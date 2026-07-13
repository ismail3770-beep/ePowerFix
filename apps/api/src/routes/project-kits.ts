// Project-kit routes: list, detail
// Public list of active sellable project kits (bundles).
import { Router } from 'express'

import { db } from '../lib/db.js'
import { asyncHandler, ApiError } from '../lib/api-handler.js'
import { parseJsonField } from '../lib/helpers.js'
import { cache, cacheKeys } from '../lib/cache.js'

const router = Router()

// ─── GET /api/project-kits ────────────────────────────────────────────────────

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const query = req.query as Record<string, any>
    const search = query.search || query.q || ''
    const category = query.category || undefined

    // Skip cache when any filter is present to avoid cache poisoning
    const hasExtraFilters = !!(search || category)

    const fetchKits = async () => {
      const where: any = { isActive: true }
      if (category) where.category = category
      if (search) {
        where.OR = [
          { title: { contains: search } },
          { titleBn: { contains: search } },
          { description: { contains: search } },
          { category: { contains: search } },
        ]
      }

      return await db.projectKit.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: { select: { items: true } },
        },
      })
    }

    const kits = hasExtraFilters
      ? await fetchKits()
      : await cache.getOrSet(cacheKeys.projectKits(), 300, fetchKits)

    const parsed = kits.map((k: any) => ({
      ...k,
      images: parseJsonField(k.images),
      itemCount: k._count?.items ?? 0,
      _count: undefined,
    }))

    res.json({ data: parsed })
  })
)

// ─── GET /api/project-kits/:slug ──────────────────────────────────────────────

router.get(
  '/:slug',
  asyncHandler(async (req, res) => {
    const { slug } = req.params

    const kit = await db.projectKit.findFirst({
      where: { slug, isActive: true },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                price: true,
                salePrice: true,
                stock: true,
                images: true,
                sku: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    })

    if (!kit) {
      throw new ApiError('Kit not found', 404)
    }

    const parsed = {
      ...kit,
      images: parseJsonField(kit.images),
    }
    res.json({ data: parsed })
  })
)

export default router
