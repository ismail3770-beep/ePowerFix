import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { jsonResponse, errorResponse, requireAuth } from '@/lib/auth'

/**
 * GET /api/downloads
 * List the current user's purchased digital products (lines whose product
 * isDigital and whose order is paid/confirmed).
 */
export async function GET(_request: NextRequest) {
  try {
    const auth = await requireAuth()
    if (!auth.ok) return auth.response!

    const items = await db.orderItem.findMany({
      where: {
        order: { userId: auth.user!.id, paymentStatus: { in: ['PAID', 'CONFIRMED'] } },
        product: { isDigital: true },
      },
      include: { product: true, order: true },
      orderBy: { createdAt: 'desc' },
    })

    const downloads = items.map((it) => ({
      orderItemId: it.id,
      orderNumber: it.order.orderNumber,
      productName: it.productName,
      productImage: it.productImage,
      downloadLimit: it.product.downloadLimit,
      downloadCount: it.downloadCount,
      purchasedAt: it.order.createdAt,
    }))

    return jsonResponse({ data: downloads })
  } catch (err: any) {
    console.error('public/downloads GET error:', err)
    return errorResponse(err?.message || 'Internal server error', 500)
  }
}
