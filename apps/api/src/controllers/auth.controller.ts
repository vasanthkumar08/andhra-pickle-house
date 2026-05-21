import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authService } from '../services/auth.service';
import { env } from '../config/env';
import { UnauthorizedError } from '../lib/errors';

const phoneSchema = z.object({
  phone: z.string().min(10).max(15),
});

const verifySchema = z.object({
  phone: z.string().min(10).max(15),
  code: z.string().length(6),
  name: z.string().optional(),
});

function authCookieOptions() {
  return {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    path: '/',
  };
}

function setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
  const cookieOpts = authCookieOptions();
  res.cookie('accessToken', accessToken, { ...cookieOpts, maxAge: 15 * 60 * 1000 });
  res.cookie('refreshToken', refreshToken, { ...cookieOpts, maxAge: 7 * 24 * 60 * 60 * 1000 });
}

function firstHeaderValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export const authController = {
  requestOtp: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { phone } = phoneSchema.parse(req.body);
      const result = await authService.requestOtp(phone, req.ip);
      res.json({ success: true, data: result, requestId: req.requestId });
    } catch (error) {
      next(error);
    }
  },

  verifyOtp: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = verifySchema.parse(req.body);
      const { tokens, user } = await authService.verifyOtpAndLogin(
        body.phone,
        body.code,
        body.name,
        firstHeaderValue(req.headers['x-device-info']),
        req.ip,
        req.headers['user-agent']
      );
      setAuthCookies(res, tokens.accessToken, tokens.refreshToken);
      res.json({ success: true, data: { user, accessToken: tokens.accessToken }, requestId: req.requestId });
    } catch (error) {
      next(error);
    }
  },

  refresh: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;
      if (!refreshToken) throw new UnauthorizedError('No refresh token');
      const tokens = await authService.refreshTokens(refreshToken);
      setAuthCookies(res, tokens.accessToken, tokens.refreshToken);
      res.json({ success: true, data: { accessToken: tokens.accessToken }, requestId: req.requestId });
    } catch (error) {
      next(error);
    }
  },

  logout: async (req: Request, res: Response, next: NextFunction) => {
    try {
      await authService.logout(req.user!.userId, req.cookies?.refreshToken);
      res.clearCookie('accessToken', authCookieOptions());
      res.clearCookie('refreshToken', authCookieOptions());
      res.json({ success: true, requestId: req.requestId });
    } catch (error) {
      next(error);
    }
  },

  me: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await authService.getMe(req.user!.userId);
      res.json({ success: true, data: user, requestId: req.requestId });
    } catch (error) {
      next(error);
    }
  },
};
