import { createHmac, randomInt, timingSafeEqual } from 'node:crypto'

import { env } from '../config/env.js'

const OTP_PATTERN = /^\d{6}$/
const QUANTITY_PATTERN = /^\d{1,4}(?:\.\d{1,2})?$/
const MONEY_PATTERN = /^\d{1,10}(?:\.\d{1,2})?$/

function parseScaled(value: string, scale: number, pattern: RegExp): bigint {
  const normalized = value.trim()
  if (!pattern.test(normalized)) throw new Error('Invalid decimal value')
  const [whole, fraction = ''] = normalized.split('.')
  return BigInt(whole) * BigInt(scale) + BigInt(fraction.padEnd(2, '0'))
}

function formatCents(cents: bigint): string {
  const whole = cents / 100n
  const fraction = (cents % 100n).toString().padStart(2, '0')
  return `${whole}.${fraction}`
}

export function generateArrivalOtp(): string {
  return randomInt(0, 1_000_000).toString().padStart(6, '0')
}

export function hashArrivalOtp(jobId: string, code: string): string {
  if (!OTP_PATTERN.test(code)) throw new Error('Arrival OTP must contain six digits')
  return createHmac('sha256', env.JWT_SECRET)
    .update(`marketplace-arrival:${jobId}:${code}`)
    .digest('hex')
}

export function verifyArrivalOtp(jobId: string, code: string, expectedHash: string): boolean {
  if (!OTP_PATTERN.test(code) || !/^[a-f\d]{64}$/i.test(expectedHash)) return false
  const actual = Buffer.from(hashArrivalOtp(jobId, code), 'hex')
  const expected = Buffer.from(expectedHash, 'hex')
  return actual.length === expected.length && timingSafeEqual(actual, expected)
}

export type QuoteCalculationInput = {
  type: 'LABOR' | 'MATERIAL' | 'OTHER'
  description: string
  quantity: string
  unitPrice: string
}

export type CalculatedQuoteLine = QuoteCalculationInput & {
  total: string
}

export function calculateQuoteLines(lines: QuoteCalculationInput[]): {
  lines: CalculatedQuoteLine[]
  subtotal: string
  total: string
} {
  if (lines.length === 0 || lines.length > 50) throw new Error('Quote must contain 1-50 lines')

  let subtotalCents = 0n
  const calculated = lines.map((line) => {
    const quantityHundredths = parseScaled(line.quantity, 100, QUANTITY_PATTERN)
    const unitCents = parseScaled(line.unitPrice, 100, MONEY_PATTERN)
    if (quantityHundredths <= 0n) throw new Error('Quantity must be greater than zero')

    // Quantity has two decimal places and price is in cents. Round half-up to cents.
    const lineCents = (quantityHundredths * unitCents + 50n) / 100n
    subtotalCents += lineCents
    if (subtotalCents > 9_999_999_999n) throw new Error('Quote total is too large')

    return {
      ...line,
      quantity: formatCents(quantityHundredths),
      unitPrice: formatCents(unitCents),
      total: formatCents(lineCents),
    }
  })

  const subtotal = formatCents(subtotalCents)
  return { lines: calculated, subtotal, total: subtotal }
}
