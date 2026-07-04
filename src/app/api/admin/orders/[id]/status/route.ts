import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import {
  requireAdmin,
  jsonResponse,
  errorResponse,
  parseBody,
} from '@/lib/admin-api'

/**
 * PUT /api/admin/orders/[id]/status
 * Update only the order status and create an OrderHistory entry.
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response!

  try {
    const { id } = await params
    const body = await parseBody<any>(request)
    if (!body?.status) return errorResponse('status is required', 400)

    const existing = await db.order.findUnique({ where: { id } })
    if (!existing) return errorResponse('Order not found', 404)

    const { status, note } = body
    const data: any = { status }
    if (status === 'DELIVERED' && !existing.deliveredAt) {
      data.deliveredAt = new Date()
    }

    const order = await db.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id },
        data,
        include: {
          user: { select: { id: true, name: true, email: true, phone: true } },
          items: true,
          histories: {
            orderBy: { createdAt: 'desc' },
            include: { user: { select: { id: true, name: true, email: true } } },
          },
        },
      })

      if (status !== existing.status) {
        await tx.orderHistory.create({
          data: {
            orderId: id,
            userId: auth.user!.id,
            status,
            note: note || `Status updated from ${existing.status} to ${status}`,
          },
        })
      }

      return updated
    })

    return jsonResponse({ data: order })
  } catch (err: any) {
    console.error('admin/orders/[id]/status PUT error:', err)
    return errorResponse(err?.message || 'Internal server error', 500)
  }
}
