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
  DATABASE_URL: string
  JWT_SECRET: string
  NEXTAUTH_SECRET: string
  NEXT_PUBLIC_BASE_URL: string
  NODE_ENV: 'development' | 'production' | 'test'
}

const REQUIRED_VARS: (keyof EnvShape)[] = [
  'DATABASE_URL',
  'JWT_SECRET',
  'NEXTAUTH_SECRET',
]

function validateEnv(): EnvShape {
  const missing: string[] = []

  for (const key of REQUIRED_VARS) {
    const value = process.env[key]
    if (!value || value.trim() === '') {
      missing.push(key)
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

    // In production, throw immediately. In dev, warn but continue
    // (some routes may not need all vars).
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

  return {
    DATABASE_URL: process.env.DATABASE_URL || '',
    JWT_SECRET: process.env.JWT_SECRET || '',
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || '',
    NEXT_PUBLIC_BASE_URL:
      process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
    NODE_ENV: (process.env.NODE_ENV as EnvShape['NODE_ENV']) || 'development',
  }
}

export const env = validateEnv()
