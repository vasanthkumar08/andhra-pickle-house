import type { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';

type PrismaClientLike = typeof prisma | Prisma.TransactionClient;

export class UserRepository {
  constructor(private readonly client: PrismaClientLike = prisma) {}

  findByPhone(phone: string) {
    return this.client.user.findUnique({ where: { phone } });
  }

  create(phone: string) {
    return this.client.user.create({ data: { phone } });
  }

  updateLogin(userId: string) {
    return this.client.user.update({
      where: { id: userId },
      data: { lastLoginAt: new Date(), loginAttempts: 0 },
    });
  }

  updateName(userId: string, name: string) {
    return this.client.user.update({ where: { id: userId }, data: { name } });
  }

  getPublicProfile(userId: string) {
    return this.client.user.findUnique({
      where: { id: userId },
      select: { id: true, phone: true, name: true, role: true },
    });
  }
}

export const userRepository = new UserRepository();
