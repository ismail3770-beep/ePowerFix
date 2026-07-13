// Wishlist routes: list, add, remove
import { Router } from 'express'
import { z } from 'zod'

import { db } from '../lib/db.js'
import { asyncHandler, ApiError, validateBody } from '../lib/api-handler.js'
import { requireAuth, getAuthUser } from '../lib/auth.js'

const router = Router()

// ─── Zod Schema ───────────────────────────────────────────────────────────────

const addToWishlistSchema = z
  .object({
    productId: z.string().min(1),
  })
  .passthrough()

// ─── GET /api/wishlist ────────────────────────────────────────────────────────

router.get(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = getAuthUser(req)

    const items = await db.wishlist.findMany({
      where: { userId: user.id },
      include: {
        product: {
          include: { category: true, brand: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    res.json({ success: true, data: items })
  })
)

// ─── POST /api/wishlist ───────────────────────────────────────────────────────

router.post(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const body = validateBody(req, addToWishlistSchema)
    const user = getAuthUser(req)

    const { productId } = body
    if (!productId) {
      throw new ApiError('productId is required', 400)
    }

    // Upsert — the unique constraint [userId, productId] guards duplicates.
    const existing = await db.wishlist.findUnique({
      where: { userId_productId: { userId: user.id, productId } },
    })
    if (existing) {
      return res.json({ success: true, data: existing })
    }

    const item = await db.wishlist.create({
      data: { userId: user.id, productId },
    })
    res.status(201).json({ success: true, data: item })
  })
)

// ─── DELETE /api/wishlist/:id ─────────────────────────────────────────────────

router.delete(
  '/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = getAuthUser(req)
    const { id } = req.params

    // Ensure the item belongs to the requesting user before deleting.
    const item = await db.wishlist.findUnique({ where: { id } })
    if (!item) {
      throw new ApiError('Wishlist item not found', 404)
    }
    if (item.userId !== user.id) {
      throw new ApiError('Forbidden', 403)
    }

    await db.wishlist.delete({ where: { id } })
    res.json({ success: true, message: 'Removed from wishlist' })
  })
)

export default router
