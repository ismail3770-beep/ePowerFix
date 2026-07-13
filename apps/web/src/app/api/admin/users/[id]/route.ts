import type { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import {
  requireAdmin,
  jsonResponse,
  errorResponse,
} from '@/lib/admin-api'
import { withErrorHandling, validateBody, z } from '@/lib/api-handler'

const PUBLIC_FIELDS = {
  id: true,
  name: true,
  nameBn: true,
  email: true,
  phone: true,
  role: true,
  avatar: true,
  isActive: true,
  emailVerified: true,
  createdAt: true,
  updatedAt: true,
}

// ─── Zod Schema ───────────────────────────────────────────────────────────────

const updateUserSchema = z.object({
  name: z.string().optional(),
  nameBn: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  password: z.string().optional(),
  role: z.string().optional(),
  avatar: z.string().optional(),
  isActive: z.boolean().optional(),
}).passthrough()

// ─── GET /api/admin/users/[id] ────────────────────────────────────────────────

export const GET = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const auth = await requireAdmin()
  if (!auth.ok) {return auth.response!}

  const { id } = await params
  const user = await db.user.findUnique({
    where: { id },
    select: PUBLIC_FIELDS,
  })
  if (!user) {return errorResponse('User not found', 404)}
  return jsonResponse({ data: user })
})

// ─── PUT /api/admin/users/[id] ────────────────────────────────────────────────

export const PUT = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const auth = await requireAdmin()
  if (!auth.ok) {return auth.response!}

  const { id } = await params
  const body = await validateBody(request, updateUserSchema)

  const existing = await db.user.findUnique({ where: { id } })
  if (!existing) {return errorResponse('User not found', 404)}

  const { name, nameBn, email, phone, password, role, avatar, isActive } = body

  // Uniqueness checks for email / phone
  if (email && email.toLowerCase().trim() !== existing.email) {
    const emailOwner = await db.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    })
    if (emailOwner && emailOwner.id !== id) {
      return errorResponse('Email already in use', 400)
    }
  }
  if (phone && phone !== existing.phone) {
    const phoneOwner = await db.user.findUnique({ where: { phone } })
    if (phoneOwner && phoneOwner.id !== id) {
      return errorResponse('Phone already in use', 400)
    }
  }

  const data: any = {}
  if (name !== undefined) {data.name = name}
  if (nameBn !== undefined) {data.nameBn = nameBn || null}
  if (email !== undefined) {data.email = email.toLowerCase().trim()}
  if (phone !== undefined) {data.phone = phone}
  if (role !== undefined) {data.role = role}
  if (avatar !== undefined) {data.avatar = avatar || null}
  if (isActive !== undefined) {data.isActive = !!isActive}
  if (password) {data.password = bcrypt.hashSync(password, 10)}

  const user = await db.user.update({
    where: { id },
    data,
    select: PUBLIC_FIELDS,
  })

  return jsonResponse({ data: user })
})

// ─── DELETE /api/admin/users/[id] ─────────────────────────────────────────────

export const DELETE = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const auth = await requireAdmin()
  if (!auth.ok) {return auth.response!}

  const { id } = await params
  const existing = await db.user.findUnique({ where: { id } })
  if (!existing) {return errorResponse('User not found', 404)}

  if (id === auth.user!.id) {
    return errorResponse('Cannot delete your own account', 400)
  }

  await db.user.update({
    where: { id },
    data: { isDeleted: true, isActive: false },
  })

  return jsonResponse({ message: 'User deleted' })
})
