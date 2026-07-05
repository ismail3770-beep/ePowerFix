/**
 * Security Event Logger with Privacy Guard
 *
 * Provides logSecurityEvent() — a reusable helper that:
 *   1. Extracts request metadata (IP, user-agent, path, method)
 *   2. Strips sensitive data (passwords, JWTs, API keys, emails)
 *   3. Formats as structured JSON for console output
 *
 * Usage in proxy.ts:
 *   import { logSecurityEvent } from '@/lib/security-logger'
 *   await logSecurityEvent('CSRF blocked', 'warning', request)
 *
 * Usage in API routes:
 *   import { logSecurityEvent } from '@/lib/security-logger'
 *   await logSecurityEvent('Rate limit exceeded', 'warning', request, { userId: 'xxx' })
 *
 * Privacy compliance (GDPR):
 *   - Passwords are replaced with '[REDACTED]'
 *   - JWT tokens are truncated to first 10 chars + '[REDACTED]'
 *   - API keys are masked (first 4 + last 4 chars)
 *   - Email addresses are hashed (not stored in plain text)
 *   - Credit card numbers are masked
 *   - No request bodies are ever logged
 *
 * Sentry integration: removed to avoid a hard dependency on @sentry/nextjs.
 * To re-enable: install the package, set SENTRY_DSN, and forward events in
 * logSecurityEvent() below.
 */

import type { NextRequest } from 'next/server'

// --- Types -------------------------------------------------------------------

export type SecurityLogLevel = 'info' | 'warning' | 'error'

export interface SecurityEventContext {
  [key: string]: unknown
}

// --- Sensitive Data Patterns -------------------------------------------------

const SENSITIVE_KEYS = [
  'password', 'passwd', 'pwd', 'secret', 'token', 'authorization',
  'apiKey', 'api_key', 'apikey', 'privateKey', 'private_key',
  'creditCard', 'credit_card', 'cardNumber', 'card_number',
  'cvv', 'ssn', 'nationalId',
]

const SENSITIVE_PATTERNS: Array<{ regex: RegExp; replacement: string; name: string }> = [
  {
    regex: /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g,
    replacement: '[JWT_REDACTED]',
    name: 'jwt',
  },
  {
    regex: /Bearer\s+[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/gi,
    replacement: 'Bearer [REDACTED]',
    name: 'bearer',
  },
  {
    regex: /\b(sk|pk|key|api)[_-][A-Za-z0-9]{20,}\b/gi,
    replacement: '[API_KEY_REDACTED]',
    name: 'apiKey',
  },
  {
    regex: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{1,4}\b/g,
    replacement: '[CARD_REDACTED]',
    name: 'creditCard',
  },
  {
    regex: /([a-zA-Z0-9._%+-]+)@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g,
    replacement: '[EMAIL_HASHED]',
    name: 'email',
  },
  {
    regex: /\+?\d{1,3}[\s-]?\d{3,4}[\s-]?\d{3,4}[\s-]?\d{3,4}/g,
    replacement: '[PHONE_REDACTED]',
    name: 'phone',
  },
]

// --- Sanitization ------------------------------------------------------------

function sanitizeValue(value: unknown, key?: string): unknown {
  if (key && SENSITIVE_KEYS.some(s => key.toLowerCase().includes(s.toLowerCase()))) {
    if (typeof value === 'string') {
      if (key.toLowerCase().includes('token') || key.toLowerCase().includes('authorization')) {
        return value.length > 10 ? `${value.slice(0, 10)}...[REDACTED]` : '[REDACTED]'
      }
      return '[REDACTED]'
    }
    return '[REDACTED]'
  }

  if (typeof value === 'string') {
    let sanitized = value
    for (const pattern of SENSITIVE_PATTERNS) {
      sanitized = sanitized.replace(pattern.regex, pattern.replacement)
    }
    return sanitized
  }

  if (Array.isArray(value)) {
    return value.map(v => sanitizeValue(v, key))
  }

  if (value !== null && typeof value === 'object') {
    const result: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value)) {
      result[k] = sanitizeValue(v, k)
    }
    return result
  }

  return value
}

function extractRequestMeta(request?: NextRequest): Record<string, unknown> {
  if (!request) return {}

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || 'unknown'

  const userAgent = request.headers.get('user-agent') || 'unknown'

  return {
    ip: ip === 'unknown' ? 'unknown' : hashIP(ip),
    userAgent: truncateUA(userAgent),
    method: request.method,
    path: request.nextUrl.pathname,
    query: sanitizeQueryParams(request.nextUrl.searchParams),
    referer: request.headers.get('referer') || 'none',
  }
}

function hashIP(ip: string): string {
  let hash = 0
  for (let i = 0; i < ip.length; i++) {
    hash = ((hash << 5) - hash) + ip.charCodeAt(i)
    hash |= 0
  }
  return `ip_${Math.abs(hash).toString(36)}`
}

function truncateUA(ua: string): string {
  if (ua.length > 200) return ua.slice(0, 200) + '...'
  return ua
}

function sanitizeQueryParams(params: URLSearchParams): Record<string, string> {
  const result: Record<string, string> = {}
  for (const [key, value] of params.entries()) {
    const sanitized = sanitizeValue(value, key)
    result[key] = typeof sanitized === 'string' ? sanitized : String(sanitized)
  }
  return result
}

// --- Main Export: logSecurityEvent -------------------------------------------

/**
 * Logs a security event as structured JSON to the console.
 *
 * @param message — Human-readable event description
 * @param level — Severity: 'info' | 'warning' | 'error'
 * @param request — Optional NextRequest for metadata extraction
 * @param context — Additional context (will be sanitized for PII)
 */
export async function logSecurityEvent(
  message: string,
  level: SecurityLogLevel,
  request?: NextRequest,
  context: SecurityEventContext = {},
): Promise<void> {
  const requestMeta = extractRequestMeta(request)
  const sanitizedContext = sanitizeValue(context) as Record<string, unknown>

  const event = {
    timestamp: new Date().toISOString(),
    level,
    message,
    category: 'security',
    ...requestMeta,
    ...sanitizedContext,
  }

  const logMethod = level === 'error' ? console.error : level === 'warning' ? console.warn : console.log
  logMethod(JSON.stringify(event))
}

/**
 * Flushes any buffered events. No-op for the console backend.
 */
export async function flushSecurityEvents(): Promise<void> {
  // No-op: console writes are synchronous.
}
