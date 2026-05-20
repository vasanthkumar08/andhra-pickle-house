import path from 'path';
import dotenv from 'dotenv';
import pino from 'pino';
import { envSchema } from '../validators/env.schema';

/** Load .env from monorepo root first, then app-local fallbacks (npm workspace cwd varies). */
const envPaths = [
  path.resolve(__dirname, '../../../../.env'),
  path.resolve(__dirname, '../../../.env'),
  path.resolve(process.cwd(), '../../.env'),
  path.resolve(process.cwd(), '../.env'),
  path.resolve(process.cwd(), '.env'),
];

const loadedEnvFiles: string[] = [];

for (const envPath of envPaths) {
  const result = dotenv.config({ path: envPath });
  if (!result.error) loadedEnvFiles.push(envPath);
}

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const bootLogger = pino({
    level: 'error',
    base: { service: process.env.SERVICE_NAME || 'aph-api', pid: process.pid },
    timestamp: pino.stdTimeFunctions.isoTime,
  });
  bootLogger.error(
    {
      errors: parsed.error.flatten().fieldErrors,
      loadedEnvFiles,
    },
    'Invalid environment. Copy .env.example to the repo root as .env and ensure PostgreSQL is reachable.'
  );
  process.exit(1);
}

export const env = {
  ...parsed.data,
  corsOrigins: parsed.data.CORS_ORIGINS.split(',').map((o) => o.trim()),
  isDev: parsed.data.NODE_ENV === 'development',
  hasCloudinary:
    Boolean(parsed.data.CLOUDINARY_CLOUD_NAME) &&
    Boolean(parsed.data.CLOUDINARY_API_KEY) &&
    Boolean(parsed.data.CLOUDINARY_API_SECRET),
};

export const envMeta = {
  loadedEnvFiles,
};
