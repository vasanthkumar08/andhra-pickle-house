import pino from 'pino';
import { env } from '../config/env';

export const logger = pino({
  level: env.isDev ? 'debug' : 'info',
  base: {
    service: process.env.SERVICE_NAME || 'aph-api',
    environment: env.NODE_ENV,
    pid: process.pid,
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'headers.authorization',
      'headers.cookie',
      '*.password',
      '*.token',
      '*.accessToken',
      '*.refreshToken',
      '*.JWT_ACCESS_SECRET',
      '*.JWT_REFRESH_SECRET',
      '*.TWILIO_AUTH_TOKEN',
      '*.CLOUDINARY_API_SECRET',
      '*.FIREBASE_PRIVATE_KEY',
      '*.firebaseToken',
    ],
    censor: '[redacted]',
  },
  serializers: {
    err: pino.stdSerializers.err,
  },
});
