import { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { createSession, jsonResponse, errorResponse, parseBody } from '@/lib/auth'
import { checkRateLimit } from '@/lib/rate-limit'
import { headers } from 'next/headers'

export async function POST(request: NextRequest) {
  // Rate limit: 10 login attempts per 15 minutes per IP.
  const ip = (await headers()).get('x-forwarded-for') || 'unknown'
  const rl = checkRateLimit(`login:${ip}`, 10, 15 * 60 * 1000)
  if (!rl.allowed) {
    return errorResponse('Too many login attempts. Please try again later.', 429)
  }

  const body = await parseBody<{ email?: string; password?: string }>(request)
  if (!body?.email || !body?.password) {
    return errorResponse('Email and password are required', 400)
  }

  const user = await db.user.findUnique({
    where: { email: body.email.toLowerCase().trim() },
  })
  if (!user) {
    return errorResponse('Invalid email or password', 401)
  }
  if (!user.isActive) {
    return errorResponse('Account is disabled', 403)
  }

  const valid = bcrypt.compareSync(body.password, user.password)
  if (!valid) {
    return errorResponse('Invalid email or password', 401)
  }

  const safeUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone,
    avatar: user.avatar,
    isActive: user.isActive,
  }

  await createSession(safeUser)

  return jsonResponse({
    data: { user: safeUser },
    message: 'Login successful',
  })
}
