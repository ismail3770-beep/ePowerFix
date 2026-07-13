// Banner routes: list active banners
import { Router } from 'express'

import { db } from '../lib/db.js'
import { asyncHandler } from '../lib/api-handler.js'
import { cache, cacheKeys } from '../lib/cache.js'

const router = Router()

// ─── GET /api/banners ─────────────────────────────────────────────────────────
// Public list of active banners. Query: type (hero|services|promo)
// Cached for 5 minutes (TTL 300s) keyed on the requested banner type.

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const type = (req.query.type as string) || undefined

    const banners = await cache.getOrSet(cacheKeys.banners(type), 300, async () => {
      const where: any = { isActive: true }
      if (type) where.type = type

      return await db.banner.findMany({
        where,
        orderBy: { position: 'asc' },
      })
    })

    res.json({ data: banners })
  })
)

export default router
