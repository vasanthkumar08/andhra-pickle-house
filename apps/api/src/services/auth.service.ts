import bcrypt from 'bcryptjs';
import { createHash } from 'node:crypto';
import jwt from 'jsonwebtoken';
import { nanoid } from 'nanoid';
import type { Prisma } from '@prisma/client';
import { z } from 'zod';
import { normalizePhone } from '@aph/shared';
import { prisma } from '../lib/prisma';
import { env } from '../config/env';
import { otpService } from './otp.service';
import { UnauthorizedError } from '../lib/errors';
import { appendOutboxEvent, publishPendingOutbox } from '../events/outbox';
import { logger } from '../lib/logger';
import { verifyFirebasePhoneToken } from '../lib/firebase';
import { redis, redisReady } from '../lib/redis';
import { UserRepository, userRepository } from '../repositories/user.repository';
import {
  SessionRepository,
  sessionRepository,
  type PrismaClientLike,
} from '../repositories/session.repository';

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

interface AuthUser {
  id: string;
  phone: string;
  name: string | null;
  role: string;
}

const FIREBASE_TOKEN_REPLAY_PREFIX = 'auth:firebase-token:';
const FIREBASE_TOKEN_REPLAY_FALLBACK_TTL_SECONDS = 60 * 60;

const refreshTokenPayloadSchema = z.object({
  userId: z.string(),
  role: z.string(),
});

export class AuthService {
  private signAccess(userId: string, role: string, sessionId: string): string {
    return jwt.sign({ userId, role, sessionId }, env.JWT_ACCESS_SECRET, {
      expiresIn: env.JWT_ACCESS_EXPIRES as jwt.SignOptions['expiresIn'],
    });
  }

  private signRefresh(userId: string, role: string): string {
    return jwt.sign({ userId, role, jti: nanoid() }, env.JWT_REFRESH_SECRET, {
      expiresIn: env.JWT_REFRESH_EXPIRES as jwt.SignOptions['expiresIn'],
    });
  }

  async requestOtp(phone: string, ipAddress?: string): Promise<{ expiresIn: number }> {
    return otpService.sendOtp(phone, ipAddress);
  }

  async verifyOtpAndLogin(
    phone: string,
    code: string,
    name?: string,
    deviceInfo?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<{ tokens: TokenPair; user: AuthUser }> {
    const normalized = await otpService.verifyOtp(phone, code);

    return this.loginWithVerifiedPhone({
      phone: normalized,
      name,
      deviceInfo,
      ipAddress,
      userAgent,
      provider: 'legacy-otp',
    });
  }

  async firebaseLogin(
    firebaseToken: string,
    deviceInfo?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<{ tokens: TokenPair; user: AuthUser }> {
    const decodedToken = await verifyFirebasePhoneToken(firebaseToken);
    await preventFirebaseTokenReplay(firebaseToken, decodedToken.exp);

    const phoneNumber = decodedToken.phone_number;

    if (!phoneNumber) {
      throw new UnauthorizedError('Firebase token does not contain a verified phone number');
    }

    return this.loginWithVerifiedPhone({
      phone: normalizePhone(phoneNumber),
      deviceInfo,
      ipAddress,
      userAgent,
      provider: 'firebase',
      firebaseUid: decodedToken.uid,
    });
  }

  private async loginWithVerifiedPhone(input: {
    phone: string;
    name?: string;
    deviceInfo?: string;
    ipAddress?: string;
    userAgent?: string;
    provider: 'firebase' | 'legacy-otp';
    firebaseUid?: string;
  }): Promise<{ tokens: TokenPair; user: AuthUser }> {
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const users = new UserRepository(tx);
      let user = await users.findByPhone(input.phone);
      let registered = false;
      if (!user) {
        user = await users.create(input.phone);
        registered = true;
      }

      if (user.lockedUntil && user.lockedUntil > new Date()) {
        throw new UnauthorizedError('Account temporarily locked');
      }

      const tokens = await this.createSessionWithClient(
        tx,
        user.id,
        user.role,
        input.deviceInfo,
        input.ipAddress,
        input.userAgent
      );

      await users.updateLogin(user.id);
      if (input.name) await users.updateName(user.id, input.name);

      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: 'LOGIN',
          ipAddress: input.ipAddress,
          metadata: {
            provider: input.provider,
            deviceInfo: input.deviceInfo,
            firebaseUid: input.firebaseUid,
          },
        },
      });

      if (registered) {
        await appendOutboxEvent(tx, {
          type: 'user.registered',
          id: user.id,
          occurredAt: new Date().toISOString(),
          payload: { userId: user.id, phone: user.phone },
        });
      }

      return {
        tokens,
        user: { id: user.id, phone: user.phone, name: user.name, role: user.role },
      };
    });

    try {
      await publishPendingOutbox();
    } catch (error) {
      logger.error({ err: error, userId: result.user.id }, 'Outbox relay failed after login commit');
    }

    return {
      tokens: result.tokens,
      user: result.user,
    };
  }

  async createSession(
    userId: string,
    role: string,
    deviceInfo?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<TokenPair> {
    return this.createSessionWithClient(prisma, userId, role, deviceInfo, ipAddress, userAgent);
  }

  private async createSessionWithClient(
    client: PrismaClientLike,
    userId: string,
    role: string,
    deviceInfo?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<TokenPair> {
    const refreshToken = this.signRefresh(userId, role);
    const refreshHash = await bcrypt.hash(refreshToken, 10);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const sessions = new SessionRepository(client);
    const session = await sessions.create({
      userId,
      refreshHash,
      deviceInfo,
      ipAddress,
      userAgent,
      expiresAt,
    });

    const accessToken = this.signAccess(userId, role, session.id);
    return { accessToken, refreshToken };
  }

  async refreshTokens(refreshToken: string): Promise<TokenPair> {
    let payload: z.infer<typeof refreshTokenPayloadSchema>;
    try {
      payload = refreshTokenPayloadSchema.parse(jwt.verify(refreshToken, env.JWT_REFRESH_SECRET));
    } catch (error) {
      logger.debug({ err: error }, 'Refresh token verification failed');
      throw new UnauthorizedError('Invalid refresh token');
    }

    const sessions = await sessionRepository.findActiveForUser(payload.userId);

    let validSession = null;
    for (const s of sessions) {
      if (await bcrypt.compare(refreshToken, s.refreshHash)) {
        validSession = s;
        break;
      }
    }

    if (!validSession) throw new UnauthorizedError('Session not found');

    return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const txSessions = new SessionRepository(tx);
      const revoked = await txSessions.revokeIfActive(validSession.id);
      if (revoked.count !== 1) throw new UnauthorizedError('Refresh token already used');

      const newRefreshToken = this.signRefresh(payload.userId, payload.role);
      const refreshHash = await bcrypt.hash(newRefreshToken, 10);
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      const session = await txSessions.create({
        userId: payload.userId,
        refreshHash,
        expiresAt,
      });

      return {
        accessToken: this.signAccess(payload.userId, payload.role, session.id),
        refreshToken: newRefreshToken,
      };
    });
  }

  async logout(userId: string, refreshToken?: string): Promise<void> {
    if (refreshToken) {
      const sessions = await sessionRepository.findActiveForUser(userId);
      for (const s of sessions) {
        if (await bcrypt.compare(refreshToken, s.refreshHash)) {
          await prisma.session.update({ where: { id: s.id }, data: { isRevoked: true } });
        }
      }
    } else {
      await sessionRepository.revokeAll(userId);
    }
  }

  async getMe(userId: string) {
    return userRepository.getPublicProfile(userId);
  }
}

export const authService = new AuthService();

async function preventFirebaseTokenReplay(firebaseToken: string, expiresAtSeconds?: number): Promise<void> {
  if (!redisReady) {
    logger.warn('Firebase token replay guard skipped because Redis is not ready');
    return;
  }

  const tokenHash = createHash('sha256').update(firebaseToken).digest('hex');
  const ttlSeconds = getFirebaseReplayTtlSeconds(expiresAtSeconds);

  try {
    const result = await redis.set(`${FIREBASE_TOKEN_REPLAY_PREFIX}${tokenHash}`, '1', 'EX', ttlSeconds, 'NX');
    if (result !== 'OK') {
      throw new UnauthorizedError('Firebase token was already used');
    }
  } catch (error) {
    if (error instanceof UnauthorizedError) throw error;
    logger.warn({ err: error }, 'Firebase token replay guard failed open');
  }
}

function getFirebaseReplayTtlSeconds(expiresAtSeconds?: number): number {
  if (!expiresAtSeconds) return FIREBASE_TOKEN_REPLAY_FALLBACK_TTL_SECONDS;

  const secondsUntilExpiry = expiresAtSeconds - Math.floor(Date.now() / 1000);
  return Math.max(60, Math.min(FIREBASE_TOKEN_REPLAY_FALLBACK_TTL_SECONDS, secondsUntilExpiry));
}
