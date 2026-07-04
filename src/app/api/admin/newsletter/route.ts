import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import {
  requireAdmin,
  errorResponse,
  getPagination,
  listResponse,
} from '@/lib/admin-api'

/**
 * GET /api/admin/newsletter
 * List newsletter subscribers with pagination, search, and status filter.
 */
export async function GET(request: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response!

  try {
    const { page, limit, skip, search } = getPagination(request.url)
    const url = new URL(request.url)
    const status = url.searchParams.get('status') || undefined

    const where: any = {}
    if (search) {
      where.OR = [
        { email: { contains: search } },
        { user: { name: { contains: search } } },
        { user: { email: { contains: search } } },
      ]
    }
    if (status) where.status = status.toUpperCase()

    const [subscribers, total] = await Promise.all([
      db.newsletter.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      }),
      db.newsletter.count({ where }),
    ])

    return listResponse(subscribers, total, page, limit)
  } catch (err: any) {
    console.error('admin/newsletter GET error:', err)
    return errorResponse(err?.message || 'Internal server error', 500)
  }
}
