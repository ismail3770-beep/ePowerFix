import { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import {
  jsonResponse,
  errorResponse,
  requireAuth,
  parseBody,
  createSession,
} from '@/lib/auth'

/**
 * PUT /api/auth/profile
 * Update the current user's profile (name, username, phone, avatar, email).
 * If email changes, currentPassword must be supplied for verification.
 * Body: { name?, username?, phone?, avatar?, email?, currentPassword? }
 */
export async function PUT(request: NextRequest) {
  try {
    const auth = await requireAuth()
    if (!auth.ok) return auth.response!

    const body = await parseBody<any>(request)
    if (!body) return errorResponse('Invalid request body', 400)

    const user = await db.user.findUnique({ where: { id: auth.user!.id } })
    if (!user) return errorResponse('User not found', 404)

    // Email change requires password verification.
    if (body.email && body.email.toLowerCase() !== user.email) {
      if (!body.currentPassword) {
        return errorResponse('Current password is required to change email', 400)
      }
      const ok = bcrypt.compareSync(body.currentPassword, user.password)
      if (!ok) return errorResponse('Current password is incorrect', 400)

      const exists = await db.user.findUnique({
        where: { email: body.email.toLowerCase() },
      })
      if (exists) return errorResponse('Email already in use', 409)
    }

    // Phone uniqueness check (if changing).
    if (body.phone && body.phone !== user.phone) {
      const exists = await db.user.findUnique({ where: { phone: body.phone } })
      if (exists) return errorResponse('Phone already in use', 409)
    }

    const data: any = {}
    if (body.name !== undefined) data.name = body.name
    if (body.phone !== undefined) data.phone = body.phone || null
    if (body.avatar !== undefined) data.avatar = body.avatar
    if (body.email !== undefined) data.email = body.email.toLowerCase()
    // nameBn kept in sync if the frontend ever sends it.
    if (body.nameBn !== undefined) data.nameBn = body.nameBn || null

    const updated = await db.user.update({
      where: { id: user.id },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        avatar: true,
        isActive: true,
      },
    })

    // Refresh the JWT so the new name/email is reflected in the session.
    await createSession(updated)

    return jsonResponse({ data: updated, message: 'Profile updated successfully' })
  } catch (err: any) {
    console.error('auth/profile PUT error:', err)
    return errorResponse(err?.message || 'Internal server error', 500)
  }
}
