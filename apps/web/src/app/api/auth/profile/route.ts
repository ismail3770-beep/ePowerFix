import { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import {
  jsonResponse,
  errorResponse,
  requireAuth,
  createSession,
} from '@/lib/auth'
import { authRoute, z } from '@/lib/api-handler'

// ─── Zod Schema ───────────────────────────────────────────────────────────────

const updateProfileSchema = z.object({
  name: z.string().optional(),
  nameBn: z.string().optional(),
  username: z.string().optional(),
  phone: z.string().optional(),
  avatar: z.string().optional(),
  email: z.string().optional(),
  currentPassword: z.string().optional(),
  address: z.string().optional(),
  area: z.string().optional(),
  city: z.string().optional(),
  postalCode: z.string().optional(),
}).passthrough()

// ─── PUT /api/auth/profile ────────────────────────────────────────────────────

export const PUT = authRoute(updateProfileSchema, async (request, body, user) => {
  const currentUser = await db.user.findUnique({ where: { id: user.id } })
  if (!currentUser) {return errorResponse('User not found', 404)}

  // Email change requires password verification.
  if (body.email && body.email.toLowerCase() !== currentUser.email) {
    if (!body.currentPassword) {
      return errorResponse('Current password is required to change email', 400)
    }
    const ok = bcrypt.compareSync(body.currentPassword, currentUser.password)
    if (!ok) {return errorResponse('Current password is incorrect', 400)}

    const exists = await db.user.findUnique({
      where: { email: body.email.toLowerCase() },
    })
    if (exists) {return errorResponse('Email already in use', 409)}
  }

  // Phone uniqueness check (if changing).
  if (body.phone && body.phone !== currentUser.phone) {
    const exists = await db.user.findUnique({ where: { phone: body.phone } })
    if (exists) {return errorResponse('Phone already in use', 409)}
  }

  const data: any = {}
  if (body.name !== undefined) {data.name = body.name}
  if (body.phone !== undefined) {data.phone = body.phone || null}
  if (body.avatar !== undefined) {data.avatar = body.avatar}
  if (body.email !== undefined) {data.email = body.email.toLowerCase()}
  // nameBn kept in sync if the frontend ever sends it.
  if (body.nameBn !== undefined) {data.nameBn = body.nameBn || null}
  // Address fields (editable from /profile page)
  if (body.address !== undefined) {data.address = body.address || null}
  if (body.area !== undefined) {data.area = body.area || null}
  if (body.city !== undefined) {data.city = body.city || null}
  if (body.postalCode !== undefined) {data.postalCode = body.postalCode || null}

  const updated = await db.user.update({
    where: { id: currentUser.id },
    data,
    select: {
      id: true,
      name: true,
      nameBn: true,
      email: true,
      role: true,
      phone: true,
      avatar: true,
      isActive: true,
      address: true,
      area: true,
      city: true,
      postalCode: true,
    },
  })

  // Refresh the JWT so the new name/email is reflected in the session.
  await createSession(updated)

  return jsonResponse({ data: updated, message: 'Profile updated successfully' })
})
