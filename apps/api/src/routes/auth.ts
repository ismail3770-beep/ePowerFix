import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { db } from '@epowerfix/db'
import { signToken, requireAuth, COOKIE_NAME } from '../middleware/auth'
import { validate } from '../middleware/validate'
import { authLimiter } from '../middleware/rate-limit'
import { success, error } from '../utils/response'

export const authRouter = Router()

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  phone: z.string().regex(/^(\+880|0)1[3-9]\d{8}$/, 'Invalid BD phone number'),
})

const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
})

const profileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  nameBn: z.string().max(200).optional(),
  phone: z.string().regex(/^(\+880|0)1[3-9]\d{8}$/, 'Invalid BD phone number').nullable().optional(),
  email: z.string().email('Invalid email').optional(),
  avatar: z.string().nullable().optional(),
  currentPassword: z.string().optional(),
})

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
})

// POST /api/auth/register
authRouter.post('/register', authLimiter, validate(registerSchema), async (req, res) => {
  try {
    const { name, email, password, phone } = req.body

    const existing = await db.user.findFirst({ where: { OR: [{ email: email.toLowerCase() }, { phone }] } })
    if (existing) {
      const field = existing.email === email.toLowerCase() ? 'Email' : 'Phone'
      return res.status(409).json(error(`${field} already registered`))
    }

    const hashedPassword = await bcrypt.hash(password, 12)
    const user = await db.user.create({
      data: { name, email: email.toLowerCase(), password: hashedPassword, phone, role: 'CUSTOMER' },
      select: { id: true, name: true, email: true, phone: true, role: true, avatar: true },
    })

    const token = await signToken({ userId: user.id, email: user.email, role: user.role })
    res.cookie(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    })

    res.status(201).json(success({ user, token }, 'Registration successful'))
  } catch (err: any) {
    res.status(500).json(error(err.message || 'Registration failed'))
  }
})

// POST /api/auth/login
authRouter.post('/login', authLimiter, validate(loginSchema), async (req, res) => {
  try {
    const { email, password } = req.body

    const user = await db.user.findUnique({ where: { email: email.toLowerCase() } })
    if (!user || !user.isActive) return res.status(401).json(error('Invalid credentials'))
    if (!user.password) return res.status(401).json(error('Account uses social login'))

    const valid = await bcrypt.compare(password, user.password)
    if (!valid) return res.status(401).json(error('Invalid credentials'))

    const token = await signToken({ userId: user.id, email: user.email, role: user.role })
    res.cookie(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    })

    res.json(success({
      user: { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role, avatar: user.avatar },
      token,
    }, 'Login successful'))
  } catch (err: any) {
    res.status(500).json(error(err.message || 'Login failed'))
  }
})

// POST /api/auth/logout
authRouter.post('/logout', (_req, res) => {
  res.clearCookie(COOKIE_NAME, { path: '/' })
  res.json(success(null, 'Logged out'))
})

// GET /api/auth/me
authRouter.get('/me', requireAuth, async (req, res) => {
  try {
    const user = await db.user.findUnique({
      where: { id: req.user!.id },
      select: { id: true, name: true, email: true, phone: true, role: true, avatar: true, isActive: true },
    })
    if (!user) return res.status(404).json(error('User not found'))

    const orderCount = await db.order.count({ where: { userId: user.id } })
    res.json(success({ ...user, orderCount }))
  } catch (err: any) {
    res.status(500).json(error(err.message))
  }
})

// PUT /api/auth/profile
authRouter.put('/profile', requireAuth, validate(profileSchema), async (req, res) => {
  try {
    const { name, nameBn, phone, avatar, email, currentPassword } = req.body

    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (nameBn !== undefined) updateData.nameBn = nameBn
    if (phone !== undefined) {
      if (phone) {
        const existing = await db.user.findFirst({
          where: { phone, id: { not: req.user!.id }, isDeleted: false },
        })
        if (existing) {
          return res.status(409).json(error('Phone number already in use'))
        }
      }
      updateData.phone = phone || null
    }
    if (avatar !== undefined) updateData.avatar = avatar || null

    // Email change requires current password verification
    if (email !== undefined && email !== req.user!.email) {
      if (!currentPassword) {
        return res.status(400).json(error('Current password is required to change email'))
      }
      const currentUser = await db.user.findUnique({ where: { id: req.user!.id } })
      if (!currentUser?.password) {
        return res.status(400).json(error('Account uses social login, cannot change email'))
      }
      const isValidPassword = await bcrypt.compare(currentPassword, currentUser.password)
      if (!isValidPassword) {
        return res.status(400).json(error('Current password is incorrect'))
      }
      const normalizedEmail = email.toLowerCase()
      const emailExists = await db.user.findFirst({
        where: { email: normalizedEmail, id: { not: req.user!.id }, isDeleted: false },
      })
      if (emailExists) {
        return res.status(409).json(error('Email already in use'))
      }
      updateData.email = normalizedEmail
    }

    const user = await db.user.update({
      where: { id: req.user!.id },
      data: updateData,
    })

    // Re-issue token if email changed (email is in JWT payload)
    if (updateData.email) {
      const token = await signToken({ userId: user.id, email: user.email, role: user.role })
      res.cookie(COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: '/',
      })
    }

    const { password: _, ...safeUser } = user
    res.json(success(safeUser, 'Profile updated'))
  } catch (err: any) {
    console.error('Profile update error:', err)
    res.status(500).json(error('Something went wrong'))
  }
})

// PUT /api/auth/change-password
authRouter.put('/change-password', requireAuth, validate(changePasswordSchema), async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body

    const user = await db.user.findUnique({ where: { id: req.user!.id } })
    if (!user) return res.status(401).json(error('User not found'))

    if (!user.password) {
      return res.status(400).json(error('Cannot change password for social login account'))
    }

    const isValid = await bcrypt.compare(currentPassword, user.password)
    if (!isValid) return res.status(400).json(error('Current password is incorrect'))

    const hashedPassword = await bcrypt.hash(newPassword, 12)
    await db.user.update({
      where: { id: req.user!.id },
      data: { password: hashedPassword },
    })

    res.json(success(null, 'Password changed successfully'))
  } catch (err: any) {
    console.error('Change password error:', err)
    res.status(500).json(error('Something went wrong'))
  }
})
