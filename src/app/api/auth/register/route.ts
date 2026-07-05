import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'
import { db } from '@/lib/db'
import { jsonResponse, errorResponse } from '@/lib/auth'
import { checkRateLimit } from '@/lib/rate-limit'
import { headers } from 'next/headers'
import { publicRoute, schemas } from '@/lib/api-handler'

/**
 * POST /api/auth/register
 * Rate-limited, Zod-validated registration.
 */
export const POST = publicRoute(schemas.register, async (request, { name, email, phone, password }) => {
  // Rate limit: 5 registrations per hour per IP.
  const ip = (await headers()).get('x-forwarded-for') || 'unknown'
  const rl = checkRateLimit(`register:${ip}`, 5, 60 * 60 * 1000)
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Too many registration attempts. Please try again later.' },
      { status: 429 },
    )
  }

  const normalizedEmail = email.toLowerCase().trim()

  // Uniqueness checks
  const emailExists = await db.user.findUnique({ where: { email: normalizedEmail } })
  if (emailExists) return errorResponse('Email already registered', 409)
  const phoneExists = await db.user.findUnique({ where: { phone } })
  if (phoneExists) return errorResponse('Phone already registered', 409)

  const user = await db.user.create({
    data: {
      id: uuidv4(),
      name,
      email: normalizedEmail,
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
})
