import type { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import {
  requireAdmin,
  jsonResponse,
  errorResponse,
} from '@/lib/admin-api'
import { withErrorHandling, validateBody, z } from '@/lib/api-handler'

function mapTax(t: any) {
  if (!t) {return t}
  return { ...t, value: t.rate }
}

// ─── Zod Schema ───────────────────────────────────────────────────────────────

const updateTaxSchema = z.object({
  name: z.string().optional(),
  type: z.string().optional(),
  rate: z.number().nullable().optional(),
  value: z.number().nullable().optional(),
  isActive: z.boolean().optional(),
}).passthrough()

// ─── GET /api/admin/taxes/[id] ────────────────────────────────────────────────

export const GET = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const auth = await requireAdmin()
  if (!auth.ok) {return auth.response!}

  const { id } = await params
  const tax = await db.tax.findUnique({ where: { id } })
  if (!tax) {return errorResponse('Tax not found', 404)}
  return jsonResponse({ data: mapTax(tax) })
})

// ─── PUT /api/admin/taxes/[id] ────────────────────────────────────────────────

export const PUT = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const auth = await requireAdmin()
  if (!auth.ok) {return auth.response!}

  const { id } = await params
  const body = await validateBody(request, updateTaxSchema)

  const existing = await db.tax.findUnique({ where: { id } })
  if (!existing) {return errorResponse('Tax not found', 404)}

  const data: any = {}
  if (body.name !== undefined) {data.name = body.name}
  if (body.type !== undefined) {
    const type = (body.type || '').toString().toUpperCase()
    if (!['PERCENTAGE', 'FLAT'].includes(type)) {
      return errorResponse('type must be PERCENTAGE or FLAT', 400)
    }
    data.type = type
  }
  if (body.rate !== undefined || body.value !== undefined) {
    const v = body.rate !== undefined ? body.rate : body.value
    data.rate = Number(v)
  }
  if (body.isActive !== undefined) {data.isActive = !!body.isActive}

  const tax = await db.tax.update({ where: { id }, data })
  return jsonResponse({ data: mapTax(tax) })
})

// ─── DELETE /api/admin/taxes/[id] ─────────────────────────────────────────────

export const DELETE = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const auth = await requireAdmin()
  if (!auth.ok) {return auth.response!}

  const { id } = await params
  const existing = await db.tax.findUnique({ where: { id } })
  if (!existing) {return errorResponse('Tax not found', 404)}

  await db.tax.update({
    where: { id },
    data: { isDeleted: true, isActive: false },
  })

  return jsonResponse({ message: 'Tax deleted' })
})
