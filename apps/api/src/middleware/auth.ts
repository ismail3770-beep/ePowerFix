import { Request, Response, NextFunction } from 'express'
import { SignJWT, jwtVerify } from 'jose'
import { db } from '@epowerfix/db'

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required')
}
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET)
const COOKIE_NAME = 'token'
const TOKEN_EXPIRY = '7d'

export interface AuthPayload { userId: string; email: string; role: string }

// Sign JWT token
export async function signToken(payload: AuthPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(TOKEN_EXPIRY)
    .sign(JWT_SECRET)
}

// Verify JWT token
export async function verifyToken(token: string): Promise<AuthPayload> {
  const { payload } = await jwtVerify(token, JWT_SECRET)
  return payload as unknown as AuthPayload
}

// Get token from request (cookie or header)
function getToken(req: Request): string | null {
  return req.cookies?.[COOKIE_NAME] || req.headers.authorization?.replace('Bearer ', '') || null
}

// Middleware: require authenticated user
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const token = getToken(req)
    if (!token) return res.status(401).json({ success: false, error: 'Authentication required' })
    const payload = await verifyToken(token)
    const user = await db.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, name: true, email: true, phone: true, role: true, avatar: true, isActive: true },
    })
    if (!user || !user.isActive) return res.status(401).json({ success: false, error: 'User not found or inactive' })
    req.user = user
    next()
  } catch {
    res.status(401).json({ success: false, error: 'Invalid or expired token' })
  }
}

// Middleware: require admin role
export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  try {
    await requireAuth(req, res, (err) => { if (err) return })
    if (res.headersSent) return
    if (req.user?.role !== 'ADMIN') {
      return res.status(403).json({ success: false, error: 'Admin access required' })
    }
    next()
  } catch {
    res.status(403).json({ success: false, error: 'Admin access required' })
  }
}

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string
        name: string
        email: string
        phone: string | null
        role: string
        avatar: string | null
        isActive: boolean
      }
    }
  }
}

export { COOKIE_NAME, TOKEN_EXPIRY }
