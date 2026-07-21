import { describe, expect, it } from 'vitest'
import {
  assertMarketplaceTransition,
  canMarketplaceTransition,
  JOB_TRANSITIONS,
  MarketplaceTransitionError,
  PROVIDER_TRANSITIONS,
  QUOTE_TRANSITIONS,
  REQUEST_TRANSITIONS,
} from './marketplace-state'

describe('marketplace state transitions', () => {
  it('contains an explicit transition list for every declared lifecycle state', () => {
    expect(Object.keys(PROVIDER_TRANSITIONS)).toHaveLength(6)
    expect(Object.keys(REQUEST_TRANSITIONS)).toHaveLength(9)
    expect(Object.keys(JOB_TRANSITIONS)).toHaveLength(15)
    expect(Object.keys(QUOTE_TRANSITIONS)).toHaveLength(7)
  })

  it('allows the pilot provider verification lifecycle', () => {
    expect(canMarketplaceTransition('provider', 'DRAFT', 'SUBMITTED')).toBe(true)
    expect(canMarketplaceTransition('provider', 'SUBMITTED', 'UNDER_REVIEW')).toBe(true)
    expect(canMarketplaceTransition('provider', 'UNDER_REVIEW', 'VERIFIED')).toBe(true)
    expect(canMarketplaceTransition('provider', 'VERIFIED', 'SUSPENDED')).toBe(true)
  })

  it('allows the customer request and provider job happy paths', () => {
    expect(canMarketplaceTransition('request', 'SUBMITTED', 'DISPATCHING')).toBe(true)
    expect(canMarketplaceTransition('request', 'DISPATCHING', 'ASSIGNED')).toBe(true)
    expect(canMarketplaceTransition('job', 'ASSIGNED', 'ACCEPTED')).toBe(true)
    expect(canMarketplaceTransition('job', 'ARRIVED', 'INSPECTION')).toBe(true)
    expect(canMarketplaceTransition('job', 'QUOTE_APPROVED', 'IN_PROGRESS')).toBe(true)
    expect(canMarketplaceTransition('job', 'COMPLETED_PENDING_CONFIRMATION', 'COMPLETED')).toBe(true)
  })

  it('returns declined offers to dispatch without losing job history', () => {
    expect(canMarketplaceTransition('job', 'ASSIGNED', 'REJECTED')).toBe(true)
    expect(canMarketplaceTransition('request', 'ASSIGNED', 'DISPATCHING')).toBe(true)
    expect(canMarketplaceTransition('job', 'REJECTED', 'ASSIGNED')).toBe(true)
  })

  it('keeps approved quotes immutable and rejects skipped job states', () => {
    expect(canMarketplaceTransition('quote', 'SUBMITTED', 'CUSTOMER_APPROVED')).toBe(true)
    expect(canMarketplaceTransition('quote', 'CUSTOMER_APPROVED', 'DRAFT')).toBe(false)
    expect(canMarketplaceTransition('job', 'ASSIGNED', 'IN_PROGRESS')).toBe(false)
    expect(canMarketplaceTransition('job', 'COMPLETED', 'IN_PROGRESS')).toBe(false)
  })

  it('rejects self, unknown, and terminal-state transitions with a 409 error', () => {
    expect(canMarketplaceTransition('request', 'CANCELLED', 'SUBMITTED')).toBe(false)
    expect(canMarketplaceTransition('job', 'ACCEPTED', 'ACCEPTED')).toBe(false)
    expect(canMarketplaceTransition('job', 'UNKNOWN', 'ACCEPTED')).toBe(false)

    expect(() => assertMarketplaceTransition('job', 'ASSIGNED', 'COMPLETED')).toThrow(
      MarketplaceTransitionError,
    )
    try {
      assertMarketplaceTransition('job', 'ASSIGNED', 'COMPLETED')
    } catch (error) {
      expect(error).toMatchObject({
        code: 'ILLEGAL_STATE_TRANSITION',
        status: 409,
        kind: 'job',
        from: 'ASSIGNED',
        to: 'COMPLETED',
      })
    }
  })
})
