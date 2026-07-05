import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import {
  requireAdmin,
  jsonResponse,
  errorResponse,
} from '@/lib/admin-api'
import { withErrorHandling, validateBody, z } from '@/lib/api-handler'

function mapQuote(q: any) {
  if (!q) return q
  return {
    ...q,
    message: q.description,
    email: q.email || '',
  }
}

// ─── Zod Schema ───────────────────────────────────────────────────────────────

const updateQuoteSchema = z.object({
  status: z.string().optional(),
  name: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  serviceType: z.string().optional(),
  description: z.string().optional(),
  address: z.string().optional(),
  budget: z.string().optional(),
  quotedPrice: z.number().optional(),
  adminNotes: z.string().optional(),
}).passthrough()

// ─── GET /api/admin/quote-requests/[id] ───────────────────────────────────────

export const GET = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response!

  const { id } = await params
  const quote = await db.quoteRequest.findUnique({ where: { id } })
  if (!quote) return errorResponse('Quote request not found', 404)
  return jsonResponse({ data: mapQuote(quote) })
})

// ─── PUT /api/admin/quote-requests/[id] ───────────────────────────────────────

export const PUT = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response!

  const { id } = await params
  const body = await validateBody(request, updateQuoteSchema)

  const existing = await db.quoteRequest.findUnique({ where: { id } })
  if (!existing) return errorResponse('Quote request not found', 404)

  const data: any = {}
  if (body.status !== undefined) data.status = body.status
  if (body.name !== undefined) data.name = body.name
  if (body.phone !== undefined) data.phone = body.phone
  if (body.email !== undefined) data.email = body.email || null
  if (body.serviceType !== undefined) data.serviceType = body.serviceType
  if (body.description !== undefined) data.description = body.description
  if (body.address !== undefined) data.address = body.address || null
  if (body.budget !== undefined) data.budget = body.budget || null
  // quotedPrice / adminNotes are not schema fields; ignored.

  const quote = await db.quoteRequest.update({ where: { id }, data })
  return jsonResponse({ data: mapQuote(quote) })
})

// ─── DELETE /api/admin/quote-requests/[id] ────────────────────────────────────

export const DELETE = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response!

  const { id } = await params
  const existing = await db.quoteRequest.findUnique({ where: { id } })
  if (!existing) return errorResponse('Quote request not found', 404)

  await db.quoteRequest.delete({ where: { id } })

  return jsonResponse({ message: 'Quote request deleted' })
})
