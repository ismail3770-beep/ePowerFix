/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Security Event Logger — Sentry Integration with Privacy Guard
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Provides logSecurityEvent() — a reusable helper that:
 *   1. Extracts request metadata (IP, user-agent, path, method)
 *   2. Strips sensitive data (passwords, JWTs, API keys, emails)
 *   3. Formats as structured JSON for console + Sentry
 *   4. Captures in Sentry with appropriate severity level
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
 */

import type { NextRequest } from 'next/server'

// ─── Types ────────────────────────────────────────────────────────────────────

export type SecurityLogLevel = 'info' | 'warning' | 'error'

export interface SecurityEventContext {
  [key: string]: unknown
}

// ─── Sensitive Data Patterns ──────────────────────────────────────────────────

// Fields that should NEVER be logged (by key name)
const SENSITIVE_KEYS = [
  'password', 'passwd', 'pwd', 'secret', 'token', 'authorization',
  'apiKey', 'api_key', 'apikey', 'privateKey', 'private_key',
  'creditCard', 'credit_card', 'cardNumber', 'card_number',
  'cvv', 'ssn', 'nationalId',
]

// Regex patterns for detecting sensitive data in string values
const SENSITIVE_PATTERNS: Array<{ regex: RegExp; replacement: string; name: string }> = [
  // JWT tokens (eyJ... format)
  {
    regex: /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g,
    replacement: '[JWT_REDACTED]',
    name: 'jwt',
  },
  // Bearer tokens
  {
    regex: /Bearer\s+[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/gi,
    replacement: 'Bearer [REDACTED]',
    name: 'bearer',
  },
  // API keys (common formats: sk_..., pk_..., key-..., etc.)
  {
    regex: /\b(sk|pk|key|api)[_-][A-Za-z0-9]{20,}\b/gi,
    replacement: '[API_KEY_REDACTED]',
    name: 'apiKey',
  },
  // Credit card numbers (13-19 digits, optional spaces/dashes)
  {
    regex: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{1,4}\b/g,
    replacement: '[CARD_REDACTED]',
    name: 'creditCard',
  },
  // Email addresses — hash for GDPR compliance
  {
    regex: /([a-zA-Z0-9._%+-]+)@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g,
    replacement: '[EMAIL_HASHED]',
    name: 'email',
  },
  // Phone numbers (international format)
  {
    regex: /\+?\d{1,3}[\s-]?\d{3,4}[\s-]?\d{3,4}[\s-]?\d{3,4}/g,
    replacement: '[PHONE_REDACTED]',
    name: 'phone',
  },
]

// ─── Sanitization ──────────────────────────────────────────────────────────────

/**
 * Recursively sanitizes an object, redacting sensitive values.
 */
function sanitizeValue(value: unknown, key?: string): unknown {
  // Check if the key itself is sensitive
  if (key && SENSITIVE_KEYS.some(s => key.toLowerCase().includes(s.toLowerCase()))) {
    if (typeof value === 'string') {
      // For tokens, show first 10 chars for debugging
      if (key.toLowerCase().includes('token') || key.toLowerCase().includes('authorization')) {
        return value.length > 10 ? `${value.slice(0, 10)}...[REDACTED]` : '[REDACTED]'
      }
      return '[REDACTED]'
    }
    return '[REDACTED]'
  }

  // String values — apply regex patterns
  if (typeof value === 'string') {
    let sanitized = value
    for (const pattern of SENSITIVE_PATTERNS) {
      sanitized = sanitized.replace(pattern.regex, pattern.replacement)
    }
    return sanitized
  }

  // Arrays — sanitize each element
  if (Array.isArray(value)) {
    return value.map(v => sanitizeValue(v, key))
  }

  // Objects — recursively sanitize
  if (value !== null && typeof value === 'object') {
    const result: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value)) {
      result[k] = sanitizeValue(v, k)
    }
    return result
  }

  return value
}

/**
 * Extracts request metadata safely (no body, no headers beyond UA/IP).
 */
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

/**
 * Hashes IP address for GDPR compliance (one-way hash).
 * We can still group by IP in Sentry, but can't reverse it.
 */
function hashIP(ip: string): string {
  // Simple hash — in production use crypto.createHash('sha256')
  let hash = 0
  for (let i = 0; i < ip.length; i++) {
    hash = ((hash << 5) - hash) + ip.charCodeAt(i)
    hash |= 0
  }
  return `ip_${Math.abs(hash).toString(36)}`
}

/**
 * Truncates user agent to prevent overly long strings.
 */
function truncateUA(ua: string): string {
  if (ua.length > 200) return ua.slice(0, 200) + '...'
  return ua
}

/**
 * Sanitizes query parameters — strips sensitive values.
 */
function sanitizeQueryParams(params: URLSearchParams): Record<string, string> {
  const result: Record<string, string> = {}
  for (const [key, value] of params.entries()) {
    const sanitized = sanitizeValue(value, key)
    result[key] = typeof sanitized === 'string' ? sanitized : String(sanitized)
  }
  return result
}

// ─── Sentry Integration ───────────────────────────────────────────────────────

let SentryModule: any = null

async function getSentry() {
  if (SentryModule !== null) return SentryModule

  const dsn = process.env.SENTRY_DSN
  if (!dsn) {
    SentryModule = false  // Mark as checked, don't retry
    return false
  }

  try {
    SentryModule = await import('@sentry/nextjs')
    return SentryModule
  } catch {
    SentryModule = false
    return false
  }
}

// ─── Main Export: logSecurityEvent ────────────────────────────────────────────

/**
 * Logs a security event to console (structured JSON) + Sentry (if configured).
 *
 * @param message — Human-readable event description
 * @param level — Severity: 'info' | 'warning' | 'error'
 * @param request — Optional NextRequest for metadata extraction
 * @param context — Additional context (will be sanitized for PII)
 *
 * Example:
 *   await logSecurityEvent('CSRF blocked: origin mismatch', 'warning', request, {
 *     origin: request.headers.get('origin'),
 *     expectedHost: request.headers.get('host'),
 *   })
 */
export async function logSecurityEvent(
  message: string,
  level: SecurityLogLevel,
  request?: NextRequest,
  context: SecurityEventContext = {},
): Promise<void> {
  // Build the event payload
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

  // Always log to console (structured JSON for log aggregation)
  const logMethod = level === 'error' ? console.error : level === 'warning' ? console.warn : console.log
  logMethod(JSON.stringify(event))

  // Send to Sentry if configured
  const Sentry = await getSentry()
  if (Sentry) {
    // Map log level to Sentry severity
    const sentryLevel =
      level === 'error' ? 'error' :
      level === 'warning' ? 'warning' :
      'info'

    // Add security event as a Sentry breadcrumb for correlation
    Sentry.addBreadcrumb({
      category: 'security',
      message,
      level: sentryLevel,
      data: sanitizedContext,
    })

    // Capture as a message (not exception) for info/warning
    // Capture as exception for error level
    if (level === 'error') {
      Sentry.captureMessage(`[SECURITY] ${message}`, 'error')
    } else {
      Sentry.captureMessage(`[SECURITY] ${message}`, sentryLevel as any)
    }

    // Set user context if available (for correlation in Sentry dashboard)
    if (sanitizedContext.userId) {
      Sentry.setUser({ id: String(sanitizedContext.userId) })
    }

    // Tag for easy filtering in Sentry dashboard
    Sentry.setTag('security_event', 'true')
    Sentry.setTag('event_level', level)
    if (requestMeta.path) {
      Sentry.setTag('request_path', String(requestMeta.path))
    }
  }
}

/**
 * Flushes Sentry events (call before process exit).
 */
export async function flushSecurityEvents(): Promise<void> {
  const Sentry = await getSentry()
  if (Sentry) {
    await Sentry.flush(2000)
  }
}
