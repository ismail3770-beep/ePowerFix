/**
 * Comprehensive auth utilities for Next.js API routes.
 * Handles JWT creation/verification, cookie-based sessions, and admin authorization.
 */

import { jwtVerify, SignJWT } from 'jose'
import { cookies } from 'next/headers'
import { db } from '@/lib/db'

const COOKIE_NAME = 'token'
const TOKEN_TTL_SECONDS = 60 * 60 * 24 * 7 // 7 days

function getJwtSecret() {
  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error('JWT_SECRET not configured')
  return new TextEncoder().encode(secret)
}

export interface SessionUser {
  id: string
  name: string
  email: string
  role: string
  phone?: string | null
  avatar?: string | null
  isActive?: boolean
}

export interface AuthResult {
  ok: boolean
  user?: SessionUser
  response?: Response
}

/**
 * Creates a signed JWT for a user and sets it as an httpOnly cookie.
 */
export async function createSession(user: SessionUser) {
  const secret = getJwtSecret()
  const token = await new SignJWT({
    id: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${TOKEN_TTL_SECONDS}s`)
    .sign(secret)

  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: TOKEN_TTL_SECONDS,
  })

  return token
}

/**
 * Clears the session cookie (logout).
 */
export async function clearSession() {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAME)
}

/**
 * Reads & verifies the JWT from the cookie (or Authorization header).
 * Returns the full user record from DB.
 */
export async function getSession(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(COOKIE_NAME)?.value
    if (!token) return null

    const secret = getJwtSecret()
    const { payload } = await jwtVerify(token, secret)
    const userId = payload.id as string | undefined
    if (!userId) return null

    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true, name: true, email: true, role: true,
        phone: true, avatar: true, isActive: true,
      },
    })
    if (!user || !user.isActive) return null
    return user
  } catch {
    return null
  }
}

/**
 * Requires an authenticated session. Returns 401 if not logged in.
 */
export async function requireAuth(): Promise<AuthResult> {
  const user = await getSession()
  if (!user) {
    return {
      ok: false,
      response: Response.json(
        { error: 'Authentication required' },
        { status: 401 }
      ),
    }
  }
  return { ok: true, user }
}

/**
 * Requires an authenticated ADMIN session. Returns 403 if not admin.
 */
export async function requireAdmin(): Promise<AuthResult> {
  const auth = await requireAuth()
  if (!auth.ok) return auth
  if (auth.user!.role !== 'ADMIN') {
    return {
      ok: false,
      response: Response.json(
        { error: 'Admin access required' },
        { status: 403 }
      ),
    }
  }
  return auth
}

/**
 * Helper to send a JSON response with consistent shape.
 */
export function jsonResponse(data: unknown, status = 200, init?: ResponseInit) {
  return Response.json(data, { status, ...init })
}

/**
 * Helper to send an error response.
 */
export function errorResponse(message: string, status = 400) {
  return Response.json({ error: message }, { status })
}

/**
 * Parses JSON body safely.
 */
export async function parseBody<T = any>(request: Request): Promise<T | null> {
  try {
    return await request.json()
  } catch {
    return null
  }
}
