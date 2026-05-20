import { createApp } from './app';
import { env, envMeta } from './config/env';
import { connectRedis, redis } from './lib/redis';
import { prisma } from './lib/prisma';
import { verifyCloudinary } from './lib/cloudinary';
import { assertPortAvailable } from './utils/port';
import { logger } from './lib/logger';
import { getActiveRequests, markShutdownStarted } from './observability/metrics';
import {
  formatDuration,
  startupError,
  startupLog,
  startupSuccess,
  startupWarn,
} from './logs/startup-logger';

async function main() {
  const startedAt = process.hrtime.bigint();

  startupLog('API', `Environment Loaded (${env.NODE_ENV})`);
  startupLog('API', `Loaded env files: ${envMeta.loadedEnvFiles.length || 'none'}`);
  startupSuccess('API', 'Environment Validated');

  await assertPortAvailable(env.API_PORT);
  startupSuccess('API', `Port ${env.API_PORT} Available`);

  try {
    await prisma.$connect();
    await prisma.$queryRaw`SELECT 1`;
    startupSuccess('API', 'PostgreSQL Connected');
  } catch (err) {
    startupError('API', 'PostgreSQL connection failed. Start Docker: docker compose up -d postgres');
    if (err instanceof Error) startupError('API', err.message);
    process.exit(1);
  }

  try {
    await connectRedis();
    await redis.ping();
    startupSuccess('API', 'Redis Connected');
  } catch (err) {
    startupWarn('API', 'Redis unavailable; continuing with in-memory rate limits and no cache acceleration');
    if (err instanceof Error) startupWarn('API', err.message);
  }

  try {
    const cloudinary = await verifyCloudinary();
    if (cloudinary.ok) {
      startupSuccess('API', 'Cloudinary Connected');
    } else {
      startupWarn('API', `${cloudinary.message}; media uploads disabled until credentials are added`);
    }
  } catch (err) {
    startupError('API', 'Cloudinary credential verification failed');
    if (err instanceof Error) startupError('API', err.message);
    process.exit(1);
  }

  const app = createApp();
  const server = app.listen(env.API_PORT, () => {
    startupSuccess('API', `Server running on port ${env.API_PORT}`);
    startupSuccess('API', 'API Ready');
    startupLog('API', `Startup duration ${formatDuration(startedAt)}`);
  });

  const shutdown = async (signal: string) => {
    markShutdownStarted();
    startupLog('API', `Graceful shutdown requested (${signal})`);
    server.closeIdleConnections?.();
    server.close(async () => {
      try {
        const deadline = Date.now() + 20_000;
        while (getActiveRequests() > 0 && Date.now() < deadline) {
          await new Promise((resolve) => setTimeout(resolve, 250));
        }
        if (getActiveRequests() > 0) {
          logger.warn({ activeRequests: getActiveRequests() }, 'API shutdown deadline reached with active requests');
          server.closeAllConnections?.();
        }
        await Promise.allSettled([prisma.$disconnect(), redis.quit()]);
        startupSuccess('API', 'Shutdown Complete');
        process.exit(0);
      } catch (err) {
        startupError('API', 'Shutdown failed');
        if (err instanceof Error) startupError('API', err.message);
        process.exit(1);
      }
    });
  };

  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('unhandledRejection', (reason) => {
    logger.error({ err: reason }, 'Unhandled API promise rejection');
  });
  process.on('uncaughtException', (error) => {
    logger.fatal({ err: error }, 'Uncaught API exception');
    void shutdown('uncaughtException');
  });
}

main().catch((err) => {
  logger.fatal({ err }, 'API startup failed');
  startupError('API', err instanceof Error ? err.message : 'Startup failed');
  process.exit(1);
});
