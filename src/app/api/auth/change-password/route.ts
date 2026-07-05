import { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { jsonResponse, errorResponse, requireAuth, parseBody } from '@/lib/auth'
import { checkRateLimit } from '@/lib/rate-limit'
import { headers } from 'next/headers'

/**
 * PUT /api/auth/change-password
 * Change the current user's password.
 * Body: { currentPassword, newPassword }
 */
export async function PUT(request: NextRequest) {
  // Rate limit: 5 password changes per hour per IP.
  const ip = (await headers()).get('x-forwarded-for') || 'unknown'
  const rl = checkRateLimit(`change-pw:${ip}`, 5, 60 * 60 * 1000)
  if (!rl.allowed) {
    return errorResponse('Too many password change attempts. Please try again later.', 429)
  }

  try {
    const auth = await requireAuth()
    if (!auth.ok) return auth.response!

    const body = await parseBody<{
      currentPassword?: string
      newPassword?: string
    }>(request)
    if (!body) return errorResponse('Invalid request body', 400)

    const { currentPassword, newPassword } = body
    if (!currentPassword || !newPassword) {
      return errorResponse('currentPassword and newPassword are required', 400)
    }
    if (newPassword.length < 8) {
      return errorResponse('New password must be at least 8 characters', 400)
    }

    const user = await db.user.findUnique({ where: { id: auth.user!.id } })
    if (!user) return errorResponse('User not found', 404)

    const ok = bcrypt.compareSync(currentPassword, user.password)
    if (!ok) return errorResponse('Current password is incorrect', 400)

    await db.user.update({
      where: { id: user.id },
      data: { password: bcrypt.hashSync(newPassword, 10) },
    })

    return jsonResponse({ message: 'Password changed successfully' })
  } catch (err: any) {
    console.error('auth/change-password PUT error:', err)
    return errorResponse(err?.message || 'Internal server error', 500)
  }
}
