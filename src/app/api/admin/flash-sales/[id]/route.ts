import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import {
  requireAdmin,
  jsonResponse,
  errorResponse,
} from '@/lib/admin-api'
import { withErrorHandling, validateBody, z } from '@/lib/api-handler'

function mapFlashSale(f: any) {
  if (!f) return f
  return {
    ...f,
    discountPercent: f.discount,
    startsAt: f.startDate,
    expiresAt: f.endDate,
  }
}

// ─── Zod Schema ───────────────────────────────────────────────────────────────

const updateFlashSaleSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  startDate: z.string().optional(),
  startsAt: z.string().optional(),
  endDate: z.string().optional(),
  expiresAt: z.string().optional(),
  discount: z.number().nullable().optional(),
  discountPercent: z.number().nullable().optional(),
  isActive: z.boolean().optional(),
}).passthrough()

// ─── GET /api/admin/flash-sales/[id] ──────────────────────────────────────────

export const GET = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response!

  const { id } = await params
  const flashSale = await db.flashSale.findUnique({
    where: { id },
    include: { products: { select: { id: true, name: true, slug: true } } },
  })
  if (!flashSale) return errorResponse('Flash sale not found', 404)
  return jsonResponse({ data: mapFlashSale(flashSale) })
})

// ─── PUT /api/admin/flash-sales/[id] ──────────────────────────────────────────

export const PUT = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response!

  const { id } = await params
  const body = await validateBody(request, updateFlashSaleSchema)

  const existing = await db.flashSale.findUnique({ where: { id } })
  if (!existing) return errorResponse('Flash sale not found', 404)

  const data: any = {}
  if (body.title !== undefined) data.title = body.title
  if (body.description !== undefined) data.description = body.description || null
  if (body.startDate !== undefined || body.startsAt !== undefined) {
    const s = body.startDate !== undefined ? body.startDate : body.startsAt
    data.startDate = s ? new Date(s) : existing.startDate
  }
  if (body.endDate !== undefined || body.expiresAt !== undefined) {
    const e = body.endDate !== undefined ? body.endDate : body.expiresAt
    data.endDate = e ? new Date(e) : existing.endDate
  }
  if (body.discount !== undefined || body.discountPercent !== undefined) {
    const d = body.discount !== undefined ? body.discount : body.discountPercent
    data.discount = Number(d)
  }
  if (body.isActive !== undefined) data.isActive = !!body.isActive

  // Validate date range if both are present.
  const startDate = data.startDate || existing.startDate
  const endDate = data.endDate || existing.endDate
  if (endDate < startDate) {
    return errorResponse('endDate must be after startDate', 400)
  }

  const flashSale = await db.flashSale.update({ where: { id }, data })
  return jsonResponse({ data: mapFlashSale(flashSale) })
})

// ─── DELETE /api/admin/flash-sales/[id] ───────────────────────────────────────

export const DELETE = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response!

  const { id } = await params
  const existing = await db.flashSale.findUnique({ where: { id } })
  if (!existing) return errorResponse('Flash sale not found', 404)

  await db.flashSale.update({
    where: { id },
    data: { isDeleted: true, isActive: false },
  })

  return jsonResponse({ message: 'Flash sale deleted' })
})
