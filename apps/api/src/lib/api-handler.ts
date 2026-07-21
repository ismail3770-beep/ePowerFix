// Centralized error handling and route wrappers for Express
// Mirrors the pattern from apps/web/src/lib/api-handler.ts

import type { Request, Response, NextFunction, RequestHandler } from 'express'
import type { ParamsFlatDictionary } from 'express-serve-static-core'
import { ZodError, type ZodSchema } from 'zod'

// ─── Error class ──────────────────────────────────────────────────────────────

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number = 400,
    public details?: unknown
  ) {
    super(message)
  }
}

// ─── Async handler wrapper ────────────────────────────────────────────────────

/**
 * Wraps an async route handler to catch promise rejections automatically.
 */
export function asyncHandler(
  fn: (req: Request<ParamsFlatDictionary>, res: Response, next: NextFunction) => Promise<any>
): RequestHandler<ParamsFlatDictionary> {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}

// ─── Body validation ──────────────────────────────────────────────────────────

/**
 * Validates request body against a Zod schema.
 * Throws ApiError(400) if invalid.
 */
export function validateBody<T>(req: Request, schema: ZodSchema<T>): T {
  if (!req.body || Object.keys(req.body).length === 0) {
    throw new ApiError('Request body is required', 400)
  }
  return schema.parse(req.body)
}

/**
 * Validates query params against a Zod schema.
 */
export function validateQuery<T>(req: Request, schema: ZodSchema<T>): T {
  return schema.parse(req.query)
}

// ─── Response helpers ─────────────────────────────────────────────────────────

export function successResponse(data: unknown, status = 200) {
  return { success: true, data }
}

export function errorResponse(message: string, status = 400) {
  return { error: message }
}

// ─── Error handler middleware ─────────────────────────────────────────────────

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Log the full error server-side
  console.error('[API Error]', err)

  // Zod validation errors → 400
  if (err instanceof ZodError) {
    res.status(400).json({
      error: 'Validation failed',
      details: err.issues.map((i) => ({
        field: i.path.join('.'),
        message: i.message,
      })),
    })
    return
  }

  // ApiError instances
  if (err instanceof ApiError) {
    res.status(err.status).json({ error: err.message, ...(err.details ? { details: err.details } : {}) })
    return
  }

  // Never leak internal details to the client
  res.status(500).json({ error: 'An unexpected error occurred' })
}

// ─── 404 handler ──────────────────────────────────────────────────────────────

export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({ error: 'Not found' })
}
