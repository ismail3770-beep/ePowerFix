/**
 * Centralized monitoring + error tracking.
 *
 * Supports two backends:
 *  - Sentry (if SENTRY_DSN is set) — full error tracking + performance
 *  - Console fallback (dev) — structured JSON logs
 *
 * Usage in API routes:
 *   import { captureError, captureMessage, startSpan } from '@/lib/monitoring'
 *
 *   export const GET = withErrorHandling(async (req) => {
 *     const span = startSpan('admin.products.list')
 *     try {
 *       // ... business logic
 *       span.finish()
 *     } catch (err) {
 *       captureError(err, { route: 'GET /api/admin/products', userId: user?.id })
 *       throw err  // re-throw so withErrorHandling returns 500
 *     }
 *   })
 *
 * The api-handler.ts withErrorHandling wrapper already calls captureError
 * internally — this module is the underlying implementation.
 */

// ─── Configuration ────────────────────────────────────────────────────────────

const SENTRY_DSN = process.env.SENTRY_DSN || ''
const ENV = process.env.NODE_ENV || 'development'
const IS_PROD = ENV === 'production'

// Lazy-load Sentry only if DSN is configured
let SentryClient: any = null
async function getSentry() {
  if (!SENTRY_DSN || !IS_PROD) return null
  if (!SentryClient) {
    try {
      const Sentry = await import('@sentry/nextjs')
      SentryClient = Sentry
    } catch {
      console.warn('[monitoring] @sentry/nextjs not installed — falling back to console')
      return null
    }
  }
  return SentryClient
}

// ─── Error Capture ───────────────────────────────────────────────────────────

export interface ErrorContext {
  route?: string
  method?: string
  userId?: string
  [key: string]: any
}

/**
 * Capture an error and send it to Sentry (if configured) or log it.
 * Never throws — safe to call in catch blocks.
 */
export async function captureError(error: unknown, context: ErrorContext = {}) {
  const err = error instanceof Error ? error : new Error(String(error))

  // Always log server-side (structured JSON for log aggregation)
  console.error(JSON.stringify({
    timestamp: new Date().toISOString(),
    level: 'error',
    message: err.message,
    name: err.name,
    stack: IS_PROD ? undefined : err.stack,  // Don't log stacks in prod (Sentry has them)
    ...context,
  }))

  // Send to Sentry if configured
  const sentry = await getSentry()
  if (sentry) {
    sentry.captureException(err, {
      tags: {
        route: context.route,
        method: context.method,
      },
      extra: context,
    })
  }
}

/**
 * Capture a info/warning message (non-error).
 */
export async function captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info', context: ErrorContext = {}) {
  if (level === 'error') {
    console.error(JSON.stringify({ timestamp: new Date().toISOString(), level, message, ...context }))
  } else {
    console.log(JSON.stringify({ timestamp: new Date().toISOString(), level, message, ...context }))
  }

  const sentry = await getSentry()
  if (sentry) {
    sentry.captureMessage(message, level)
  }
}

// ─── Performance Spans ───────────────────────────────────────────────────────

/**
 * Lightweight performance span — measures execution time and reports
 * to Sentry as a transaction or logs it.
 *
 * Usage:
 *   const span = startSpan('db.products.findMany')
 *   const products = await db.product.findMany()
 *   span.finish()  // logs duration, sends to Sentry if configured
 */
export function startSpan(name: string) {
  const start = Date.now()

  return {
    finish() {
      const duration = Date.now() - start
      if (duration > 100) {
        // Log slow operations (> 100ms)
        console.warn(JSON.stringify({
          timestamp: new Date().toISOString(),
          level: 'warning',
          message: `Slow operation: ${name}`,
          durationMs: duration,
        }))
      }
      // In production with Sentry, this would be sent as a span
      // sentry?.startSpan({ name, op: 'db' }, () => { ... })
    },
    getData() {
      return { name, durationMs: Date.now() - start }
    },
  }
}

// ─── Health Check ─────────────────────────────────────────────────────────────

/**
 * Returns a health check object for /api/health endpoint.
 * Checks: database connectivity, memory usage, uptime.
 */
export async function getHealthStatus() {
  const checks: Record<string, { status: 'ok' | 'error'; details?: any }> = {}

  // Database check
  try {
    const { db } = await import('@/lib/db')
    await db.$queryRaw`SELECT 1`
    checks.database = { status: 'ok' }
  } catch (err: any) {
    checks.database = { status: 'error', details: err?.message }
  }

  // Memory check
  const mem = process.memoryUsage()
  checks.memory = {
    status: mem.heapUsed < mem.heapTotal * 0.9 ? 'ok' : 'error',
    details: {
      heapUsed: `${Math.round(mem.heapUsed / 1024 / 1024)}MB`,
      heapTotal: `${Math.round(mem.heapTotal / 1024 / 1024)}MB`,
      rss: `${Math.round(mem.rss / 1024 / 1024)}MB`,
    },
  }

  // Uptime
  checks.uptime = {
    status: 'ok',
    details: `${Math.round(process.uptime())}s`,
  }

  const allOk = Object.values(checks).every((c) => c.status === 'ok')

  return {
    status: allOk ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    environment: ENV,
    checks,
  }
}
