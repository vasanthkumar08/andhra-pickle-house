import bcrypt from 'bcryptjs';
import { nanoid } from 'nanoid';
import { normalizePhone } from '@aph/shared';
import { prisma } from '../lib/prisma';
import { redis, redisReady } from '../lib/redis';
import { env } from '../config/env';
import { RateLimitError, ValidationError } from '../lib/errors';
import { logger } from '../lib/logger';
import { getNotificationProvider } from '../notifications';

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

const memoryRate = new Map<string, { count: number; resetAt: number }>();

async function incrementRate(key: string): Promise<number> {
  if (redisReady) {
    try {
      const attempts = await redis.incr(key);
      if (attempts === 1) await redis.expire(key, 3600);
      return attempts;
    } catch (error) {
      logger.warn({ err: error, key }, 'Redis OTP rate limit failed; using process-local fallback');
    }
  }
  const now = Date.now();
  const entry = memoryRate.get(key);
  if (!entry || entry.resetAt < now) {
    memoryRate.set(key, { count: 1, resetAt: now + 3600_000 });
    return 1;
  }
  entry.count += 1;
  return entry.count;
}

export class OtpService {
  async sendOtp(phone: string, ipAddress?: string) {
    const normalized = normalizePhone(phone);
    const rateKey = `otp:rate:${normalized}`;
    const attempts = await incrementRate(rateKey);
    if (attempts > 5) throw new RateLimitError('Too many OTP requests. Try again later.');

    const code = generateOtp();
    const codeHash = await bcrypt.hash(code, 10);
    const expiresAt = new Date(Date.now() + env.OTP_EXPIRY_MINUTES * 60 * 1000);

    const record = await prisma.otpVerification.create({
      data: {
        phone: normalized,
        codeHash,
        expiresAt,
        ipAddress,
        maxAttempts: env.OTP_MAX_ATTEMPTS,
      },
    });

    try {
      await getNotificationProvider().sendOTP({ phone: normalized, code });
    } catch (error) {
      await prisma.otpVerification.delete({ where: { id: record.id } }).catch((deleteError) => {
        logger.error({ err: deleteError, otpId: record.id }, 'Failed to rollback OTP record after send failure');
      });
      logger.error({ err: error, phone: normalized }, 'OTP provider failed');
      throw error;
    }

    return { expiresIn: env.OTP_EXPIRY_MINUTES * 60 };
  }

  async verifyOtp(phone: string, code: string) {
    const normalized = normalizePhone(phone);
    const record = await prisma.otpVerification.findFirst({
      where: {
        phone: normalized,
        verifiedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!record) throw new ValidationError('OTP expired or not found');
    if (record.attempts >= record.maxAttempts) {
      throw new RateLimitError('Maximum OTP attempts exceeded');
    }

    const valid = await bcrypt.compare(code, record.codeHash);
    const attempt = await prisma.otpVerification.updateMany({
      where: {
        id: record.id,
        verifiedAt: null,
        attempts: { lt: record.maxAttempts },
      },
      data: { attempts: { increment: 1 } },
    });

    if (attempt.count !== 1) throw new RateLimitError('Maximum OTP attempts exceeded');
    if (!valid) throw new ValidationError('Invalid OTP');

    const verified = await prisma.otpVerification.updateMany({
      where: { id: record.id, verifiedAt: null },
      data: { verifiedAt: new Date() },
    });
    if (verified.count !== 1) throw new ValidationError('OTP already used');

    return normalized;
  }
}

export const otpService = new OtpService();
