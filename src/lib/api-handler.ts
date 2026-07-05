/**
 * Centralized API utilities for secure, validated, error-handled routes.
 *
 * Usage — replace raw route handlers with the typed wrappers:
 *
 *   // Before (insecure):
 *   export async function POST(request: NextRequest) {
 *     const auth = await requireAdmin()
 *     const body = await parseBody<any>(request)
 *     // ... no validation, raw any
 *   }
 *
 *   // After (secure):
 *   export const POST = adminRoute(createSchema, async (req, parsed, user) => {
 *     // parsed is fully typed & validated
 *   })
 *
 *   // Public route (no auth):
 *   export const POST = publicRoute(contactSchema, async (req, parsed) => {
 *     // ...
 *   })
 *
 *   // Auth-required route (any logged-in user):
 *   export const PUT = authRoute(passwordSchema, async (req, parsed, user) => {
 *     // ...
 *   })
 *
 *   // Route with no body (GET handlers):
 *   export const GET = adminGetRoute(async (req, user) => {
 *     // ...
 *   })
 */

import { NextRequest, NextResponse } from 'next/server'
import { ZodSchema, ZodError } from 'zod'
import { requireAdmin, requireAuth, jsonResponse, errorResponse } from '@/lib/auth'

// ─── Types ────────────────────────────────────────────────────────────────────

type AdminHandler<T> = (
  request: NextRequest,
  parsed: T,
  user: NonNullable<Awaited<ReturnType<typeof requireAdmin>>['user']>,
) => Promise<Response | NextResponse>

type AuthHandler<T> = (
  request: NextRequest,
  parsed: T,
  user: NonNullable<Awaited<ReturnType<typeof requireAuth>>['user']>,
) => Promise<Response | NextResponse>

type PublicHandler<T> = (
  request: NextRequest,
  parsed: T,
) => Promise<Response | NextResponse>

type NoBodyAdminHandler = (
  request: NextRequest,
  user: NonNullable<Awaited<ReturnType<typeof requireAdmin>>['user']>,
) => Promise<Response | NextResponse>

type NoBodyAuthHandler = (
  request: NextRequest,
  user: NonNullable<Awaited<ReturnType<typeof requireAuth>>['user']>,
) => Promise<Response | NextResponse>

type NoBodyPublicHandler = (
  request: NextRequest,
) => Promise<Response | NextResponse>

// ─── Error Handling ───────────────────────────────────────────────────────────

/**
 * Wraps an async handler in a try/catch that NEVER leaks stack traces to
 * the client. Logs the full error server-side, returns a generic 500.
 */
export function withErrorHandling<T extends (...args: any[]) => Promise<Response | NextResponse>>(
  handler: T,
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await handler(...args)
    } catch (err: any) {
      // Log full error server-side
      console.error('[API Error]', {
        message: err?.message,
        stack: err?.stack,
        name: err?.name,
      })

      // Zod validation errors → 400
      if (err instanceof ZodError) {
        return NextResponse.json(
          {
            error: 'Validation failed',
            details: err.issues.map((i) => ({
              field: i.path.join('.'),
              message: i.message,
            })),
          },
          { status: 400 },
        )
      }

      // Already-formatted error responses (from auth helpers)
      if (err?.message && err?.status) {
        return NextResponse.json({ error: err.message }, { status: err.status })
      }

      // Never leak internal details to the client
      return NextResponse.json(
        { error: 'An unexpected error occurred' },
        { status: 500 },
      )
    }
  }) as T
}

/**
 * Parses and validates the request body against a Zod schema.
 * Throws a ZodError (caught by withErrorHandling) if invalid.
 * Exported so routes with dynamic URL params can use it directly.
 */
export async function validateBody<T>(request: NextRequest, schema: ZodSchema<T>): Promise<T> {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    throw new ZodError([{
      code: 'custom',
      path: ['_body'],
      message: 'Invalid JSON body',
      fatal: true,
    } as any])
  }
  return schema.parse(body)
}

// ─── Route Wrappers ───────────────────────────────────────────────────────────

/**
 * Admin-only POST/PUT route with body validation.
 * Usage: export const POST = adminRoute(schema, handler)
 */
export function adminRoute<T>(
  schema: ZodSchema<T>,
  handler: AdminHandler<T>,
) {
  return withErrorHandling(async (request: NextRequest) => {
    const auth = await requireAdmin()
    if (!auth.ok) return auth.response!
    const parsed = await validateBody(request, schema)
    return handler(request, parsed, auth.user!)
  })
}

/**
 * Admin-only GET/DELETE route (no body validation needed).
 * Usage: export const GET = adminGetRoute(handler)
 */
export function adminGetRoute(handler: NoBodyAdminHandler) {
  return withErrorHandling(async (request: NextRequest) => {
    const auth = await requireAdmin()
    if (!auth.ok) return auth.response!
    return handler(request, auth.user!)
  })
}

/**
 * Authenticated (any logged-in user) POST/PUT route with body validation.
 */
export function authRoute<T>(
  schema: ZodSchema<T>,
  handler: AuthHandler<T>,
) {
  return withErrorHandling(async (request: NextRequest) => {
    const auth = await requireAuth()
    if (!auth.ok) return auth.response!
    const parsed = await validateBody(request, schema)
    return handler(request, parsed, auth.user!)
  })
}

/**
 * Authenticated GET/DELETE route (no body).
 */
export function authGetRoute(handler: NoBodyAuthHandler) {
  return withErrorHandling(async (request: NextRequest) => {
    const auth = await requireAuth()
    if (!auth.ok) return auth.response!
    return handler(request, auth.user!)
  })
}

/**
 * Public POST/PUT route with body validation (no auth required).
 * Usage: export const POST = publicRoute(schema, handler)
 */
export function publicRoute<T>(
  schema: ZodSchema<T>,
  handler: PublicHandler<T>,
) {
  return withErrorHandling(async (request: NextRequest) => {
    const parsed = await validateBody(request, schema)
    return handler(request, parsed)
  })
}

/**
 * Public GET/DELETE route (no body, no auth).
 */
export function publicGetRoute(handler: NoBodyPublicHandler) {
  return withErrorHandling(async (request: NextRequest) => {
    return handler(request)
  })
}

// ─── Common Zod Schemas ───────────────────────────────────────────────────────
// Pre-built Zod schemas for common API patterns. Import and reuse across routes.

export const schemas = {
  // Auth
  login: z.object({
    email: z.string().email(),
    password: z.string().min(1),
  }),
  register: z.object({
    name: z.string().min(2),
    email: z.string().email(),
    phone: z.string().min(6),
    password: z.string().min(6),
  }),
  changePassword: z.object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(8),
  }),

  // Contact / Newsletter / Quote
  contact: z.object({
    name: z.string().min(1).max(100),
    email: z.string().email(),
    phone: z.string().optional(),
    subject: z.string().min(1).max(200),
    message: z.string().min(1).max(5000),
  }),
  newsletter: z.object({
    email: z.string().email(),
  }),
  quoteRequest: z.object({
    name: z.string().min(1),
    phone: z.string().min(6),
    email: z.string().email().optional().or(z.literal('')),
    serviceType: z.string().min(1),
    description: z.string().min(1),
    address: z.string().optional(),
    budget: z.string().optional(),
  }),

  // Service booking
  serviceBooking: z.object({
    serviceId: z.string().min(1),
    bookingDate: z.string().min(1),
    bookingTime: z.string().min(1),
    address: z.string().min(1),
    phone: z.string().min(6),
    notes: z.string().optional(),
  }),

  // Review
  review: z.object({
    productId: z.string().optional(),
    serviceId: z.string().optional(),
    rating: z.number().int().min(1).max(5),
    title: z.string().min(1).max(200),
    comment: z.string().min(1).max(5000),
  }),

  // Pagination query params helper
  pagination: z.object({
    page: z.string().optional().default('1').transform(Number),
    limit: z.string().optional().default('20').transform(Number),
    search: z.string().optional().default(''),
  }),
}

// Re-export z for convenience
export { z } from 'zod'
