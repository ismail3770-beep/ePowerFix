const MONEY_PATTERN = /^\d{1,10}(?:\.\d{1,2})?$/
const COMMISSION_PATTERN = /^(?:\d|[1-9]\d|100)(?:\.\d{1,2})?$/

function parseHundredths(value: string, pattern: RegExp, label: string): bigint {
  const normalized = value.trim()
  if (!pattern.test(normalized)) throw new Error(`Invalid ${label}`)
  const [whole, fraction = ''] = normalized.split('.')
  return BigInt(whole) * 100n + BigInt(fraction.padEnd(2, '0'))
}

function formatHundredths(value: bigint): string {
  if (value < 0n) throw new Error('Amount cannot be negative')
  return `${value / 100n}.${(value % 100n).toString().padStart(2, '0')}`
}

export type MarketplacePaymentSplit = {
  grossAmount: string
  commissionRate: string
  commissionAmount: string
  providerNetAmount: string
}

/**
 * Calculates the platform/provider split with integer arithmetic. The rate is a
 * percentage with up to two decimals (15.25 means 15.25%). Commission rounds
 * half-up to the nearest paisa; net is always gross minus that exact amount.
 */
export function calculateMarketplacePaymentSplit(
  grossAmount: string,
  commissionRate: string,
): MarketplacePaymentSplit {
  const grossCents = parseHundredths(grossAmount, MONEY_PATTERN, 'gross amount')
  const rateBasisPoints = parseHundredths(
    commissionRate,
    COMMISSION_PATTERN,
    'commission rate',
  )
  if (rateBasisPoints > 10_000n) throw new Error('Commission rate cannot exceed 100%')

  const commissionCents = (grossCents * rateBasisPoints + 5_000n) / 10_000n
  const providerNetCents = grossCents - commissionCents

  return {
    grossAmount: formatHundredths(grossCents),
    commissionRate: formatHundredths(rateBasisPoints),
    commissionAmount: formatHundredths(commissionCents),
    providerNetAmount: formatHundredths(providerNetCents),
  }
}

export function sumMarketplaceAmounts(values: string[]): string {
  return formatHundredths(
    values.reduce(
      (total, value) => total + parseHundredths(value, MONEY_PATTERN, 'amount'),
      0n,
    ),
  )
}

export function marketplacePaymentAmountMatches(
  expectedAmount: string,
  verifiedAmount: number | undefined,
  verifiedAmountInvalid = false,
  verifiedAmountMissing = false,
): boolean {
  if (
    verifiedAmountInvalid ||
    verifiedAmountMissing ||
    verifiedAmount === undefined ||
    !Number.isFinite(verifiedAmount)
  ) {
    return false
  }
  try {
    const expectedPaisa = parseHundredths(
      expectedAmount,
      MONEY_PATTERN,
      'expected amount',
    )
    const verifiedPaisa = parseHundredths(
      verifiedAmount.toFixed(2),
      MONEY_PATTERN,
      'verified amount',
    )
    return expectedPaisa === verifiedPaisa
  } catch {
    return false
  }
}

export function normalizeCommissionRate(
  value: string | null | undefined,
  fallback = '15.00',
): string {
  try {
    return calculateMarketplacePaymentSplit('0.00', value?.trim() || fallback)
      .commissionRate
  } catch {
    return calculateMarketplacePaymentSplit('0.00', fallback).commissionRate
  }
}

export function marketplaceLedgerKey(
  paymentId: string,
  entry: 'GROSS_EARNING' | 'PLATFORM_COMMISSION',
): string {
  if (!paymentId.trim()) throw new Error('Payment ID is required')
  return `marketplace-payment:${paymentId}:${entry.toLowerCase()}`
}

const PAYOUT_TRANSITIONS: Record<string, readonly string[]> = {
  DRAFT: ['APPROVED', 'FAILED'],
  APPROVED: ['PAID', 'FAILED'],
  PAID: [],
  FAILED: [],
}

export function canMarketplacePayoutTransition(from: string, to: string): boolean {
  return PAYOUT_TRANSITIONS[from]?.includes(to) ?? false
}

export function marketplacePayoutLedgerKey(payoutId: string): string {
  if (!payoutId.trim()) throw new Error('Payout ID is required')
  return `marketplace-payout:${payoutId}:paid`
}
