// Admin user routes: list, create, get, update, delete.
// Migrated from apps/web/src/app/api/admin/users/route.ts and [id]/route.ts.
//
// Mounted at /api/admin/users

import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

import { db } from '../../lib/db.js'
import { asyncHandler, ApiError, validateBody } from '../../lib/api-handler.js'
import {
  getPagination,
  listResponse,
} from '../../lib/helpers.js'
import { getAuthUser } from '../../lib/auth.js'

const router = Router()

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

const createUserSchema = z
  .object({
    name: z.string().min(1),
    nameBn: z.string().optional(),
    email: z.string().min(1),
    phone: z.string().min(1).optional().nullable().default(''),
    password: z.string().min(1),
    role: z.string().optional(),
    avatar: z.string().optional(),
    isActive: z.boolean().optional(),
  })
  .passthrough()

const updateUserSchema = z
  .object({
    name: z.string().optional(),
    nameBn: z.string().optional(),
    email: z.string().optional(),
    phone: z.string().optional(),
    password: z.string().optional(),
    role: z.string().optional(),
    avatar: z.string().optional(),
    isActive: z.boolean().optional(),
  })
  .passthrough()

// ─── GET /api/admin/users ────────────────────────────────────────────────────

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const query = req.query as Record<string, any>
    const { page, limit, skip, search } = getPagination(query)
    const role = query.role || undefined

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

    res.json(listResponse(users, total, page, limit))
  })
)

// ─── POST /api/admin/users ───────────────────────────────────────────────────

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const body = validateBody(req, createUserSchema)
    const { name, email, phone, password, role, nameBn, avatar, isActive } = body

    if (!name) {
      throw new ApiError('name is required', 400)
    }
    if (!email) {
      throw new ApiError('email is required', 400)
    }
    if (!password) {
      throw new ApiError('password is required', 400)
    }

    const phoneValue = phone || ''

    const emailExists = await db.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    })
    if (emailExists) {
      throw new ApiError('Email already in use', 400)
    }

    if (phoneValue) {
      const phoneExists = await db.user.findUnique({ where: { phone: phoneValue } })
      if (phoneExists) {
        throw new ApiError('Phone already in use', 400)
      }
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

    res.status(201).json({ data: created })
  })
)

// ─── GET /api/admin/users/:id ────────────────────────────────────────────────

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params

    const user = await db.user.findUnique({
      where: { id },
      select: PUBLIC_FIELDS,
    })
    if (!user) {
      throw new ApiError('User not found', 404)
    }
    res.json({ data: user })
  })
)

// ─── PUT /api/admin/users/:id ────────────────────────────────────────────────

router.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params
    const body = validateBody(req, updateUserSchema)

    const existing = await db.user.findUnique({ where: { id } })
    if (!existing) {
      throw new ApiError('User not found', 404)
    }

    const { name, nameBn, email, phone, password, role, avatar, isActive } = body

    if (email && email.toLowerCase().trim() !== existing.email) {
      const emailOwner = await db.user.findUnique({
        where: { email: email.toLowerCase().trim() },
      })
      if (emailOwner && emailOwner.id !== id) {
        throw new ApiError('Email already in use', 400)
      }
    }
    if (phone && phone !== existing.phone) {
      const phoneOwner = await db.user.findUnique({ where: { phone } })
      if (phoneOwner && phoneOwner.id !== id) {
        throw new ApiError('Phone already in use', 400)
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

    res.json({ data: user })
  })
)

// ─── DELETE /api/admin/users/:id ─────────────────────────────────────────────

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params
    const authUser = getAuthUser(req)

    const existing = await db.user.findUnique({ where: { id } })
    if (!existing) {
      throw new ApiError('User not found', 404)
    }

    if (id === authUser.id) {
      throw new ApiError('Cannot delete your own account', 400)
    }

    await db.user.update({
      where: { id },
      data: { isDeleted: true, isActive: false },
    })

    res.json({ message: 'User deleted' })
  })
)

export default router
