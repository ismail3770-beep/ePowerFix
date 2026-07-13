import { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { createSession, jsonResponse, errorResponse } from '@/lib/auth'
import { checkRateLimit } from '@/lib/rate-limit'
import { headers } from 'next/headers'
import { publicRoute, schemas } from '@/lib/api-handler'
import { NextResponse } from 'next/server'

/**
 * POST /api/auth/login
 * Rate-limited, Zod-validated login.
 */
export const POST = publicRoute(schemas.login, async (request, { email, password }) => {
  // Rate limit: 10 login attempts per 15 minutes per IP.
  const ip = (await headers()).get('x-forwarded-for') || 'unknown'
  const rl = await checkRateLimit(`login:${ip}`, 10, 15 * 60 * 1000)
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Too many login attempts. Please try again later.' },
      { status: 429 },
    )
  }

  const user = await db.user.findUnique({
    where: { email: email.toLowerCase().trim() },
  })
  if (!user) {
    return errorResponse('Invalid email or password', 401)
  }
  if (!user.isActive) {
    return errorResponse('Account is disabled', 403)
  }

  const valid = bcrypt.compareSync(password, user.password)
  if (!valid) {
    return errorResponse('Invalid email or password', 401)
  }

  const safeUser = {
    id: user.id,
    name: user.name,
    nameBn: user.nameBn,
    email: user.email,
    role: user.role,
    phone: user.phone,
    avatar: user.avatar,
    isActive: user.isActive,
    address: user.address,
    area: user.area,
    city: user.city,
    postalCode: user.postalCode,
  }

  await createSession(safeUser)

  return jsonResponse({
    data: { user: safeUser },
    message: 'Login successful',
  })
})
