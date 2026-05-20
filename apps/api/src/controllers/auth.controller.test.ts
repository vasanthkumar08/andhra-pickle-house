import type { NextFunction, Request, Response } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UnauthorizedError, ValidationError } from '../lib/errors';

vi.hoisted(() => {
  process.env.NODE_ENV = 'test';
  process.env.AUTH_PROVIDER = 'firebase';
  process.env.DATABASE_URL = 'postgresql://user:password@localhost:5432/test';
  process.env.REDIS_URL = 'redis://localhost:6379';
  process.env.JWT_ACCESS_SECRET = 'a'.repeat(40);
  process.env.JWT_REFRESH_SECRET = 'b'.repeat(40);
  process.env.WEB_URL = 'http://localhost:3000';
  process.env.CORS_ORIGINS = 'http://localhost:3000';
  process.env.WHATSAPP_BUSINESS_NUMBER = '919876543210';
  process.env.CLOUDINARY_REQUIRED = 'false';
  process.env.FIREBASE_PROJECT_ID = 'andhra-pickle-house';
  process.env.FIREBASE_CLIENT_EMAIL = 'firebase-admin@example.iam.gserviceaccount.com';
  process.env.FIREBASE_PRIVATE_KEY = '-----BEGIN PRIVATE KEY-----\\ntest\\n-----END PRIVATE KEY-----\\n';
});

const authMocks = vi.hoisted(() => ({
  firebaseLogin: vi.fn(),
  requestOtp: vi.fn(),
}));

vi.mock('../services/auth.service', () => ({
  authService: {
    firebaseLogin: authMocks.firebaseLogin,
    requestOtp: authMocks.requestOtp,
  },
}));

vi.mock('../config/env', () => ({
  env: {
    AUTH_PROVIDER: 'firebase',
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

describe('authController.firebaseLogin', () => {
  beforeEach(() => {
    authMocks.firebaseLogin.mockReset();
    authMocks.requestOtp.mockReset();
  });

  it('sets backend session cookies after Firebase phone verification', async () => {
    authMocks.firebaseLogin.mockResolvedValue({
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

    const req = createRequest({ firebaseToken: 'x'.repeat(128) });
    const res = createResponse();
    const next: NextFunction = vi.fn();

    await authController.firebaseLogin(req, res as unknown as Response, next);

    expect(next).not.toHaveBeenCalled();
    expect(authMocks.firebaseLogin).toHaveBeenCalledWith('x'.repeat(128), 'test-device', '127.0.0.1', 'vitest');
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

  it('passes invalid Firebase tokens to centralized error handling', async () => {
    authMocks.firebaseLogin.mockRejectedValue(new UnauthorizedError('Invalid or expired Firebase token'));

    const req = createRequest({ firebaseToken: 'x'.repeat(128) });
    const res = createResponse();
    const next: NextFunction = vi.fn();

    await authController.firebaseLogin(req, res as unknown as Response, next);

    expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
    expect(res.cookies.accessToken).toBeUndefined();
  });

  it('keeps legacy OTP routes disabled when AUTH_PROVIDER=firebase', async () => {
    const req = createRequest({ phone: '9876543210' });
    const res = createResponse();
    const next: NextFunction = vi.fn();

    await authController.requestOtp(req, res as unknown as Response, next);

    expect(authMocks.requestOtp).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(expect.any(ValidationError));
  });
});
