export type DomainEventType = 'order.created' | 'inventory.reserved' | 'user.registered';

export interface OrderCreatedEvent {
  type: 'order.created';
  id: string;
  occurredAt: string;
  payload: {
    orderId: string;
    orderRef: string;
  };
}

export interface InventoryReservedEvent {
  type: 'inventory.reserved';
  id: string;
  occurredAt: string;
  payload: {
    orderId: string;
    orderRef: string;
  };
}

export interface UserRegisteredEvent {
  type: 'user.registered';
  id: string;
  occurredAt: string;
  payload: {
    userId: string;
    phone: string;
  };
}

export type DomainEvent = OrderCreatedEvent | InventoryReservedEvent | UserRegisteredEvent;

export type PersistedDomainEvent = DomainEvent & {
  outboxId: string;
};
