import { describe, expect, it } from 'vitest'

import {
  calculateQuoteLines,
  generateArrivalOtp,
  hashArrivalOtp,
  verifyArrivalOtp,
} from './marketplace-job'

describe('marketplace job policies', () => {
  it('generates six-digit arrival codes and verifies only the matching job/code pair', () => {
    const code = generateArrivalOtp()
    expect(code).toMatch(/^\d{6}$/)
    const hash = hashArrivalOtp('job-1', code)
    expect(hash).toMatch(/^[a-f\d]{64}$/)
    expect(verifyArrivalOtp('job-1', code, hash)).toBe(true)
    expect(verifyArrivalOtp('job-2', code, hash)).toBe(false)
    expect(verifyArrivalOtp('job-1', '000000', hash)).toBe(code === '000000')
    expect(verifyArrivalOtp('job-1', 'not-an-otp', hash)).toBe(false)
  })

  it('calculates quote totals with integer decimal arithmetic and half-up cent rounding', () => {
    const result = calculateQuoteLines([
      { type: 'LABOR', description: 'Technician time', quantity: '1.50', unitPrice: '100.00' },
      { type: 'MATERIAL', description: 'Cable', quantity: '2.25', unitPrice: '10.10' },
    ])

    expect(result.lines[0]?.total).toBe('150.00')
    expect(result.lines[1]?.total).toBe('22.73')
    expect(result.subtotal).toBe('172.73')
    expect(result.total).toBe('172.73')
  })

  it('rejects empty quotes, zero quantity, malformed money, and excessive totals', () => {
    expect(() => calculateQuoteLines([])).toThrow()
    expect(() => calculateQuoteLines([
      { type: 'LABOR', description: 'Work', quantity: '0', unitPrice: '1.00' },
    ])).toThrow()
    expect(() => calculateQuoteLines([
      { type: 'LABOR', description: 'Work', quantity: '1.00', unitPrice: '-1.00' },
    ])).toThrow()
    expect(() => calculateQuoteLines([
      { type: 'LABOR', description: 'Work', quantity: '9999.99', unitPrice: '9999999999.99' },
    ])).toThrow()
  })
})
