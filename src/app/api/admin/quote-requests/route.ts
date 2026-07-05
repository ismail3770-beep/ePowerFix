import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import {
  requireAdmin,
  jsonResponse,
  errorResponse,
  getPagination,
  listResponse,
} from '@/lib/admin-api'

/**
 * Maps a QuoteRequest DB row to the response shape expected by the admin
 * frontend. The frontend reads `message` (string) and `email` (string), but
 * the schema stores `description` (the main text) and `email?` (nullable).
 * We expose `message` as an alias of `description` and coerce `email` to ''.
 */
function mapQuote(q: any) {
  if (!q) return q
  return {
    ...q,
    message: q.description,
    email: q.email || '',
  }
}

/**
 * GET /api/admin/quote-requests
 * List quote requests with pagination, search, status filter.
 */
export async function GET(request: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response!

  try {
    const { page, limit, skip, search } = getPagination(request.url)
    const url = new URL(request.url)
    const rawStatus = url.searchParams.get('status')
    const status = rawStatus && rawStatus !== 'all' ? rawStatus.toUpperCase() : undefined

    const where: any = {}
    if (status) where.status = status
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } },
        { serviceType: { contains: search } },
        { description: { contains: search } },
        { address: { contains: search } },
        { budget: { contains: search } },
      ]
    }

    const [quotes, total] = await Promise.all([
      db.quoteRequest.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      db.quoteRequest.count({ where }),
    ])

    return listResponse(quotes.map(mapQuote), total, page, limit)
  } catch (err: any) {
    console.error('admin/quote-requests GET error:', err)
    return errorResponse(err?.message || 'Internal server error', 500)
  }
}
