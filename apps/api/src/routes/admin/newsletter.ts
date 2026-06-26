import { Router } from 'express'
import { db } from '@epowerfix/db'
import { requireAdmin } from '../../middleware/auth'
import { success, error } from '../../utils/response'

export const newsletterRouter = Router()

// GET /api/admin/newsletter — list all subscribers
newsletterRouter.get('/', requireAdmin, async (_req, res) => {
  try {
    const subscribers = await db.newsletter.findMany({ orderBy: { createdAt: 'desc' } })
    res.json(success(subscribers))
  } catch (err: any) {
    res.status(500).json(error(err.message))
  }
})

// GET /api/admin/newsletter/trashed — soft-deleted subscribers
newsletterRouter.get('/trashed', requireAdmin, async (_req, res) => {
  try {
    const subscribers = await db.newsletter.findMany({ where: { isDeleted: true }, orderBy: { createdAt: 'desc' } })
    res.json(success(subscribers))
  } catch (err: any) {
    res.status(500).json(error(err.message))
  }
})

// PUT /api/admin/newsletter/:id/restore
newsletterRouter.put('/:id/restore', requireAdmin, async (req, res) => {
  try {
    const subscriber = await db.newsletter.update({ where: { id: req.params.id }, data: { isDeleted: false } })
    res.json(success(subscriber, 'Subscriber restored'))
  } catch (err: any) {
    res.status(500).json(error(err.message))
  }
})

// DELETE /api/admin/newsletter/:id (soft delete)
newsletterRouter.delete('/:id', requireAdmin, async (req, res) => {
  try {
    await db.newsletter.update({ where: { id: req.params.id }, data: { isDeleted: true } })
    res.json(success(null, 'Subscriber moved to trash'))
  } catch (err: any) {
    res.status(500).json(error(err.message))
  }
})
