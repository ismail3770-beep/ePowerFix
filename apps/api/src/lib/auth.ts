// Authentication utilities for Express API
// Supports both cookie-based (web) and Bearer token (mobile) auth

import { jwtVerify, SignJWT } from 'jose'
import type { Request, Response, NextFunction } from 'express'
import { db } from './db.js'
import { env } from '../config/env.js'

const COOKIE_NAME = 'token'
const TOKEN_TTL_SECONDS = 60 * 60 * 24 * 7 // 7 days
const ISSUER = env.JWT_ISSUER
const AUDIENCE = env.JWT_AUDIENCE

export interface SessionUser {
  id: string
  name: string
  nameBn?: string | null
  email: string
  role: string
  phone?: string | null
  avatar?: string | null
  isActive?: boolean
  address?: string | null
  area?: string | null
  city?: string | null
  postalCode?: string | null
}

function getJwtSecret(): Uint8Array {
  const secret = env.JWT_SECRET
  if (!secret || secret.length < 32) {
    throw new Error('JWT_SECRET must be set and at least 32 characters.')
  }
  return new TextEncoder().encode(secret)
}

/**
 * Creates a signed JWT for a user.
 * Returns the token — caller decides whether to set as cookie or send in response body.
 */
export async function createSessionToken(user: SessionUser): Promise<string> {
  const secret = getJwtSecret()
  return new SignJWT({
    id: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setExpirationTime(`${TOKEN_TTL_SECONDS}s`)
    .sign(secret)
}

/**
 * Sets the session token as an httpOnly cookie on the response.
 */
export function setSessionCookie(res: Response, token: string): void {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: TOKEN_TTL_SECONDS * 1000,
  })
}

/**
 * Clears the session cookie (logout).
 */
export function clearSessionCookie(res: Response): void {
  res.clearCookie(COOKIE_NAME, { path: '/' })
}

/**
 * Extracts and verifies the JWT from either:
 *   1. Authorization: Bearer <token> header (mobile)
 *   2. cookie (web)
 * Returns the full user record from DB.
 */
export async function getSession(req: Request): Promise<SessionUser | null> {
  try {
    let token: string | undefined

    // 1. Try Authorization header (Bearer token for mobile)
    const authHeader = req.headers.authorization
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.slice(7)
    }

    // 2. Try cookie (for web)
    if (!token) {
      token = req.cookies?.[COOKIE_NAME]
    }

    if (!token) return null

    const secret = getJwtSecret()
    const { payload } = await jwtVerify(token, secret, {
      issuer: ISSUER,
      audience: AUDIENCE,
    })

    const userId = payload.id as string | undefined
    if (!userId) return null

    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true, name: true, nameBn: true, email: true, role: true,
        phone: true, avatar: true, isActive: true,
        address: true, area: true, city: true, postalCode: true,
      },
    })

    if (!user || !user.isActive) return null
    return user
  } catch {
    return null
  }
}

// ─── Express Middleware ───────────────────────────────────────────────────────

/**
 * Middleware: requires authentication. Sends 401 if not logged in.
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const user = await getSession(req)
  if (!user) {
    return res.status(401).json({ error: 'Authentication required' })
  }
  ;(req as any).user = user
  next()
}

/**
 * Middleware: requires admin role. Sends 403 if not admin.
 */
export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const user = await getSession(req)
  if (!user) {
    return res.status(401).json({ error: 'Authentication required' })
  }
  if (user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin access required' })
  }
  ;(req as any).user = user
  next()
}

/**
 * Optional auth — attaches user if logged in, but doesn't block.
 */
export async function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const user = await getSession(req)
  if (user) {
    ;(req as any).user = user
  }
  next()
}

/**
 * Helper to get the authenticated user from request.
 */
export function getAuthUser(req: Request): SessionUser {
  return (req as any).user
}
