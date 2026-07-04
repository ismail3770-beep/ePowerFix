import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import {
  requireAdmin,
  jsonResponse,
  errorResponse,
  parseBody,
} from '@/lib/admin-api'

function mapQuote(q: any) {
  if (!q) return q
  return {
    ...q,
    message: q.description,
    email: q.email || '',
  }
}

/**
 * GET /api/admin/quote-requests/[id]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response!

  try {
    const { id } = await params
    const quote = await db.quoteRequest.findUnique({ where: { id } })
    if (!quote) return errorResponse('Quote request not found', 404)
    return jsonResponse({ data: mapQuote(quote) })
  } catch (err: any) {
    console.error('admin/quote-requests/[id] GET error:', err)
    return errorResponse(err?.message || 'Internal server error', 500)
  }
}

/**
 * PUT /api/admin/quote-requests/[id]
 * Updates `status` (and editable fields). The schema has no `quotedPrice` or
 * `adminNotes` columns, so those fields are silently ignored if sent.
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response!

  try {
    const { id } = await params
    const body = await parseBody<any>(request)
    if (!body) return errorResponse('Invalid request body', 400)

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
  } catch (err: any) {
    console.error('admin/quote-requests/[id] PUT error:', err)
    return errorResponse(err?.message || 'Internal server error', 500)
  }
}

/**
 * DELETE /api/admin/quote-requests/[id] — hard delete.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response!

  try {
    const { id } = await params
    const existing = await db.quoteRequest.findUnique({ where: { id } })
    if (!existing) return errorResponse('Quote request not found', 404)

    await db.quoteRequest.delete({ where: { id } })

    return jsonResponse({ message: 'Quote request deleted' })
  } catch (err: any) {
    console.error('admin/quote-requests/[id] DELETE error:', err)
    return errorResponse(err?.message || 'Internal server error', 500)
  }
}
