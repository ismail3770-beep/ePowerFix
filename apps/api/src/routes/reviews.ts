import { Router } from 'express'
import { z } from 'zod'
import { db } from '@epowerfix/db'
import { requireAuth } from '../middleware/auth'
import { validate } from '../middleware/validate'
import { success, error } from '../utils/response'

export const reviewsRouter = Router()

// GET /api/reviews?productId=xxx
reviewsRouter.get('/', async (req, res) => {
  try {
    const { productId, page = '1', limit = '10' } = req.query as any
    if (!productId) return res.status(400).json(error('productId is required'))

    const where = { productId: String(productId), status: 'APPROVED' as const }
    const skip = (Number(page) - 1) * Number(limit)
    const take = Number(limit)

    const [data, total] = await Promise.all([
      db.review.findMany({
        where, skip, take,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { name: true, avatar: true } } },
      }),
      db.review.count({ where }),
    ])

    const agg = await db.review.aggregate({
      where: { productId: String(productId), status: 'APPROVED' },
      _avg: { rating: true },
      _count: { rating: true },
    })

    res.json(success({
      data,
      pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) },
      averageRating: agg._avg.rating || 0,
      totalReviews: agg._count.rating,
    }))
  } catch (err: any) {
    res.status(500).json(error(err.message))
  }
})

// POST /api/reviews (auth required)
reviewsRouter.post('/', requireAuth, validate(z.object({
  productId: z.string(),
  rating: z.number().int().min(1).max(5),
  title: z.string().optional().default(''),
  comment: z.string().optional().default(''),
})), async (req, res) => {
  try {
    const { productId, rating, title, comment } = req.body

    const existing = await db.review.findFirst({ where: { userId: req.user!.id, productId } })
    if (existing) return res.status(409).json(error('You have already reviewed this product'))

    const review = await db.review.create({
      data: { userId: req.user!.id, productId, rating, title, comment, status: 'PENDING' },
    })

    res.status(201).json(success(review, 'Review submitted'))
  } catch (err: any) {
    res.status(500).json(error(err.message))
  }
})
