import { Router } from 'express'
import { z } from 'zod'
import { db } from '@epowerfix/db'
import { requireAdmin } from '../../middleware/auth'
import { validate } from '../../middleware/validate'
import { success, error } from '../../utils/response'

export const shipmentsRouter = Router()

const SHIPPING_STATUSES = ['PENDING', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'FAILED'] as const

const createShipmentSchema = z.object({
  orderId: z.string().min(1),
  trackingNumber: z.string().min(1).max(100).optional(),
  carrier: z.string().min(1).max(50).optional(),
  estimatedDelivery: z.string().datetime().optional(),
  notes: z.string().max(2000).optional(),
})

const updateShipmentSchema = z.object({
  trackingNumber: z.string().min(1).max(100).optional(),
  carrier: z.string().min(1).max(50).optional(),
  estimatedDelivery: z.string().datetime().optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
})

const updateShipmentStatusSchema = z.object({
  status: z.enum(SHIPPING_STATUSES),
  note: z.string().max(1000).optional(),
  location: z.string().max(200).optional(),
})

// POST /api/admin/shipments — create shipment for an order (1:1)
shipmentsRouter.post('/', requireAdmin, validate(createShipmentSchema), async (req, res) => {
  try {
    const { orderId, trackingNumber, carrier, estimatedDelivery, notes } = req.body

    const order = await db.order.findUnique({ where: { id: orderId } })
    if (!order) return res.status(404).json(error('Order not found'))

    const existing = await db.shipment.findUnique({ where: { orderId } })
    if (existing) return res.status(409).json(error('Shipment already exists for this order'))

    // Create shipment + initial PENDING history row, atomically
    const [shipment] = await db.$transaction([
      db.shipment.create({
        data: {
          orderId,
          trackingNumber: trackingNumber || null,
          carrier: carrier || null,
          estimatedDelivery: estimatedDelivery ? new Date(estimatedDelivery) : null,
          notes: notes || null,
          histories: {
            create: [{ status: 'PENDING', note: 'Shipment created' }],
          },
        },
        include: { histories: { orderBy: { createdAt: 'asc' } } },
      }),
    ])

    res.status(201).json(success(shipment, 'Shipment created'))
  } catch (err: any) {
    if (err.code === 'P2002') return res.status(409).json(error('Tracking number already exists'))
    res.status(500).json(error(err.message))
  }
})

// GET /api/admin/shipments/:orderId — shipment for an order
shipmentsRouter.get('/:orderId', requireAdmin, async (req, res) => {
  try {
    const shipment = await db.shipment.findUnique({
      where: { orderId: req.params.orderId },
      include: { histories: { orderBy: { createdAt: 'asc' } }, order: { select: { id: true, orderNumber: true, status: true } } },
    })
    if (!shipment) return res.status(404).json(error('Shipment not found for this order'))
    res.json(success(shipment))
  } catch (err: any) {
    res.status(500).json(error(err.message))
  }
})

// PUT /api/admin/shipments/:id — update shipment fields (tracking/carrier/eta/notes)
shipmentsRouter.put('/:id', requireAdmin, validate(updateShipmentSchema), async (req, res) => {
  try {
    const existing = await db.shipment.findUnique({ where: { id: req.params.id } })
    if (!existing) return res.status(404).json(error('Shipment not found'))

    const data: any = { ...req.body }
    if (data.estimatedDelivery) data.estimatedDelivery = new Date(data.estimatedDelivery)

    const shipment = await db.shipment.update({
      where: { id: req.params.id },
      data,
      include: { histories: { orderBy: { createdAt: 'asc' } } },
    })
    res.json(success(shipment, 'Shipment updated'))
  } catch (err: any) {
    if (err.code === 'P2002') return res.status(409).json(error('Tracking number already exists'))
    res.status(500).json(error(err.message))
  }
})

// PUT /api/admin/shipments/:id/status — advance shipment status + record history
shipmentsRouter.put('/:id/status', requireAdmin, validate(updateShipmentStatusSchema), async (req, res) => {
  try {
    const { status, note, location } = req.body
    const shipment = await db.shipment.findUnique({ where: { id: req.params.id } })
    if (!shipment) return res.status(404).json(error('Shipment not found'))

    const updateData: any = { status }
    // Auto-stamp lifecycle timestamps on first entry into these states
    if (status !== 'PENDING' && !shipment.shippedAt) updateData.shippedAt = new Date()
    if (status === 'DELIVERED') updateData.deliveredAt = new Date()

    // Update shipment + append a history row, atomically
    const [updated] = await db.$transaction([
      db.shipment.update({
        where: { id: req.params.id },
        data: updateData,
        include: { histories: { orderBy: { createdAt: 'asc' } } },
      }),
      db.shipmentHistory.create({
        data: { shipmentId: req.params.id, status, note: note || null, location: location || null },
      }),
    ])

    // When the shipment is delivered, sync the parent order to DELIVERED (+ an OrderHistory entry)
    if (status === 'DELIVERED') {
      const order = await db.order.findUnique({ where: { id: shipment.orderId } })
      if (order && order.status !== 'DELIVERED') {
        await db.$transaction([
          db.order.update({
            where: { id: order.id },
            data: { status: 'DELIVERED', deliveredAt: new Date() },
          }),
          db.orderHistory.create({
            data: {
              orderId: order.id,
              userId: req.user!.id,
              status: 'DELIVERED',
              note: 'Shipment delivered',
            },
          }),
        ])
      }
    }

    res.json(success(updated, `Shipment status updated to ${status}`))
  } catch (err: any) {
    res.status(500).json(error(err.message))
  }
})
