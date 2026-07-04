import { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import {
  requireAdmin,
  jsonResponse,
  errorResponse,
  parseBody,
} from '@/lib/admin-api'

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

/**
 * GET /api/admin/users/[id]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response!

  try {
    const { id } = await params
    const user = await db.user.findUnique({
      where: { id },
      select: PUBLIC_FIELDS,
    })
    if (!user) return errorResponse('User not found', 404)
    return jsonResponse({ data: user })
  } catch (err: any) {
    console.error('admin/users/[id] GET error:', err)
    return errorResponse(err?.message || 'Internal server error', 500)
  }
}

/**
 * PUT /api/admin/users/[id]
 * If a password is supplied, hash it before saving.
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response!

  try {
    const { id } = await params
    const body = await parseBody<any>(request)
    if (!body) return errorResponse('Invalid request body', 400)

    const existing = await db.user.findUnique({ where: { id } })
    if (!existing) return errorResponse('User not found', 404)

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
    if (name !== undefined) data.name = name
    if (nameBn !== undefined) data.nameBn = nameBn || null
    if (email !== undefined) data.email = email.toLowerCase().trim()
    if (phone !== undefined) data.phone = phone
    if (role !== undefined) data.role = role
    if (avatar !== undefined) data.avatar = avatar || null
    if (isActive !== undefined) data.isActive = !!isActive
    if (password) data.password = bcrypt.hashSync(password, 10)

    const user = await db.user.update({
      where: { id },
      data,
      select: PUBLIC_FIELDS,
    })

    return jsonResponse({ data: user })
  } catch (err: any) {
    console.error('admin/users/[id] PUT error:', err)
    return errorResponse(err?.message || 'Internal server error', 500)
  }
}

/**
 * DELETE /api/admin/users/[id] — soft-delete (isDeleted=true, isActive=false).
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response!

  try {
    const { id } = await params
    const existing = await db.user.findUnique({ where: { id } })
    if (!existing) return errorResponse('User not found', 404)

    if (id === auth.user!.id) {
      return errorResponse('Cannot delete your own account', 400)
    }

    await db.user.update({
      where: { id },
      data: { isDeleted: true, isActive: false },
    })

    return jsonResponse({ message: 'User deleted' })
  } catch (err: any) {
    console.error('admin/users/[id] DELETE error:', err)
    return errorResponse(err?.message || 'Internal server error', 500)
  }
}
