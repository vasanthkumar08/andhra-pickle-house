import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

declare global {
  namespace Express {
    interface Request {
      requestId: string;
    }
  }
}

function firstHeaderValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export function requestIdMiddleware(req: Request, res: Response, next: NextFunction) {
  req.requestId =
    firstHeaderValue(req.headers['x-request-id']) ||
    firstHeaderValue(req.headers['x-correlation-id']) ||
    uuidv4();
  res.setHeader('X-Request-Id', req.requestId);
  res.setHeader('X-Correlation-Id', req.requestId);
  next();
}
