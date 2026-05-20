import crypto from 'crypto';
import type { NextFunction, Request, Response } from 'express';
import { ForbiddenError } from '../lib/errors';

const CSRF_COOKIE = 'csrfToken';
const CSRF_HEADER = 'x-csrf-token';
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

function secureCompare(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

export function csrfMiddleware(req: Request, res: Response, next: NextFunction) {
  let token = req.cookies?.[CSRF_COOKIE] as string | undefined;
  if (!token) {
    token = crypto.randomBytes(32).toString('base64url');
    res.cookie(CSRF_COOKIE, token, {
      httpOnly: false,
      secure: req.secure || req.headers['x-forwarded-proto'] === 'https',
      sameSite: 'strict',
      path: '/',
      maxAge: 24 * 60 * 60 * 1000,
    });
  }

  if (SAFE_METHODS.has(req.method)) return next();

  const header = req.headers[CSRF_HEADER];
  const provided = Array.isArray(header) ? header[0] : header;
  if (!provided || !secureCompare(provided, token)) {
    return next(new ForbiddenError('Invalid CSRF token'));
  }

  next();
}
