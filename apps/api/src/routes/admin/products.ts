import { Router } from 'express'
import { z } from 'zod'
import { db } from '@epowerfix/db'
import { requireAdmin } from '../../middleware/auth'
import { validate } from '../../middleware/validate'
import { success, error } from '../../utils/response'
import { getPagination, generateSlug } from '@epowerfix/utils'

export const productsRouter = Router()

const createProductSchema = z.object({
  name: z.string().min(2),
  nameBn: z.string().optional().default(''),
  description: z.string().default(''),
  shortDesc: z.string().optional().default(''),
  price: z.number().positive(),
  salePrice: z.number().positive().optional().nullable(),
  costPrice: z.number().positive().optional().nullable(),
  sku: z.string().optional(),
  stock: z.number().int().min(0).default(0),
  minStock: z.number().int().min(0).default(5),
  categoryId: z.string().min(1),
  brandId: z.string().min(1),
  images: z.array(z.string()).default([]),
  specs: z.record(z.string(), z.any()).default({}),
  tags: z.array(z.string()).default([]),
  isFeatured: z.boolean().default(false),
  hasVariant: z.boolean().default(false),
  isActive: z.boolean().default(true),
})

const variantSchema = z.object({
  name: z.string().min(1),
  sku: z.string().min(1),
  price: z.number().positive(),
  salePrice: z.number().positive().optional().nullable(),
  stock: z.number().int().min(0).default(0),
  attributes: z.record(z.string(), z.any()).default({}),
  isActive: z.boolean().default(true),
})

// GET /api/admin/products
productsRouter.get('/', requireAdmin, async (req, res) => {
  try {
    const { page = '1', limit = '20', search, category, status } = req.query as any
    const { skip, take } = getPagination({ page: Number(page), limit: Number(limit) })
    const where: any = { isDeleted: false }
    if (search) where.OR = [{ name: { contains: String(search), mode: 'insensitive' } }, { sku: { contains: String(search) } }]
    if (category) where.categoryId = String(category)
    if (status === 'inactive') where.isActive = false
    else if (status === 'active') where.isActive = true

    const [data, total] = await Promise.all([
      db.product.findMany({
        where, skip, take,
        orderBy: { createdAt: 'desc' },
        include: { category: { select: { name: true } }, brand: { select: { name: true } } },
      }),
      db.product.count({ where }),
    ])

    res.json(success({ data, pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) } }))
  } catch (err: any) {
    res.status(500).json(error(err.message))
  }
})

// GET /api/admin/products/trashed — soft-deleted products
productsRouter.get('/trashed', requireAdmin, async (_req, res) => {
  try {
    const products = await db.product.findMany({
      where: { isDeleted: true },
      orderBy: { createdAt: 'desc' },
      include: { category: { select: { name: true } }, brand: { select: { name: true } } },
    })
    res.json(success(products))
  } catch (err: any) {
    res.status(500).json(error(err.message))
  }
})

// GET /api/admin/products/:id
productsRouter.get('/:id', requireAdmin, async (req, res) => {
  try {
    const product = await db.product.findUnique({
      where: { id: req.params.id },
      include: { category: true, brand: true, variants: { orderBy: { createdAt: 'asc' } } },
    })
    if (!product) return res.status(404).json(error('Product not found'))
    res.json(success(product))
  } catch (err: any) {
    res.status(500).json(error(err.message))
  }
})

// POST /api/admin/products
productsRouter.post('/', requireAdmin, validate(createProductSchema), async (req, res) => {
  try {
    const { variants: rawVariants, ...productData } = req.body
    const slug = generateSlug(productData.name) + '-' + Date.now().toString(36)
    const sku = productData.sku || `EPF-${Date.now().toString(36).toUpperCase()}`
    const hasVariant = productData.hasVariant ?? (rawVariants && rawVariants.length > 0)

    const product = await db.product.create({
      data: {
        ...productData,
        slug,
        sku,
        hasVariant,
        ...(rawVariants && rawVariants.length > 0 ? {
          variants: { create: rawVariants },
        } : {}),
      },
      include: { variants: true },
    })
    res.status(201).json(success(product, 'Product created'))
  } catch (err: any) {
    if (err.code === 'P2002') return res.status(409).json(error('SKU or slug already exists'))
    res.status(500).json(error(err.message))
  }
})

// PUT /api/admin/products/:id
productsRouter.put('/:id', requireAdmin, validate(createProductSchema.partial()), async (req, res) => {
  try {
    const { variants: rawVariants, ...productData } = req.body

    // If variants array is provided, replace all variants
    if (rawVariants !== undefined) {
      await db.productVariant.deleteMany({ where: { productId: req.params.id } })
    }

    const product = await db.product.update({
      where: { id: req.params.id },
      data: {
        ...productData,
        ...(rawVariants && rawVariants.length > 0 ? {
          hasVariant: true,
          variants: { create: rawVariants },
        } : rawVariants !== undefined ? { hasVariant: false } : {}),
      },
      include: { variants: true },
    })
    res.json(success(product, 'Product updated'))
  } catch (err: any) {
    res.status(500).json(error(err.message))
  }
})

// PUT /api/admin/products/:id/restore
productsRouter.put('/:id/restore', requireAdmin, async (req, res) => {
  try {
    const product = await db.product.update({ where: { id: req.params.id }, data: { isDeleted: false } })
    res.json(success(product, 'Product restored'))
  } catch (err: any) {
    res.status(500).json(error(err.message))
  }
})

// DELETE /api/admin/products/:id (soft delete)
productsRouter.delete('/:id', requireAdmin, async (req, res) => {
  try {
    await db.product.update({ where: { id: req.params.id }, data: { isDeleted: true } })
    res.json(success(null, 'Product moved to trash'))
  } catch (err: any) {
    res.status(500).json(error(err.message))
  }
})

// PUT /api/admin/products/:id/variants/:variantId — update single variant
productsRouter.put('/:id/variants/:variantId', requireAdmin, validate(variantSchema.partial()), async (req, res) => {
  try {
    const variant = await db.productVariant.findFirst({
      where: { id: req.params.variantId, productId: req.params.id },
    })
    if (!variant) return res.status(404).json(error('Variant not found'))

    const updated = await db.productVariant.update({
      where: { id: req.params.variantId },
      data: req.body,
    })
    res.json(success(updated, 'Variant updated'))
  } catch (err: any) {
    if (err.code === 'P2002') return res.status(409).json(error('Variant SKU already exists'))
    res.status(500).json(error(err.message))
  }
})

// DELETE /api/admin/products/:id/variants/:variantId — soft delete variant
productsRouter.delete('/:id/variants/:variantId', requireAdmin, async (req, res) => {
  try {
    const variant = await db.productVariant.findFirst({
      where: { id: req.params.variantId, productId: req.params.id },
    })
    if (!variant) return res.status(404).json(error('Variant not found'))

    await db.productVariant.update({
      where: { id: req.params.variantId },
      data: { isActive: false },
    })
    res.json(success(null, 'Variant deactivated'))
  } catch (err: any) {
    res.status(500).json(error(err.message))
  }
})
