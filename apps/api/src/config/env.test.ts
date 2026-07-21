import { describe, expect, it } from 'vitest'
import { loadEnv } from './env'

const productionBase = {
  NODE_ENV: 'production',
  PORT: '4000',
  DATABASE_URL: 'postgresql://user:password@example.com:5432/epowerfix',
  JWT_SECRET: 'a'.repeat(32),
  WEB_URL: 'https://epowerfix.example',
}

describe('environment validation', () => {
  it('accepts the minimum safe production configuration', () => {
    const config = loadEnv(productionBase)

    expect(config.NODE_ENV).toBe('production')
    expect(config.PORT).toBe(4000)
    expect(config.PAYMENT_TEST_MODE).toBe(false)
  })

  it('rejects missing production database and weak JWT configuration', () => {
    expect(() => loadEnv({
      NODE_ENV: 'production',
      WEB_URL: 'https://epowerfix.example',
      JWT_SECRET: 'too-short',
    })).toThrow(/DATABASE_URL is required.*JWT_SECRET must be at least 32 characters/s)
  })

  it('rejects local URLs and simulated payments in production', () => {
    expect(() => loadEnv({
      ...productionBase,
      WEB_URL: 'http://localhost:3000',
      PAYMENT_TEST_MODE: 'true',
    })).toThrow(/WEB_URL must not use localhost.*PAYMENT_TEST_MODE must not be enabled/s)
  })

  it('rejects partial optional integration credentials', () => {
    expect(() => loadEnv({
      ...productionBase,
      BKASH_APP_KEY: 'configured-without-the-rest',
    })).toThrow(/bKash configuration is incomplete/)
  })

  it('requires and parses callback source addresses for production gateways', () => {
    const gatewayConfig = {
      ...productionBase,
      SSLCOMMERZ_STORE_ID: 'store-id',
      SSLCOMMERZ_STORE_PASSWD: 'store-secret',
    }

    expect(() => loadEnv(gatewayConfig)).toThrow(/PAYMENT_CALLBACK_IP_WHITELIST is required/)

    const config = loadEnv({
      ...gatewayConfig,
      PAYMENT_CALLBACK_IP_WHITELIST: '203.0.113.10, 198.51.100.0/24',
    })
    expect(config.PAYMENT_CALLBACK_IP_WHITELIST).toEqual([
      '203.0.113.10',
      '198.51.100.0/24',
    ])
  })

  it('keeps every marketplace capability disabled by default and parses explicit flags', () => {
    const defaults = loadEnv(productionBase)
    expect(defaults.MARKETPLACE_ENABLED).toBe(false)
    expect(defaults.PROVIDER_ONBOARDING_ENABLED).toBe(false)
    expect(defaults.MARKETPLACE_PAYMENTS_ENABLED).toBe(false)
    expect(defaults.LIVE_TRACKING_ENABLED).toBe(false)
    expect(defaults.AUTO_MATCHING_ENABLED).toBe(false)

    const enabled = loadEnv({
      ...productionBase,
      MARKETPLACE_ENABLED: 'true',
      PROVIDER_ONBOARDING_ENABLED: 'true',
    })
    expect(enabled.MARKETPLACE_ENABLED).toBe(true)
    expect(enabled.PROVIDER_ONBOARDING_ENABLED).toBe(true)
    expect(() => loadEnv({ ...productionBase, AUTO_MATCHING_ENABLED: 'yes' }))
      .toThrow(/AUTO_MATCHING_ENABLED must be either true or false/)
  })

  it('validates port bounds and production cleanup secret strength', () => {
    expect(() => loadEnv({ ...productionBase, PORT: '70000' })).toThrow(/PORT must be an integer/)
    expect(() => loadEnv({
      ...productionBase,
      PAYMENT_RESERVATION_CLEANUP_SECRET: 'weak',
    })).toThrow(/PAYMENT_RESERVATION_CLEANUP_SECRET must be at least 32 characters/)
  })
})
