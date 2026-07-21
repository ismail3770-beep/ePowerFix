import type { Prisma } from '@prisma/client'

export interface MarketplaceNotificationInput {
  userId: string
  idempotencyKey: string
  template: string
  title: string
  message: string
  entityType?: string
  entityId?: string
  payload?: Record<string, unknown>
}

type NotificationUpsert = (
  args: Prisma.NotificationDeliveryUpsertArgs,
) => PromiseLike<unknown>

const IDEMPOTENCY_PATTERN = /^[A-Za-z0-9:_-]{16,200}$/

export function marketplaceNotificationKey(
  template: string,
  entityId: string,
  userId: string,
): string {
  return `marketplace:${template}:${entityId}:${userId}`
}

export function assertMarketplaceNotificationInput(input: MarketplaceNotificationInput): void {
  if (!IDEMPOTENCY_PATTERN.test(input.idempotencyKey)) {
    throw new Error('Marketplace notification idempotency key is invalid')
  }
  if (!input.userId || !input.template || !input.title.trim() || !input.message.trim()) {
    throw new Error('Marketplace notification recipient, template, title, and message are required')
  }
  if (input.title.length > 200 || input.message.length > 5000) {
    throw new Error('Marketplace notification content exceeds the allowed length')
  }
}

/**
 * Enqueues an in-app notification through the caller's transaction. The narrow
 * callback supports both base and extended Prisma clients without weakening the
 * typed upsert payload. An empty update preserves the first immutable snapshot.
 */
export async function enqueueMarketplaceNotification(
  upsert: NotificationUpsert,
  input: MarketplaceNotificationInput,
) {
  assertMarketplaceNotificationInput(input)
  const now = new Date()
  return upsert({
    where: { idempotencyKey: input.idempotencyKey },
    create: {
      userId: input.userId,
      idempotencyKey: input.idempotencyKey,
      channel: 'IN_APP',
      template: input.template,
      title: input.title.trim(),
      message: input.message.trim(),
      payload: input.payload ? JSON.stringify(input.payload) : null,
      status: 'DELIVERED',
      entityType: input.entityType ?? null,
      entityId: input.entityId ?? null,
      deliveredAt: now,
    },
    update: {},
  })
}
