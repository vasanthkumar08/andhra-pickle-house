import { nanoid } from 'nanoid';
import { ORDER_TOKEN_PREFIX } from '@aph/shared';
import { OrderStatus, type Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { ValidationError, NotFoundError } from '../lib/errors';
import { calcOrderPrice } from '../notifications/order-notifications';
import { appendOutboxEvent, publishPendingOutbox } from '../events/outbox';
import { logger } from '../lib/logger';

export class OrderService {
  private generateOrderRef(): string {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    return `${ORDER_TOKEN_PREFIX}-${date}-${nanoid(8).toUpperCase()}`;
  }

  async checkout(
    userId: string,
    data: {
      addressId?: string;
      address?: {
        line1: string;
        line2?: string;
        city: string;
        state: string;
        pincode: string;
        phone: string;
      };
      customerName: string;
      deliveryNotes?: string;
    }
  ): Promise<{ order: Awaited<ReturnType<OrderService['getOrder']>>; eventId: string }> {
    const orderRef = this.generateOrderRef();
    const orderToken = nanoid(32);

    const order = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const user = await tx.user.findUniqueOrThrow({ where: { id: userId } });
      const cart = await tx.cart.findUnique({
        where: { userId },
        include: {
          items: {
            include: {
              product: {
                include: { inventory: true },
              },
            },
          },
        },
      });

      if (!cart || !cart.items.length) throw new ValidationError('Cart is empty');

      const addressSnapshot = await this.resolveAddress(tx, userId, data);
      const mappedItems = cart.items.map((item) => {
        const inv = item.product.inventory.find((i) => i.weightGrams === item.weightGrams);
        const available = inv ? inv.stock - inv.reserved : 0;
        if (!item.product.isActive || item.product.deletedAt || !inv || available < item.quantity) {
          throw new ValidationError(`Insufficient stock for ${item.product.name}`);
        }

        const unitPrice = calcOrderPrice(
          item.product.basePrice,
          item.weightGrams,
          item.product.discountPercent
        );
        const lineTotal = unitPrice * item.quantity;
        return {
          productId: item.productId,
          productName: item.product.name,
          weightGrams: item.weightGrams,
          weightLabel: `${item.weightGrams}g`,
          quantity: item.quantity,
          unitPrice,
          lineTotal,
        };
      });

      const subtotal = mappedItems.reduce((sum, item) => sum + item.lineTotal, 0);
      const snapshot = {
        orderRef,
        items: mappedItems.map((i) => ({
          name: i.productName,
          weight: i.weightLabel,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          lineTotal: i.lineTotal,
        })),
        subtotal,
        customerName: data.customerName,
        customerPhone: user.phone,
        address: `${addressSnapshot.line1}, ${addressSnapshot.line2 ? addressSnapshot.line2 + ', ' : ''}${addressSnapshot.city}, ${addressSnapshot.state} - ${addressSnapshot.pincode}`,
        deliveryNotes: data.deliveryNotes,
        createdAt: new Date().toISOString(),
      };

      const created = await tx.order.create({
        data: {
          orderRef,
          orderToken,
          userId,
          subtotalPaise: subtotal,
          snapshotJson: snapshot,
          addressSnapshot,
          deliveryNotes: data.deliveryNotes,
          customerPhone: user.phone,
          customerName: data.customerName,
          items: {
            create: mappedItems.map((i) => ({
              productId: i.productId,
              productName: i.productName,
              weightGrams: i.weightGrams,
              quantity: i.quantity,
              unitPricePaise: i.unitPrice,
              lineTotalPaise: i.lineTotal,
            })),
          },
        },
        include: { items: true },
      });

      for (const item of mappedItems) {
        const updated = await tx.$executeRaw`
          UPDATE inventory
          SET reserved = reserved + ${item.quantity}, version = version + 1, "updatedAt" = NOW()
          WHERE "productId" = ${item.productId}
            AND "weightGrams" = ${item.weightGrams}
            AND stock - reserved >= ${item.quantity}
        `;
        if (updated !== 1) {
          throw new ValidationError(`Insufficient stock for ${item.productName}`);
        }
      }

      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

      await tx.auditLog.create({
        data: {
          userId,
          action: 'ORDER_CREATED',
          entity: 'Order',
          entityId: created.id,
          metadata: { orderRef },
        },
      });

      const occurredAt = new Date().toISOString();
      await appendOutboxEvent(tx, {
        type: 'order.created',
        id: created.id,
        occurredAt,
        payload: { orderId: created.id, orderRef: created.orderRef },
      });
      await appendOutboxEvent(tx, {
        type: 'inventory.reserved',
        id: `${created.id}:inventory.reserved`,
        occurredAt,
        payload: { orderId: created.id, orderRef: created.orderRef },
      });

      return created;
    });

    try {
      await publishPendingOutbox();
    } catch (error) {
      logger.error({ err: error, orderId: order.id }, 'Outbox relay failed after checkout commit');
    }

    return { order: await this.getOrder(order.id), eventId: order.id };
  }

  private async resolveAddress(
    tx: Prisma.TransactionClient,
    userId: string,
    data: {
      addressId?: string;
      address?: {
        line1: string;
        line2?: string;
        city: string;
        state: string;
        pincode: string;
        phone: string;
      };
    }
  ): Promise<Record<string, string>> {
    if (data.addressId) {
      const addr = await tx.address.findFirst({
        where: { id: data.addressId, userId },
      });
      if (!addr) throw new NotFoundError('Address not found');
      return {
        line1: addr.line1,
        line2: addr.line2 || '',
        city: addr.city,
        state: addr.state,
        pincode: addr.pincode,
        phone: addr.phone,
      };
    }

    if (!data.address) throw new ValidationError('Address required');

    await tx.address.updateMany({
      where: { userId, isDefault: true },
      data: { isDefault: false },
    });

    const created = await tx.address.create({
      data: {
        userId,
        line1: data.address.line1,
        line2: data.address.line2,
        city: data.address.city,
        state: data.address.state,
        pincode: data.address.pincode,
        phone: data.address.phone,
        isDefault: true,
      },
    });

    return {
      line1: created.line1,
      line2: created.line2 || '',
      city: created.city,
      state: created.state,
      pincode: created.pincode,
      phone: created.phone,
    };
  }

  async getOrder(orderId: string) {
    return prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true, user: { select: { phone: true, name: true } } },
    });
  }

  async verifyOrder(ref: string, token: string) {
    const order = await prisma.order.findFirst({
      where: { orderRef: ref, orderToken: token },
      include: { items: true },
    });
    if (!order) throw new NotFoundError('Invalid order reference');
    return order;
  }

  async listMine(userId: string) {
    return prisma.order.findMany({
      where: { userId },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  }

  async listForAdmin(status?: OrderStatus, page = 1, limit = 20) {
    const where: Prisma.OrderWhereInput = status ? { status } : {};
    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: { items: true, user: { select: { phone: true, name: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.order.count({ where }),
    ]);
    return { orders, total, page, limit };
  }

  async updateStatus(orderId: string, status: OrderStatus) {
    return prisma.order.update({
      where: { id: orderId },
      data: { status },
    });
  }

  async getAnalytics() {
    const [totalOrders, revenue, topProducts, repeatCustomers] = await Promise.all([
      prisma.order.count(),
      prisma.order.aggregate({ _sum: { subtotalPaise: true } }),
      prisma.orderItem.groupBy({
        by: ['productName'],
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 5,
      }),
      prisma.order.groupBy({
        by: ['userId'],
        _count: { id: true },
        having: { userId: { _count: { gt: 1 } } },
      }),
    ]);

    return {
      totalOrders,
      revenuePaise: revenue._sum.subtotalPaise ?? 0,
      topProducts,
      repeatCustomerCount: repeatCustomers.length,
      pendingOrders: await prisma.order.count({ where: { status: 'PENDING' } }),
    };
  }
}

export const orderService = new OrderService();
