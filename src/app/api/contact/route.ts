import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { jsonResponse, errorResponse, requireAuth, parseBody } from '@/lib/auth'
import { publicRoute, schemas } from '@/lib/api-handler'

/**
 * POST /api/contact
 * Submit a contact message with Zod validation.
 */
export const POST = publicRoute(schemas.contact, async (request, { name, email, phone, subject, message }) => {
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
})
