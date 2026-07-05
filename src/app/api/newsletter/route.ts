import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { jsonResponse, errorResponse, parseBody } from '@/lib/auth'

/**
 * POST /api/newsletter
 * Subscribe an email to the newsletter.
 * Body: { email }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await parseBody<any>(request)
    if (!body) return errorResponse('Invalid request body', 400)

    const email = (body.email || '').toString().trim().toLowerCase()
    if (!email) return errorResponse('email is required', 400)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) return errorResponse('Invalid email', 400)

    const existing = await db.newsletter.findUnique({ where: { email } })
    if (existing) {
      if (existing.status === 'ACTIVE') {
        return errorResponse('Already subscribed', 409)
      }
      // Reactivate a previously-unsubscribed entry.
      await db.newsletter.update({
        where: { email },
        data: { status: 'ACTIVE' },
      })
      return jsonResponse({ data: { email }, message: 'Re-subscribed successfully' })
    }

    await db.newsletter.create({ data: { email, status: 'ACTIVE' } })
    return jsonResponse({ data: { email }, message: 'Subscribed successfully' }, 201)
  } catch (err: any) {
    console.error('public/newsletter POST error:', err)
    return errorResponse(err?.message || 'Internal server error', 500)
  }
}
