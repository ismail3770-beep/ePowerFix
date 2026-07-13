// Product routes: list, detail, compare
import { Router } from 'express'

import { db } from '../lib/db.js'
import { asyncHandler, ApiError } from '../lib/api-handler.js'
import { parseJsonField, getPagination, listResponse } from '../lib/helpers.js'
import { cache, cacheKeys } from '../lib/cache.js'

const router = Router()

// ─── GET /api/products ────────────────────────────────────────────────────────

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const query = req.query as Record<string, any>
    const countOnly = query.countOnly === 'true'

    if (countOnly) {
      const total = await db.product.count({ where: { isActive: true } })
      return res.json({ data: { total } })
    }

    const { page, limit, skip, search } = getPagination(query)
    const categoryParam = query.category || query.categoryId || undefined
    const brandId = query.brandId || undefined
    const featured = query.featured
    const bestDeals = query.bestDeals
    const sort = query.sort || 'featured'
    const minPrice = query.minPrice
    const maxPrice = query.maxPrice
    const minRating = query.minRating

    const hasExtraFilters = !!(
      categoryParam ||
      brandId ||
      featured ||
      bestDeals ||
      (sort && sort !== 'featured') ||
      minPrice ||
      maxPrice ||
      minRating
    )

    const fetchProducts = async () => {
      const where: any = { isActive: true }

      if (categoryParam) {
        const cat = await db.productCategory.findFirst({
          where: { OR: [{ id: categoryParam }, { slug: categoryParam }] },
          select: { id: true },
        })
        if (cat) where.categoryId = cat.id
        else where.categoryId = categoryParam
      }
      if (brandId) where.brandId = brandId
      if (featured === 'true') where.isFeatured = true
      if (bestDeals === 'true') where.isBestDeal = true

      if (minPrice || maxPrice) {
        where.price = {}
        if (minPrice) where.price.gte = parseFloat(minPrice)
        if (maxPrice) where.price.lte = parseFloat(maxPrice)
      }

      if (minRating) {
        where.rating = { gte: parseFloat(minRating) }
      }

      if (search) {
        where.OR = [
          { name: { contains: search } },
          { nameBn: { contains: search } },
          { sku: { contains: search } },
          { slug: { contains: search } },
          { shortDesc: { contains: search } },
        ]
      }

      let orderBy: any = { createdAt: 'desc' }
      if (sort === 'price-asc') orderBy = { price: 'asc' }
      else if (sort === 'price-desc') orderBy = { price: 'desc' }
      else if (sort === 'rating') orderBy = { rating: 'desc' }
      else if (sort === 'featured') orderBy = [{ isFeatured: 'desc' }, { createdAt: 'desc' }]

      const [products, total] = await Promise.all([
        db.product.findMany({
          where,
          skip,
          take: limit,
          orderBy,
          include: { category: true, brand: true },
        }),
        db.product.count({ where }),
      ])
      return { products, total }
    }

    const { products, total } = hasExtraFilters
      ? await fetchProducts()
      : await cache.getOrSet(cacheKeys.products(page, limit, search), 120, fetchProducts)

    const parsed = products.map((p: any) => ({
      ...p,
      images: parseJsonField(p.images),
      tags: parseJsonField(p.tags),
      comparePrice: p.salePrice ?? null,
    }))

    res.json(listResponse(parsed, total, page, limit))
  })
)

// ─── GET /api/products/compare ────────────────────────────────────────────────

router.get(
  '/compare',
  asyncHandler(async (req, res) => {
    const idsParam = (req.query.ids as string) || ''
    const ids = idsParam.split(',').map((s) => s.trim()).filter(Boolean).slice(0, 4)

    if (ids.length === 0) {
      return res.json({ data: [] })
    }

    const products = await db.product.findMany({
      where: { id: { in: ids }, isActive: true },
      include: { category: true, brand: true },
    })

    const ordered = ids
      .map((id) => products.find((p: any) => p.id === id))
      .filter(Boolean) as typeof products

    const parsed = ordered.map((p: any) => ({
      ...p,
      images: parseJsonField(p.images),
      tags: parseJsonField(p.tags),
    }))

    res.json({ data: parsed })
  })
)

// ─── GET /api/products/:id ────────────────────────────────────────────────────

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params

    const product = await db.product.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
        isActive: true,
      },
      include: {
        category: true,
        brand: true,
        variants: true,
        reviews: {
          where: { status: 'APPROVED' },
          include: { user: { select: { name: true, avatar: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!product) {
      throw new ApiError('Product not found', 404)
    }

    let related: any[] = []
    if (product.categoryId) {
      related = await db.product.findMany({
        where: {
          categoryId: product.categoryId,
          isActive: true,
          id: { not: product.id },
        },
        take: 4,
        orderBy: { createdAt: 'desc' },
        include: { category: true, brand: true },
      })
    }

    const parsed = {
      ...product,
      images: parseJsonField(product.images),
      tags: parseJsonField(product.tags),
      comparePrice: product.salePrice ?? null,
      reviews: product.reviews,
    }

    const parsedRelated = related.map((p: any) => ({
      ...p,
      images: parseJsonField(p.images),
      tags: parseJsonField(p.tags),
      comparePrice: p.salePrice ?? null,
    }))

    res.json({ data: { product: parsed, related: parsedRelated } })
  })
)

export default router
