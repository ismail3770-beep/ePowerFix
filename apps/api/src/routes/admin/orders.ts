import { Router } from 'express'
import { z } from 'zod'
import { db } from '@epowerfix/db'
import { requireAdmin } from '../../middleware/auth'
import { validate } from '../../middleware/validate'
import { success, error } from '../../utils/response'
import { getPagination } from '@epowerfix/utils'

export const ordersRouter = Router()

// GET /api/admin/orders
ordersRouter.get('/', requireAdmin, async (req, res) => {
  try {
    const { page = '1', limit = '20', status, paymentStatus, search } = req.query as any
    const { skip, take } = getPagination({ page: Number(page), limit: Number(limit) })
    const where: any = { isDeleted: false }
    if (status) where.status = String(status)
    if (paymentStatus) where.paymentStatus = String(paymentStatus)
    if (search) where.orderNumber = { contains: String(search), mode: 'insensitive' }

    const [data, total] = await Promise.all([
      db.order.findMany({
        where, skip, take,
        orderBy: { createdAt: 'desc' },
        include: {
          items: true,
          user: { select: { id: true, name: true, email: true, phone: true } },
        },
      }),
      db.order.count({ where }),
    ])

    res.json(success({ data, pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) } }))
  } catch (err: any) {
    res.status(500).json(error(err.message))
  }
})

// GET /api/admin/orders/:id
ordersRouter.get('/:id', requireAdmin, async (req, res) => {
  try {
    const order = await db.order.findUnique({
      where: { id: req.params.id },
      include: {
        items: { include: { product: { select: { id: true, name: true, slug: true, images: true } } } },
        user: { select: { id: true, name: true, email: true, phone: true } },
        address: true,
        coupon: { select: { code: true } },
        payments: { orderBy: { createdAt: 'desc' } },
        shipment: {
          include: { histories: { orderBy: { createdAt: 'asc' } } },
        },
        histories: {
          orderBy: { createdAt: 'asc' },
          include: { user: { select: { id: true, name: true, role: true } } },
        },
      },
    })
    if (!order) return res.status(404).json(error('Order not found'))
    res.json(success(order))
  } catch (err: any) {
    res.status(500).json(error(err.message))
  }
})

// PUT /api/admin/orders/:id/status
ordersRouter.put('/:id/status', requireAdmin, validate(z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'RETURNED']),
  paymentStatus: z.enum(['PENDING', 'PAID', 'FAILED', 'REFUNDED', 'PARTIAL_REFUND']).optional(),
  note: z.string().max(1000).optional(),
})), async (req, res) => {
  try {
    const order = await db.order.findUnique({ where: { id: req.params.id } })
    if (!order) return res.status(404).json(error('Order not found'))

    const updateData: any = { status: req.body.status }
    if (req.body.paymentStatus) updateData.paymentStatus = req.body.paymentStatus
    if (req.body.status === 'DELIVERED') updateData.deliveredAt = new Date()

    // Atomically update order status + create history record
    const [updated] = await db.$transaction([
      db.order.update({ where: { id: req.params.id }, data: updateData }),
      db.orderHistory.create({
        data: {
          orderId: req.params.id,
          userId: req.user!.id,
          status: req.body.status,
          note: req.body.note || null,
        },
      }),
    ])
    res.json(success(updated, `Order status updated to ${req.body.status}`))
  } catch (err: any) {
    res.status(500).json(error(err.message))
  }
})

// POST /api/admin/orders/:id/refund — record a refund as a new Payment
ordersRouter.post('/:id/refund', requireAdmin, validate(z.object({
  amount: z.number().positive('Refund amount must be positive'),
  reason: z.string().max(500).optional(),
})), async (req, res) => {
  try {
    const order = await db.order.findUnique({ where: { id: req.params.id } })
    if (!order) return res.status(404).json(error('Order not found'))

    // Wrap the entire refund operation in a transaction to prevent race conditions
    const result = await db.$transaction(async (tx) => {
      // Sum existing refunds (negative amounts) for this order
      const existingRefunds = await tx.payment.aggregate({
        where: { orderId: order.id, status: 'REFUNDED', amount: { lt: 0 } },
        _sum: { amount: true },
      })
      const totalRefunded = Math.abs(existingRefunds._sum.amount || 0)

      if (totalRefunded + Number(req.body.amount) > Number(order.total)) {
        return { error: 'Refund amount exceeds order total' }
      }

      // Create a refund Payment record (negative amount convention)
      const refund = await tx.payment.create({
        data: {
          orderId: order.id,
          amount: -Number(req.body.amount),
          method: order.paymentMethod,
          status: 'REFUNDED',
          paymentData: { type: 'refund', reason: req.body.reason || null } as any,
        },
      })

      // Update denormalized order payment status
      const totalRefundedAfter = totalRefunded + Number(req.body.amount)
      const fullRefund = totalRefundedAfter >= Number(order.total)
      const updatedOrder = await tx.order.update({
        where: { id: order.id },
        data: { paymentStatus: fullRefund ? 'REFUNDED' : 'PARTIAL_REFUND' },
      })

      return { refund, fullRefund }
    })

    if (result.error) return res.status(400).json(error(result.error))

    res.status(201).json(success(result.refund, result.fullRefund ? 'Order fully refunded' : 'Partial refund recorded'))
  } catch (err: any) {
    res.status(500).json(error(err.message))
  }
})
