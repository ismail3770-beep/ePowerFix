// Environment configuration for ePowerFix API
// Validates required env vars at startup

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
  // Payment gateways
  SSLCOMMERZ_STORE_ID: string | undefined
  SSLCOMMERZ_STORE_PASSWD: string | undefined
  BKASH_APP_KEY: string | undefined
  BKASH_APP_SECRET: string | undefined
  BKASH_USERNAME: string | undefined
  BKASH_PASSWORD: string | undefined
  BKASH_CALLBACK_URL: string | undefined
  NAGAD_MERCHANT_ID: string | undefined
  NAGAD_CALLBACK_URL: string | undefined
  // Cloudinary
  CLOUDINARY_CLOUD_NAME: string | undefined
  CLOUDINARY_API_KEY: string | undefined
  CLOUDINARY_API_SECRET: string | undefined
  // Sentry
  SENTRY_DSN: string | undefined
}

function loadEnv(): EnvShape {
  const PORT = parseInt(process.env.PORT || '4000', 10)

  const required: (keyof EnvShape)[] = ['DATABASE_URL', 'JWT_SECRET']
  const missing: string[] = []

  for (const key of required) {
    const value = process.env[key]
    if (!value || value.trim() === '') {
      missing.push(key)
    }
  }

  if (missing.length > 0) {
    const msg = `❌ Missing required env vars: ${missing.join(', ')}`
    if (process.env.NODE_ENV === 'production') {
      throw new Error(msg)
    } else {
      console.warn(msg)
    }
  }

  const jwtSecret = process.env.JWT_SECRET || ''
  if (jwtSecret && jwtSecret.length < 32) {
    console.warn('⚠️  JWT_SECRET is shorter than 32 characters.')
  }

  return {
    NODE_ENV: (process.env.NODE_ENV as EnvShape['NODE_ENV']) || 'development',
    PORT,
    DATABASE_URL: process.env.DATABASE_URL || '',
    JWT_SECRET: process.env.JWT_SECRET || '',
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
