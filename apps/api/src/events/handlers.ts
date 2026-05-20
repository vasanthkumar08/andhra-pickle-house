import type { Job } from 'bullmq';
import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';
import { getNotificationProvider } from '../notifications';
import { buildOrderConfirmation } from '../notifications/order-notifications';
import { markOutboxFailed, markOutboxProcessed } from './outbox';
import type { PersistedDomainEvent } from './types';

export async function processDomainEvent(job: Job<PersistedDomainEvent>): Promise<void> {
  const event = job.data;
  logger.info(
    {
      eventType: event.type,
      eventId: event.id,
      outboxId: event.outboxId,
      jobId: job.id,
      attemptsMade: job.attemptsMade,
      maxAttempts: job.opts.attempts,
    },
    'Processing domain event'
  );

  try {
    if (event.type === 'order.created') {
      await processOrderCreated(event.outboxId, event.payload.orderId);
    } else if (event.type === 'inventory.reserved') {
      logger.info({ event }, 'Inventory reserved event observed');
    } else if (event.type === 'user.registered') {
      logger.info({ event }, 'User registered event observed');
    }
    await markOutboxProcessed(event.outboxId);
  } catch (error) {
    await markOutboxFailed(event.outboxId, error);
    logger.error(
      {
        err: error,
        eventType: event.type,
        eventId: event.id,
        outboxId: event.outboxId,
        jobId: job.id,
        attemptsMade: job.attemptsMade,
        maxAttempts: job.opts.attempts,
      },
      'Domain event processing failed'
    );
    throw error;
  }
}

async function processOrderCreated(eventId: string, orderId: string): Promise<void> {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new Error(`Order ${orderId} not found for order.created event`);
  if (order.whatsappSent) {
    logger.info({ orderId, orderRef: order.orderRef }, 'Order notification already processed');
    return;
  }

  const message = await buildOrderConfirmation(orderId);
  const shouldSend = await claimDelivery(eventId, 'sms', message.customerPhone, 'twilio');
  if (!shouldSend) return;
  try {
    await getNotificationProvider().sendOrderConfirmation(message);
    await prisma.notificationDelivery.update({
      where: { eventId_channel_recipient: { eventId, channel: 'sms', recipient: message.customerPhone } },
      data: { status: 'SENT', sentAt: new Date(), error: null },
    });
  } catch (error) {
    await prisma.notificationDelivery.update({
      where: { eventId_channel_recipient: { eventId, channel: 'sms', recipient: message.customerPhone } },
      data: {
        status: 'FAILED',
        error: error instanceof Error ? error.message : String(error),
      },
    });
    throw error;
  }
  await prisma.order.update({
    where: { id: orderId },
    data: { whatsappSent: true },
  });

  logger.info({ orderId, orderRef: order.orderRef }, 'Order notification processed');
}

async function claimDelivery(
  eventId: string,
  channel: string,
  recipient: string,
  provider: string
): Promise<boolean> {
  const existing = await prisma.notificationDelivery.findUnique({
    where: { eventId_channel_recipient: { eventId, channel, recipient } },
  });
  if (existing?.status === 'SENT') {
    logger.info({ eventId, channel, recipient }, 'Notification delivery already sent');
    return false;
  }

  await prisma.notificationDelivery.upsert({
    where: { eventId_channel_recipient: { eventId, channel, recipient } },
    update: { status: 'PROCESSING', attempts: { increment: 1 }, error: null },
    create: { eventId, channel, recipient, provider, status: 'PROCESSING', attempts: 1 },
  });
  return true;
}
