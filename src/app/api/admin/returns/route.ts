import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin, jsonResponse, errorResponse, getPagination, listResponse } from '@/lib/admin-api'

export async function GET(request: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response!

  try {
    const url = new URL(request.url)
    const { page, limit, skip, search } = getPagination(url)
    const status = url.searchParams.get('status')

    const where: any = {}
    if (status) where.status = status
    if (search) {
      where.OR = [
        { reason: { contains: search } },
        { order: { orderNumber: { contains: search } } },
      ]
    }

    const [returns, total] = await Promise.all([
      db.returnRequest.findMany({
        where,
        include: {
          order: { select: { orderNumber: true } },
          user: { select: { name: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.returnRequest.count({ where }),
    ])

    return listResponse(returns, total, page, limit)
  } catch (err: any) {
    console.error('GET /api/admin/returns error:', err)
    return errorResponse(err?.message || 'Internal server error', 500)
  }
}
