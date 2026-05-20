import { Queue, QueueEvents, Worker, type Processor } from 'bullmq';
import { env } from '../config/env';
import { logger } from '../lib/logger';

export const QUEUE_NAMES = {
  events: 'events',
  media: 'media',
  notifications: 'notifications',
  deadLetter: 'dead-letter',
} as const;

const connection = {
  url: env.REDIS_URL,
  maxRetriesPerRequest: null,
};

const queues = new Map<string, Queue>();

export function createQueue(name: string) {
  const existing = queues.get(name);
  if (existing) return existing;

  const queue = new Queue(name, {
    connection,
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: 'exponential', delay: 1_000 },
      removeOnComplete: 100,
      removeOnFail: 500,
    },
  });
  queues.set(name, queue);
  return queue;
}

export function createQueueEvents(name: string) {
  return new QueueEvents(name, { connection });
}

export function createWorker(name: string, processor: Processor) {
  return new Worker(name, processor, {
    connection,
    concurrency: env.WORKER_CONCURRENCY,
    lockDuration: 60_000,
  });
}

export async function getQueueStats() {
  const stats: Record<string, unknown> = {};
  for (const name of Object.values(QUEUE_NAMES)) {
    try {
      const queue = createQueue(name);
      const counts = await queue.getJobCounts('waiting', 'active', 'delayed', 'failed', 'completed');
      stats[name] = counts;
    } catch (error) {
      logger.warn({ err: error, queueName: name }, 'Queue stats collection failed');
      stats[name] = { error: error instanceof Error ? error.message : String(error) };
    }
  }
  return stats;
}

export async function closeQueueRegistry() {
  await Promise.allSettled(Array.from(queues.values()).map((queue) => queue.close()));
}
