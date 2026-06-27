import { Router } from 'express'
import { z } from 'zod'
import { db } from '@epowerfix/db'
import { requireAdmin } from '../../middleware/auth'
import { validate } from '../../middleware/validate'
import { success, error } from '../../utils/response'
import { getPagination } from '@epowerfix/utils'

export const messagesRouter = Router()

// GET /api/admin/messages — list all contact messages
messagesRouter.get('/', requireAdmin, async (req, res) => {
  try {
    const { status } = req.query as any
    const page = Number(req.query.page) || 1
    const limit = Number(req.query.limit) || 20
    const { skip, take } = getPagination({ page, limit })
    const where: any = { isDeleted: false }
    if (status) where.status = status

    const [messages, total] = await Promise.all([
      db.contact.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: { user: { select: { id: true, name: true, email: true, avatar: true } } },
      }),
      db.contact.count({ where }),
    ])
    res.json(success({ data: messages, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } }))
  } catch (err: any) {
    res.status(500).json(error(err.message))
  }
})

// PUT /api/admin/messages/:id — update status
messagesRouter.put('/:id', requireAdmin, validate(z.object({
  status: z.enum(['NEW', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']),
})), async (req, res) => {
  try {
    const message = await db.contact.update({
      where: { id: req.params.id },
      data: { status: req.body.status },
    })
    res.json(success(message, 'Message status updated'))
  } catch (err: any) {
    res.status(500).json(error(err.message))
  }
})

// GET /api/admin/messages/trashed — soft-deleted messages
messagesRouter.get('/trashed', requireAdmin, async (_req, res) => {
  try {
    const messages = await db.contact.findMany({
      where: { isDeleted: true },
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { id: true, name: true, email: true, avatar: true } } },
    })
    res.json(success(messages))
  } catch (err: any) {
    res.status(500).json(error(err.message))
  }
})

// PUT /api/admin/messages/:id/restore
messagesRouter.put('/:id/restore', requireAdmin, async (req, res) => {
  try {
    const message = await db.contact.update({ where: { id: req.params.id }, data: { isDeleted: false } })
    res.json(success(message, 'Message restored'))
  } catch (err: any) {
    res.status(500).json(error(err.message))
  }
})

// DELETE /api/admin/messages/:id (soft delete)
messagesRouter.delete('/:id', requireAdmin, async (req, res) => {
  try {
    await db.contact.update({ where: { id: req.params.id }, data: { isDeleted: true } })
    res.json(success(null, 'Message moved to trash'))
  } catch (err: any) {
    res.status(500).json(error(err.message))
  }
})
