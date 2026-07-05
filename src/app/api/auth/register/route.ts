import { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'
import { db } from '@/lib/db'
import { jsonResponse, errorResponse, parseBody } from '@/lib/auth'
import { checkRateLimit } from '@/lib/rate-limit'
import { headers } from 'next/headers'

/**
 * POST /api/auth/register
 * Register a new customer account.
 * Body: { name, email, phone, password }
 */
export async function POST(request: NextRequest) {
  // Rate limit: 5 registrations per hour per IP.
  const ip = (await headers()).get('x-forwarded-for') || 'unknown'
  const rl = checkRateLimit(`register:${ip}`, 5, 60 * 60 * 1000)
  if (!rl.allowed) {
    return errorResponse('Too many registration attempts. Please try again later.', 429)
  }

  try {
    const body = await parseBody<{
      name?: string
      email?: string
      phone?: string
      password?: string
    }>(request)
    if (!body) return errorResponse('Invalid request body', 400)

    const name = (body.name || '').trim()
    const email = (body.email || '').trim().toLowerCase()
    const phone = (body.phone || '').trim()
    const password = body.password || ''

    if (!name || name.length < 2) return errorResponse('Name is required', 400)
    if (!email) return errorResponse('Email is required', 400)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) return errorResponse('Invalid email', 400)
    if (!phone) return errorResponse('Phone is required', 400)
    if (password.length < 6) return errorResponse('Password must be at least 6 characters', 400)

    // Uniqueness checks
    const emailExists = await db.user.findUnique({ where: { email } })
    if (emailExists) return errorResponse('Email already registered', 409)
    const phoneExists = await db.user.findUnique({ where: { phone } })
    if (phoneExists) return errorResponse('Phone already registered', 409)

    const user = await db.user.create({
      data: {
        id: uuidv4(),
        name,
        email,
        phone,
        password: bcrypt.hashSync(password, 10),
        role: 'CUSTOMER',
        isActive: true,
        emailVerified: false,
      },
    })

    return jsonResponse({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
      message: 'Account created successfully',
    }, 201)
  } catch (err: any) {
    console.error('auth/register POST error:', err)
    return errorResponse(err?.message || 'Internal server error', 500)
  }
}
