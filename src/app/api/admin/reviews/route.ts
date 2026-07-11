import type { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import {
  requireAdmin,
  jsonResponse,
  errorResponse,
  getPagination,
  listResponse,
} from '@/lib/admin-api'

const REVIEW_INCLUDE = {
  user: { select: { id: true, name: true, email: true } },
  product: { select: { id: true, name: true } },
  service: { select: { id: true, name: true } },
}

/**
 * GET /api/admin/reviews
 * List reviews with pagination, search, status filter, productId filter.
 */
export async function GET(request: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) {return auth.response!}

  try {
    const { page, limit, skip, search } = getPagination(request.url)
    const url = new URL(request.url)
    const rawStatus = url.searchParams.get('status')
    const status = rawStatus && rawStatus !== 'all' ? rawStatus.toUpperCase() : undefined
    const productId = url.searchParams.get('productId') || undefined
    const serviceId = url.searchParams.get('serviceId') || undefined

    const where: any = {}
    if (status) {where.status = status}
    if (productId) {where.productId = productId}
    if (serviceId) {where.serviceId = serviceId}
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { comment: { contains: search } },
        { user: { name: { contains: search } } },
        { user: { email: { contains: search } } },
        { product: { name: { contains: search } } },
        { service: { name: { contains: search } } },
      ]
    }

    const [reviews, total] = await Promise.all([
      db.review.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: REVIEW_INCLUDE,
      }),
      db.review.count({ where }),
    ])

    return listResponse(reviews, total, page, limit)
  } catch (err: any) {
    console.error('admin/reviews GET error:', err)
    return errorResponse(err?.message || 'Internal server error', 500)
  }
}
