/**
 * Test-mode payment token utilities.
 * Only used in development when payment gateway keys are not configured.
 *
 * L5 NOTE: These tokens live in an in-process Map, which is NOT shared across
 * serverless function invocations. In production (Vercel, Netlify, etc.) this
 * means a test token issued by one invocation may not be found by the next.
 * This is acceptable because test mode is dev-only — production deployments
 * must use real gateway credentials and the real gateway callback flow.
 *
 * If you need test tokens to persist in CI/staging, swap this Map for a
 * DB-backed store keyed by the token string.
 */

const testTokens = new Map<string, { orderId: string; tranId: string; expiresAt: number }>()

export function generateTestPaymentToken(orderId: string, tranId: string): string {
  const token = `test_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`
  testTokens.set(token, {
    orderId,
    tranId,
    expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
  })
  return token
}

export function consumeTestPaymentToken(token: string): { orderId: string; tranId: string } | null {
  const data = testTokens.get(token)
  if (!data) return null
  if (Date.now() > data.expiresAt) {
    testTokens.delete(token)
    return null
  }
  testTokens.delete(token)
  return { orderId: data.orderId, tranId: data.tranId }
}
