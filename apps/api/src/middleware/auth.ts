import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { env } from '../config/env';
import { UnauthorizedError, ForbiddenError } from '../lib/errors';
import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';

export interface JwtPayload {
  userId: string;
  role: string;
  sessionId: string;
}

const jwtPayloadSchema = z.object({
  userId: z.string(),
  role: z.string(),
  sessionId: z.string(),
});

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export async function authenticate(req: Request, _res: Response, next: NextFunction) {
  const token =
    req.cookies?.accessToken ||
    (req.headers.authorization?.startsWith('Bearer ')
      ? req.headers.authorization.slice(7)
      : null);

  if (!token) return next(new UnauthorizedError('Login required'));

  try {
    const payload = jwtPayloadSchema.parse(jwt.verify(token, env.JWT_ACCESS_SECRET));
    if (!payload.sessionId) throw new UnauthorizedError('Session missing from token');
    const session = await prisma.session.findFirst({
      where: {
        id: payload.sessionId,
        userId: payload.userId,
        isRevoked: false,
        expiresAt: { gt: new Date() },
        user: { isActive: true, deletedAt: null },
      },
    });
    if (!session) throw new UnauthorizedError('Session expired or revoked');
    req.user = payload;
    next();
  } catch (error) {
    if (error instanceof UnauthorizedError) return next(error);
    next(new UnauthorizedError('Invalid or expired token'));
  }
}

export async function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const token = req.cookies?.accessToken;
  if (!token) return next();
  try {
    const payload = jwtPayloadSchema.parse(jwt.verify(token, env.JWT_ACCESS_SECRET));
    if (!payload.sessionId) return next();
    const session = await prisma.session.findFirst({
      where: {
        id: payload.sessionId,
        userId: payload.userId,
        isRevoked: false,
        expiresAt: { gt: new Date() },
        user: { isActive: true, deletedAt: null },
      },
    });
    if (session) req.user = payload;
  } catch (error) {
    logger.debug({ err: error }, 'Optional auth token rejected');
  }
  next();
}

export async function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  if (!req.user) return next(new UnauthorizedError());
  const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
  if (!user || user.role !== 'ADMIN') return next(new ForbiddenError('Admin access required'));
  next();
}
