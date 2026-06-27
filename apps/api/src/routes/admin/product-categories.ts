import { Router } from 'express'
import { z } from 'zod'
import { db } from '@epowerfix/db'
import { requireAdmin } from '../../middleware/auth'
import { validate } from '../../middleware/validate'
import { success, error } from '../../utils/response'
import { generateSlug } from '@epowerfix/utils'

export const productCategoriesRouter = Router()

const createCategorySchema = z.object({
  name: z.string().min(1),
  nameBn: z.string().min(1),
  slug: z.string().optional(),
  icon: z.string().optional().default(''),
  image: z.string().optional().default(''),
  parentId: z.string().optional().nullable(),
  sortOrder: z.number().default(0),
  isActive: z.boolean().default(true),
})

// GET /api/admin/product-categories
productCategoriesRouter.get('/', requireAdmin, async (_req, res) => {
  try {
    const categories = await db.productCategory.findMany({
      where: { isDeleted: false },
      orderBy: { sortOrder: 'asc' },
      include: { _count: { select: { products: { where: { isActive: true } } } } },
    })
    res.json(success(categories))
  } catch (err: any) {
    res.status(500).json(error(err.message))
  }
})

// POST /api/admin/product-categories
productCategoriesRouter.post('/', requireAdmin, validate(createCategorySchema), async (req, res) => {
  try {
    const slug = req.body.slug || generateSlug(req.body.name) + '-' + Date.now().toString(36)
    const category = await db.productCategory.create({ data: { ...req.body, slug } })
    res.status(201).json(success(category, 'Category created'))
  } catch (err: any) {
    if (err.code === 'P2002') return res.status(409).json(error('Slug already exists'))
    res.status(500).json(error(err.message))
  }
})

// PUT /api/admin/product-categories/:id
productCategoriesRouter.put('/:id', requireAdmin, validate(createCategorySchema.partial()), async (req, res) => {
  try {
    const category = await db.productCategory.update({ where: { id: req.params.id }, data: req.body })
    res.json(success(category, 'Category updated'))
  } catch (err: any) {
    res.status(500).json(error(err.message))
  }
})

// GET /api/admin/product-categories/trashed — soft-deleted categories
productCategoriesRouter.get('/trashed', requireAdmin, async (_req, res) => {
  try {
    const categories = await db.productCategory.findMany({ where: { isDeleted: true }, orderBy: { sortOrder: 'asc' } })
    res.json(success(categories))
  } catch (err: any) {
    res.status(500).json(error(err.message))
  }
})

// PUT /api/admin/product-categories/:id/restore
productCategoriesRouter.put('/:id/restore', requireAdmin, async (req, res) => {
  try {
    const category = await db.productCategory.update({ where: { id: req.params.id }, data: { isDeleted: false } })
    res.json(success(category, 'Category restored'))
  } catch (err: any) {
    res.status(500).json(error(err.message))
  }
})

// DELETE /api/admin/product-categories/:id (soft delete)
productCategoriesRouter.delete('/:id', requireAdmin, async (req, res) => {
  try {
    await db.productCategory.update({ where: { id: req.params.id }, data: { isDeleted: true } })
    res.json(success(null, 'Category moved to trash'))
  } catch (err: any) {
    res.status(500).json(error(err.message))
  }
})
