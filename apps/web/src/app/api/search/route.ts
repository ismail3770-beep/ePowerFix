import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { publicGetRoute, z } from '@/lib/api-handler'
import { startSpan } from '@/lib/monitoring'

const searchQuerySchema = z.object({
  q: z.string().min(1).max(200),
  productLimit: z.coerce.number().int().min(1).max(10).default(5),
  serviceLimit: z.coerce.number().int().min(1).max(10).default(5),
  projectLimit: z.coerce.number().int().min(1).max(10).default(5),
})

interface SearchResultItem {
  id: string
  name: string
  slug: string
  price?: number
  image?: string | null
  type: 'product' | 'service' | 'project'
  category?: { name: string } | null
}

/**
 * GET /api/search
 * Unified search across products, services, and projects.
 * Query params: q (required), productLimit, serviceLimit, projectLimit
 */
export const GET = publicGetRoute(async (request: NextRequest) => {
  const url = new URL(request.url)
  const query = url.searchParams.get('q') || ''
  const productLimit = parseInt(url.searchParams.get('productLimit') || '5', 10)
  const serviceLimit = parseInt(url.searchParams.get('serviceLimit') || '5', 10)
  const projectLimit = parseInt(url.searchParams.get('projectLimit') || '5', 10)

  if (!query || query.length < 2) {
    return Response.json({ products: [], services: [], projects: [] })
  }

  const span = startSpan('search.unified')
  try {
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
      image: Array.isArray(p.images) ? p.images[0] : p.images ? JSON.parse(p.images)[0] : null,
      type: 'product' as const,
      category: p.category,
    }))

    const formatServices = services.map((s: any) => ({
      id: s.id,
      name: s.name,
      slug: s.slug,
      price: s.basePrice,
      priceUnit: s.priceUnit,
      image: Array.isArray(s.images) ? s.images[0] : s.images ? JSON.parse(s.images)[0] : null,
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

    return Response.json({
      products: formatProducts,
      services: formatServices,
      projects: formatProjects,
    })
  } finally {
    span.finish()
  }
})