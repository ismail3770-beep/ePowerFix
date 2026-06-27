import { Router } from 'express'
import { db } from '@epowerfix/db'
import { success, error } from '../utils/response'

export const servicesRouter = Router()

// GET /api/services — list services with category filter
servicesRouter.get('/', async (req, res) => {
  try {
    const categoryId = req.query.category as string | undefined

    const categories = await db.serviceCategory.findMany({
      where: { isActive: true, ...(categoryId ? { id: categoryId } : {}) },
      orderBy: { sortOrder: 'asc' },
    })

    const where: any = { isActive: true, isDeleted: false }
    if (categoryId) where.categoryId = categoryId

    const services = await db.service.findMany({
      where,
      include: { category: { select: { id: true, name: true, nameBn: true, slug: true } } },
      orderBy: [{ isFeatured: 'desc' }, { name: 'asc' }],
    })

    res.json(success({ categories, services }))
  } catch (err: any) {
    res.status(500).json(error(err.message))
  }
})

// GET /api/services/:id — single service by id or slug
servicesRouter.get('/:id', async (req, res) => {
  try {
    const service = await db.service.findFirst({
      where: { OR: [{ id: req.params.id }, { slug: req.params.id }], isActive: true, isDeleted: false },
      include: { category: { select: { id: true, name: true, nameBn: true, slug: true } } },
    })
    if (!service) return res.status(404).json(error('Service not found'))
    res.json(success(service))
  } catch (err: any) {
    res.status(500).json(error(err.message))
  }
})
