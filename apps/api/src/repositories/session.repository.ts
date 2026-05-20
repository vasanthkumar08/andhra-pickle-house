import type { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';

export type PrismaClientLike = typeof prisma | Prisma.TransactionClient;

export class SessionRepository {
  constructor(private readonly client: PrismaClientLike = prisma) {}

  create(data: {
    userId: string;
    refreshHash: string;
    deviceInfo?: string;
    ipAddress?: string;
    userAgent?: string;
    expiresAt: Date;
  }) {
    return this.client.session.create({ data });
  }

  findActiveForUser(userId: string) {
    return this.client.session.findMany({
      where: { userId, isRevoked: false, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    });
  }

  revokeIfActive(sessionId: string) {
    return this.client.session.updateMany({
      where: { id: sessionId, isRevoked: false },
      data: { isRevoked: true },
    });
  }

  revokeAll(userId: string) {
    return this.client.session.updateMany({
      where: { userId },
      data: { isRevoked: true },
    });
  }
}

export const sessionRepository = new SessionRepository();
