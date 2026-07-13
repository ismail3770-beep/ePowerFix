import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { checkRateLimit, resetRateLimit } from '@/lib/rate-limit'

describe('Rate Limiter', () => {
  beforeEach(async () => {
    await resetRateLimit('test:key')
  })

  afterEach(async () => {
    await resetRateLimit('test:key')
  })

  describe('checkRateLimit', () => {
    it('allows first request', async () => {
      const result = await checkRateLimit('test:key', 5, 60000)
      expect(result.allowed).toBe(true)
      expect(result.retryAfterMs).toBe(0)
    })

    it('allows requests within limit', async () => {
      for (let i = 0; i < 5; i++) {
        const result = await checkRateLimit('test:key', 5, 60000)
        expect(result.allowed).toBe(true)
      }
    })

    it('blocks requests exceeding limit', async () => {
      // Make 5 requests
      for (let i = 0; i < 5; i++) {
        await checkRateLimit('test:key', 5, 60000)
      }

      // 6th request should be blocked
      const result = await checkRateLimit('test:key', 5, 60000)
      expect(result.allowed).toBe(false)
      expect(result.retryAfterMs).toBeGreaterThan(0)
    })

    it('resets after window expires', async () => {
      // Use very short window (100ms)
      for (let i = 0; i < 2; i++) {
        const result = await checkRateLimit('test:window', 2, 100)
        expect(result.allowed).toBe(true)
      }

      // Wait for window to expire
      await new Promise(resolve => setTimeout(resolve, 150))

      // Should be allowed again
      const result = await checkRateLimit('test:window', 2, 100)
      expect(result.allowed).toBe(true)
    })

    it('tracks different keys independently', async () => {
      await checkRateLimit('key:a', 1, 60000)
      await checkRateLimit('key:b', 1, 60000)

      const resultA = await checkRateLimit('key:a', 1, 60000)
      const resultB = await checkRateLimit('key:b', 1, 60000)

      expect(resultA.allowed).toBe(false)
      expect(resultB.allowed).toBe(false)
    })
  })

  describe('resetRateLimit', () => {
    it('resets a rate limit key', async () => {
      await checkRateLimit('test:reset', 1, 60000)
      let result = await checkRateLimit('test:reset', 1, 60000)
      expect(result.allowed).toBe(false)

      await resetRateLimit('test:reset')
      result = await checkRateLimit('test:reset', 1, 60000)
      expect(result.allowed).toBe(true)
    })
  })
})