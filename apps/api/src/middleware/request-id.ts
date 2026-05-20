import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

declare global {
  namespace Express {
    interface Request {
      requestId: string;
    }
  }
}

export function requestIdMiddleware(req: Request, res: Response, next: NextFunction) {
  req.requestId =
    (req.headers['x-request-id'] as string | undefined) ||
    (req.headers['x-correlation-id'] as string | undefined) ||
    uuidv4();
  res.setHeader('X-Request-Id', req.requestId);
  res.setHeader('X-Correlation-Id', req.requestId);
  next();
}
