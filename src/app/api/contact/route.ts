import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { jsonResponse, errorResponse, parseBody, requireAuth } from '@/lib/auth'

/**
 * POST /api/contact
 * Submit a contact message.
 * Body: { name, email, phone?, subject, message }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await parseBody<any>(request)
    if (!body) return errorResponse('Invalid request body', 400)

    const { name, email, phone, subject, message } = body
    if (!name) return errorResponse('name is required', 400)
    if (!email) return errorResponse('email is required', 400)
    if (!subject) return errorResponse('subject is required', 400)
    if (!message) return errorResponse('message is required', 400)

    const auth = await requireAuth()

    const contact = await db.contact.create({
      data: {
        userId: auth.ok ? auth.user!.id : null,
        name,
        email,
        phone: phone || null,
        subject,
        message,
        status: 'NEW',
      },
    })

    return jsonResponse({ data: contact, message: 'Message sent successfully' }, 201)
  } catch (err: any) {
    console.error('public/contact POST error:', err)
    return errorResponse(err?.message || 'Internal server error', 500)
  }
}
