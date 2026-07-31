// Admin transaction routes: list payment transactions.
// Backs the admin "Transactions" page (apps/web/src/app/admin/transactions).
//
// Transactions are derived from the existing Payment model (there is no
// dedicated Transaction table) — each payment is shaped into the transaction
// view-model the admin frontend expects.
//
// Mounted at /api/admin/transactions

import { Router } from 'express'
import { z } from 'zod'

import { db } from '../../lib/db.js'
import { asyncHandler, validateQuery } from '../../lib/api-handler.js'

const router = Router()

const listQuerySchema = z.object({
  status: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(200).optional(),
})

function txType(status: string): string {
  const s = status.toUpperCase()
  if (s.includes('REFUND')) return 'REFUND'
  if (s.includes('PAYOUT')) return 'PAYOUT'
  return 'PAYMENT'
}

// ─── GET /api/admin/transactions ─────────────────────────────────────────────

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const q = validateQuery(req, listQuerySchema)
    const page = q.page ?? 1
    const limit = q.limit ?? 50

    const where: any = {}
    if (q.status && q.status !== 'ALL') {
      where.status = q.status
    }
    if (q.search) {
      where.OR = [
        { transactionId: { contains: q.search, mode: 'insensitive' } },
        { order: { orderNumber: { contains: q.search, mode: 'insensitive' } } },
      ]
    }

    const [payments, total] = await Promise.all([
      db.payment.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          order: {
            select: {
              orderNumber: true,
              user: { select: { name: true, email: true } },
            },
          },
        },
      }),
      db.payment.count({ where }),
    ])

    const data = payments.map((p) => ({
      id: p.id,
      orderId: p.orderId,
      orderNumber: p.order?.orderNumber,
      amount: Number(p.amount),
      type: txType(p.status),
      status: p.status,
      method: p.method,
      reference: p.transactionId,
      createdAt: p.createdAt,
      user: p.order?.user ?? null,
      order: p.order ? { orderNumber: p.order.orderNumber } : null,
    }))

    res.json({
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    })
  })
)

export default router
