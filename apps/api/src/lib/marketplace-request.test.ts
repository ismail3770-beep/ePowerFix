import { describe, expect, it } from 'vitest'
import {
  getRequestSubmissionIssues,
  isOwnedCustomerRequestStorageKey,
  normalizeMarketplaceMoney,
} from './marketplace-request'

describe('marketplace request policies', () => {
  it('normalizes valid nonnegative money and rejects malformed settings', () => {
    expect(normalizeMarketplaceMoney('250')).toBe('250.00')
    expect(normalizeMarketplaceMoney('250.5')).toBe('250.50')
    expect(normalizeMarketplaceMoney('-1')).toBe('0.00')
    expect(normalizeMarketplaceMoney('not-money')).toBe('0.00')
  })

  it('requires a service or skill, scheduling for non-emergency work, and surcharge consent', () => {
    expect(getRequestSubmissionIssues({
      serviceId: null,
      skillId: null,
      scheduledFor: null,
      isEmergency: false,
      emergencySurcharge: '0.00',
      emergencySurchargeAccepted: false,
    })).toEqual(['SERVICE_OR_SKILL_REQUIRED', 'SCHEDULE_REQUIRED'])

    expect(getRequestSubmissionIssues({
      serviceId: 'service-1',
      skillId: null,
      scheduledFor: null,
      isEmergency: true,
      emergencySurcharge: '150.00',
      emergencySurchargeAccepted: false,
    })).toEqual(['EMERGENCY_SURCHARGE_CONFIRMATION_REQUIRED'])
  })

  it('accepts only traversal-safe keys in the authenticated customer request namespace', () => {
    expect(isOwnedCustomerRequestStorageKey(
      'marketplace/customers/customer-1/requests/client-1/photo.webp',
      'customer-1',
    )).toBe(true)
    expect(isOwnedCustomerRequestStorageKey(
      'marketplace/customers/customer-2/requests/client-1/photo.webp',
      'customer-1',
    )).toBe(false)
    expect(isOwnedCustomerRequestStorageKey(
      'marketplace/customers/customer-1/requests/../private/file',
      'customer-1',
    )).toBe(false)
    expect(isOwnedCustomerRequestStorageKey('https://example.com/file', 'customer-1')).toBe(false)
  })
})
