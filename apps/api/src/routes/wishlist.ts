import { Router } from 'express'
import { z } from 'zod'
import { db } from '@epowerfix/db'
import { requireAuth } from '../middleware/auth'
import { validate } from '../middleware/validate'
import { success, error } from '../utils/response'

export const wishlistRouter = Router()

// GET /api/wishlist (auth required)
wishlistRouter.get('/', requireAuth, async (req, res) => {
  try {
    const items = await db.wishlist.findMany({
      where: { userId: req.user!.id },
      include: {
        product: { select: { id: true, name: true, nameBn: true, price: true, salePrice: true, images: true, stock: true, rating: true, reviewCount: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
    res.json(success(items))
  } catch (err: any) {
    res.status(500).json(error(err.message))
  }
})

// POST /api/wishlist (auth required)
wishlistRouter.post('/', requireAuth, validate(z.object({ productId: z.string() })), async (req, res) => {
  try {
    const item = await db.wishlist.create({ data: { userId: req.user!.id, productId: req.body.productId } })
    res.status(201).json(success(item, 'Added to wishlist'))
  } catch (err: any) {
    if (err.code === 'P2002') return res.status(409).json(error('Already in wishlist'))
    res.status(500).json(error(err.message))
  }
})

// DELETE /api/wishlist/:id (auth required)
wishlistRouter.delete('/:id', requireAuth, async (req, res) => {
  try {
    await db.wishlist.delete({ where: { id: req.params.id, userId: req.user!.id } })
    res.json(success(null, 'Removed from wishlist'))
  } catch (err: any) {
    res.status(500).json(error(err.message))
  }
})
