import { Router } from 'express'
import { z } from 'zod'
import { db } from '@epowerfix/db'
import { requireAdmin } from '../../middleware/auth'
import { validate } from '../../middleware/validate'
import { success, error } from '../../utils/response'
import { getPagination } from '@epowerfix/utils'

export const returnsRouter = Router()

const updateReturnSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED', 'COMPLETED']),
  refundAmount: z.number().positive().optional(),
  notes: z.string().max(2000).optional(),
})

// GET /api/admin/returns — all return requests (paginated, filter by status)
returnsRouter.get('/', requireAdmin, async (req, res) => {
  try {
    const { page = '1', limit = '20', status } = req.query as any
    const { skip, take } = getPagination({ page: Number(page), limit: Number(limit) })
    const where: any = {}
    if (status) where.status = String(status)

    const [data, total] = await Promise.all([
      db.returnRequest.findMany({
        where, skip, take,
        orderBy: { createdAt: 'desc' },
        include: {
          order: { select: { id: true, orderNumber: true, status: true, total: true, paymentStatus: true } },
          user: { select: { id: true, name: true, email: true, phone: true } },
        },
      }),
      db.returnRequest.count({ where }),
    ])

    res.json(success({ data, pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) } }))
  } catch (err: any) {
    res.status(500).json(error(err.message))
  }
})

// GET /api/admin/returns/:id — detail (include order + user)
returnsRouter.get('/:id', requireAdmin, async (req, res) => {
  try {
    const returnRequest = await db.returnRequest.findUnique({
      where: { id: req.params.id },
      include: {
        order: {
          select: {
            id: true, orderNumber: true, status: true, total: true, paymentStatus: true, paymentMethod: true,
            items: { select: { id: true, productName: true, productImage: true, quantity: true, price: true, total: true } },
          },
        },
        user: { select: { id: true, name: true, email: true, phone: true } },
      },
    })
    if (!returnRequest) return res.status(404).json(error('Return request not found'))
    res.json(success(returnRequest))
  } catch (err: any) {
    res.status(500).json(error(err.message))
  }
})

// PUT /api/admin/returns/:id — status update + (optionally) refund amount
returnsRouter.put('/:id', requireAdmin, validate(updateReturnSchema), async (req, res) => {
  try {
    const { status, refundAmount, notes } = req.body

    const existing = await db.returnRequest.findUnique({ where: { id: req.params.id } })
    if (!existing) return res.status(404).json(error('Return request not found'))

    // Guards: only PENDING requests can be approved/rejected; only APPROVED can be completed
    if (status === 'APPROVED' && existing.status !== 'PENDING') {
      return res.status(400).json(error('Only pending requests can be approved'))
    }
    if (status === 'REJECTED' && existing.status !== 'PENDING') {
      return res.status(400).json(error('Only pending requests can be rejected'))
    }
    if (status === 'COMPLETED' && existing.status !== 'APPROVED') {
      return res.status(400).json(error('Only approved requests can be completed'))
    }

    // APPROVED requires a refund amount; COMPLETED requires one already on record
    if (status === 'APPROVED' && !refundAmount) {
      return res.status(400).json(error('Refund amount is required to approve'))
    }
    const finalRefund = status === 'APPROVED' ? Number(refundAmount) : Number(existing.refundAmount)
    if (status === 'COMPLETED' && (!finalRefund || finalRefund <= 0)) {
      return res.status(400).json(error('No refund amount set on this request'))
    }

    if (status === 'APPROVED' || status === 'REJECTED') {
      const updateData: any = { status }
      if (status === 'APPROVED') updateData.refundAmount = refundAmount
      if (notes !== undefined) updateData.notes = notes

      const notifMessage = status === 'APPROVED'
        ? `Your return request has been approved. Refund of ৳${Number(refundAmount)} will be processed shortly.`
        : `Your return request has been rejected. ${notes ? `Reason: ${notes}` : 'Please contact support for details.'}`

      const [updated] = await db.$transaction([
        db.returnRequest.update({ where: { id: req.params.id }, data: updateData }),
        db.notification.create({
          data: {
            userId: existing.userId,
            title: status === 'APPROVED' ? 'Return Request Approved' : 'Return Request Rejected',
            message: notifMessage,
            type: 'RETURN',
            relatedId: existing.id,
          },
        }),
      ])
      res.json(success(updated, `Return request ${status.toLowerCase()}`))
      return
    }

    // COMPLETED — refund Payment record + flip the order, all atomically
    const order = await db.order.findUnique({ where: { id: existing.orderId } })
    if (!order) return res.status(400).json(error('Linked order not found'))

    const [updated] = await db.$transaction([
      db.returnRequest.update({
        where: { id: req.params.id },
        data: { status: 'COMPLETED', notes: notes !== undefined ? notes : undefined },
      }),
      db.payment.create({
        data: {
          orderId: order.id,
          amount: -finalRefund, // negative convention for refunds (matches /refund route)
          method: order.paymentMethod,
          status: 'REFUNDED',
          paymentData: { type: 'return_refund', returnRequestId: existing.id } as any,
        },
      }),
      db.order.update({
        where: { id: order.id },
        data: { paymentStatus: 'REFUNDED', status: 'RETURNED' },
      }),
      db.orderHistory.create({
        data: {
          orderId: order.id,
          userId: req.user!.id,
          status: 'RETURNED',
          note: `Return completed — refund ৳${finalRefund}`,
        },
      }),
      db.notification.create({
        data: {
          userId: existing.userId,
          title: 'Refund Processed',
          message: `Your return has been completed. A refund of ৳${finalRefund} has been processed to your original payment method.`,
          type: 'RETURN',
          relatedId: existing.id,
        },
      }),
    ])

    res.json(success(updated, 'Return completed and refund recorded'))
  } catch (err: any) {
    res.status(500).json(error(err.message))
  }
})
