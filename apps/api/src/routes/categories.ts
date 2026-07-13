// Category routes
import { Router } from 'express'
import { db } from '../lib/db.js'
import { asyncHandler } from '../lib/api-handler.js'
import { cache, cacheKeys } from '../lib/cache.js'

const router = Router()

// ─── GET /api/categories ──────────────────────────────────────────────────────

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const includeCounts = req.query.counts !== 'false'

    const fetchCategories = async () => {
      return await db.productCategory.findMany({
        where: { isActive: true, isDeleted: false },
        orderBy: { sortOrder: 'asc' },
        select: {
          id: true,
          name: true,
          nameBn: true,
          slug: true,
          icon: true,
          image: true,
          sortOrder: true,
          _count: includeCounts ? { select: { products: true } } : false,
        },
      })
    }

    const cacheKey = includeCounts ? cacheKeys.categories(true) : cacheKeys.categories(false)
    const categories = await cache.getOrSet(cacheKey, 300, fetchCategories)

    res.json({ categories })
  })
)

export default router
