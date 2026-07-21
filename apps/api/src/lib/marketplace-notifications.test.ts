import { describe, expect, it } from 'vitest'

import {
  assertMarketplaceNotificationInput,
  marketplaceNotificationKey,
} from './marketplace-notifications'

describe('marketplace notifications', () => {
  it('builds deterministic producer-scoped keys', () => {
    expect(marketplaceNotificationKey('PROVIDER_ASSIGNED', 'assignment-1', 'user-1')).toBe(
      'marketplace:PROVIDER_ASSIGNED:assignment-1:user-1',
    )
  })

  it('accepts bounded in-app notification content', () => {
    expect(() => assertMarketplaceNotificationInput({
      userId: 'user-1',
      idempotencyKey: 'marketplace:TEST:entity:user-1',
      template: 'TEST',
      title: 'New assignment',
      message: 'A marketplace job is ready for your response.',
    })).not.toThrow()
  })

  it('rejects unsafe keys and missing or oversized content', () => {
    expect(() => assertMarketplaceNotificationInput({
      userId: 'user-1',
      idempotencyKey: 'short',
      template: 'TEST',
      title: 'Title',
      message: 'Message',
    })).toThrow('idempotency key')
    expect(() => assertMarketplaceNotificationInput({
      userId: 'user-1',
      idempotencyKey: 'marketplace:TEST:entity:user-1',
      template: 'TEST',
      title: ' ',
      message: 'Message',
    })).toThrow('required')
    expect(() => assertMarketplaceNotificationInput({
      userId: 'user-1',
      idempotencyKey: 'marketplace:TEST:entity:user-1',
      template: 'TEST',
      title: 'Title',
      message: 'x'.repeat(5001),
    })).toThrow('allowed length')
  })
})
