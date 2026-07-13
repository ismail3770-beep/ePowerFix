// Brand routes
import { Router } from 'express'
import { db } from '../lib/db.js'
import { asyncHandler } from '../lib/api-handler.js'
import { cache, cacheKeys } from '../lib/cache.js'

const router = Router()

// ─── GET /api/brands ──────────────────────────────────────────────────────────

router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const brands = await cache.getOrSet(cacheKeys.brands(), 300, async () => {
      return await db.brand.findMany({
        where: { isActive: true, isDeleted: false },
        orderBy: { name: 'asc' },
        select: {
          id: true,
          name: true,
          nameBn: true,
          slug: true,
          logo: true,
          isActive: true,
        },
      })
    })

    res.json({ brands })
  })
)

export default router
