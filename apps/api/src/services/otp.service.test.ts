import bcrypt from 'bcryptjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RateLimitError, ValidationError } from '../lib/errors';

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
  process.env.OTP_EXPIRY_MINUTES = '5';
  process.env.OTP_MAX_ATTEMPTS = '5';
});

const prismaMocks = vi.hoisted(() => ({
  create: vi.fn(),
  delete: vi.fn(),
  findFirst: vi.fn(),
  updateMany: vi.fn(),
}));

const notificationMocks = vi.hoisted(() => ({
  sendOTP: vi.fn(),
}));

vi.mock('../lib/prisma', () => ({
  prisma: {
    otpVerification: {
      create: prismaMocks.create,
      delete: prismaMocks.delete,
      findFirst: prismaMocks.findFirst,
      updateMany: prismaMocks.updateMany,
    },
  },
}));

vi.mock('../lib/redis', () => ({
  redisReady: false,
  redis: {
    incr: vi.fn(),
    expire: vi.fn(),
  },
}));

vi.mock('../notifications', () => ({
  getNotificationProvider: () => ({
    sendOTP: notificationMocks.sendOTP,
  }),
}));

import { OtpService } from './otp.service';

describe('OtpService', () => {
  beforeEach(() => {
    prismaMocks.create.mockReset();
    prismaMocks.delete.mockReset();
    prismaMocks.findFirst.mockReset();
    prismaMocks.updateMany.mockReset();
    notificationMocks.sendOTP.mockReset();
  });

  it('generates, hashes, stores, and sends an OTP', async () => {
    prismaMocks.create.mockResolvedValue({ id: 'otp_1' });
    notificationMocks.sendOTP.mockResolvedValue(undefined);

    const service = new OtpService();
    const result = await service.sendOtp('+919876543210', '127.0.0.1');

    expect(result).toEqual({ expiresIn: 300 });
    expect(prismaMocks.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        phone: '919876543210',
        codeHash: expect.any(String),
        ipAddress: '127.0.0.1',
        maxAttempts: 5,
      }),
    });
    expect(notificationMocks.sendOTP).toHaveBeenCalledWith({
      phone: '919876543210',
      code: expect.stringMatching(/^\d{6}$/),
    });
  });

  it('rejects expired or missing OTP records', async () => {
    prismaMocks.findFirst.mockResolvedValue(null);

    const service = new OtpService();

    await expect(service.verifyOtp('+919876543210', '123456')).rejects.toBeInstanceOf(ValidationError);
  });

  it('rejects invalid OTPs and increments attempts', async () => {
    const codeHash = await bcrypt.hash('123456', 4);
    prismaMocks.findFirst.mockResolvedValue({
      id: 'otp_1',
      phone: '919876543210',
      codeHash,
      attempts: 0,
      maxAttempts: 5,
    });
    prismaMocks.updateMany.mockResolvedValue({ count: 1 });

    const service = new OtpService();

    await expect(service.verifyOtp('+919876543210', '000000')).rejects.toBeInstanceOf(ValidationError);
    expect(prismaMocks.updateMany).toHaveBeenCalledWith({
      where: {
        id: 'otp_1',
        verifiedAt: null,
        attempts: { lt: 5 },
      },
      data: { attempts: { increment: 1 } },
    });
  });

  it('rejects brute force attempts after the max attempt count', async () => {
    const codeHash = await bcrypt.hash('123456', 4);
    prismaMocks.findFirst.mockResolvedValue({
      id: 'otp_1',
      phone: '919876543210',
      codeHash,
      attempts: 5,
      maxAttempts: 5,
    });

    const service = new OtpService();

    await expect(service.verifyOtp('+919876543210', '123456')).rejects.toBeInstanceOf(RateLimitError);
    expect(prismaMocks.updateMany).not.toHaveBeenCalled();
  });

  it('invalidates OTPs after a successful verification to prevent replay', async () => {
    const codeHash = await bcrypt.hash('123456', 4);
    prismaMocks.findFirst.mockResolvedValue({
      id: 'otp_1',
      phone: '919876543210',
      codeHash,
      attempts: 0,
      maxAttempts: 5,
    });
    prismaMocks.updateMany.mockResolvedValueOnce({ count: 1 }).mockResolvedValueOnce({ count: 1 });

    const service = new OtpService();
    await expect(service.verifyOtp('+919876543210', '123456')).resolves.toBe('919876543210');

    expect(prismaMocks.updateMany).toHaveBeenLastCalledWith({
      where: { id: 'otp_1', verifiedAt: null },
      data: { verifiedAt: expect.any(Date) },
    });
  });

  it('rejects concurrent verification after another request has already consumed the OTP', async () => {
    const codeHash = await bcrypt.hash('123456', 4);
    prismaMocks.findFirst.mockResolvedValue({
      id: 'otp_1',
      phone: '919876543210',
      codeHash,
      attempts: 0,
      maxAttempts: 5,
    });
    prismaMocks.updateMany.mockResolvedValueOnce({ count: 1 }).mockResolvedValueOnce({ count: 0 });

    const service = new OtpService();

    await expect(service.verifyOtp('+919876543210', '123456')).rejects.toBeInstanceOf(ValidationError);
  });

  it('rate limits excessive resend requests for the same phone', async () => {
    prismaMocks.create.mockResolvedValue({ id: 'otp_1' });
    notificationMocks.sendOTP.mockResolvedValue(undefined);

    const service = new OtpService();
    const phone = '+919111111111';

    for (let index = 0; index < 5; index += 1) {
      await service.sendOtp(phone);
    }

    await expect(service.sendOtp(phone)).rejects.toBeInstanceOf(RateLimitError);
  });
});
