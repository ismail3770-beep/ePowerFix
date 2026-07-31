import { describe, expect, it } from 'vitest'

import { calculateCouponDiscount, formatPaisa, toPaisa } from './money'

describe('money helpers', () => {
  it('converts two-decimal amounts into paisa exactly', () => {
    expect(toPaisa('120.50')).toBe(12_050)
    expect(toPaisa('0.1')).toBe(10)
    expect(formatPaisa(12_050)).toBe('120.50')
  })

  it('rejects malformed and over-precision amounts', () => {
    expect(() => toPaisa('abc')).toThrow('valid monetary amount')
    expect(() => toPaisa('1.001')).toThrow('at most two decimal places')
    expect(() => toPaisa('-1')).toThrow('non-negative')
  })

  it('calculates percentage discounts with an exact cap', () => {
    expect(calculateCouponDiscount({ subtotalPaisa: toPaisa('199.99'), type: 'PERCENTAGE', value: '12.5', maxDiscount: '20.00' })).toBe(toPaisa('20.00'))
  })

  it('never discounts more than the subtotal', () => {
    expect(calculateCouponDiscount({ subtotalPaisa: toPaisa('10.00'), type: 'FIXED', value: '25.00', maxDiscount: null })).toBe(toPaisa('10.00'))
  })
})
