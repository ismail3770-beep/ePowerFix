import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { jsonResponse, errorResponse } from '@/lib/auth'
import { publicRoute, schemas } from '@/lib/api-handler'

/**
 * POST /api/newsletter
 * Subscribe an email to the newsletter with Zod validation.
 */
export const POST = publicRoute(schemas.newsletter, async (request, { email }) => {
  const normalizedEmail = email.trim().toLowerCase()

  const existing = await db.newsletter.findUnique({ where: { email: normalizedEmail } })
  if (existing) {
    if (existing.status === 'ACTIVE') {
      return errorResponse('Already subscribed', 409)
    }
    // Reactivate a previously-unsubscribed entry.
    await db.newsletter.update({
      where: { email: normalizedEmail },
      data: { status: 'ACTIVE' },
    })
    return jsonResponse({ data: { email: normalizedEmail }, message: 'Re-subscribed successfully' })
  }

  await db.newsletter.create({ data: { email: normalizedEmail, status: 'ACTIVE' } })
  return jsonResponse({ data: { email: normalizedEmail }, message: 'Subscribed successfully' }, 201)
})
