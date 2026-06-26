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

flashSaleRoutes.get('/', requireAdmin, async (_req, res) => {
  try {
    const flashSales = await db.flashSale.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { products: true } } },
    })
    res.json(success(flashSales))
  } catch (err: any) {
    res.status(500).json(error(err.message))
  }
})

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

flashSaleRoutes.delete('/:id', requireAdmin, async (req, res) => {
  try {
    await db.flashSale.update({
      where: { id: req.params.id },
      data: { isActive: false },
    })
    res.json(success(null, 'Flash sale deactivated'))
  } catch (err: any) {
    res.status(500).json(error(err.message))
  }
})
