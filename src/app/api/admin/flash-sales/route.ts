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
 * Maps a FlashSale DB row to the response shape expected by the admin frontend.
 * The frontend uses `discountPercent` while the schema stores `discount`.
 * We expose BOTH names so the API stays compatible with the task spec and UI.
 */
function mapFlashSale(f: any) {
  if (!f) return f
  return {
    ...f,
    discountPercent: f.discount,
    startDate: f.startDate,
    endDate: f.endDate,
    startsAt: f.startDate,
    expiresAt: f.endDate,
  }
}

/**
 * GET /api/admin/flash-sales
 * List flash sales with pagination, search, and active/inactive filter.
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
        { title: { contains: search } },
        { description: { contains: search } },
      ]
    }
    if (status === 'active') where.isActive = true
    if (status === 'inactive') where.isActive = false

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
  } catch (err: any) {
    console.error('admin/flash-sales GET error:', err)
    return errorResponse(err?.message || 'Internal server error', 500)
  }
}

/**
 * POST /api/admin/flash-sales
 * Create a flash sale. Accepts both `discountPercent` (task spec) and `discount`
 * (schema) and both `startDate`/`endDate` and `startsAt`/`expiresAt`.
 */
export async function POST(request: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response!

  try {
    const body = await parseBody<any>(request)
    if (!body) return errorResponse('Invalid request body', 400)

    const title = (body.title || '').toString().trim()
    if (!title) return errorResponse('title is required', 400)

    const startDateRaw = body.startDate || body.startsAt
    const endDateRaw = body.endDate || body.expiresAt
    if (!startDateRaw) return errorResponse('startDate is required', 400)
    if (!endDateRaw) return errorResponse('endDate is required', 400)

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
  } catch (err: any) {
    console.error('admin/flash-sales POST error:', err)
    return errorResponse(err?.message || 'Internal server error', 500)
  }
}
