import type { NextFunction, Request, Response } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ZodError } from 'zod';

vi.hoisted(() => {
  process.env.NODE_ENV = 'test';
  process.env.AUTH_PROVIDER = 'legacy';
  process.env.DATABASE_URL = 'postgresql://user:password@localhost:5432/test';
  process.env.REDIS_URL = 'redis://localhost:6379';
  process.env.JWT_ACCESS_SECRET = 'a'.repeat(40);
  process.env.JWT_REFRESH_SECRET = 'b'.repeat(40);
  process.env.WEB_URL = 'http://localhost:3000';
  process.env.CORS_ORIGINS = 'http://localhost:3000';
  process.env.WHATSAPP_BUSINESS_NUMBER = '919876543210';
  process.env.CLOUDINARY_REQUIRED = 'false';
});

const authMocks = vi.hoisted(() => ({
  requestOtp: vi.fn(),
  verifyOtpAndLogin: vi.fn(),
}));

vi.mock('../services/auth.service', () => ({
  authService: {
    requestOtp: authMocks.requestOtp,
    verifyOtpAndLogin: authMocks.verifyOtpAndLogin,
  },
}));

vi.mock('../config/env', () => ({
  env: {
    NODE_ENV: 'test',
  },
}));

import { authController } from './auth.controller';

interface MockResponse {
  cookies: Record<string, { value: string; options: unknown }>;
  body?: unknown;
  cookie: (name: string, value: string, options?: unknown) => MockResponse;
  json: (body: unknown) => MockResponse;
}

function createResponse(): MockResponse {
  const response: MockResponse = {
    cookies: {},
    cookie(name: string, value: string, options: unknown) {
      response.cookies[name] = { value, options };
      return response;
    },
    json(body: unknown) {
      response.body = body;
      return response;
    },
  };
  return response;
}

function createRequest(body: unknown): Request {
  return {
    body,
    ip: '127.0.0.1',
    headers: {
      'user-agent': 'vitest',
      'x-device-info': 'test-device',
    },
    requestId: 'req-test',
  } as unknown as Request;
}

describe('authController backend OTP login', () => {
  beforeEach(() => {
    authMocks.requestOtp.mockReset();
    authMocks.verifyOtpAndLogin.mockReset();
  });

  it('requests an OTP through the backend auth service', async () => {
    authMocks.requestOtp.mockResolvedValue({ expiresIn: 300 });

    const req = createRequest({ phone: '+919876543210' });
    const res = createResponse();
    const next: NextFunction = vi.fn();

    await authController.requestOtp(req, res as unknown as Response, next);

    expect(next).not.toHaveBeenCalled();
    expect(authMocks.requestOtp).toHaveBeenCalledWith('+919876543210', '127.0.0.1');
    expect(res.body).toMatchObject({
      success: true,
      data: { expiresIn: 300 },
      requestId: 'req-test',
    });
  });

  it('sets backend session cookies after OTP verification', async () => {
    authMocks.verifyOtpAndLogin.mockResolvedValue({
      tokens: {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      },
      user: {
        id: 'user_1',
        phone: '919876543210',
        name: null,
        role: 'CUSTOMER',
      },
    });

    const req = createRequest({ phone: '+919876543210', code: '123456' });
    const res = createResponse();
    const next: NextFunction = vi.fn();

    await authController.verifyOtp(req, res as unknown as Response, next);

    expect(next).not.toHaveBeenCalled();
    expect(authMocks.verifyOtpAndLogin).toHaveBeenCalledWith(
      '+919876543210',
      '123456',
      undefined,
      'test-device',
      '127.0.0.1',
      'vitest'
    );
    expect(res.cookies.accessToken.value).toBe('access-token');
    expect(res.cookies.refreshToken.value).toBe('refresh-token');
    expect(res.body).toMatchObject({
      success: true,
      data: {
        accessToken: 'access-token',
        user: { id: 'user_1', phone: '919876543210' },
      },
    });
  });

  it('rejects malformed OTP verification requests before the service runs', async () => {
    const req = createRequest({ phone: '+919876543210', code: '12345' });
    const res = createResponse();
    const next: NextFunction = vi.fn();

    await authController.verifyOtp(req, res as unknown as Response, next);

    expect(authMocks.verifyOtpAndLogin).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(expect.any(ZodError));
  });
});
