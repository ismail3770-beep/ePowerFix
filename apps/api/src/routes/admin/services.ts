import { Router } from 'express'
import { z } from 'zod'
import { db } from '@epowerfix/db'
import { requireAdmin } from '../../middleware/auth'
import { validate } from '../../middleware/validate'
import { success, error } from '../../utils/response'
import { generateSlug } from '@epowerfix/utils'

export const servicesRouter = Router()

const createServiceSchema = z.object({
  name: z.string().min(2),
  nameBn: z.string().optional().default(''),
  description: z.string().default(''),
  shortDesc: z.string().optional().default(''),
  basePrice: z.number().min(0),
  priceUnit: z.string().default('fixed'),
  categoryId: z.string().min(1),
  images: z.array(z.string()).default([]),
  features: z.record(z.string(), z.any()).default({}),
  isFeatured: z.boolean().default(false),
  isActive: z.boolean().default(true),
})

// GET /api/admin/services
servicesRouter.get('/', requireAdmin, async (req, res) => {
  try {
    const { category, status } = req.query as any
    const where: any = {}
    if (category) where.categoryId = category
    if (status === 'active') where.isActive = true
    else if (status === 'inactive') where.isActive = false

    const services = await db.service.findMany({
      where,
      include: { category: { select: { name: true, nameBn: true } } },
      orderBy: { createdAt: 'desc' },
    })
    res.json(success(services))
  } catch (err: any) {
    res.status(500).json(error(err.message))
  }
})

// POST /api/admin/services
servicesRouter.post('/', requireAdmin, validate(createServiceSchema), async (req, res) => {
  try {
    const slug = generateSlug(req.body.name) + '-' + Date.now().toString(36)
    const service = await db.service.create({ data: { ...req.body, slug } })
    res.status(201).json(success(service, 'Service created'))
  } catch (err: any) {
    if (err.code === 'P2002') return res.status(409).json(error('Slug already exists'))
    res.status(500).json(error(err.message))
  }
})

// PUT /api/admin/services/:id
servicesRouter.put('/:id', requireAdmin, validate(createServiceSchema.partial()), async (req, res) => {
  try {
    const service = await db.service.update({ where: { id: req.params.id }, data: req.body })
    res.json(success(service, 'Service updated'))
  } catch (err: any) {
    res.status(500).json(error(err.message))
  }
})

// GET /api/admin/services/trashed — soft-deleted services
servicesRouter.get('/trashed', requireAdmin, async (_req, res) => {
  try {
    const services = await db.service.findMany({
      where: { isDeleted: true },
      include: { category: { select: { name: true, nameBn: true } } },
      orderBy: { createdAt: 'desc' },
    })
    res.json(success(services))
  } catch (err: any) {
    res.status(500).json(error(err.message))
  }
})

// PUT /api/admin/services/:id/restore
servicesRouter.put('/:id/restore', requireAdmin, async (req, res) => {
  try {
    const service = await db.service.update({ where: { id: req.params.id }, data: { isDeleted: false } })
    res.json(success(service, 'Service restored'))
  } catch (err: any) {
    res.status(500).json(error(err.message))
  }
})

// DELETE /api/admin/services/:id (soft delete)
servicesRouter.delete('/:id', requireAdmin, async (req, res) => {
  try {
    await db.service.update({ where: { id: req.params.id }, data: { isDeleted: true } })
    res.json(success(null, 'Service moved to trash'))
  } catch (err: any) {
    res.status(500).json(error(err.message))
  }
})
