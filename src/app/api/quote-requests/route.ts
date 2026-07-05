import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { jsonResponse, errorResponse, parseBody, requireAuth } from '@/lib/auth'

/**
 * POST /api/quote-requests
 * Submit a quote request.
 * Body: { name, phone, email?, serviceType, description, address?, budget? }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await parseBody<any>(request)
    if (!body) return errorResponse('Invalid request body', 400)

    const { name, phone, email, serviceType, description, address, budget } = body
    if (!name) return errorResponse('name is required', 400)
    if (!phone) return errorResponse('phone is required', 400)
    if (!serviceType) return errorResponse('serviceType is required', 400)
    if (!description) return errorResponse('description is required', 400)

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
  } catch (err: any) {
    console.error('public/quote-requests POST error:', err)
    return errorResponse(err?.message || 'Internal server error', 500)
  }
}
