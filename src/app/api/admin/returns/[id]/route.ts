import type { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin, jsonResponse, errorResponse } from '@/lib/admin-api'
import { withErrorHandling, validateBody, z } from '@/lib/api-handler'
import { notifyUser } from '@/lib/notifications'

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
  if (!auth.ok) {return auth.response!}
  const { id } = await params

  const ret = await db.returnRequest.findUnique({
    where: { id },
    include: {
      order: { select: { orderNumber: true } },
      user: { select: { name: true, email: true } },
    },
  })
  if (!ret) {return errorResponse('Return request not found', 404)}
  return jsonResponse({ data: ret })
})

// ─── PUT /api/admin/returns/[id] ──────────────────────────────────────────────

export const PUT = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const auth = await requireAdmin()
  if (!auth.ok) {return auth.response!}
  const { id } = await params
  const body = await validateBody(request, updateReturnSchema)

  const updated = await db.returnRequest.update({
    where: { id },
    data: {
      ...(body.status ? { status: body.status } : {}),
      ...(body.adminNotes ? { adminNotes: body.adminNotes } : {}),
    },
    include: { order: { select: { orderNumber: true } } },
  })

  // Notify the customer when their return request status changes
  // (e.g. approved / rejected / completed).
  if (body.status && updated.userId) {
    const statusMessages: Record<string, string> = {
      PENDING: 'is under review',
      APPROVED: 'has been approved',
      REJECTED: 'has been rejected',
      COMPLETED: 'has been completed — refund processed',
    }
    const detail = statusMessages[body.status.toUpperCase()] || `updated to ${body.status}`
    await notifyUser(
      updated.userId,
      'Return Request Update',
      `Your return request for order ${updated.order.orderNumber} ${detail}.`,
      'RETURN',
      updated.id,
    )
  }

  return jsonResponse({ data: updated })
})

// ─── DELETE /api/admin/returns/[id] ───────────────────────────────────────────

export const DELETE = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const auth = await requireAdmin()
  if (!auth.ok) {return auth.response!}
  const { id } = await params

  await db.returnRequest.delete({ where: { id } })
  return jsonResponse({ message: 'Return request deleted' })
})
