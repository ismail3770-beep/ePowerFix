import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import {
  requireAdmin,
  jsonResponse,
  errorResponse,
  parseBody,
  getPagination,
  listResponse,
} from '@/lib/admin-api'

/**
 * Maps a Tax DB row to the response shape expected by the admin frontend.
 * The frontend uses `value` while the schema stores `rate`. We expose BOTH
 * names so the API stays compatible with the task spec and the UI.
 */
function mapTax(t: any) {
  if (!t) return t
  return {
    ...t,
    value: t.rate,
  }
}

/**
 * GET /api/admin/taxes
 * List taxes with pagination.
 */
export async function GET(request: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response!

  try {
    const { page, limit, skip, search } = getPagination(request.url)

    const where: any = {}
    if (search) {
      where.OR = [{ name: { contains: search } }]
    }

    const [taxes, total] = await Promise.all([
      db.tax.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      db.tax.count({ where }),
    ])

    return listResponse(taxes.map(mapTax), total, page, limit)
  } catch (err: any) {
    console.error('admin/taxes GET error:', err)
    return errorResponse(err?.message || 'Internal server error', 500)
  }
}

/**
 * POST /api/admin/taxes
 * Create a tax. Accepts both `value` (task spec) and `rate` (schema).
 */
export async function POST(request: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response!

  try {
    const body = await parseBody<any>(request)
    if (!body) return errorResponse('Invalid request body', 400)

    const name = (body.name || '').toString().trim()
    if (!name) return errorResponse('name is required', 400)

    const type = (body.type || 'PERCENTAGE').toString().toUpperCase()
    if (!['PERCENTAGE', 'FLAT'].includes(type)) {
      return errorResponse('type must be PERCENTAGE or FLAT', 400)
    }

    const rate =
      body.rate !== undefined && body.rate !== null
        ? Number(body.rate)
        : body.value !== undefined && body.value !== null
        ? Number(body.value)
        : null
    if (rate === null || Number.isNaN(rate)) {
      return errorResponse('value (or rate) is required', 400)
    }

    const tax = await db.tax.create({
      data: {
        name,
        type,
        rate,
        isActive: body.isActive !== undefined ? !!body.isActive : true,
      },
    })

    return jsonResponse({ data: mapTax(tax) }, 201)
  } catch (err: any) {
    console.error('admin/taxes POST error:', err)
    return errorResponse(err?.message || 'Internal server error', 500)
  }
}
