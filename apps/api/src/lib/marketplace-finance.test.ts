import { describe, expect, it } from 'vitest'

import {
  calculateMarketplacePaymentSplit,
  canMarketplacePayoutTransition,
  marketplaceLedgerKey,
  marketplacePaymentAmountMatches,
  marketplacePayoutLedgerKey,
  normalizeCommissionRate,
  sumMarketplaceAmounts,
} from './marketplace-finance'

describe('marketplace finance policies', () => {
  it('splits BDT amounts exactly at the configured commission rate', () => {
    expect(calculateMarketplacePaymentSplit('1000', '15')).toEqual({
      grossAmount: '1000.00',
      commissionRate: '15.00',
      commissionAmount: '150.00',
      providerNetAmount: '850.00',
    })
  })

  it('rounds commission half-up to paisa and preserves gross exactly', () => {
    const split = calculateMarketplacePaymentSplit('10.01', '12.50')
    expect(split.commissionAmount).toBe('1.25')
    expect(split.providerNetAmount).toBe('8.76')
  })

  it('supports zero and full commission while rejecting malformed values', () => {
    expect(calculateMarketplacePaymentSplit('25.00', '0').providerNetAmount).toBe('25.00')
    expect(calculateMarketplacePaymentSplit('25.00', '100').providerNetAmount).toBe('0.00')
    expect(() => calculateMarketplacePaymentSplit('-1', '15')).toThrow()
    expect(() => calculateMarketplacePaymentSplit('10.00', '100.01')).toThrow()
    expect(() => calculateMarketplacePaymentSplit('10.001', '15')).toThrow()
  })

  it('normalizes configuration values with a safe default', () => {
    expect(normalizeCommissionRate('12.5')).toBe('12.50')
    expect(normalizeCommissionRate('not-a-rate')).toBe('15.00')
    expect(normalizeCommissionRate(undefined, '10')).toBe('10.00')
  })

  it('matches gateway amounts exactly in paisa', () => {
    expect(marketplacePaymentAmountMatches('1000.10', 1000.1)).toBe(true)
    expect(marketplacePaymentAmountMatches('1000.10', 1000.11)).toBe(false)
    expect(marketplacePaymentAmountMatches('1000.10', undefined)).toBe(false)
    expect(marketplacePaymentAmountMatches('1000.10', 1000.1, true)).toBe(false)
    expect(marketplacePaymentAmountMatches('1000.10', 1000.1, false, true)).toBe(false)
  })

  it('creates stable, domain-separated ledger idempotency keys', () => {
    expect(marketplaceLedgerKey('payment-1', 'GROSS_EARNING')).toBe(
      'marketplace-payment:payment-1:gross_earning',
    )
    expect(marketplaceLedgerKey('payment-1', 'GROSS_EARNING')).not.toBe(
      marketplaceLedgerKey('payment-1', 'PLATFORM_COMMISSION'),
    )
    expect(marketplacePayoutLedgerKey('payout-1')).toBe(
      'marketplace-payout:payout-1:paid',
    )
  })

  it('sums payout batches exactly and rejects invalid money', () => {
    expect(sumMarketplaceAmounts(['10.10', '0.05', '2'])).toBe('12.15')
    expect(() => sumMarketplaceAmounts(['-1'])).toThrow()
  })

  it('allows only forward payout lifecycle transitions', () => {
    expect(canMarketplacePayoutTransition('DRAFT', 'APPROVED')).toBe(true)
    expect(canMarketplacePayoutTransition('APPROVED', 'PAID')).toBe(true)
    expect(canMarketplacePayoutTransition('APPROVED', 'FAILED')).toBe(true)
    expect(canMarketplacePayoutTransition('PAID', 'FAILED')).toBe(false)
    expect(canMarketplacePayoutTransition('FAILED', 'APPROVED')).toBe(false)
  })
})
