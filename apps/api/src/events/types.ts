import { z } from 'zod';

export const domainEventTypeSchema = z.enum(['order.created', 'inventory.reserved', 'user.registered']);
export type DomainEventType = z.infer<typeof domainEventTypeSchema>;

export const orderCreatedEventSchema = z.object({
  type: z.literal('order.created'),
  id: z.string(),
  occurredAt: z.string(),
  payload: z.object({
    orderId: z.string(),
    orderRef: z.string(),
  }),
});

export const inventoryReservedEventSchema = z.object({
  type: z.literal('inventory.reserved'),
  id: z.string(),
  occurredAt: z.string(),
  payload: z.object({
    orderId: z.string(),
    orderRef: z.string(),
  }),
});

export const userRegisteredEventSchema = z.object({
  type: z.literal('user.registered'),
  id: z.string(),
  occurredAt: z.string(),
  payload: z.object({
    userId: z.string(),
    phone: z.string(),
  }),
});

export const domainEventSchema = z.discriminatedUnion('type', [
  orderCreatedEventSchema,
  inventoryReservedEventSchema,
  userRegisteredEventSchema,
]);

export type OrderCreatedEvent = z.infer<typeof orderCreatedEventSchema>;
export type InventoryReservedEvent = z.infer<typeof inventoryReservedEventSchema>;
export type UserRegisteredEvent = z.infer<typeof userRegisteredEventSchema>;
export type DomainEvent = z.infer<typeof domainEventSchema>;

export type PersistedDomainEvent = DomainEvent & {
  outboxId: string;
};
