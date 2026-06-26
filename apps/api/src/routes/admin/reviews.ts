import { Router } from 'express'
import { z } from 'zod'
import { db } from '@epowerfix/db'
import { requireAdmin } from '../../middleware/auth'
import { validate } from '../../middleware/validate'
import { success, error } from '../../utils/response'

export const reviewsRouter = Router()

// GET /api/admin/reviews
reviewsRouter.get('/', requireAdmin, async (req, res) => {
  try {
    const { status } = req.query as any
    const where: any = {}
    if (status) where.status = status

    const reviews = await db.review.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true } },
        product: { select: { id: true, name: true, images: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
    res.json(success(reviews))
  } catch (err: any) {
    res.status(500).json(error(err.message))
  }
})

// PUT /api/admin/reviews/:id — update review status
reviewsRouter.put('/:id', requireAdmin, validate(z.object({
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED']),
})), async (req, res) => {
  try {
    const review = await db.review.update({
      where: { id: req.params.id },
      data: { status: req.body.status },
    })

    // Recalculate product rating if approved
    if (req.body.status === 'APPROVED' && review.productId) {
      const agg = await db.review.aggregate({
        where: { productId: review.productId, status: 'APPROVED' },
        _avg: { rating: true },
        _count: { rating: true },
      })
      await db.product.update({
        where: { id: review.productId },
        data: { rating: agg._avg.rating || 0, reviewCount: agg._count.rating },
      })
    }

    res.json(success(review, 'Review status updated'))
  } catch (err: any) {
    res.status(500).json(error(err.message))
  }
})

// GET /api/admin/reviews/trashed — soft-deleted reviews
reviewsRouter.get('/trashed', requireAdmin, async (_req, res) => {
  try {
    const reviews = await db.review.findMany({
      where: { isDeleted: true },
      include: {
        user: { select: { id: true, name: true, email: true } },
        product: { select: { id: true, name: true, images: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
    res.json(success(reviews))
  } catch (err: any) {
    res.status(500).json(error(err.message))
  }
})

// PUT /api/admin/reviews/:id/restore
reviewsRouter.put('/:id/restore', requireAdmin, async (req, res) => {
  try {
    const review = await db.review.update({ where: { id: req.params.id }, data: { isDeleted: false } })
    res.json(success(review, 'Review restored'))
  } catch (err: any) {
    res.status(500).json(error(err.message))
  }
})

// DELETE /api/admin/reviews/:id (soft delete)
reviewsRouter.delete('/:id', requireAdmin, async (req, res) => {
  try {
    await db.review.update({ where: { id: req.params.id }, data: { isDeleted: true } })
    res.json(success(null, 'Review moved to trash'))
  } catch (err: any) {
    res.status(500).json(error(err.message))
  }
})
