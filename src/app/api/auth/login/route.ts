import { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { createSession, jsonResponse, errorResponse, parseBody } from '@/lib/auth'

export async function POST(request: NextRequest) {
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
