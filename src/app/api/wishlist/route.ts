import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { jsonResponse, errorResponse, requireAuth, parseBody } from '@/lib/auth'

/**
 * GET /api/wishlist
 * List the current user's wishlist items.
 */
export async function GET(_request: NextRequest) {
  try {
    const auth = await requireAuth()
    if (!auth.ok) return auth.response!

    const items = await db.wishlist.findMany({
      where: { userId: auth.user!.id },
      include: {
        product: {
          include: { category: true, brand: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return jsonResponse({ success: true, data: items })
  } catch (err: any) {
    console.error('public/wishlist GET error:', err)
    return errorResponse(err?.message || 'Internal server error', 500)
  }
}

/**
 * POST /api/wishlist
 * Add a product to the wishlist.
 * Body: { productId }
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth()
    if (!auth.ok) return auth.response!

    const body = await parseBody<any>(request)
    if (!body) return errorResponse('Invalid request body', 400)
    const { productId } = body
    if (!productId) return errorResponse('productId is required', 400)

    // Upsert — the unique constraint [userId, productId] guards duplicates.
    const existing = await db.wishlist.findUnique({
      where: { userId_productId: { userId: auth.user!.id, productId } },
    })
    if (existing) {
      return jsonResponse({ success: true, data: existing })
    }

    const item = await db.wishlist.create({
      data: { userId: auth.user!.id, productId },
    })
    return jsonResponse({ success: true, data: item }, 201)
  } catch (err: any) {
    console.error('public/wishlist POST error:', err)
    return errorResponse(err?.message || 'Internal server error', 500)
  }
}
