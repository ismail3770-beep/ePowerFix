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

// POST /api/auth/register
authRouter.post('/register', authLimiter, validate(registerSchema), async (req, res) => {
  try {
    const { name, email, password, phone } = req.body

    const existing = await db.user.findFirst({ where: { OR: [{ email: email.toLowerCase() }, { phone }] } })
    if (existing) {
      const field = existing.email === email.toLowerCase() ? 'Email' : 'Phone'
      return res.status(409).json(error(`${field} already registered`))
    }

    const hashedPassword = await bcrypt.hash(password, 10)
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
authRouter.put('/profile', requireAuth, async (req, res) => {
  try {
    const { name, phone, avatar } = req.body

    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (phone !== undefined) {
      if (phone && !/^01[3-9]\d{8}$/.test(phone)) {
        return res.status(400).json(error('Invalid BD phone number'))
      }
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

    const user = await db.user.update({
      where: { id: req.user!.id },
      data: updateData,
    })

    const { password: _, ...safeUser } = user
    res.json(success(safeUser, 'Profile updated'))
  } catch (err: any) {
    console.error('Profile update error:', err)
    res.status(500).json(error('Something went wrong'))
  }
})

// PUT /api/auth/change-password
authRouter.put('/change-password', requireAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body

    if (!currentPassword || !newPassword) {
      return res.status(400).json(error('Both current and new password required'))
    }

    if (newPassword.length < 8) {
      return res.status(400).json(error('New password must be at least 8 characters'))
    }

    const user = await db.user.findUnique({ where: { id: req.user!.id } })
    if (!user) return res.status(401).json(error('User not found'))

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
