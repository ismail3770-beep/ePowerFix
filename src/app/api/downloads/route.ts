import type { NextRequest } from 'next/server'
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
    if (!auth.ok) {return auth.response!}

    const items = await db.orderItem.findMany({
      where: {
        order: { userId: auth.user!.id, paymentStatus: { in: ['PAID', 'CONFIRMED'] } },
        product: { isDigital: true },
      },
      include: { product: true, order: true },
      orderBy: { createdAt: 'desc' },
    })

    const downloads = items
      .filter((it) => it.product) // safety filter for TS
      .map((it) => {
      const product = it.product!
      const downloadLimit = product.downloadLimit ?? 0
      const downloadCount = it.downloadCount ?? 0
      // Compute fields the profile page expects.
      const unlocked = it.order.paymentStatus === 'PAID' || it.order.paymentStatus === 'CONFIRMED'
      const hasFile = !!(product.digitalFile && product.digitalFile.trim() !== '')
      const remaining = Math.max(0, downloadLimit - downloadCount)
      return {
        orderItemId: it.id,
        orderNumber: it.order.orderNumber,
        productName: it.productName,
        productImage: it.productImage,
        downloadLimit,
        downloadCount,
        purchasedAt: it.order.createdAt,
        // Computed fields (M17):
        unlocked,
        hasFile,
        remaining,
        digitalFile: product.digitalFile || null,
      }
    })

    return jsonResponse({ data: downloads })
  } catch (err: any) {
    // M20: don't leak internal error details to the client.
    console.error('public/downloads GET error:', err)
    return errorResponse('Internal server error', 500)
  }
}
