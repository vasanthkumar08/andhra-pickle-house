import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { nanoid } from 'nanoid';
import { prisma } from '../lib/prisma';
import { env } from '../config/env';
import { otpService } from './otp.service';
import { UnauthorizedError } from '../lib/errors';
import { appendOutboxEvent, publishPendingOutbox } from '../events/outbox';
import { logger } from '../lib/logger';
import { UserRepository, userRepository } from '../repositories/user.repository';
import { SessionRepository, sessionRepository } from '../repositories/session.repository';

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export class AuthService {
  private signAccess(userId: string, role: string, sessionId: string) {
    return jwt.sign({ userId, role, sessionId }, env.JWT_ACCESS_SECRET, {
      expiresIn: env.JWT_ACCESS_EXPIRES as jwt.SignOptions['expiresIn'],
    });
  }

  private signRefresh(userId: string, role: string) {
    return jwt.sign({ userId, role, jti: nanoid() }, env.JWT_REFRESH_SECRET, {
      expiresIn: env.JWT_REFRESH_EXPIRES as jwt.SignOptions['expiresIn'],
    });
  }

  async requestOtp(phone: string, ipAddress?: string) {
    return otpService.sendOtp(phone, ipAddress);
  }

  async verifyOtpAndLogin(
    phone: string,
    code: string,
    name?: string,
    deviceInfo?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<{ tokens: TokenPair; user: { id: string; phone: string; name: string | null; role: string } }> {
    const normalized = await otpService.verifyOtp(phone, code);

    const result = await prisma.$transaction(async (tx) => {
      const users = new UserRepository(tx);
      let user = await users.findByPhone(normalized);
      let registered = false;
      if (!user) {
        user = await users.create(normalized);
        registered = true;
      }

      if (user.lockedUntil && user.lockedUntil > new Date()) {
        throw new UnauthorizedError('Account temporarily locked');
      }

      const tokens = await this.createSessionWithClient(
        tx,
        user.id,
        user.role,
        deviceInfo,
        ipAddress,
        userAgent
      );

      await users.updateLogin(user.id);
      if (name) await users.updateName(user.id, name);

      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: 'LOGIN',
          ipAddress,
          metadata: { deviceInfo },
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
    client: Pick<typeof prisma, 'session'>,
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

    const sessions = new SessionRepository(client as typeof prisma);
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
    let payload: { userId: string; role: string };
    try {
      payload = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as {
        userId: string;
        role: string;
      };
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

    return prisma.$transaction(async (tx) => {
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

  async logout(userId: string, refreshToken?: string) {
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
