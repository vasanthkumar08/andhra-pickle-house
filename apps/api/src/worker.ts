import { env } from './config/env';
import { startupError, startupLog, startupSuccess } from './logs/startup-logger';
import { redis } from './lib/redis';
import { closeQueueRegistry, createQueue, createWorker, QUEUE_NAMES } from './queues';
import { processDomainEvent } from './events/handlers';
import { publishPendingOutbox, recoverStuckOutbox } from './events/outbox';
import { logger } from './lib/logger';
import { writeWorkerHeartbeat, type WorkerHeartbeat } from './observability/worker-heartbeat';
import type { Job } from 'bullmq';

async function main() {
  const startedAt = new Date().toISOString();
  const workerId = `${process.env.HOSTNAME || 'worker'}:${process.pid}`;
  const state: Omit<WorkerHeartbeat, 'heartbeatAt'> = {
    service: 'worker',
    workerId,
    pid: process.pid,
    startedAt,
    activeJobs: 0,
    processedJobs: 0,
    failedJobs: 0,
    outboxPublished: 0,
    outboxRecovered: 0,
  };
  const deadLetterQueue = createQueue(QUEUE_NAMES.deadLetter);

  startupLog('WORKER', `Environment Loaded (${env.NODE_ENV})`);
  await redis.connect();
  startupSuccess('WORKER', 'Redis Connected');

  const mediaWorker = createWorker(QUEUE_NAMES.media, async (job: Job) => {
    logger.info({ queueName: job.queueName, jobId: job.id, attemptsMade: job.attemptsMade }, 'Processing media job');
  });
  const eventsWorker = createWorker(QUEUE_NAMES.events, processDomainEvent);

  mediaWorker.on('ready', () => startupSuccess('WORKER', 'Queue Worker Connected'));
  eventsWorker.on('ready', () => startupSuccess('WORKER', 'Event Worker Connected'));

  const onActive = (job: Job) => {
    state.activeJobs += 1;
    state.lastJob = { queueName: job.queueName, jobId: String(job.id), status: 'active', at: new Date().toISOString() };
    logger.info({ queueName: job.queueName, jobId: job.id, attemptsMade: job.attemptsMade }, 'Worker job active');
  };

  const onCompleted = (job: Job) => {
    state.activeJobs = Math.max(0, state.activeJobs - 1);
    state.processedJobs += 1;
    state.lastJob = { queueName: job.queueName, jobId: String(job.id), status: 'completed', at: new Date().toISOString() };
    logger.info({ queueName: job.queueName, jobId: job.id, attemptsMade: job.attemptsMade }, 'Worker job completed');
  };

  const onFailed = async (job: Job | undefined, error: Error) => {
    state.activeJobs = Math.max(0, state.activeJobs - 1);
    state.failedJobs += 1;
    state.lastJob = {
      queueName: job?.queueName ?? 'unknown',
      jobId: job?.id ? String(job.id) : undefined,
      status: 'failed',
      at: new Date().toISOString(),
    };

    const attemptsMade = job?.attemptsMade ?? 0;
    const maxAttempts = Number(job?.opts.attempts ?? 1);
    const exhausted = attemptsMade >= maxAttempts;
    logger.error(
      {
        err: error,
        queueName: job?.queueName,
        jobId: job?.id,
        attemptsMade,
        maxAttempts,
        retryStatus: exhausted ? 'dead-lettered' : 'scheduled',
      },
      'Worker job failed'
    );

    if (job && exhausted) {
      await deadLetterQueue.add(
        `${job.queueName}.failed`,
        {
          sourceQueue: job.queueName,
          sourceJobId: job.id,
          sourceJobName: job.name,
          data: job.data,
          failedReason: error.message,
          stack: error.stack,
          attemptsMade,
          failedAt: new Date().toISOString(),
        },
        { jobId: `${job.queueName}:${job.id}:dead-letter`, attempts: 1, removeOnComplete: false }
      );
    }
  };

  mediaWorker.on('active', onActive);
  eventsWorker.on('active', onActive);
  mediaWorker.on('completed', onCompleted);
  eventsWorker.on('completed', onCompleted);
  mediaWorker.on('failed', (job, error) => void onFailed(job, error));
  eventsWorker.on('failed', (job, error) => void onFailed(job, error));
  mediaWorker.on('error', (error) => logger.error({ err: error, queueName: QUEUE_NAMES.media }, 'Worker runtime error'));
  eventsWorker.on('error', (error) => logger.error({ err: error, queueName: QUEUE_NAMES.events }, 'Worker runtime error'));

  const relayTimer = setInterval(() => {
    Promise.all([recoverStuckOutbox(), publishPendingOutbox()])
      .then(([recovered, published]) => {
        state.outboxRecovered += recovered;
        state.outboxPublished += published;
        if (recovered || published) {
          logger.info({ recovered, published }, 'Outbox relay completed');
        }
      })
      .catch((error) => {
        logger.error({ err: error }, 'Outbox relay failed');
      });
  }, 5_000);

  const heartbeatTimer = setInterval(() => {
    writeWorkerHeartbeat({ ...state, heartbeatAt: new Date().toISOString() }).catch((error) => {
      logger.warn({ err: error }, 'Worker heartbeat write failed');
    });
  }, 10_000);
  relayTimer.unref();
  heartbeatTimer.unref();

  const recovered = await recoverStuckOutbox();
  const published = await publishPendingOutbox();
  state.outboxRecovered += recovered;
  state.outboxPublished += published;
  await writeWorkerHeartbeat({ ...state, heartbeatAt: new Date().toISOString() });

  const shutdown = async (signal: string) => {
    startupLog('WORKER', `Graceful shutdown requested (${signal})`);
    clearInterval(relayTimer);
    clearInterval(heartbeatTimer);
    await Promise.allSettled([mediaWorker.close(), eventsWorker.close(), closeQueueRegistry()]);
    await redis.quit();
    startupSuccess('WORKER', 'Shutdown Complete');
    process.exit(0);
  };

  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('unhandledRejection', (reason) => {
    logger.error({ err: reason }, 'Unhandled worker promise rejection');
  });
  process.on('uncaughtException', (error) => {
    logger.fatal({ err: error }, 'Uncaught worker exception');
    void shutdown('uncaughtException');
  });
}

main().catch((error) => {
  logger.fatal({ err: error }, 'Worker startup failed');
  startupError('WORKER', error instanceof Error ? error.message : 'Worker startup failed');
  process.exit(1);
});
