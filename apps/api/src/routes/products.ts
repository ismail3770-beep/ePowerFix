import { Router } from 'express'
import { Prisma } from '@prisma/client'
import { db } from '@epowerfix/db'
import { getPagination } from '@epowerfix/utils'
import { success, error } from '../utils/response'

export const productsRouter = Router()

// GET /api/products — list with filters
// Supports: ?page, ?limit, ?search, ?category, ?brand, ?featured, ?sort, ?order, ?minPrice, ?maxPrice
productsRouter.get('/', async (req, res) => {
  try {
    const { page = '1', limit = '20', search, category, brand, featured, sort = 'createdAt', order = 'desc', minPrice, maxPrice } = req.query as any
    const { skip, take } = getPagination({ page: Number(page), limit: Number(limit) })

    const where: Prisma.ProductWhereInput = {
      isActive: true,
      ...(search ? { OR: [
        { name: { contains: String(search), mode: 'insensitive' } },
        { nameBn: { contains: String(search), mode: 'insensitive' } },
        { sku: { contains: String(search), mode: 'insensitive' } },
      ]} : {}),
      ...(category ? { categoryId: String(category) } : {}),
      ...(brand ? { brandId: String(brand) } : {}),
      ...(featured === 'true' ? { isFeatured: true } : {}),
      ...(minPrice || maxPrice ? { price: { ...(minPrice ? { gte: Number(minPrice) } : {}), ...(maxPrice ? { lte: Number(maxPrice) } : {}) } } : {}),
    }

    const orderBy: Prisma.ProductOrderByWithRelationInput = {}
    const sortField = String(sort)
    if (['price', 'rating', 'reviewCount', 'createdAt', 'isFeatured'].includes(sortField)) {
      ;(orderBy as any)[sortField] = order === 'asc' ? 'asc' : 'desc'
    }

    const [data, total] = await Promise.all([
      db.product.findMany({
        where, skip, take, orderBy,
        include: {
          category: { select: { id: true, name: true, nameBn: true, slug: true } },
          brand: { select: { id: true, name: true, slug: true, logo: true } },
          variants: { where: { isActive: true }, select: { id: true, name: true, sku: true, price: true, salePrice: true, stock: true, attributes: true } },
        },
      }),
      db.product.count({ where }),
    ])

    res.json(success({ data, pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) } }))
  } catch (err: any) {
    res.status(500).json(error(err.message))
  }
})

// GET /api/products/:id — single product by id or slug
productsRouter.get('/:id', async (req, res) => {
  try {
    const product = await db.product.findFirst({
      where: {
        OR: [{ id: req.params.id }, { slug: req.params.id }],
        isActive: true,
      },
      include: {
        category: { select: { id: true, name: true, nameBn: true, slug: true } },
        brand: { select: { id: true, name: true, slug: true, logo: true } },
        variants: { where: { isActive: true } },
        reviews: {
          where: { status: 'APPROVED' },
          take: 10,
          orderBy: { createdAt: 'desc' },
          select: { id: true, rating: true, title: true, comment: true, user: { select: { name: true, avatar: true } }, createdAt: true },
        },
      },
    })
    if (!product) return res.status(404).json(error('Product not found'))

    // Related products
    const related = await db.product.findMany({
      where: { categoryId: product.categoryId, id: { not: product.id }, isActive: true },
      take: 8,
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, nameBn: true, slug: true, price: true, salePrice: true, images: true, rating: true, reviewCount: true },
    })

    res.json(success({ product, related }))
  } catch (err: any) {
    res.status(500).json(error(err.message))
  }
})
