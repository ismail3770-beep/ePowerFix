// Environment configuration for ePowerFix API
// Lenient validation — warns but does not crash in production

type EnvShape = {
  NODE_ENV: 'development' | 'production' | 'test'
  PORT: number
  DATABASE_URL: string
  JWT_SECRET: string
  JWT_ISSUER: string
  JWT_AUDIENCE: string
  WEB_URL: string
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
  CLOUDINARY_CLOUD_NAME: string | undefined
  CLOUDINARY_API_KEY: string | undefined
  CLOUDINARY_API_SECRET: string | undefined
  SENTRY_DSN: string | undefined
}

function loadEnv(): EnvShape {
  const PORT = parseInt(process.env.PORT || '4000', 10)

  // Check required vars — warn but don't crash
  const DATABASE_URL = process.env.DATABASE_URL || ''
  const JWT_SECRET = process.env.JWT_SECRET || ''

  if (!DATABASE_URL) {
    console.warn('⚠️  DATABASE_URL is not set. Database queries will fail.')
  }
  if (!JWT_SECRET) {
    console.warn('⚠️  JWT_SECRET is not set. Auth will not work.')
    console.warn('   Set it in Railway → Variables tab')
  }
  if (JWT_SECRET && JWT_SECRET.length < 32) {
    console.warn('⚠️  JWT_SECRET is shorter than 32 characters.')
  }

  // Debug: log available env vars (names only, not values for security)
  if (process.env.NODE_ENV !== 'production') {
    console.log('Environment variables available:')
    console.log('  PORT:', process.env.PORT || '(not set, using 4000)')
    console.log('  DATABASE_URL:', DATABASE_URL ? '✓ set' : '✗ missing')
    console.log('  JWT_SECRET:', JWT_SECRET ? '✓ set' : '✗ missing')
    console.log('  WEB_URL:', process.env.WEB_URL || '(not set)')
  }

  return {
    NODE_ENV: (process.env.NODE_ENV as EnvShape['NODE_ENV']) || 'development',
    PORT,
    DATABASE_URL,
    JWT_SECRET,
    JWT_ISSUER: process.env.JWT_ISSUER || 'epowerfix',
    JWT_AUDIENCE: process.env.JWT_AUDIENCE || 'epowerfix-users',
    WEB_URL: process.env.WEB_URL || 'http://localhost:3000',
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
    SSLCOMMERZ_STORE_ID: process.env.SSLCOMMERZ_STORE_ID,
    SSLCOMMERZ_STORE_PASSWD: process.env.SSLCOMMERZ_STORE_PASSWD,
    BKASH_APP_KEY: process.env.BKASH_APP_KEY,
    BKASH_APP_SECRET: process.env.BKASH_APP_SECRET,
    BKASH_USERNAME: process.env.BKASH_USERNAME,
    BKASH_PASSWORD: process.env.BKASH_PASSWORD,
    BKASH_CALLBACK_URL: process.env.BKASH_CALLBACK_URL,
    NAGAD_MERCHANT_ID: process.env.NAGAD_MERCHANT_ID,
    NAGAD_CALLBACK_URL: process.env.NAGAD_CALLBACK_URL,
    CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
    SENTRY_DSN: process.env.SENTRY_DSN,
  }
}

export const env = loadEnv()
