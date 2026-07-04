/**
 * Test-mode payment token utilities.
 * Only used in development when payment gateway keys are not configured.
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
