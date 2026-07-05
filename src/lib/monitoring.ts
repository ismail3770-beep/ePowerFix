/**
 * Centralized monitoring + error tracking.
 *
 * Backend: structured JSON console logs (always on).
 * To enable Sentry later: `bun add @sentry/nextjs`, set SENTRY_DSN, and
 * re-add the captureException/captureMessage forwarding in the functions
 * below. The module is intentionally free of any `import('@sentry/nextjs')`
 * so it compiles cleanly without the package installed.
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
 *       throw err
 *     }
 *   })
 */

// --- Configuration -----------------------------------------------------------

const ENV = process.env.NODE_ENV || 'development'
const IS_PROD = ENV === 'production'

// --- Error Capture -----------------------------------------------------------

export interface ErrorContext {
  route?: string
  method?: string
  userId?: string
  [key: string]: any
}

/**
 * Capture an error and log it (structured JSON).
 * Never throws — safe to call in catch blocks.
 */
export async function captureError(error: unknown, context: ErrorContext = {}) {
  const err = error instanceof Error ? error : new Error(String(error))

  console.error(JSON.stringify({
    timestamp: new Date().toISOString(),
    level: 'error',
    message: err.message,
    name: err.name,
    stack: IS_PROD ? undefined : err.stack,
    ...context,
  }))
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
}

// --- Performance Spans -------------------------------------------------------

/**
 * Lightweight performance span — measures execution time and logs slow ops.
 *
 * Usage:
 *   const span = startSpan('db.products.findMany')
 *   const products = await db.product.findMany()
 *   span.finish()
 */
export function startSpan(name: string) {
  const start = Date.now()

  return {
    finish() {
      const duration = Date.now() - start
      if (duration > 100) {
        console.warn(JSON.stringify({
          timestamp: new Date().toISOString(),
          level: 'warning',
          message: `Slow operation: ${name}`,
          durationMs: duration,
        }))
      }
    },
    getData() {
      return { name, durationMs: Date.now() - start }
    },
  }
}

// --- Health Check ------------------------------------------------------------

/**
 * Returns a health check object for /api/health endpoint.
 */
export async function getHealthStatus() {
  const checks: Record<string, { status: 'ok' | 'error'; details?: any }> = {}

  try {
    const { db } = await import('@/lib/db')
    await db.$queryRaw`SELECT 1`
    checks.database = { status: 'ok' }
  } catch (err: any) {
    checks.database = { status: 'error', details: err?.message }
  }

  const mem = process.memoryUsage()
  checks.memory = {
    status: mem.heapUsed < mem.heapTotal * 0.9 ? 'ok' : 'error',
    details: {
      heapUsed: `${Math.round(mem.heapUsed / 1024 / 1024)}MB`,
      heapTotal: `${Math.round(mem.heapTotal / 1024 / 1024)}MB`,
      rss: `${Math.round(mem.rss / 1024 / 1024)}MB`,
    },
  }

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
