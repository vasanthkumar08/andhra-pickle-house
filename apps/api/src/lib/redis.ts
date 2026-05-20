import Redis from 'ioredis';
import { env } from '../config/env';
import { logger } from './logger';
import { recordDependency } from '../observability/metrics';

export let redisReady = false;

export const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: 3,
  lazyConnect: true,
  enableOfflineQueue: true,
  retryStrategy(times) {
    return Math.min(times * 200, 2_000);
  },
  reconnectOnError(error) {
    return error.message.includes('READONLY');
  },
});

redis.on('error', (error) => {
  redisReady = false;
  logger.warn({ err: error }, 'Redis connection issue');
});
redis.on('ready', () => {
  redisReady = true;
  logger.info('Redis connected');
});
redis.on('close', () => {
  redisReady = false;
});
redis.on('reconnecting', () => {
  logger.warn('Redis reconnecting');
});

export async function connectRedis() {
  if (redis.status === 'ready') return;
  await redis.connect();
}

export async function redisHealthCheck(timeoutMs = 500) {
  const startedAt = process.hrtime.bigint();
  try {
    const pong = await Promise.race([
      redis.ping(),
      new Promise<string>((_, reject) =>
        setTimeout(() => reject(new Error(`Redis health check timed out after ${timeoutMs}ms`)), timeoutMs)
      ),
    ]);
    const latencyMs = Math.round(Number(process.hrtime.bigint() - startedAt) / 1_000_000);
    const ok = pong === 'PONG';
    recordDependency('redis', { ok, latencyMs, ...(ok ? {} : { error: `Unexpected response: ${pong}` }) });
    return ok;
  } catch (error) {
    const latencyMs = Math.round(Number(process.hrtime.bigint() - startedAt) / 1_000_000);
    recordDependency('redis', {
      ok: false,
      latencyMs,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  if (!redisReady) return null;
  try {
    const data = await redis.get(key);
    return data ? (JSON.parse(data) as T) : null;
  } catch (error) {
    logger.warn({ err: error, key }, 'Redis cache get failed');
    return null;
  }
}

export async function cacheSet(key: string, value: unknown, ttlSeconds = 300): Promise<void> {
  if (!redisReady) return;
  try {
    await redis.setex(key, ttlSeconds, JSON.stringify(value));
  } catch (error) {
    logger.warn({ err: error, key, ttlSeconds }, 'Redis cache set failed');
  }
}

export async function cacheDel(key: string): Promise<void> {
  if (!redisReady) return;
  try {
    await redis.del(key);
  } catch (error) {
    logger.warn({ err: error, key }, 'Redis cache delete failed');
  }
}

export async function cacheBumpVersion(namespace: string): Promise<number> {
  if (!redisReady) return Date.now();
  try {
    return await redis.incr(`cache-version:${namespace}`);
  } catch (error) {
    logger.warn({ err: error, namespace }, 'Redis cache version bump failed');
    return Date.now();
  }
}

export async function cacheGetVersion(namespace: string): Promise<number> {
  if (!redisReady) return 0;
  try {
    const version = await redis.get(`cache-version:${namespace}`);
    return version ? Number(version) : 0;
  } catch (error) {
    logger.warn({ err: error, namespace }, 'Redis cache version read failed');
    return 0;
  }
}

export async function sessionSet(key: string, value: unknown, ttlSeconds: number): Promise<void> {
  await cacheSet(`session:${key}`, value, ttlSeconds);
}

export async function sessionGet<T>(key: string): Promise<T | null> {
  return cacheGet<T>(`session:${key}`);
}

export async function rateLimitIncrement(key: string, ttlSeconds: number): Promise<number> {
  if (!redisReady) return 0;
  try {
    const count = await redis.incr(`rate:${key}`);
    if (count === 1) await redis.expire(`rate:${key}`, ttlSeconds);
    return count;
  } catch (error) {
    logger.warn({ err: error, key }, 'Redis rate limit increment failed');
    return 0;
  }
}
