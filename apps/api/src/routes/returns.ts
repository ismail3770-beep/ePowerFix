import { Router } from 'express'
import { db } from '@epowerfix/db'
import { requireAuth } from '../middleware/auth'
import { success, error } from '../utils/response'
import { getPagination } from '@epowerfix/utils'

export const returnsRouter = Router()

// GET /api/returns — the authenticated customer's return requests (paginated)
returnsRouter.get('/', requireAuth, async (req, res) => {
  try {
    const { page = '1', limit = '10', status } = req.query as any
    const { skip, take } = getPagination({ page: Number(page), limit: Number(limit) })
    const where: any = { userId: req.user!.id }
    if (status) where.status = String(status)

    const [data, total] = await Promise.all([
      db.returnRequest.findMany({
        where, skip, take,
        orderBy: { createdAt: 'desc' },
        include: {
          order: { select: { id: true, orderNumber: true, status: true, total: true } },
        },
      }),
      db.returnRequest.count({ where }),
    ])

    res.json(success({ data, pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) } }))
  } catch (err: any) {
    res.status(500).json(error(err.message))
  }
})

// GET /api/returns/:id — single return request (must belong to the customer)
returnsRouter.get('/:id', requireAuth, async (req, res) => {
  try {
    const returnRequest = await db.returnRequest.findFirst({
      where: { id: req.params.id, userId: req.user!.id },
      include: {
        order: {
          select: {
            id: true, orderNumber: true, status: true, total: true, paymentStatus: true,
            items: { select: { id: true, productName: true, productImage: true, quantity: true, price: true, total: true } },
          },
        },
      },
    })
    if (!returnRequest) return res.status(404).json(error('Return request not found'))
    res.json(success(returnRequest))
  } catch (err: any) {
    res.status(500).json(error(err.message))
  }
})
