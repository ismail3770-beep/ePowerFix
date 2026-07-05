import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { jsonResponse, errorResponse, requireAuth } from '@/lib/auth'
import { publicRoute, schemas } from '@/lib/api-handler'

/**
 * POST /api/quote-requests
 * Submit a quote request with Zod validation.
 */
export const POST = publicRoute(schemas.quoteRequest, async (request, { name, phone, email, serviceType, description, address, budget }) => {
  const auth = await requireAuth()

  const quote = await db.quoteRequest.create({
    data: {
      userId: auth.ok ? auth.user!.id : null,
      name,
      phone,
      email: email || null,
      serviceType,
      description,
      address: address || null,
      budget: budget || null,
      status: 'PENDING',
    },
  })

  return jsonResponse({ data: quote, message: 'Quote request submitted' }, 201)
})
