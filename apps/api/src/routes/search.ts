// Search routes: unified search across products, services, and projects
import { Router } from 'express'

import { db } from '../lib/db.js'
import { asyncHandler, ApiError, validateQuery } from '../lib/api-handler.js'
import { z } from 'zod'

const router = Router()

// ─── GET /api/search ──────────────────────────────────────────────────────────

const searchQuerySchema = z.object({
  q: z.string().min(1).max(200),
  productLimit: z.coerce.number().int().min(1).max(10).default(5),
  serviceLimit: z.coerce.number().int().min(1).max(10).default(5),
  projectLimit: z.coerce.number().int().min(1).max(10).default(5),
})

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { q: query, productLimit, serviceLimit, projectLimit } = validateQuery(
      req,
      searchQuerySchema
    )

    // The Next.js route returned an empty result set when q < 2 chars.
    if (!query || query.length < 2) {
      return res.json({ products: [], services: [], projects: [] })
    }

    const [products, services, projects] = await Promise.all([
      // Search products
      db.product.findMany({
        where: {
          isActive: true,
          OR: [
            { name: { contains: query } },
            { nameBn: { contains: query } },
            { shortDesc: { contains: query } },
            { sku: { contains: query } },
          ],
        },
        take: productLimit,
        select: {
          id: true,
          name: true,
          slug: true,
          price: true,
          salePrice: true,
          images: true,
          category: { select: { name: true } },
        },
      }),
      // Search services
      db.service.findMany({
        where: {
          isActive: true,
          OR: [
            { name: { contains: query } },
            { nameBn: { contains: query } },
            { shortDesc: { contains: query } },
          ],
        },
        take: serviceLimit,
        select: {
          id: true,
          name: true,
          slug: true,
          basePrice: true,
          priceUnit: true,
          images: true,
          category: { select: { name: true } },
        },
      }),
      // Search projects
      db.project.findMany({
        where: {
          isDeleted: false,
          OR: [
            { title: { contains: query } },
            { titleBn: { contains: query } },
            { description: { contains: query } },
          ],
        },
        take: projectLimit,
        select: {
          id: true,
          title: true,
          slug: true,
          coverImage: true,
        },
      }),
    ])

    const formatProducts = products.map((p: any) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      price: p.salePrice ?? p.price,
      image: Array.isArray(p.images)
        ? p.images[0]
        : p.images
        ? safeParseFirst(p.images)
        : null,
      type: 'product' as const,
      category: p.category,
    }))

    const formatServices = services.map((s: any) => ({
      id: s.id,
      name: s.name,
      slug: s.slug,
      price: s.basePrice,
      priceUnit: s.priceUnit,
      image: Array.isArray(s.images)
        ? s.images[0]
        : s.images
        ? safeParseFirst(s.images)
        : null,
      type: 'service' as const,
      category: s.category,
    }))

    const formatProjects = projects.map((p: any) => ({
      id: p.id,
      name: p.title,
      slug: p.slug,
      image: p.coverImage,
      type: 'project' as const,
    }))

    res.json({
      products: formatProducts,
      services: formatServices,
      projects: formatProjects,
    })
  })
)

/** Safely JSON-parse a stored JSON-stringified array and return the first element. */
function safeParseFirst(raw: string): string | null {
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed[0] ?? null : null
  } catch {
    return null
  }
}

export default router
