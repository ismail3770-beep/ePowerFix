import { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import {
  requireAdmin,
  jsonResponse,
  errorResponse,
  getPagination,
  listResponse,
} from '@/lib/admin-api'
import { adminGetRoute, adminRoute, z } from '@/lib/api-handler'

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

const createUserSchema = z.object({
  name: z.string().min(1),
  nameBn: z.string().optional(),
  email: z.string().min(1),
  phone: z.string().min(1).optional().nullable().default(''),
  password: z.string().min(1),
  role: z.string().optional(),
  avatar: z.string().optional(),
  isActive: z.boolean().optional(),
}).passthrough()

// ─── GET /api/admin/users ─────────────────────────────────────────────────────

export const GET = adminGetRoute(async (request) => {
  const { page, limit, skip, search } = getPagination(request.url)
  const url = new URL(request.url)
  const role = url.searchParams.get('role') || undefined

  const where: any = {}
  if (role) {where.role = role}
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
})

// ─── POST /api/admin/users ────────────────────────────────────────────────────

export const POST = adminRoute(createUserSchema, async (request, body, user) => {
  const { name, email, phone, password, role, nameBn, avatar, isActive } = body

  if (!name) {return errorResponse('name is required', 400)}
  if (!email) {return errorResponse('email is required', 400)}
  if (!password) {return errorResponse('password is required', 400)}

  const phoneValue = phone || ''

  const emailExists = await db.user.findUnique({
    where: { email: email.toLowerCase().trim() },
  })
  if (emailExists) {return errorResponse('Email already in use', 400)}

  // Only enforce phone uniqueness when a phone is actually provided.
  if (phoneValue) {
    const phoneExists = await db.user.findUnique({ where: { phone: phoneValue } })
    if (phoneExists) {return errorResponse('Phone already in use', 400)}
  }

  const hashed = bcrypt.hashSync(password, 10)
  const created = await db.user.create({
    data: {
      name,
      nameBn: nameBn || null,
      email: email.toLowerCase().trim(),
      phone: phoneValue,
      password: hashed,
      role: role || 'CUSTOMER',
      avatar: avatar || null,
      isActive: isActive !== undefined ? !!isActive : true,
    },
    select: PUBLIC_FIELDS,
  })

  return jsonResponse({ data: created }, 201)
})
