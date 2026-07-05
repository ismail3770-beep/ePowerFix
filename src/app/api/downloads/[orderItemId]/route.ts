import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { errorResponse, requireAuth } from '@/lib/auth'

/**
 * GET /api/downloads/[orderItemId]
 * Securely download a digital product tied to a paid order item.
 * Enforces the per-line download limit.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ orderItemId: string }> }
) {
  try {
    const auth = await requireAuth()
    if (!auth.ok) return auth.response!

    const { orderItemId } = await params
    const item = await db.orderItem.findUnique({
      where: { id: orderItemId },
      include: { product: true, order: true },
    })

    if (!item) return errorResponse('Download not found', 404)
    if (item.order.userId !== auth.user!.id) return errorResponse('Forbidden', 403)
    if (!item.product?.isDigital) return errorResponse('Not a digital product', 400)
    if (!['PAID', 'CONFIRMED'].includes(item.order.paymentStatus)) {
      return errorResponse('Order not yet paid', 403)
    }
    if (
      item.product.downloadLimit !== null &&
      item.downloadCount >= item.product.downloadLimit
    ) {
      return errorResponse('Download limit reached', 403)
    }

    // Increment the download counter.
    await db.orderItem.update({
      where: { id: orderItemId },
      data: { downloadCount: { increment: 1 } },
    })

    // digitalFile holds a path/URL — redirect to it (in production this would be
    // a signed URL). For now we 302 to the stored value.
    const file = item.product.digitalFile
    if (!file) return errorResponse('No file attached to this product', 404)

    return NextResponse.redirect(file, { status: 302 })
  } catch (err: any) {
    console.error('public/downloads/[orderItemId] GET error:', err)
    return errorResponse(err?.message || 'Internal server error', 500)
  }
}
