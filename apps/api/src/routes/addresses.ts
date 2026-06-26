import { Router } from 'express'
import { z } from 'zod'
import { db } from '@epowerfix/db'
import { requireAuth } from '../middleware/auth'
import { validate } from '../middleware/validate'
import { success, error } from '../utils/response'

export const addressesRouter = Router()

const createAddressSchema = z.object({
  label: z.string().max(50).optional(),
  fullName: z.string().min(2, 'Name is required').max(100),
  phone: z.string().regex(/^(\+880|0)1[3-9]\d{8}$/, 'Invalid BD phone number'),
  address: z.string().min(5, 'Address is too short').max(500),
  city: z.string().min(2, 'City is required').max(100),
  area: z.string().max(100).optional(),
  postalCode: z.string().max(20).optional(),
  isDefault: z.boolean().optional().default(false),
})

const updateAddressSchema = createAddressSchema.partial().omit({ isDefault: true })

// GET /api/addresses — user's addresses
addressesRouter.get('/', requireAuth, async (req, res) => {
  try {
    const addresses = await db.userAddress.findMany({
      where: { userId: req.user!.id, isDeleted: false },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    })
    res.json(success(addresses))
  } catch (err: any) {
    res.status(500).json(error(err.message))
  }
})

// POST /api/addresses — create address
addressesRouter.post('/', requireAuth, validate(createAddressSchema), async (req, res) => {
  try {
    const { isDefault, ...data } = req.body

    // If setting as default, unset previous default
    if (isDefault) {
      await db.userAddress.updateMany({
        where: { userId: req.user!.id, isDefault: true },
        data: { isDefault: false },
      })
    }

    const address = await db.userAddress.create({
      data: { ...data, userId: req.user!.id, isDefault: isDefault ?? false },
    })

    res.status(201).json(success(address, 'Address created'))
  } catch (err: any) {
    res.status(500).json(error(err.message || 'Failed to create address'))
  }
})

// PUT /api/addresses/:id — update address
addressesRouter.put('/:id', requireAuth, validate(updateAddressSchema), async (req, res) => {
  try {
    const existing = await db.userAddress.findFirst({
      where: { id: req.params.id, userId: req.user!.id, isDeleted: false },
    })
    if (!existing) return res.status(404).json(error('Address not found'))

    const address = await db.userAddress.update({
      where: { id: req.params.id },
      data: req.body,
    })

    res.json(success(address, 'Address updated'))
  } catch (err: any) {
    res.status(500).json(error(err.message || 'Failed to update address'))
  }
})

// DELETE /api/addresses/:id — soft delete
addressesRouter.delete('/:id', requireAuth, async (req, res) => {
  try {
    const existing = await db.userAddress.findFirst({
      where: { id: req.params.id, userId: req.user!.id, isDeleted: false },
    })
    if (!existing) return res.status(404).json(error('Address not found'))

    await db.userAddress.update({
      where: { id: req.params.id },
      data: { isDeleted: true, isDefault: false },
    })

    res.json(success(null, 'Address deleted'))
  } catch (err: any) {
    res.status(500).json(error(err.message || 'Failed to delete address'))
  }
})

// PUT /api/addresses/:id/default — set as default
addressesRouter.put('/:id/default', requireAuth, async (req, res) => {
  try {
    const existing = await db.userAddress.findFirst({
      where: { id: req.params.id, userId: req.user!.id, isDeleted: false },
    })
    if (!existing) return res.status(404).json(error('Address not found'))

    // Unset all other defaults for this user
    await db.userAddress.updateMany({
      where: { userId: req.user!.id, isDefault: true },
      data: { isDefault: false },
    })

    const address = await db.userAddress.update({
      where: { id: req.params.id },
      data: { isDefault: true },
    })

    res.json(success(address, 'Default address updated'))
  } catch (err: any) {
    res.status(500).json(error(err.message || 'Failed to set default address'))
  }
})
