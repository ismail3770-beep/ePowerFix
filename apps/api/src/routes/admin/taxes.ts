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

// GET /api/admin/taxes
taxRoutes.get('/', requireAdmin, async (_req, res) => {
  try {
    const taxes = await db.tax.findMany({
      where: { isDeleted: false },
      orderBy: { createdAt: 'desc' },
    })
    res.json(success(taxes))
  } catch (err: any) {
    res.status(500).json(error(err.message))
  }
})

// GET /api/admin/taxes/trash
taxRoutes.get('/trash', requireAdmin, async (_req, res) => {
  try {
    const taxes = await db.tax.findMany({
      where: { isDeleted: true },
      orderBy: { createdAt: 'desc' },
    })
    res.json(success(taxes))
  } catch (err: any) {
    res.status(500).json(error(err.message))
  }
})

// PATCH /api/admin/taxes/:id/restore
taxRoutes.patch('/:id/restore', requireAdmin, async (req, res) => {
  try {
    const tax = await db.tax.update({
      where: { id: req.params.id },
      data: { isDeleted: false },
    })
    res.json(success(tax, 'Tax restored'))
  } catch (err: any) {
    res.status(500).json(error(err.message))
  }
})

// POST /api/admin/taxes
taxRoutes.post('/', requireAdmin, validate(createTaxSchema), async (req, res) => {
  try {
    const tax = await db.tax.create({ data: req.body })
    res.status(201).json(success(tax))
  } catch (err: any) {
    res.status(500).json(error(err.message))
  }
})

// PUT /api/admin/taxes/:id
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

// DELETE /api/admin/taxes/:id (soft delete)
taxRoutes.delete('/:id', requireAdmin, async (req, res) => {
  try {
    await db.tax.update({
      where: { id: req.params.id },
      data: { isDeleted: true, isActive: false },
    })
    res.json(success(null, 'Tax moved to trash'))
  } catch (err: any) {
    res.status(500).json(error(err.message))
  }
})