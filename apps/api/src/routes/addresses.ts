// Address routes: list, create, update, delete
import { Router } from 'express'
import { z } from 'zod'

import { db } from '../lib/db.js'
import { asyncHandler, ApiError, validateBody } from '../lib/api-handler.js'
import { requireAuth, getAuthUser } from '../lib/auth.js'

const router = Router()

// ─── Zod Schemas ──────────────────────────────────────────────────────────────

const createAddressSchema = z
  .object({
    fullName: z.string().min(2).max(100),
    phone: z.string().min(6).max(20),
    address: z.string().min(3).max(300),
    area: z.string().max(100).optional(),
    city: z.string().min(2).max(100),
    postalCode: z.string().max(20).optional(),
    label: z.string().max(50).optional(),
    isDefault: z.boolean().optional(),
  })
  .passthrough()

const updateAddressSchema = z
  .object({
    fullName: z.string().min(2).max(100).optional(),
    phone: z.string().min(6).max(20).optional(),
    address: z.string().min(3).max(300).optional(),
    area: z.string().max(100).optional(),
    city: z.string().min(2).max(100).optional(),
    postalCode: z.string().max(20).optional(),
    label: z.string().max(50).optional(),
    isDefault: z.boolean().optional(),
  })
  .passthrough()

// ─── Helper: ensure address belongs to user ───────────────────────────────────

async function getOwnedAddress(id: string, userId: string) {
  const address = await db.userAddress.findUnique({ where: { id } })
  if (!address || address.userId !== userId) return null
  return address
}

// ─── GET /api/addresses ───────────────────────────────────────────────────────
// List current user's addresses.

router.get(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = getAuthUser(req)

    const addresses = await db.userAddress.findMany({
      where: { userId: user.id },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    })
    res.json({ data: addresses })
  })
)

// ─── POST /api/addresses ──────────────────────────────────────────────────────
// Create a new address.

router.post(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const body = validateBody(req, createAddressSchema)
    const user = getAuthUser(req)

    // If this address is marked default, unset any existing default first.
    if (body.isDefault) {
      await db.userAddress.updateMany({
        where: { userId: user.id, isDefault: true },
        data: { isDefault: false },
      })
    }

    // If the user has no addresses yet, force this one to be the default.
    const existingCount = await db.userAddress.count({ where: { userId: user.id } })
    const makeDefault = body.isDefault || existingCount === 0

    const address = await db.userAddress.create({
      data: {
        userId: user.id,
        fullName: body.fullName.trim(),
        phone: body.phone.trim(),
        address: body.address.trim(),
        area: body.area?.trim() || null,
        city: body.city.trim(),
        postalCode: body.postalCode?.trim() || null,
        label: body.label?.trim() || null,
        isDefault: makeDefault,
      },
    })

    res.status(201).json({
      data: address,
      message: 'Address added successfully',
    })
  })
)

// ─── PUT /api/addresses/:id ───────────────────────────────────────────────────
// Update an address (also handles set-default).

router.put(
  '/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const body = validateBody(req, updateAddressSchema)
    const user = getAuthUser(req)
    const id = String(req.params.id)

    const existing = await getOwnedAddress(id, user.id)
    if (!existing) {
      throw new ApiError('Address not found', 404)
    }

    // If marking as default, unset any other default first.
    if (body.isDefault && !existing.isDefault) {
      await db.userAddress.updateMany({
        where: { userId: user.id, isDefault: true, id: { not: id } },
        data: { isDefault: false },
      })
    }

    const data: any = {}
    if (body.fullName !== undefined) data.fullName = body.fullName.trim()
    if (body.phone !== undefined) data.phone = body.phone.trim()
    if (body.address !== undefined) data.address = body.address.trim()
    if (body.area !== undefined) data.area = body.area?.trim() || null
    if (body.city !== undefined) data.city = body.city.trim()
    if (body.postalCode !== undefined) data.postalCode = body.postalCode?.trim() || null
    if (body.label !== undefined) data.label = body.label?.trim() || null
    if (body.isDefault !== undefined) data.isDefault = body.isDefault

    const updated = await db.userAddress.update({ where: { id }, data })
    res.json({ data: updated, message: 'Address updated successfully' })
  })
)

// ─── DELETE /api/addresses/:id ────────────────────────────────────────────────
// Remove an address. Promotes the next-most-recent address to default if the
// deleted one was the default.

router.delete(
  '/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = getAuthUser(req)
    const id = String(req.params.id)

    const existing = await getOwnedAddress(id, user.id)
    if (!existing) {
      throw new ApiError('Address not found', 404)
    }

    await db.userAddress.delete({ where: { id } })

    // If the deleted address was the default, promote the most recent remaining
    // address to default (so the user always has a default for checkout).
    if (existing.isDefault) {
      const next = await db.userAddress.findFirst({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
      })
      if (next) {
        await db.userAddress.update({
          where: { id: next.id },
          data: { isDefault: true },
        })
      }
    }

    res.json({ message: 'Address deleted successfully' })
  })
)

export default router
