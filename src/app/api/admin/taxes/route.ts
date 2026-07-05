import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import {
  requireAdmin,
  jsonResponse,
  errorResponse,
  getPagination,
  listResponse,
} from '@/lib/admin-api'
import { adminGetRoute, adminRoute, z } from '@/lib/api-handler'

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

// ─── Zod Schema ───────────────────────────────────────────────────────────────

const createTaxSchema = z.object({
  name: z.string().min(1),
  type: z.string().optional(),
  rate: z.number().nullable().optional(),
  value: z.number().nullable().optional(),
  isActive: z.boolean().optional(),
}).passthrough()

// ─── GET /api/admin/taxes ─────────────────────────────────────────────────────

export const GET = adminGetRoute(async (request) => {
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
})

// ─── POST /api/admin/taxes ────────────────────────────────────────────────────

export const POST = adminRoute(createTaxSchema, async (request, body, user) => {
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
})
