import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { errorResponse, requireAuth, jsonResponse } from '@/lib/auth'
import { checkRateLimit } from '@/lib/rate-limit'
import { headers } from 'next/headers'
import { authRoute, schemas } from '@/lib/api-handler'

/**
 * PUT /api/auth/change-password
 * Rate-limited, Zod-validated password change.
 */
export const PUT = authRoute(schemas.changePassword, async (request, { currentPassword, newPassword }, user) => {
  // Rate limit: 5 password changes per hour per IP.
  const ip = (await headers()).get('x-forwarded-for') || 'unknown'
  const rl = checkRateLimit(`change-pw:${ip}`, 5, 60 * 60 * 1000)
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Too many password change attempts. Please try again later.' },
      { status: 429 },
    )
  }

  const dbUser = await db.user.findUnique({ where: { id: user.id } })
  if (!dbUser) return errorResponse('User not found', 404)

  const ok = bcrypt.compareSync(currentPassword, dbUser.password)
  if (!ok) return errorResponse('Current password is incorrect', 400)

  await db.user.update({
    where: { id: dbUser.id },
    data: { password: bcrypt.hashSync(newPassword, 10) },
  })

  return jsonResponse({ message: 'Password changed successfully' })
})
