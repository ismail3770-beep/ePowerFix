import { Router } from 'express'
import { z } from 'zod'
import { db } from '@epowerfix/db'
import { requireAdmin } from '../../middleware/auth'
import { validate } from '../../middleware/validate'
import { success, error } from '../../utils/response'

export const quoteRequestsRouter = Router()

// GET /api/admin/quote-requests
quoteRequestsRouter.get('/', requireAdmin, async (_req, res) => {
  try {
    const quoteRequests = await db.quoteRequest.findMany({
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { id: true, name: true, email: true } } },
    })
    res.json(success(quoteRequests))
  } catch (err: any) {
    res.status(500).json(error(err.message))
  }
})

// PUT /api/admin/quote-requests/:id — update status
quoteRequestsRouter.put('/:id', requireAdmin, validate(z.object({
  status: z.enum(['PENDING', 'REPLIED', 'CLOSED']),
})), async (req, res) => {
  try {
    const quoteRequest = await db.quoteRequest.update({
      where: { id: req.params.id },
      data: { status: req.body.status },
    })
    res.json(success(quoteRequest, 'Quote request updated'))
  } catch (err: any) {
    res.status(500).json(error(err.message))
  }
})

// GET /api/admin/quote-requests/trashed — soft-deleted quote requests
quoteRequestsRouter.get('/trashed', requireAdmin, async (_req, res) => {
  try {
    const quoteRequests = await db.quoteRequest.findMany({
      where: { isDeleted: true },
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { id: true, name: true, email: true } } },
    })
    res.json(success(quoteRequests))
  } catch (err: any) {
    res.status(500).json(error(err.message))
  }
})

// PUT /api/admin/quote-requests/:id/restore
quoteRequestsRouter.put('/:id/restore', requireAdmin, async (req, res) => {
  try {
    const quoteRequest = await db.quoteRequest.update({ where: { id: req.params.id }, data: { isDeleted: false } })
    res.json(success(quoteRequest, 'Quote request restored'))
  } catch (err: any) {
    res.status(500).json(error(err.message))
  }
})

// DELETE /api/admin/quote-requests/:id (soft delete)
quoteRequestsRouter.delete('/:id', requireAdmin, async (req, res) => {
  try {
    await db.quoteRequest.update({ where: { id: req.params.id }, data: { isDeleted: true } })
    res.json(success(null, 'Quote request moved to trash'))
  } catch (err: any) {
    res.status(500).json(error(err.message))
  }
})
