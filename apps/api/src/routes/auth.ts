// Auth routes: login, register, logout, me, profile, change-password
import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'
import { z } from 'zod'

import { db } from '../lib/db.js'
import {
  createSessionToken,
  setSessionCookie,
  clearSessionCookie,
  requireAuth,
  getSession,
  getAuthUser,
} from '../lib/auth.js'
import { asyncHandler, ApiError, validateBody } from '../lib/api-handler.js'
import { schemas } from '../lib/schemas.js'

const router = Router()

// ─── POST /api/auth/login ─────────────────────────────────────────────────────

router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const { email, password } = validateBody(req, schemas.login)

    const user = await db.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    })
    if (!user) {
      throw new ApiError('Invalid email or password', 401)
    }
    if (!user.isActive) {
      throw new ApiError('Account is disabled', 403)
    }

    const valid = bcrypt.compareSync(password, user.password)
    if (!valid) {
      throw new ApiError('Invalid email or password', 401)
    }

    const safeUser = {
      id: user.id,
      name: user.name,
      nameBn: user.nameBn,
      email: user.email,
      role: user.role,
      phone: user.phone,
      avatar: user.avatar,
      isActive: user.isActive,
      address: user.address,
      area: user.area,
      city: user.city,
      postalCode: user.postalCode,
    }

    const token = await createSessionToken(safeUser)
    setSessionCookie(res, token)

    res.json({
      data: { user: safeUser, token },
      message: 'Login successful',
    })
  })
)

// ─── POST /api/auth/register ──────────────────────────────────────────────────

router.post(
  '/register',
  asyncHandler(async (req, res) => {
    const { name, nameBn, email, phone, password } = validateBody(req, schemas.register)

    const normalizedEmail = email.toLowerCase().trim()

    // Uniqueness checks
    const emailExists = await db.user.findUnique({ where: { email: normalizedEmail } })
    if (emailExists) {
      throw new ApiError('Email already registered', 409)
    }
    const phoneExists = await db.user.findUnique({ where: { phone } })
    if (phoneExists) {
      throw new ApiError('Phone already registered', 409)
    }

    const user = await db.user.create({
      data: {
        id: uuidv4(),
        name,
        nameBn: nameBn?.trim() ? nameBn.trim() : null,
        email: normalizedEmail,
        phone,
        password: bcrypt.hashSync(password, 10),
        role: 'CUSTOMER',
        isActive: true,
        emailVerified: false,
      },
    })

    res.status(201).json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
      message: 'Account created successfully',
    })
  })
)

// ─── POST /api/auth/logout ────────────────────────────────────────────────────

router.post(
  '/logout',
  asyncHandler(async (_req, res) => {
    clearSessionCookie(res)
    res.json({ message: 'Logout successful' })
  })
)

// ─── GET /api/auth/me ─────────────────────────────────────────────────────────

router.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = getAuthUser(req)
    res.json({ data: user })
  })
)

// ─── PUT /api/auth/profile ────────────────────────────────────────────────────

const updateProfileSchema = z
  .object({
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
  })
  .passthrough()

router.put(
  '/profile',
  requireAuth,
  asyncHandler(async (req, res) => {
    const body = validateBody(req, updateProfileSchema)
    const authUser = getAuthUser(req)

    const currentUser = await db.user.findUnique({ where: { id: authUser.id } })
    if (!currentUser) {
      throw new ApiError('User not found', 404)
    }

    // Email change requires password verification
    if (body.email && body.email.toLowerCase() !== currentUser.email) {
      if (!body.currentPassword) {
        throw new ApiError('Current password is required to change email', 400)
      }
      const ok = bcrypt.compareSync(body.currentPassword, currentUser.password)
      if (!ok) {
        throw new ApiError('Current password is incorrect', 400)
      }

      const exists = await db.user.findUnique({
        where: { email: body.email.toLowerCase() },
      })
      if (exists) {
        throw new ApiError('Email already in use', 409)
      }
    }

    // Phone uniqueness check
    if (body.phone && body.phone !== currentUser.phone) {
      const exists = await db.user.findUnique({ where: { phone: body.phone } })
      if (exists) {
        throw new ApiError('Phone already in use', 409)
      }
    }

    const data: Record<string, unknown> = {}
    if (body.name !== undefined) data.name = body.name
    if (body.phone !== undefined) data.phone = body.phone || null
    if (body.avatar !== undefined) data.avatar = body.avatar
    if (body.email !== undefined) data.email = body.email.toLowerCase()
    if (body.nameBn !== undefined) data.nameBn = body.nameBn || null
    if (body.address !== undefined) data.address = body.address || null
    if (body.area !== undefined) data.area = body.area || null
    if (body.city !== undefined) data.city = body.city || null
    if (body.postalCode !== undefined) data.postalCode = body.postalCode || null

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

    // Refresh the JWT
    const token = await createSessionToken(updated)
    setSessionCookie(res, token)

    res.json({ data: updated, message: 'Profile updated successfully' })
  })
)

// ─── PUT /api/auth/change-password ────────────────────────────────────────────

router.put(
  '/change-password',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = validateBody(req, schemas.changePassword)
    const authUser = getAuthUser(req)

    const dbUser = await db.user.findUnique({ where: { id: authUser.id } })
    if (!dbUser) {
      throw new ApiError('User not found', 404)
    }

    const ok = bcrypt.compareSync(currentPassword, dbUser.password)
    if (!ok) {
      throw new ApiError('Current password is incorrect', 400)
    }

    await db.user.update({
      where: { id: dbUser.id },
      data: { password: bcrypt.hashSync(newPassword, 10) },
    })

    res.json({ message: 'Password changed successfully' })
  })
)

export default router
