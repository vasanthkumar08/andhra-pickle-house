import type { Prisma } from '@prisma/client';
import { createQueue, QUEUE_NAMES } from '../queues';
import { logger } from '../lib/logger';
import { prisma } from '../lib/prisma';
import { domainEventSchema, type DomainEvent, type PersistedDomainEvent } from './types';

const eventsQueue = createQueue(QUEUE_NAMES.events);
type OutboxPayloadInput = Prisma.DomainEventOutboxCreateInput['payload'];

export async function appendOutboxEvent(
  tx: Prisma.TransactionClient,
  event: DomainEvent
): Promise<void> {
  const payload: OutboxPayloadInput = event;
  await tx.domainEventOutbox.create({
    data: {
      id: event.id,
      type: event.type,
      payload,
    },
  });
}

export async function publishPendingOutbox(limit = 25): Promise<number> {
  const pending = await prisma.domainEventOutbox.findMany({
    where: {
      status: { in: ['PENDING', 'FAILED'] },
      attempts: { lt: prisma.domainEventOutbox.fields.maxAttempts },
      nextAttemptAt: { lte: new Date() },
    },
    orderBy: { createdAt: 'asc' },
    take: limit,
  });

  let published = 0;
  for (const record of pending) {
    const claimed = await prisma.domainEventOutbox.updateMany({
      where: {
        id: record.id,
        status: { in: ['PENDING', 'FAILED'] },
      },
      data: {
        status: 'PROCESSING',
        lockedAt: new Date(),
        attempts: { increment: 1 },
      },
    });
    if (claimed.count !== 1) continue;

    try {
      const event = domainEventSchema.parse(record.payload);
      const persisted: PersistedDomainEvent = { ...event, outboxId: record.id };
      await eventsQueue.add(event.type, persisted, {
        jobId: `${event.type}:${record.id}`,
      });
      published += 1;
      logger.info({ eventType: event.type, outboxId: record.id }, 'Outbox event queued');
    } catch (error) {
      await markOutboxFailed(record.id, error);
    }
  }

  return published;
}

export async function recoverStuckOutbox(lockTimeoutMs = 2 * 60_000): Promise<number> {
  const staleBefore = new Date(Date.now() - lockTimeoutMs);
  const recovered = await prisma.domainEventOutbox.updateMany({
    where: {
      status: 'PROCESSING',
      lockedAt: { lt: staleBefore },
      processedAt: null,
    },
    data: {
      status: 'FAILED',
      lockedAt: null,
      nextAttemptAt: new Date(),
      lastError: `Recovered stale PROCESSING lock older than ${lockTimeoutMs}ms`,
    },
  });

  if (recovered.count > 0) {
    logger.warn({ count: recovered.count, lockTimeoutMs }, 'Recovered stuck outbox events');
  }

  return recovered.count;
}

export async function markOutboxProcessed(outboxId: string): Promise<void> {
  await prisma.domainEventOutbox.update({
    where: { id: outboxId },
    data: {
      status: 'PROCESSED',
      processedAt: new Date(),
      lastError: null,
      lockedAt: null,
    },
  });
}

export async function markOutboxFailed(outboxId: string, error: unknown): Promise<void> {
  const message = error instanceof Error ? error.message : String(error);
  const current = await prisma.domainEventOutbox.findUnique({ where: { id: outboxId } });
  if (!current) {
    logger.error({ outboxId, err: error }, 'Outbox record missing while marking failure');
    return;
  }

  const exhausted = current.attempts >= current.maxAttempts;
  const delayMs = Math.min(60_000, 1_000 * 2 ** Math.max(0, current.attempts - 1));

  await prisma.domainEventOutbox.update({
    where: { id: outboxId },
    data: {
      status: exhausted ? 'DEAD' : 'FAILED',
      lastError: message,
      nextAttemptAt: new Date(Date.now() + delayMs),
      lockedAt: null,
    },
  });

  logger.error(
    {
      outboxId,
      err: error,
      exhausted,
      attempts: current.attempts,
      maxAttempts: current.maxAttempts,
      nextAttemptAt: exhausted ? null : new Date(Date.now() + delayMs).toISOString(),
      retryStatus: exhausted ? 'dead' : 'scheduled',
    },
    'Outbox event failed'
  );
}
