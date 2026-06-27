import { Router } from 'express'
import { z } from 'zod'
import { db } from '@epowerfix/db'
import { requireAdmin } from '../../middleware/auth'
import { validate } from '../../middleware/validate'
import { success, error } from '../../utils/response'
import { generateSlug } from '@epowerfix/utils'

export const brandsRouter = Router()

const createBrandSchema = z.object({
  name: z.string().min(1),
  nameBn: z.string().optional().default(''),
  logo: z.string().optional().default(''),
  country: z.string().optional().default(''),
  website: z.string().optional().default(''),
  isActive: z.boolean().default(true),
})

// GET /api/admin/brands
brandsRouter.get('/', requireAdmin, async (_req, res) => {
  try {
    const brands = await db.brand.findMany({ where: { isDeleted: false }, orderBy: { name: 'asc' } })
    res.json(success(brands))
  } catch (err: any) {
    res.status(500).json(error(err.message))
  }
})

// POST /api/admin/brands
brandsRouter.post('/', requireAdmin, validate(createBrandSchema), async (req, res) => {
  try {
    const slug = generateSlug(req.body.name) + '-' + Date.now().toString(36)
    const brand = await db.brand.create({ data: { ...req.body, slug } })
    res.status(201).json(success(brand, 'Brand created'))
  } catch (err: any) {
    if (err.code === 'P2002') return res.status(409).json(error('Slug already exists'))
    res.status(500).json(error(err.message))
  }
})

// PUT /api/admin/brands/:id
brandsRouter.put('/:id', requireAdmin, validate(createBrandSchema.partial()), async (req, res) => {
  try {
    const brand = await db.brand.update({ where: { id: req.params.id }, data: req.body })
    res.json(success(brand, 'Brand updated'))
  } catch (err: any) {
    res.status(500).json(error(err.message))
  }
})

// GET /api/admin/brands/trashed — soft-deleted brands
brandsRouter.get('/trashed', requireAdmin, async (_req, res) => {
  try {
    const brands = await db.brand.findMany({ where: { isDeleted: true }, orderBy: { name: 'asc' } })
    res.json(success(brands))
  } catch (err: any) {
    res.status(500).json(error(err.message))
  }
})

// PUT /api/admin/brands/:id/restore
brandsRouter.put('/:id/restore', requireAdmin, async (req, res) => {
  try {
    const brand = await db.brand.update({ where: { id: req.params.id }, data: { isDeleted: false } })
    res.json(success(brand, 'Brand restored'))
  } catch (err: any) {
    res.status(500).json(error(err.message))
  }
})

// DELETE /api/admin/brands/:id (soft delete)
brandsRouter.delete('/:id', requireAdmin, async (req, res) => {
  try {
    await db.brand.update({ where: { id: req.params.id }, data: { isDeleted: true } })
    res.json(success(null, 'Brand moved to trash'))
  } catch (err: any) {
    res.status(500).json(error(err.message))
  }
})
