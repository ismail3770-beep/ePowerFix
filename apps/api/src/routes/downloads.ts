// Download routes: list user's digital downloads + secure file download
// Migrated from apps/web/src/app/api/downloads/* (Next.js → Express).
//
// Source files:
//   apps/web/src/app/api/downloads/route.ts                  → GET /
//   apps/web/src/app/api/downloads/[orderItemId]/route.ts    → GET /:orderItemId

import { Router } from 'express'

import { db } from '../lib/db.js'
import { asyncHandler, ApiError } from '../lib/api-handler.js'
import { requireAuth, getAuthUser } from '../lib/auth.js'

const router = Router()

// ─── GET /api/downloads — list user's purchased digital products ──────────────
// Returns order items whose product isDigital and whose order is paid/confirmed.

router.get(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = getAuthUser(req)

    const items = await db.orderItem.findMany({
      where: {
        order: { userId: user.id, paymentStatus: { in: ['PAID', 'CONFIRMED'] } },
        product: { isDigital: true },
      },
      include: { product: true, order: true },
      orderBy: { createdAt: 'desc' },
    })

    const downloads = items
      .filter((it: any) => it.product) // safety filter for TS
      .map((it: any) => {
        const product = it.product!
        const downloadLimit = product.downloadLimit ?? 0
        const downloadCount = it.downloadCount ?? 0
        // Compute fields the profile page expects.
        const unlocked =
          it.order.paymentStatus === 'PAID' || it.order.paymentStatus === 'CONFIRMED'
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
          unlocked,
          hasFile,
          remaining,
          digitalFile: product.digitalFile || null,
        }
      })

    res.json({ data: downloads })
  })
)

// ─── GET /api/downloads/:orderItemId — secure file download ───────────────────
// Enforces per-line download limit. Issues a 302 redirect to the stored file
// URL (in production this would be a signed URL).

router.get(
  '/:orderItemId',
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = getAuthUser(req)
    const { orderItemId } = req.params

    const item = await db.orderItem.findUnique({
      where: { id: orderItemId },
      include: { product: true, order: true },
    })

    if (!item) {
      throw new ApiError('Download not found', 404)
    }
    if (item.order.userId !== user.id) {
      throw new ApiError('Forbidden', 403)
    }
    if (!item.product?.isDigital) {
      throw new ApiError('Not a digital product', 400)
    }
    if (!['PAID', 'CONFIRMED'].includes(item.order.paymentStatus)) {
      throw new ApiError('Order not yet paid', 403)
    }
    if (
      item.product.downloadLimit !== null &&
      item.downloadCount >= item.product.downloadLimit
    ) {
      throw new ApiError('Download limit reached', 403)
    }

    // Increment the download counter.
    await db.orderItem.update({
      where: { id: orderItemId },
      data: { downloadCount: { increment: 1 } },
    })

    // digitalFile holds a path/URL — redirect to it (in production this would
    // be a signed URL). For now we 302 to the stored value.
    const file = item.product.digitalFile
    if (!file) {
      throw new ApiError('No file attached to this product', 404)
    }

    res.redirect(file)
  })
)

export default router
