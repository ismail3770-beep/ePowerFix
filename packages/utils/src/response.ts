export function success<T>(data: T, message?: string) {
  return { success: true as const, data, message: message || 'OK' }
}

export function error(message: string, statusCode = 400) {
  return { success: false as const, error: message, statusCode }
}

/**
 * Returns a production-safe error message.
 * In production, internal server errors are masked. Client errors (4xx) pass through.
 */
export function safeError(err: unknown, fallback: string, statusCode = 500) {
  const isProd = process.env.NODE_ENV === 'production'
  if (statusCode >= 500) {
    // Never leak internal details for server errors
    console.error(`[Error] ${fallback}:`, err)
    return error(isProd ? fallback : ((err as Error)?.message || fallback), statusCode)
  }
  // Client errors are safe to pass through
  return error(fallback, statusCode)
}

/**
 * Async route handler wrapper that catches errors and returns safe responses.
 * Eliminates repetitive try/catch blocks across all route handlers.
 */
type RouteHandler = (req: any, res: any, next?: any) => Promise<any>
export function asyncHandler(handler: RouteHandler, fallback = 'Internal server error') {
  return async (req: any, res: any, next: any) => {
    try {
      await handler(req, res, next)
    } catch (err: unknown) {
      console.error(`[Route Error] ${fallback}:`, err)
      const isProd = process.env.NODE_ENV === 'production'
      res.status(500).json(error(isProd ? fallback : ((err as Error)?.message || fallback)))
    }
  }
}
