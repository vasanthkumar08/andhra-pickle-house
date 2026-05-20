import { Request, Response, NextFunction } from 'express';
import { AppError } from '../lib/errors';
import { logger } from '../lib/logger';
import { recordError } from '../observability/metrics';

export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction) {
  const requestId = req.requestId;
  const context = {
    err,
    requestId,
    method: req.method,
    path: req.originalUrl || req.path,
    userId: req.user?.userId,
    sessionId: req.user?.sessionId,
  };

  if (err instanceof AppError) {
    recordError({ code: err.code, path: req.originalUrl || req.path });
    logger.warn({ ...context, statusCode: err.statusCode, code: err.code }, 'Handled application error');
    return res.status(err.statusCode).json({
      success: false,
      error: err.message,
      code: err.code,
      requestId,
    });
  }

  recordError({ code: 'UNHANDLED', path: req.originalUrl || req.path });
  logger.error({ ...context, statusCode: 500 }, 'Unhandled error');
  return res.status(500).json({
    success: false,
    error: 'Internal server error',
    requestId,
  });
}
