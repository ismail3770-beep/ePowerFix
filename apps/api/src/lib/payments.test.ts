import { describe, expect, it } from 'vitest'

import { appendPaymentCallbackToken } from './payments'

describe('payment callback URL construction', () => {
  it('appends a one-time token to a callback without an existing query', () => {
    expect(
      appendPaymentCallbackToken(
        '/api/marketplace/payments/bkash/callback',
        'test a/b',
      ),
    ).toBe('/api/marketplace/payments/bkash/callback?token=test%20a%2Fb')
  })

  it('preserves existing signed callback parameters', () => {
    expect(
      appendPaymentCallbackToken(
        'https://example.test/callback?domain=marketplace',
        'token-1',
      ),
    ).toBe('https://example.test/callback?domain=marketplace&token=token-1')
  })
})
