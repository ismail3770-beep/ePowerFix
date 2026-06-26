import { Router } from 'express'
import { db } from '@epowerfix/db'
import { requireAuth } from '../../middleware/auth'
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
    const products = await db.product.findMany({
      where: { id: { in: ids }, isDeleted: false },
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
extraPublicRoutes.post('/products/:id/questions', requireAuth, async (req, res) => {
  try {
    const { question } = req.body
    if (!question?.trim()) return res.status(400).json(error('Question is required'))
    const q = await db.productQuestion.create({
      data: {
        productId: req.params.id,
        userId: req.user!.id,
        question: question.trim(),
      },
      include: { user: { select: { id: true, name: true } } },
    })
    res.status(201).json(success(q))
  } catch (err: any) {
    res.status(500).json(error(err.message))
  }
})
