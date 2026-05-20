import { logger } from '../lib/logger';

type StartupStatus = 'ok' | 'warn' | 'error' | 'info';

export function startupLog(scope: 'API' | 'WEB' | 'WORKER', message: string, status: StartupStatus = 'info') {
  const context = { scope, status };
  if (status === 'error') logger.error(context, message);
  else if (status === 'warn') logger.warn(context, message);
  else logger.info(context, message);
}

export function startupSuccess(scope: 'API' | 'WEB' | 'WORKER', message: string) {
  startupLog(scope, message, 'ok');
}

export function startupWarn(scope: 'API' | 'WEB' | 'WORKER', message: string) {
  startupLog(scope, message, 'warn');
}

export function startupError(scope: 'API' | 'WEB' | 'WORKER', message: string) {
  startupLog(scope, message, 'error');
}

export function formatDuration(startedAt: bigint) {
  const ms = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
  return `${Math.round(ms)}ms`;
}
