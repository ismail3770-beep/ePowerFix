/**
 * Centralized monitoring + error tracking.
 * Backend: structured JSON console logs (always on).
 * Optional: Sentry integration via @sentry/nextjs (enabled when installed + SENTRY_DSN set).
 */

// Sentry is optional — if @sentry/nextjs is not installed, this is null
// and all Sentry calls become no-ops. Install the package + set SENTRY_DSN
// to enable error tracking.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let Sentry: any = null
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const sentryModule = require('@sentry/nextjs')
  if (sentryModule?.init && process.env.SENTRY_DSN) {
    sentryModule.init({
      dsn: process.env.SENTRY_DSN,
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
      environment: process.env.NODE_ENV || 'development',
    })
    Sentry = sentryModule
  }
} catch {
  // @sentry/nextjs not installed — Sentry stays null
}

const ENV = process.env.NODE_ENV || 'development'
const IS_PROD = ENV === 'production'

export interface ErrorContext {
  route?: string
  method?: string
  userId?: string
  [key: string]: any
}

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
  if (Sentry) {
    Sentry.captureException(err, { extra: context })
  }
}

export async function captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info', context: ErrorContext = {}) {
  const logObj = { timestamp: new Date().toISOString(), level, message, ...context }
  if (level === 'error') {
    console.error(JSON.stringify(logObj))
  } else {
    console.log(JSON.stringify(logObj))
  }
  if (Sentry && level === 'error') {
    Sentry.captureMessage(message, { extra: context })
  }
}

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
      if (Sentry) {
        Sentry.addBreadcrumb({
          category: 'performance',
          message: name,
          level: 'info',
          data: { durationMs: duration },
        })
      }
    },
    getData() {
      return { name, durationMs: Date.now() - start }
    },
  }
}

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
  checks.uptime = { status: 'ok', details: `${Math.round(process.uptime())}s` }
  const allOk = Object.values(checks).every((c) => c.status === 'ok')
  return {
    status: allOk ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    environment: ENV,
    checks,
  }
}

export const log = {
  info(message: string, context?: Record<string, any>) {
    console.log(JSON.stringify({ timestamp: new Date().toISOString(), level: 'info', message, ...context }))
  },
  warn(message: string, context?: Record<string, any>) {
    console.warn(JSON.stringify({ timestamp: new Date().toISOString(), level: 'warning', message, ...context }))
  },
  error(message: string, context?: Record<string, any>) {
    console.error(JSON.stringify({ timestamp: new Date().toISOString(), level: 'error', message, ...context }))
  },
}