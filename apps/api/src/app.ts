import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { env } from './config/env';
import { redis } from './lib/redis';
import { redisReady } from './lib/redis';
import { requestIdMiddleware } from './middleware/request-id';
import { requestLogger } from './middleware/request-logger';
import { csrfMiddleware } from './middleware/csrf';
import { errorHandler } from './middleware/error-handler';
import healthRoutes from './routes/health.routes';
import { metricsHandler, readinessHandler } from './routes/health.routes';
import authRoutes from './routes/auth.routes';
import productRoutes from './routes/product.routes';
import cartRoutes from './routes/cart.routes';
import orderRoutes from './routes/order.routes';
import adminRoutes from './routes/admin.routes';
import contentRoutes from './routes/content.routes';
import addressRoutes from './routes/address.routes';
import wishlistRoutes from './routes/wishlist.routes';
import reviewsRoutes from './routes/reviews.routes';
import analyticsRoutes from './routes/analytics.routes';
import categoriesRoutes from './routes/categories.routes';

export function createApp() {
  const app = express();
  type RedisStoreReply = boolean | number | string | Array<boolean | number | string>;
  const sendRateLimitCommand = (...args: string[]) =>
    redis.call(args[0], ...args.slice(1)) as Promise<RedisStoreReply>;

  app.set('trust proxy', 1);
  app.use(requestIdMiddleware);
  app.use(requestLogger);

  app.use(
    helmet({
      contentSecurityPolicy: env.isDev ? false : undefined,
      crossOriginEmbedderPolicy: false,
    })
  );

  app.use(
    cors({
      origin: env.corsOrigins,
      credentials: true,
      methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id', 'X-CSRF-Token'],
    })
  );

  app.use(compression());
  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());
  app.use(csrfMiddleware);

  const globalLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    passOnStoreError: true,
    message: { success: false, error: 'Too many requests' },
    ...(redisReady
      ? {
          store: new RedisStore({
            sendCommand: sendRateLimitCommand,
          }),
        }
      : {}),
  });

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    passOnStoreError: true,
    message: { success: false, error: 'Too many auth attempts' },
    ...(redisReady
      ? {
          store: new RedisStore({
            prefix: 'rl:auth:',
            sendCommand: sendRateLimitCommand,
          }),
        }
      : {}),
  });

  app.use(globalLimiter);

  app.use('/health', healthRoutes);
  app.get('/ready', readinessHandler);
  app.get('/metrics', metricsHandler);

  app.use('/v1/auth', authLimiter, authRoutes);
  app.use('/v1/products', productRoutes);
  app.use('/v1/cart', cartRoutes);
  app.use('/v1/orders', orderRoutes);
  app.use('/v1/admin', adminRoutes);
  app.use('/v1/content', contentRoutes);
  app.use('/v1/addresses', addressRoutes);
  app.use('/v1/wishlist', wishlistRoutes);
  app.use('/v1/reviews', reviewsRoutes);
  app.use('/v1/analytics', analyticsRoutes);
  app.use('/v1/categories', categoriesRoutes);

  app.use(errorHandler);

  return app;
}
