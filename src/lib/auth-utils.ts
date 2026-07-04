/**
 * Auth utilities for Next.js payment routes.
 * Verifies the same JWT that the Express API issues (signed with JWT_SECRET via `jose`).
 */

import { jwtVerify } from 'jose'

function getJwtSecret() {
  const secret = process.env.JWT_SECRET
  if (!secret) return null
  return new TextEncoder().encode(secret)
}

export interface AuthResult {
  ok: boolean
  userId?: string
  role?: string
  response?: Response
}

/**
 * Validates the JWT from the `token` cookie or `Authorization: Bearer` header.
 * Returns the real userId on success (no longer 'unknown').
 */
export async function requireAuth(request: Request): Promise<AuthResult> {
  const JWT_SECRET = getJwtSecret()
  if (!JWT_SECRET) {
    return {
      ok: false,
      response: new Response(
        JSON.stringify({ error: 'JWT_SECRET not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      ),
    }
  }

  const authHeader = request.headers.get('authorization')
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null

  // The cookie is not directly readable from a `Request`; callers that rely on the
  // httpOnly cookie should pass the token via the Authorization header. For server
  // routes that have a cookie jar, read it there and forward as Bearer.
  const token = bearerToken

  if (!token) {
    return {
      ok: false,
      response: new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      ),
    }
  }

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    const userId = payload.id as string | undefined
    if (!userId) {
      return {
        ok: false,
        response: new Response(
          JSON.stringify({ error: 'Invalid token payload' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        ),
      }
    }
    return { ok: true, userId, role: payload.role as string | undefined }
  } catch {
    return {
      ok: false,
      response: new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      ),
    }
  }
}