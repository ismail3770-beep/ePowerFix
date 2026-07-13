/**
 * Runtime environment variable validation.
 *
 * Validates that all required env vars are set before the app starts.
 * Import `env` from this module instead of reading process.env directly.
 *
 * Usage:
 *   import { env } from '@/lib/env'
 *   const dbUrl = env.DATABASE_URL
 */

type EnvShape = {
  // Required
  DATABASE_URL: string
  JWT_SECRET: string
  NEXTAUTH_SECRET: string
  // Optional but recommended
  NEXT_PUBLIC_BASE_URL: string
  UPSTASH_REDIS_REST_URL: string | undefined
  UPSTASH_REDIS_REST_TOKEN: string | undefined
  NODE_ENV: 'development' | 'production' | 'test'
}

const REQUIRED_VARS: (keyof EnvShape)[] = [
  'DATABASE_URL',
  'JWT_SECRET',
  'NEXTAUTH_SECRET',
]

// In production, these are also required
const PROD_REQUIRED_VARS: (keyof EnvShape)[] = [
  'NEXT_PUBLIC_BASE_URL',
  'UPSTASH_REDIS_REST_URL',
  'UPSTASH_REDIS_REST_TOKEN',
]

function validateEnv(): EnvShape {
  const missing: string[] = []

  // Check required vars
  for (const key of REQUIRED_VARS) {
    const value = process.env[key]
    if (!value || value.trim() === '') {
      missing.push(key)
    }
  }

  // In production, check additional required vars
  if (process.env.NODE_ENV === 'production') {
    for (const key of PROD_REQUIRED_VARS) {
      const value = process.env[key]
      if (!value || value.trim() === '') {
        missing.push(key)
      }
    }
  }

  if (missing.length > 0) {
    const message = [
      `❌ Missing required environment variables: ${missing.join(', ')}`,
      '',
      'Create a .env file in the project root with:',
      ...missing.map((k) => `  ${k}="your-value-here"`),
      '',
      'See .env.example for a template.',
    ].join('\n')

    // In production, throw immediately
    if (process.env.NODE_ENV === 'production') {
      throw new Error(message)
    } else {
      console.warn(message)
    }
  }

  // Validate JWT secret strength
  const jwtSecret = process.env.JWT_SECRET || ''
  if (jwtSecret && jwtSecret.length < 32) {
    console.warn(
      '⚠️  JWT_SECRET is shorter than 32 characters. ' +
        'Run: openssl rand -base64 32',
    )
  }

  // Validate NextAuth secret
  const nextAuthSecret = process.env.NEXTAUTH_SECRET || ''
  if (nextAuthSecret && nextAuthSecret.length < 32) {
    console.warn(
      '⚠️  NEXTAUTH_SECRET is shorter than 32 characters. ' +
        'Run: openssl rand -base64 32',
    )
  }

  return {
    DATABASE_URL: process.env.DATABASE_URL || '',
    JWT_SECRET: process.env.JWT_SECRET || '',
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || '',
    NEXT_PUBLIC_BASE_URL:
      process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
    NODE_ENV: (process.env.NODE_ENV as EnvShape['NODE_ENV']) || 'development',
  }
}

export const env = validateEnv()