import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { jsonResponse, errorResponse, requireAuth } from '@/lib/auth'
import { authGetRoute, authRoute, z } from '@/lib/api-handler'

// ─── Zod Schema ───────────────────────────────────────────────────────────────

const addToWishlistSchema = z.object({
  productId: z.string().min(1),
}).passthrough()

// ─── GET /api/wishlist ────────────────────────────────────────────────────────

export const GET = authGetRoute(async (request, user) => {
  const items = await db.wishlist.findMany({
    where: { userId: user.id },
    include: {
      product: {
        include: { category: true, brand: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return jsonResponse({ success: true, data: items })
})

// ─── POST /api/wishlist ───────────────────────────────────────────────────────

export const POST = authRoute(addToWishlistSchema, async (request, body, user) => {
  const { productId } = body
  if (!productId) return errorResponse('productId is required', 400)

  // Upsert — the unique constraint [userId, productId] guards duplicates.
  const existing = await db.wishlist.findUnique({
    where: { userId_productId: { userId: user.id, productId } },
  })
  if (existing) {
    return jsonResponse({ success: true, data: existing })
  }

  const item = await db.wishlist.create({
    data: { userId: user.id, productId },
  })
  return jsonResponse({ success: true, data: item }, 201)
})
