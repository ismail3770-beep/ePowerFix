import { Router } from 'express'
import { z } from 'zod'
import { db } from '@epowerfix/db'
import { requireAuth } from '../middleware/auth'
import { validate } from '../middleware/validate'
import { success, error } from '../utils/response'

export const cartRouter = Router()

const addToCartSchema = z.object({
  productId: z.string().min(1),
  variantId: z.string().min(1).optional(),
  quantity: z.number().int().min(1).max(99).default(1),
})

// GET /api/cart — get cart items (auth required)
cartRouter.get('/', requireAuth, async (req, res) => {
  try {
    const items = await db.cartItem.findMany({
      where: { userId: req.user!.id },
      include: {
        product: { select: { id: true, name: true, nameBn: true, price: true, salePrice: true, images: true, stock: true, isActive: true, hasVariant: true } },
        variant: { select: { id: true, name: true, sku: true, price: true, salePrice: true, stock: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Filter out invalid products
    const validItems = items.filter(i => i.product.isActive && (i.variant ? i.variant.stock > 0 : i.product.stock > 0))

    const subtotal = validItems.reduce((sum, i) => {
      const price = i.variant ? Number(i.variant.salePrice || i.variant.price) : Number(i.product.salePrice || i.product.price)
      return sum + price * i.quantity
    }, 0)
    const totalItems = validItems.reduce((sum, i) => sum + i.quantity, 0)

    res.json(success({ items: validItems, subtotal, totalItems }))
  } catch (err: any) {
    res.status(500).json(error(err.message))
  }
})

// POST /api/cart — add item (auth required)
cartRouter.post('/', requireAuth, validate(addToCartSchema), async (req, res) => {
  try {
    const { productId, variantId, quantity } = req.body

    // Validate product
    const product = await db.product.findUnique({
      where: { id: productId },
      select: { id: true, stock: true, isActive: true },
    })
    if (!product || !product.isActive) return res.status(404).json(error('Product not available'))

    // If variantId provided, validate variant
    let stock = product.stock
    if (variantId) {
      const variant = await db.productVariant.findFirst({
        where: { id: variantId, productId, isActive: true },
      })
      if (!variant) return res.status(404).json(error('Variant not available'))
      stock = variant.stock
    }

    if (stock < quantity) return res.status(400).json(error('Not enough stock'))

    const existing = await db.cartItem.findFirst({
      where: { userId: req.user!.id, productId, ...(variantId ? { variantId } : { variantId: null }) },
    })
    if (existing) {
      const newQty = Math.min(existing.quantity + quantity, stock)
      await db.cartItem.update({ where: { id: existing.id }, data: { quantity: newQty } })
    } else {
      await db.cartItem.create({
        data: { userId: req.user!.id, productId, ...(variantId ? { variantId } : {}), quantity },
      })
    }

    res.json(success(null, 'Added to cart'))
  } catch (err: any) {
    res.status(500).json(error(err.message))
  }
})

// PUT /api/cart/:id — update quantity (auth required)
cartRouter.put('/:id', requireAuth, validate(z.object({ quantity: z.number().int().min(0) })), async (req, res) => {
  try {
    if (req.body.quantity === 0) {
      await db.cartItem.delete({ where: { id: req.params.id } })
      return res.json(success(null, 'Item removed'))
    }
    await db.cartItem.update({ where: { id: req.params.id }, data: { quantity: req.body.quantity } })
    res.json(success(null, 'Cart updated'))
  } catch (err: any) {
    res.status(500).json(error(err.message))
  }
})

// DELETE /api/cart/:id — remove item (auth required)
cartRouter.delete('/:id', requireAuth, async (req, res) => {
  try {
    await db.cartItem.delete({ where: { id: req.params.id } })
    res.json(success(null, 'Item removed'))
  } catch (err: any) {
    res.status(500).json(error(err.message))
  }
})
