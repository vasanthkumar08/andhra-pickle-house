import { WEIGHT_OPTIONS } from '@aph/shared';
import { z } from 'zod';
import { env } from '../config/env';
import { prisma } from '../lib/prisma';
import { NotFoundError } from '../lib/errors';
import type { SendOrderConfirmationInput } from './provider';

const orderSnapshotSchema = z.object({
  items: z.array(
    z.object({
      name: z.string().optional(),
      weight: z.string(),
      quantity: z.number(),
      lineTotal: z.number(),
    })
  ),
  address: z.string(),
  deliveryNotes: z.string().optional(),
});

function formatCurrency(paise: number): string {
  return `₹${(paise / 100).toFixed(0)}`;
}

export async function buildOrderConfirmation(orderId: string): Promise<SendOrderConfirmationInput> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });

  if (!order) throw new NotFoundError('Order not found for notification');

  const snapshot = orderSnapshotSchema.parse(order.snapshotJson);
  const verifyUrl = `${env.WEB_URL}/order/verify?ref=${order.orderRef}&token=${order.orderToken}`;
  const itemsList = snapshot.items
    .map((i) => `- ${i.name} (${i.weight}) x ${i.quantity} = ${formatCurrency(i.lineTotal)}`)
    .join('\n');

  const ownerMessage = [
    'NEW ORDER - Andhra Pickle House',
    `Ref: ${order.orderRef}`,
    '',
    `${order.customerName}`,
    `Phone: +${order.customerPhone}`,
    `Address: ${snapshot.address}`,
    '',
    'Items:',
    itemsList,
    '',
    `Total: ${formatCurrency(order.subtotalPaise)}`,
    snapshot.deliveryNotes ? `Notes: ${snapshot.deliveryNotes}` : '',
    '',
    `Verify: ${verifyUrl}`,
  ]
    .filter(Boolean)
    .join('\n');

  const customerMessage = [
    `Thank you for ordering from Andhra Pickle House.`,
    `Order ${order.orderRef} is received.`,
    `Total: ${formatCurrency(order.subtotalPaise)}`,
    `Track: ${verifyUrl}`,
  ].join('\n');

  return {
    orderRef: order.orderRef,
    customerPhone: order.customerPhone,
    customerName: order.customerName,
    totalPaise: order.subtotalPaise,
    verifyUrl,
    ownerMessage,
    customerMessage,
  };
}

export function calcOrderPrice(basePricePaise: number, weightGrams: number, discountPercent = 0): number {
  const opt = WEIGHT_OPTIONS.find((w) => w.grams === weightGrams);
  const raw = Math.round(basePricePaise * (opt?.multiplier ?? 1));
  return Math.round(raw * (1 - discountPercent / 100));
}
