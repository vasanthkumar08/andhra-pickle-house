import { WEIGHT_OPTIONS } from '@aph/shared';
import { env } from '../config/env';
import { prisma } from '../lib/prisma';
import { NotFoundError } from '../lib/errors';
import type { SendOrderConfirmationInput } from './provider';

function formatCurrency(paise: number): string {
  return `₹${(paise / 100).toFixed(0)}`;
}

export async function buildOrderConfirmation(orderId: string): Promise<SendOrderConfirmationInput> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });

  if (!order) throw new NotFoundError('Order not found for notification');

  const snapshot = order.snapshotJson as {
    items: Array<{ name?: string; weight: string; quantity: number; lineTotal: number }>;
    address: string;
    deliveryNotes?: string;
  };
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
