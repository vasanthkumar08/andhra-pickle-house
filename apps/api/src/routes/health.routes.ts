import { Router, type Request, type Response } from 'express';
import { prisma } from '../lib/prisma';
import { redisHealthCheck } from '../lib/redis';
import { getCloudinaryStatus } from '../lib/cloudinary';
import { env } from '../config/env';
import { getQueueStats } from '../queues';
import { readWorkerHeartbeat } from '../observability/worker-heartbeat';
import { isShuttingDown, metricsSnapshot, recordDependency } from '../observability/metrics';
import { logger } from '../lib/logger';

const router = Router();

async function checkDb() {
  const startedAt = process.hrtime.bigint();
  try {
    await prisma.$queryRaw`SELECT 1`;
    const latencyMs = Math.round(Number(process.hrtime.bigint() - startedAt) / 1_000_000);
    recordDependency('postgresql', { ok: true, latencyMs });
    return { ok: true, latencyMs };
  } catch (error) {
    const latencyMs = Math.round(Number(process.hrtime.bigint() - startedAt) / 1_000_000);
    const message = error instanceof Error ? error.message : String(error);
    recordDependency('postgresql', { ok: false, latencyMs, error: message });
    logger.error({ err: error, latencyMs }, 'PostgreSQL health check failed');
    return { ok: false, latencyMs, error: message };
  }
}

async function checkRedis() {
  const startedAt = process.hrtime.bigint();
  try {
    const ok = await redisHealthCheck();
    const latencyMs = Math.round(Number(process.hrtime.bigint() - startedAt) / 1_000_000);
    return { ok, latencyMs };
  } catch (error) {
    const latencyMs = Math.round(Number(process.hrtime.bigint() - startedAt) / 1_000_000);
    const message = error instanceof Error ? error.message : String(error);
    logger.warn({ err: error, latencyMs }, 'Redis health check failed');
    return { ok: false, latencyMs, error: message };
  }
}

export function livenessHandler(_req: Request, res: Response) {
  res.json({
    status: 'ok',
    service: 'api',
    environment: env.NODE_ENV,
    shuttingDown: isShuttingDown(),
    timestamp: new Date().toISOString(),
  });
}

export async function dbHealthHandler(_req: Request, res: Response) {
  const db = await checkDb();
  res.status(db.ok ? 200 : 503).json({ status: db.ok ? 'ok' : 'error', dependency: 'postgresql', ...db });
}

export async function redisHealthHandler(_req: Request, res: Response) {
  const redis = await checkRedis();
  res.status(redis.ok ? 200 : 503).json({ status: redis.ok ? 'ok' : 'degraded', dependency: 'redis', ...redis });
}

export async function readinessHandler(_req: Request, res: Response) {
  const [db, redis] = await Promise.all([checkDb(), checkRedis()]);
  const ready = db.ok && !isShuttingDown();

  res.status(ready ? 200 : 503).json({
    status: ready ? 'ready' : 'not ready',
    checks: {
      db,
      redis,
      cloudinary: getCloudinaryStatus(),
      shuttingDown: isShuttingDown(),
    },
  });
}

export async function workerHealthHandler(_req: Request, res: Response) {
  try {
    const heartbeat = await readWorkerHeartbeat();
    const heartbeatAgeMs = heartbeat ? Date.now() - Date.parse(heartbeat.heartbeatAt) : null;
    const ok = Boolean(heartbeat && heartbeatAgeMs !== null && heartbeatAgeMs < 30_000);
    res.status(ok ? 200 : 503).json({
      status: ok ? 'ok' : 'stale',
      heartbeatAgeMs,
      heartbeat,
    });
  } catch (error) {
    logger.warn({ err: error }, 'Worker heartbeat read failed');
    res.status(503).json({
      status: 'unknown',
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

export async function metricsHandler(_req: Request, res: Response) {
  const queueStats = await getQueueStats();
  res.json({
    ...metricsSnapshot(),
    queues: queueStats,
  });
}

router.get('/', livenessHandler);
router.get('/db', dbHealthHandler);
router.get('/redis', redisHealthHandler);
router.get('/ready', readinessHandler);
router.get('/worker', workerHealthHandler);
router.get('/metrics', metricsHandler);

export default router;
