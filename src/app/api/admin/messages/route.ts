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
 * Maps a Contact DB row to the response shape expected by the admin frontend.
 * The frontend reads `isRead` (boolean) but the schema only stores `status`
 * (String, default 'NEW'). We derive `isRead` = (status !== 'NEW').
 */
function mapMessage(m: any) {
  if (!m) return m
  return {
    ...m,
    isRead: m.status !== 'NEW',
  }
}

/**
 * GET /api/admin/messages
 * List contact messages with pagination, search, status filter.
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
        { subject: { contains: search } },
        { message: { contains: search } },
        { phone: { contains: search } },
      ]
    }

    const [messages, total] = await Promise.all([
      db.contact.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      db.contact.count({ where }),
    ])

    return listResponse(messages.map(mapMessage), total, page, limit)
  } catch (err: any) {
    console.error('admin/messages GET error:', err)
    return errorResponse(err?.message || 'Internal server error', 500)
  }
}
