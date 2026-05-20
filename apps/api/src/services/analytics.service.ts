import type { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';
import type { JsonObject } from '../lib/json';

export class AnalyticsService {
  async track(event: string, payload?: JsonObject, userId?: string, sessionId?: string): Promise<void> {
    const analyticsPayload: Prisma.AnalyticsEventCreateInput['payload'] = payload ?? {};
    await prisma.analyticsEvent.create({
      data: {
        event,
        payload: analyticsPayload,
        userId,
        sessionId,
      },
    });
  }

  async getDashboard() {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const last30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      activeUsers,
      totalOrders,
      revenue,
      ordersToday,
      pendingOrders,
      topProducts,
      recentOrders,
      abandonedCarts,
      eventsLast7d,
    ] = await Promise.all([
      prisma.user.count({ where: { role: 'CUSTOMER', deletedAt: null } }),
      prisma.user.count({ where: { lastLoginAt: { gte: last30 } } }),
      prisma.order.count(),
      prisma.order.aggregate({ _sum: { subtotalPaise: true } }),
      prisma.order.count({ where: { createdAt: { gte: startOfDay } } }),
      prisma.order.count({ where: { status: 'PENDING' } }),
      prisma.orderItem.groupBy({
        by: ['productName'],
        _sum: { quantity: true, lineTotalPaise: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 8,
      }),
      prisma.order.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { phone: true, name: true } } },
      }),
      prisma.cart.count({
        where: { items: { some: {} }, updatedAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
      }),
      prisma.analyticsEvent.groupBy({
        by: ['event'],
        where: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
        _count: { id: true },
      }),
    ]);

    let dailyOrders: Array<{ day: Date; count: number }> = [];
    try {
      dailyOrders = await prisma.$queryRaw<Array<{ day: Date; count: number }>>`
        SELECT DATE("createdAt") as day, COUNT(*)::int as count
        FROM orders
        WHERE "createdAt" >= ${last30}
        GROUP BY DATE("createdAt")
        ORDER BY day ASC
      `;
    } catch (error) {
      logger.error({ err: error }, 'Daily orders analytics query failed');
      throw error;
    }

    const lowStock = await prisma.inventory.findMany({
      where: { stock: { lte: 5 } },
      include: { product: { select: { name: true, slug: true } } },
      take: 10,
    });

    return {
      totalUsers,
      activeUsers,
      totalOrders,
      revenuePaise: revenue._sum.subtotalPaise ?? 0,
      ordersToday,
      pendingOrders,
      conversionRate: totalUsers > 0 ? Number(((totalOrders / totalUsers) * 100).toFixed(1)) : 0,
      topProducts,
      recentOrders,
      abandonedCarts,
      eventsLast7d,
      dailyOrders,
      lowStock,
    };
  }
}

export const analyticsService = new AnalyticsService();
