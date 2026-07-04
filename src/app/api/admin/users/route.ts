import { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import {
  requireAdmin,
  jsonResponse,
  errorResponse,
  parseBody,
  getPagination,
  listResponse,
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
 * GET /api/admin/users
 * List users with pagination, search, role filter. Excludes password.
 */
export async function GET(request: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response!

  try {
    const { page, limit, skip, search } = getPagination(request.url)
    const url = new URL(request.url)
    const role = url.searchParams.get('role') || undefined

    const where: any = {}
    if (role) where.role = role
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } },
      ]
    }

    const [users, total] = await Promise.all([
      db.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: PUBLIC_FIELDS,
      }),
      db.user.count({ where }),
    ])

    return listResponse(users, total, page, limit)
  } catch (err: any) {
    console.error('admin/users GET error:', err)
    return errorResponse(err?.message || 'Internal server error', 500)
  }
}

/**
 * POST /api/admin/users
 * Create a user. Hashes the password with bcryptjs.
 */
export async function POST(request: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response!

  try {
    const body = await parseBody<any>(request)
    if (!body) return errorResponse('Invalid request body', 400)

    const { name, email, phone, password, role, nameBn, avatar, isActive } = body

    if (!name) return errorResponse('name is required', 400)
    if (!email) return errorResponse('email is required', 400)
    if (!phone) return errorResponse('phone is required', 400)
    if (!password) return errorResponse('password is required', 400)

    const emailExists = await db.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    })
    if (emailExists) return errorResponse('Email already in use', 400)

    const phoneExists = await db.user.findUnique({ where: { phone } })
    if (phoneExists) return errorResponse('Phone already in use', 400)

    const hashed = bcrypt.hashSync(password, 10)
    const user = await db.user.create({
      data: {
        name,
        nameBn: nameBn || null,
        email: email.toLowerCase().trim(),
        phone,
        password: hashed,
        role: role || 'CUSTOMER',
        avatar: avatar || null,
        isActive: isActive !== undefined ? !!isActive : true,
      },
      select: PUBLIC_FIELDS,
    })

    return jsonResponse({ data: user }, 201)
  } catch (err: any) {
    console.error('admin/users POST error:', err)
    return errorResponse(err?.message || 'Internal server error', 500)
  }
}
