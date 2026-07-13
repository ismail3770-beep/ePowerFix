// Admin shipment routes: list, create, get, update, delete, status update.
// Migrated from:
//   apps/web/src/app/api/admin/shipments/route.ts
//   apps/web/src/app/api/admin/shipments/[id]/route.ts
//   apps/web/src/app/api/admin/shipments/[id]/status/route.ts
//
// Mounted at /api/admin/shipments

import { Router } from 'express'
import { z } from 'zod'

import { db } from '../../lib/db.js'
import { asyncHandler, ApiError, validateBody } from '../../lib/api-handler.js'

const router = Router()

const createShipmentSchema = z
  .object({
    orderId: z.string().min(1),
    trackingNumber: z.string().optional(),
    carrier: z.string().optional(),
    status: z.string().optional(),
    estimatedDelivery: z.string().optional(),
    shippedAt: z.string().optional(),
    notes: z.string().optional(),
  })
  .passthrough()

const updateShipmentSchema = z
  .object({
    trackingNumber: z.string().optional(),
    carrier: z.string().optional(),
    status: z.string().optional(),
    estimatedDelivery: z.string().optional(),
    shippedAt: z.string().optional(),
    notes: z.string().optional(),
  })
  .passthrough()

const updateShipmentStatusSchema = z
  .object({
    status: z.string().min(1),
    shippedAt: z.string().optional(),
    deliveredAt: z.string().optional(),
  })
  .passthrough()

// ─── GET /api/admin/shipments ────────────────────────────────────────────────

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const query = req.query as Record<string, any>
    const orderId = query.orderId || undefined

    const where: any = {}
    if (orderId) where.orderId = orderId

    const shipments = await db.shipment.findMany({
      where,
      include: { order: true },
      orderBy: { createdAt: 'desc' },
    })

    res.json({ data: shipments })
  })
)

// ─── POST /api/admin/shipments ───────────────────────────────────────────────

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const body = validateBody(req, createShipmentSchema)

    if (!body.orderId) {
      throw new ApiError('orderId is required', 400)
    }

    const existing = await db.shipment.findUnique({
      where: { orderId: body.orderId },
    })
    if (existing) {
      throw new ApiError('Shipment already exists for this order', 409)
    }

    const shipment = await db.shipment.create({
      data: {
        orderId: body.orderId,
        trackingNumber: body.trackingNumber || null,
        carrier: body.carrier || null,
        status: body.status || 'PENDING',
        estimatedDelivery: body.estimatedDelivery ? new Date(body.estimatedDelivery) : null,
        shippedAt: body.shippedAt ? new Date(body.shippedAt) : null,
        notes: body.notes || null,
      },
      include: { order: true },
    })

    res.status(201).json({ data: shipment, message: 'Shipment created' })
  })
)

// ─── GET /api/admin/shipments/:id ────────────────────────────────────────────

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params

    const shipment = await db.shipment.findUnique({
      where: { id },
      include: { order: true },
    })
    if (!shipment) {
      throw new ApiError('Shipment not found', 404)
    }
    res.json({ data: shipment })
  })
)

// ─── PUT /api/admin/shipments/:id ────────────────────────────────────────────

router.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params
    const body = validateBody(req, updateShipmentSchema)

    const existing = await db.shipment.findUnique({ where: { id } })
    if (!existing) {
      throw new ApiError('Shipment not found', 404)
    }

    const data: any = {}
    if (body.trackingNumber !== undefined) data.trackingNumber = body.trackingNumber || null
    if (body.carrier !== undefined) data.carrier = body.carrier || null
    if (body.status !== undefined) data.status = body.status
    if (body.estimatedDelivery !== undefined) {
      data.estimatedDelivery = body.estimatedDelivery ? new Date(body.estimatedDelivery) : null
    }
    if (body.shippedAt !== undefined) {
      data.shippedAt = body.shippedAt ? new Date(body.shippedAt) : null
    }
    if (body.notes !== undefined) data.notes = body.notes || null

    const shipment = await db.shipment.update({
      where: { id },
      data,
      include: { order: true },
    })

    res.json({ data: shipment, message: 'Shipment updated' })
  })
)

// ─── PUT /api/admin/shipments/:id/status ─────────────────────────────────────

router.put(
  '/:id/status',
  asyncHandler(async (req, res) => {
    const { id } = req.params
    const body = validateBody(req, updateShipmentStatusSchema)

    if (!body?.status) {
      throw new ApiError('status is required', 400)
    }

    const existing = await db.shipment.findUnique({ where: { id } })
    if (!existing) {
      throw new ApiError('Shipment not found', 404)
    }

    const data: any = { status: body.status }
    if (body.status === 'SHIPPED' && !existing.shippedAt) {
      data.shippedAt = new Date()
    }
    if (body.status === 'DELIVERED') {
      data.deliveredAt = body.deliveredAt ? new Date(body.deliveredAt) : new Date()
    }

    const shipment = await db.shipment.update({
      where: { id },
      data,
      include: { order: true },
    })

    res.json({ data: shipment, message: 'Shipment status updated' })
  })
)

// ─── DELETE /api/admin/shipments/:id ─────────────────────────────────────────

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params

    await db.shipment.delete({ where: { id } })
    res.json({ message: 'Shipment deleted' })
  })
)

export default router
