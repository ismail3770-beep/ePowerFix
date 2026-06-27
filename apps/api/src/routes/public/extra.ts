import { Router } from 'express'
import { z } from 'zod'
import { db } from '@epowerfix/db'
import { requireAuth } from '../../middleware/auth'
import { validate } from '../../middleware/validate'
import { success, error } from '../../utils/response'

export const extraPublicRoutes = Router()

// Product Comparison (public)
extraPublicRoutes.get('/products/compare', async (req, res) => {
  try {
    const ids = (req.query.ids as string)?.split(',').filter(Boolean)
    if (!ids || ids.length < 2) {
      return res.status(400).json(error('Provide at least 2 product IDs'))
    }
    if (ids.length > 4) {
      return res.status(400).json(error('Maximum 4 products can be compared'))
    }
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    for (const id of ids) {
      if (!uuidRegex.test(id)) {
        return res.status(400).json(error('Invalid product ID format'))
      }
    }
    const products = await db.product.findMany({
      where: { id: { in: ids }, isActive: true, isDeleted: false },
      include: {
        category: true,
        brand: true,
        _count: { select: { reviews: true } },
      },
    })
    const data = products.map((p) => {
      const avgRating = Number(p.rating) || 0
      return { ...p, averageRating: Math.round(avgRating * 10) / 10 }
    })
    res.json(success(data))
  } catch (err: any) {
    res.status(500).json(error(err.message))
  }
})

// Active Flash Sales (public)
extraPublicRoutes.get('/flash-sales', async (req, res) => {
  try {
    const now = new Date()
    const flashSales = await db.flashSale.findMany({
      where: {
        isActive: true,
        startDate: { lte: now },
        endDate: { gte: now },
      },
      include: {
        products: {
          where: { isDeleted: false },
          include: { category: true, brand: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
    res.json(success(flashSales))
  } catch (err: any) {
    res.status(500).json(error(err.message))
  }
})

// Product Q&A — public read
extraPublicRoutes.get('/products/:id/questions', async (req, res) => {
  try {
    const questions = await db.productQuestion.findMany({
      where: { productId: req.params.id, isDeleted: false },
      include: {
        user: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
    res.json(success(questions))
  } catch (err: any) {
    res.status(500).json(error(err.message))
  }
})

// Product Q&A — ask question (auth required)
const questionSchema = z.object({
  question: z.string().min(1).max(500),
})

extraPublicRoutes.post('/products/:id/questions', requireAuth, validate(questionSchema), async (req, res) => {
  try {
    const q = await db.productQuestion.create({
      data: {
        productId: req.params.id,
        userId: req.user!.id,
        question: req.body.question.trim(),
      },
      include: { user: { select: { id: true, name: true } } },
    })
    res.status(201).json(success(q))
  } catch (err: any) {
    res.status(500).json(error(err.message))
  }
})
