import { Router } from 'express'
import { z } from 'zod'
import { db } from '@epowerfix/db'
import { requireAdmin } from '../../middleware/auth'
import { validate } from '../../middleware/validate'
import { success, error } from '../../utils/response'

export const taxRoutes = Router()

const createTaxSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  rate: z.number().min(0, 'Rate must be >= 0'),
  type: z.enum(['PERCENTAGE', 'FLAT']).optional().default('PERCENTAGE'),
  isActive: z.boolean().optional().default(true),
})

const updateTaxSchema = z.object({
  name: z.string().min(1).optional(),
  rate: z.number().min(0).optional(),
  type: z.enum(['PERCENTAGE', 'FLAT']).optional(),
  isActive: z.boolean().optional(),
})

taxRoutes.get('/', requireAdmin, async (_req, res) => {
  try {
    const taxes = await db.tax.findMany({
      orderBy: { createdAt: 'desc' },
    })
    res.json(success(taxes))
  } catch (err: any) {
    res.status(500).json(error(err.message))
  }
})

taxRoutes.post('/', requireAdmin, validate(createTaxSchema), async (req, res) => {
  try {
    const tax = await db.tax.create({ data: req.body })
    res.status(201).json(success(tax))
  } catch (err: any) {
    res.status(500).json(error(err.message))
  }
})

taxRoutes.put('/:id', requireAdmin, validate(updateTaxSchema), async (req, res) => {
  try {
    const tax = await db.tax.update({
      where: { id: req.params.id },
      data: req.body,
    })
    res.json(success(tax))
  } catch (err: any) {
    res.status(500).json(error(err.message))
  }
})

taxRoutes.delete('/:id', requireAdmin, async (req, res) => {
  try {
    await db.tax.delete({ where: { id: req.params.id } })
    res.json(success(null, 'Tax deleted'))
  } catch (err: any) {
    res.status(500).json(error(err.message))
  }
})
