import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin, jsonResponse, errorResponse } from '@/lib/admin-api'
import { withErrorHandling, validateBody, z } from '@/lib/api-handler'

// ─── Zod Schema ───────────────────────────────────────────────────────────────

const updateReturnSchema = z.object({
  status: z.string().optional(),
  adminNotes: z.string().optional(),
}).passthrough()

// ─── GET /api/admin/returns/[id] ──────────────────────────────────────────────

export const GET = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response!
  const { id } = await params

  const ret = await db.returnRequest.findUnique({
    where: { id },
    include: {
      order: { select: { orderNumber: true } },
      user: { select: { name: true, email: true } },
    },
  })
  if (!ret) return errorResponse('Return request not found', 404)
  return jsonResponse({ data: ret })
})

// ─── PUT /api/admin/returns/[id] ──────────────────────────────────────────────

export const PUT = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response!
  const { id } = await params
  const body = await validateBody(request, updateReturnSchema)

  const updated = await db.returnRequest.update({
    where: { id },
    data: {
      ...(body.status ? { status: body.status } : {}),
      ...(body.adminNotes ? { adminNotes: body.adminNotes } : {}),
    },
  })
  return jsonResponse({ data: updated })
})

// ─── DELETE /api/admin/returns/[id] ───────────────────────────────────────────

export const DELETE = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response!
  const { id } = await params

  await db.returnRequest.delete({ where: { id } })
  return jsonResponse({ message: 'Return request deleted' })
})
