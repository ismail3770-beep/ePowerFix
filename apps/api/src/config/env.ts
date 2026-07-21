// Environment configuration for ePowerFix API.
// Production fails fast on unsafe core configuration or partial integrations.

type NodeEnvironment = 'development' | 'production' | 'test'

type EnvShape = {
  NODE_ENV: NodeEnvironment
  PORT: number
  DATABASE_URL: string
  JWT_SECRET: string
  JWT_ISSUER: string
  JWT_AUDIENCE: string
  WEB_URL: string
  PRIVATE_UPLOAD_DIR: string
  UPSTASH_REDIS_REST_URL: string | undefined
  UPSTASH_REDIS_REST_TOKEN: string | undefined
  SSLCOMMERZ_STORE_ID: string | undefined
  SSLCOMMERZ_STORE_PASSWD: string | undefined
  BKASH_APP_KEY: string | undefined
  BKASH_APP_SECRET: string | undefined
  BKASH_USERNAME: string | undefined
  BKASH_PASSWORD: string | undefined
  BKASH_CALLBACK_URL: string | undefined
  NAGAD_MERCHANT_ID: string | undefined
  NAGAD_CALLBACK_URL: string | undefined
  PAYMENT_TEST_MODE: boolean
  PAYMENT_CALLBACK_IP_WHITELIST: string[]
  PAYMENT_RESERVATION_CLEANUP_SECRET: string | undefined
  MARKETPLACE_ENABLED: boolean
  PROVIDER_ONBOARDING_ENABLED: boolean
  MARKETPLACE_PAYMENTS_ENABLED: boolean
  LIVE_TRACKING_ENABLED: boolean
  AUTO_MATCHING_ENABLED: boolean
  CLOUDINARY_CLOUD_NAME: string | undefined
  CLOUDINARY_API_KEY: string | undefined
  CLOUDINARY_API_SECRET: string | undefined
  SENTRY_DSN: string | undefined
}

type EnvironmentSource = Record<string, string | undefined>

function optional(source: EnvironmentSource, name: string): string | undefined {
  const value = source[name]?.trim()
  return value || undefined
}

function featureFlag(source: EnvironmentSource, name: string): boolean {
  const value = optional(source, name)
  if (value === undefined || value === 'false') return false
  if (value === 'true') return true
  throw new Error(`${name} must be either true or false`)
}

function validateUrl(name: string, value: string, errors: string[]): void {
  try {
    const parsed = new URL(value)
    if (!['http:', 'https:'].includes(parsed.protocol)) errors.push(`${name} must use http or https`)
  } catch {
    errors.push(`${name} must be a valid URL`)
  }
}

function validateCompleteGroup(
  label: string,
  values: Array<[name: string, value: string | undefined]>,
  errors: string[]
): void {
  const configured = values.filter(([, value]) => Boolean(value))
  if (configured.length > 0 && configured.length !== values.length) {
    const missing = values.filter(([, value]) => !value).map(([name]) => name)
    errors.push(`${label} configuration is incomplete; missing ${missing.join(', ')}`)
  }
}

export function loadEnv(source: EnvironmentSource = process.env): EnvShape {
  const rawNodeEnv = source.NODE_ENV || 'development'
  const validNodeEnvs: NodeEnvironment[] = ['development', 'production', 'test']
  if (!validNodeEnvs.includes(rawNodeEnv as NodeEnvironment)) {
    throw new Error(`Invalid NODE_ENV: ${rawNodeEnv}`)
  }
  const NODE_ENV = rawNodeEnv as NodeEnvironment

  const rawPort = source.PORT || '4000'
  const PORT = Number(rawPort)
  if (!Number.isInteger(PORT) || PORT < 1 || PORT > 65535) {
    throw new Error(`PORT must be an integer between 1 and 65535; received ${rawPort}`)
  }

  const DATABASE_URL = optional(source, 'DATABASE_URL') || ''
  const JWT_SECRET = optional(source, 'JWT_SECRET') || ''
  const WEB_URL = optional(source, 'WEB_URL') || 'http://localhost:3000'
  const PRIVATE_UPLOAD_DIR = optional(source, 'PRIVATE_UPLOAD_DIR') || '.private-uploads'
  const UPSTASH_REDIS_REST_URL = optional(source, 'UPSTASH_REDIS_REST_URL')
  const UPSTASH_REDIS_REST_TOKEN = optional(source, 'UPSTASH_REDIS_REST_TOKEN')
  const SSLCOMMERZ_STORE_ID = optional(source, 'SSLCOMMERZ_STORE_ID')
  const SSLCOMMERZ_STORE_PASSWD = optional(source, 'SSLCOMMERZ_STORE_PASSWD')
  const BKASH_APP_KEY = optional(source, 'BKASH_APP_KEY')
  const BKASH_APP_SECRET = optional(source, 'BKASH_APP_SECRET')
  const BKASH_USERNAME = optional(source, 'BKASH_USERNAME')
  const BKASH_PASSWORD = optional(source, 'BKASH_PASSWORD')
  const BKASH_CALLBACK_URL = optional(source, 'BKASH_CALLBACK_URL')
  const NAGAD_MERCHANT_ID = optional(source, 'NAGAD_MERCHANT_ID')
  const NAGAD_CALLBACK_URL = optional(source, 'NAGAD_CALLBACK_URL')
  const PAYMENT_CALLBACK_IP_WHITELIST = (optional(source, 'PAYMENT_CALLBACK_IP_WHITELIST') || '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)
  const PAYMENT_RESERVATION_CLEANUP_SECRET = optional(source, 'PAYMENT_RESERVATION_CLEANUP_SECRET')
  const MARKETPLACE_ENABLED = featureFlag(source, 'MARKETPLACE_ENABLED')
  const PROVIDER_ONBOARDING_ENABLED = featureFlag(source, 'PROVIDER_ONBOARDING_ENABLED')
  const MARKETPLACE_PAYMENTS_ENABLED = featureFlag(source, 'MARKETPLACE_PAYMENTS_ENABLED')
  const LIVE_TRACKING_ENABLED = featureFlag(source, 'LIVE_TRACKING_ENABLED')
  const AUTO_MATCHING_ENABLED = featureFlag(source, 'AUTO_MATCHING_ENABLED')
  const CLOUDINARY_CLOUD_NAME = optional(source, 'CLOUDINARY_CLOUD_NAME')
  const CLOUDINARY_API_KEY = optional(source, 'CLOUDINARY_API_KEY')
  const CLOUDINARY_API_SECRET = optional(source, 'CLOUDINARY_API_SECRET')
  const SENTRY_DSN = optional(source, 'SENTRY_DSN')

  const errors: string[] = []
  validateUrl('WEB_URL', WEB_URL, errors)
  validateCompleteGroup('Upstash Redis', [
    ['UPSTASH_REDIS_REST_URL', UPSTASH_REDIS_REST_URL],
    ['UPSTASH_REDIS_REST_TOKEN', UPSTASH_REDIS_REST_TOKEN],
  ], errors)
  validateCompleteGroup('SSLCommerz', [
    ['SSLCOMMERZ_STORE_ID', SSLCOMMERZ_STORE_ID],
    ['SSLCOMMERZ_STORE_PASSWD', SSLCOMMERZ_STORE_PASSWD],
  ], errors)
  validateCompleteGroup('bKash', [
    ['BKASH_APP_KEY', BKASH_APP_KEY],
    ['BKASH_APP_SECRET', BKASH_APP_SECRET],
    ['BKASH_USERNAME', BKASH_USERNAME],
    ['BKASH_PASSWORD', BKASH_PASSWORD],
    ['BKASH_CALLBACK_URL', BKASH_CALLBACK_URL],
  ], errors)
  validateCompleteGroup('Nagad', [
    ['NAGAD_MERCHANT_ID', NAGAD_MERCHANT_ID],
    ['NAGAD_CALLBACK_URL', NAGAD_CALLBACK_URL],
  ], errors)
  validateCompleteGroup('Cloudinary', [
    ['CLOUDINARY_CLOUD_NAME', CLOUDINARY_CLOUD_NAME],
    ['CLOUDINARY_API_KEY', CLOUDINARY_API_KEY],
    ['CLOUDINARY_API_SECRET', CLOUDINARY_API_SECRET],
  ], errors)

  if (BKASH_CALLBACK_URL) validateUrl('BKASH_CALLBACK_URL', BKASH_CALLBACK_URL, errors)
  if (NAGAD_CALLBACK_URL) validateUrl('NAGAD_CALLBACK_URL', NAGAD_CALLBACK_URL, errors)

  if (NODE_ENV === 'production') {
    if (!DATABASE_URL) errors.push('DATABASE_URL is required in production')
    if (JWT_SECRET.length < 32) errors.push('JWT_SECRET must be at least 32 characters in production')
    if (WEB_URL.includes('localhost')) errors.push('WEB_URL must not use localhost in production')
    if (source.PAYMENT_TEST_MODE === 'true') errors.push('PAYMENT_TEST_MODE must not be enabled in production')
    const paymentGatewayConfigured = Boolean(
      SSLCOMMERZ_STORE_ID || BKASH_APP_KEY || NAGAD_MERCHANT_ID
    )
    if (paymentGatewayConfigured && PAYMENT_CALLBACK_IP_WHITELIST.length === 0) {
      errors.push('PAYMENT_CALLBACK_IP_WHITELIST is required when a payment gateway is configured in production')
    }
    if (PAYMENT_RESERVATION_CLEANUP_SECRET && PAYMENT_RESERVATION_CLEANUP_SECRET.length < 32) {
      errors.push('PAYMENT_RESERVATION_CLEANUP_SECRET must be at least 32 characters')
    }
  }

  if (errors.length > 0) {
    throw new Error(`Invalid environment configuration:\n- ${errors.join('\n- ')}`)
  }

  if (NODE_ENV !== 'production') {
    if (!DATABASE_URL) console.warn('⚠️  DATABASE_URL is not set. Database queries will fail.')
    if (!JWT_SECRET) console.warn('⚠️  JWT_SECRET is not set. Auth will not work.')
    if (JWT_SECRET && JWT_SECRET.length < 32) console.warn('⚠️  JWT_SECRET is shorter than 32 characters.')
  }

  return {
    NODE_ENV,
    PORT,
    DATABASE_URL,
    JWT_SECRET,
    JWT_ISSUER: optional(source, 'JWT_ISSUER') || 'epowerfix',
    JWT_AUDIENCE: optional(source, 'JWT_AUDIENCE') || 'epowerfix-users',
    WEB_URL,
    PRIVATE_UPLOAD_DIR,
    UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN,
    SSLCOMMERZ_STORE_ID,
    SSLCOMMERZ_STORE_PASSWD,
    BKASH_APP_KEY,
    BKASH_APP_SECRET,
    BKASH_USERNAME,
    BKASH_PASSWORD,
    BKASH_CALLBACK_URL,
    NAGAD_MERCHANT_ID,
    NAGAD_CALLBACK_URL,
    PAYMENT_TEST_MODE: NODE_ENV !== 'production' && source.PAYMENT_TEST_MODE === 'true',
    PAYMENT_CALLBACK_IP_WHITELIST,
    PAYMENT_RESERVATION_CLEANUP_SECRET,
    MARKETPLACE_ENABLED,
    PROVIDER_ONBOARDING_ENABLED,
    MARKETPLACE_PAYMENTS_ENABLED,
    LIVE_TRACKING_ENABLED,
    AUTO_MATCHING_ENABLED,
    CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET,
    SENTRY_DSN,
  }
}

export const env = loadEnv()
