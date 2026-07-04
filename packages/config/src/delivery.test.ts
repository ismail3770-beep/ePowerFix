import { describe, it, expect } from 'vitest'
import { getDeliveryCharge, DELIVERY_ZONES } from './delivery'

describe('getDeliveryCharge()', () => {
  it('returns 60 BDT for inside Dhaka under free threshold', () => {
    expect(getDeliveryCharge('Dhaka, Bangladesh', 500)).toBe(60)
  })

  it('returns 0 for inside Dhaka above free threshold', () => {
    expect(getDeliveryCharge('Inside Dhaka', 2500)).toBe(0)
  })

  it('returns 120 BDT for outside Dhaka under free threshold', () => {
    expect(getDeliveryCharge('Chittagong', 1000)).toBe(120)
  })

  it('returns 0 for outside Dhaka above free threshold', () => {
    expect(getDeliveryCharge('Rajshahi', 6000)).toBe(0)
  })

  it('is case-insensitive', () => {
    expect(getDeliveryCharge('INSIDE DHAKA', 100)).toBe(60)
    expect(getDeliveryCharge('dhaka city', 100)).toBe(60)
  })

  it('DELIVERY_ZONES has correct structure', () => {
    expect(DELIVERY_ZONES).toHaveLength(2)
    expect(DELIVERY_ZONES[0].charge).toBe(60)
    expect(DELIVERY_ZONES[1].charge).toBe(120)
  })
})