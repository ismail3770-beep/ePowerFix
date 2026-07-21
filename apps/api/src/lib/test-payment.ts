// Test-mode payment token utilities.
//
// Simulated gateway completion is permitted only in explicit local/test mode.
// Tokens are one-time, gateway-bound capabilities held only in this process.
//
// NOTE: These tokens live in an in-process Map, which is NOT shared across
// serverless function invocations or multi-instance deployments. This is safe
// because simulated payments are never enabled in production. If persistent
// test simulations are needed, use a DB-backed, securely random token store.

import { randomBytes } from 'node:crypto'

import { env } from '../config/env.js'

export type TestPaymentGateway = 'SSLCOMMERZ' | 'BKASH' | 'NAGAD'

type TestPaymentTokenData = {
  orderId: string
  tranId: string
  gateway: TestPaymentGateway
  expiresAt: number
}

const testTokens = new Map<string, TestPaymentTokenData>()

export function isTestPaymentMode(): boolean {
  // NODE_ENV=test is an explicit test environment. Local development requires
  // an additional opt-in so an accidentally exposed dev server cannot create
  // simulated payments merely because provider credentials are absent.
  return (
    env.NODE_ENV === 'test' ||
    (env.NODE_ENV === 'development' && env.PAYMENT_TEST_MODE)
  )
}

export function generateTestPaymentToken(
  orderId: string,
  tranId: string,
  gateway: TestPaymentGateway,
): string {
  const token = `test_${randomBytes(32).toString('base64url')}`
  testTokens.set(token, {
    orderId,
    tranId,
    gateway,
    expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
  })
  return token
}

export function consumeTestPaymentToken(
  token: string,
  expectedGateway?: TestPaymentGateway,
): Pick<TestPaymentTokenData, 'orderId' | 'tranId' | 'gateway'> | null {
  const data = testTokens.get(token)
  if (!data) return null
  if (Date.now() > data.expiresAt) {
    testTokens.delete(token)
    return null
  }
  // Do not consume a valid token presented to the wrong callback endpoint.
  // This prevents a cross-gateway probe from invalidating the legitimate flow.
  if (expectedGateway && data.gateway !== expectedGateway) return null

  testTokens.delete(token)
  return {
    orderId: data.orderId,
    tranId: data.tranId,
    gateway: data.gateway,
  }
}
