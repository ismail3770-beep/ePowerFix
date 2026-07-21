import { describe, expect, it } from 'vitest'

import {
  assertMarketplaceCaseTransition,
  canMarketplaceCaseTransition,
  isMarketplaceUniqueConstraintError,
} from './marketplace-case'

describe('marketplace case policies', () => {
  it('allows review followed by a terminal decision', () => {
    expect(canMarketplaceCaseTransition('OPEN', 'UNDER_REVIEW')).toBe(true)
    expect(canMarketplaceCaseTransition('UNDER_REVIEW', 'RESOLVED')).toBe(true)
    expect(canMarketplaceCaseTransition('UNDER_REVIEW', 'REJECTED')).toBe(true)
  })

  it('rejects skipped, reverse, self, and unknown transitions', () => {
    expect(canMarketplaceCaseTransition('OPEN', 'RESOLVED')).toBe(false)
    expect(canMarketplaceCaseTransition('RESOLVED', 'OPEN')).toBe(false)
    expect(canMarketplaceCaseTransition('OPEN', 'OPEN')).toBe(false)
    expect(canMarketplaceCaseTransition('UNKNOWN', 'OPEN')).toBe(false)
    expect(() => assertMarketplaceCaseTransition('OPEN', 'RESOLVED')).toThrow()
  })

  it('recognizes only Prisma unique constraint conflicts', () => {
    expect(isMarketplaceUniqueConstraintError({ code: 'P2002' })).toBe(true)
    expect(isMarketplaceUniqueConstraintError({ code: 'P2025' })).toBe(false)
    expect(isMarketplaceUniqueConstraintError(null)).toBe(false)
  })
})
