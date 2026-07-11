/**
 * Sentry configuration for Next.js
 *
 * Usage:
 *   import * as Sentry from '@sentry/nextjs'
 *   Sentry.init({ dsn: process.env.SENTRY_DSN })
 */

import * as Sentry from '@sentry/nextjs'

const SENTRY_DSN = process.env.SENTRY_DSN

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    debug: process.env.NODE_ENV === 'development',
    environment: process.env.NODE_ENV || 'development',
    // Set release version from package.json or git
    release: process.env.npm_package_version || 'dev',
    // Filter out common non-actionable errors
    beforeSend(event, hint) {
      const error = hint.originalException
      if (error instanceof Error) {
        // Ignore Next.js build errors in development
        if (process.env.NODE_ENV === 'development' && error.message.includes('Module not found')) {
          return null
        }
        // Ignore network errors that are likely client-side issues
        if (error.name === 'NetworkError' || error.message.includes('Failed to fetch')) {
          return null
        }
      }
      return event
    },
    // Custom tags for easier filtering
    initialScope: {
      tags: {
        project: 'epowerfix',
        service: 'web',
      },
    },
  })
}

export { Sentry }