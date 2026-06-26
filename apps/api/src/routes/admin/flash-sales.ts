import { Router } from 'express'
import { z } from 'zod'
import { db } from '@epowerfix/db'
import { requireAdmin } from '../../middleware/auth'
import { validate } from '../../middleware/validate'
import { success, error } from '../../utils/response'

export const flashSaleRoutes = Router()

const createFlashSaleSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional().default(''),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  discount: z.number().min(0).max(100, 'Discount must be 0-100'),
  productIds: z.array(z.string()).optional().default([]),
})

const updateFlashSaleSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  discount: z.number().min(0).max(100).optional(),
  isActive: z.boolean().optional(),
  productIds: z.array(z.string()).optional(),
})

// GET /api/admin/flash-sales
flashSaleRoutes.get('/', requireAdmin, async (_req, res) => {
  try {
    const flashSales = await db.flashSale.findMany({
      where: { isDeleted: false },
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { products: true } } },
    })
    res.json(success(flashSales))
  } catch (err: any) {
    res.status(500).json(error(err.message))
  }
})

// GET /api/admin/flash-sales/trash
flashSaleRoutes.get('/trash', requireAdmin, async (_req, res) => {
  try {
    const flashSales = await db.flashSale.findMany({
      where: { isDeleted: true },
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { products: true } } },
    })
    res.json(success(flashSales))
  } catch (err: any) {
    res.status(500).json(error(err.message))
  }
})

// PATCH /api/admin/flash-sales/:id/restore
flashSaleRoutes.patch('/:id/restore', requireAdmin, async (req, res) => {
  try {
    const flashSale = await db.flashSale.update({
      where: { id: req.params.id },
      data: { isDeleted: false },
    })
    res.json(success(flashSale, 'Flash sale restored'))
  } catch (err: any) {
    res.status(500).json(error(err.message))
  }
})

// GET /api/admin/flash-sales/:id
flashSaleRoutes.get('/:id', requireAdmin, async (req, res) => {
  try {
    const flashSale = await db.flashSale.findUnique({
      where: { id: req.params.id },
      include: { products: true },
    })
    if (!flashSale) return res.status(404).json(error('Flash sale not found'))
    res.json(success(flashSale))
  } catch (err: any) {
    res.status(500).json(error(err.message))
  }
})

// POST /api/admin/flash-sales
flashSaleRoutes.post('/', requireAdmin, validate(createFlashSaleSchema), async (req, res) => {
  try {
    const { productIds, ...data } = req.body
    const flashSale = await db.flashSale.create({
      data: {
        ...data,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        products: productIds?.length ? { connect: productIds.map((id: string) => ({ id })) } : undefined,
      },
      include: { products: true },
    })
    res.status(201).json(success(flashSale))
  } catch (err: any) {
    res.status(500).json(error(err.message))
  }
})

// PUT /api/admin/flash-sales/:id
flashSaleRoutes.put('/:id', requireAdmin, validate(updateFlashSaleSchema), async (req, res) => {
  try {
    const { productIds, ...data } = req.body
    const updateData: any = { ...data }
    if (data.startDate) updateData.startDate = new Date(data.startDate)
    if (data.endDate) updateData.endDate = new Date(data.endDate)
    if (productIds) updateData.products = { set: productIds.map((id: string) => ({ id })) }

    const flashSale = await db.flashSale.update({
      where: { id: req.params.id },
      data: updateData,
      include: { products: true },
    })
    res.json(success(flashSale))
  } catch (err: any) {
    res.status(500).json(error(err.message))
  }
})

// DELETE /api/admin/flash-sales/:id (soft delete)
flashSaleRoutes.delete('/:id', requireAdmin, async (req, res) => {
  try {
    await db.flashSale.update({
      where: { id: req.params.id },
      data: { isDeleted: true, isActive: false },
    })
    res.json(success(null, 'Flash sale moved to trash'))
  } catch (err: any) {
    res.status(500).json(error(err.message))
  }
})