import { db } from '@/lib/db'
import { jsonResponse } from '@/lib/auth'
import { authGetRoute } from '@/lib/api-handler'

/**
 * GET /api/reviews/mine
 * Returns the current user's reviews (any status) with the related product
 * or service info, so the "My Reviews" account page can render a table.
 */
export const GET = authGetRoute(async (_request, user) => {
  const reviews = await db.review.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          slug: true,
          images: true,
        },
      },
      service: {
        select: {
          id: true,
          name: true,
          slug: true,
          images: true,
        },
      },
    },
  })

  return jsonResponse({ data: reviews })
})
