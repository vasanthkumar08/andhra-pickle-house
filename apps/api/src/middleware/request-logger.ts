import type { NextFunction, Request, Response } from 'express';
import { logger } from '../lib/logger';
import { beginRequest, endRequest, recordHttpRequest } from '../observability/metrics';

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const startedAt = process.hrtime.bigint();
  let logged = false;
  beginRequest();

  const writeLog = (aborted = false) => {
    if (logged) return;
    logged = true;
    const latencyMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
    const roundedLatency = Math.round(latencyMs);
    const statusCode = aborted && res.statusCode < 400 ? 499 : res.statusCode;
    const logContext = {
      requestId: req.requestId,
      method: req.method,
      path: req.originalUrl || req.url,
      routePath: req.route?.path,
      statusCode,
      latencyMs: roundedLatency,
      userId: req.user?.userId,
      sessionId: req.user?.sessionId,
      ip: req.ip,
      userAgent: req.get('user-agent'),
      aborted,
    };

    recordHttpRequest({
      method: req.method,
      path: req.originalUrl || req.url,
      statusCode,
      latencyMs: roundedLatency,
    });

    if (statusCode >= 500) {
      logger.error(logContext, 'HTTP request failed');
    } else if (statusCode >= 400) {
      logger.warn(logContext, 'HTTP request rejected');
    } else {
      logger.info(logContext, 'HTTP request completed');
    }
  };

  res.on('finish', () => writeLog(false));
  res.on('close', () => {
    writeLog(!res.writableEnded);
    endRequest();
  });

  next();
}
