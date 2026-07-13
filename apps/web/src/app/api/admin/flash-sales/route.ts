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
 * Maps a FlashSale DB row to the response shape expected by the admin frontend.
 * The frontend uses `discountPercent` while the schema stores `discount`.
 * We expose BOTH names so the API stays compatible with the task spec and UI.
 */
function mapFlashSale(f: any) {
  if (!f) {return f}
  return {
    ...f,
    discountPercent: f.discount,
    startDate: f.startDate,
    endDate: f.endDate,
    startsAt: f.startDate,
    expiresAt: f.endDate,
  }
}

// ─── Zod Schema ───────────────────────────────────────────────────────────────

const createFlashSaleSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  startsAt: z.string().optional(),
  expiresAt: z.string().optional(),
  discount: z.number().nullable().optional(),
  discountPercent: z.number().nullable().optional(),
  isActive: z.boolean().optional(),
}).passthrough()

// ─── GET /api/admin/flash-sales ───────────────────────────────────────────────

export const GET = adminGetRoute(async (request) => {
  const { page, limit, skip, search } = getPagination(request.url)
  const url = new URL(request.url)
  const status = url.searchParams.get('status') || undefined

  const where: any = {}
  if (search) {
    where.OR = [
      { title: { contains: search } },
      { description: { contains: search } },
    ]
  }
  if (status === 'active') {where.isActive = true}
  if (status === 'inactive') {where.isActive = false}

  const [flashSales, total] = await Promise.all([
    db.flashSale.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { products: { select: { id: true, name: true, slug: true } } },
    }),
    db.flashSale.count({ where }),
  ])

  return listResponse(flashSales.map(mapFlashSale), total, page, limit)
})

// ─── POST /api/admin/flash-sales ──────────────────────────────────────────────

export const POST = adminRoute(createFlashSaleSchema, async (request, body, user) => {
  const title = (body.title || '').toString().trim()
  if (!title) {return errorResponse('title is required', 400)}

  const startDateRaw = body.startDate || body.startsAt
  const endDateRaw = body.endDate || body.expiresAt
  if (!startDateRaw) {return errorResponse('startDate is required', 400)}
  if (!endDateRaw) {return errorResponse('endDate is required', 400)}

  const startDate = new Date(startDateRaw)
  const endDate = new Date(endDateRaw)
  if (Number.isNaN(startDate.getTime())) {
    return errorResponse('startDate is invalid', 400)
  }
  if (Number.isNaN(endDate.getTime())) {
    return errorResponse('endDate is invalid', 400)
  }
  if (endDate < startDate) {
    return errorResponse('endDate must be after startDate', 400)
  }

  const discount =
    body.discount !== undefined && body.discount !== null
      ? Number(body.discount)
      : body.discountPercent !== undefined && body.discountPercent !== null
      ? Number(body.discountPercent)
      : null
  if (discount === null || Number.isNaN(discount)) {
    return errorResponse('discount (or discountPercent) is required', 400)
  }

  const flashSale = await db.flashSale.create({
    data: {
      title,
      description: body.description || null,
      startDate,
      endDate,
      discount,
      isActive: body.isActive !== undefined ? !!body.isActive : true,
    },
  })

  return jsonResponse({ data: mapFlashSale(flashSale) }, 201)
})
