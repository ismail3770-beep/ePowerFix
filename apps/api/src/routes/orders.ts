import { Router } from 'express'
import { z } from 'zod'
import { db } from '@epowerfix/db'
import { requireAuth } from '../middleware/auth'
import { validate } from '../middleware/validate'
import { success, error } from '../utils/response'
import { getPagination } from '@epowerfix/utils'
import { getDeliveryCharge } from '@epowerfix/config'

export const ordersRouter = Router()

const createOrderSchema = z.object({
  items: z.array(z.object({
    productId: z.string(),
    variantId: z.string().optional(),
    quantity: z.number().int().min(1),
  })).min(1),
  addressId: z.string().optional(),
  customerName: z.string().optional(),
  customerPhone: z.string().optional(),
  customerEmail: z.string().optional(),
  address: z.string().optional(),
  area: z.string().optional(),
  notes: z.string().optional(),
  couponCode: z.string().optional(),
  paymentMethod: z.enum(['COD', 'BKASH', 'NAGAD', 'SSLCOMMERZ', 'BANK_TRANSFER']),
})

// GET /api/orders — user's orders (paginated)
ordersRouter.get('/', requireAuth, async (req, res) => {
  try {
    const { page = '1', limit = '10', status } = req.query as any
    const { skip, take } = getPagination({ page: Number(page), limit: Number(limit) })
    const where: any = { userId: req.user!.id }
    if (status) where.status = String(status)

    const [data, total] = await Promise.all([
      db.order.findMany({
        where, skip, take,
        orderBy: { createdAt: 'desc' },
        include: {
          items: { select: { id: true, productName: true, productImage: true, quantity: true, price: true, total: true } },
          coupon: { select: { code: true, type: true, value: true } },
        },
      }),
      db.order.count({ where }),
    ])

    res.json(success({ data, pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) } }))
  } catch (err: any) {
    res.status(500).json(error(err.message))
  }
})

// GET /api/orders/:id — single order
ordersRouter.get('/:id', requireAuth, async (req, res) => {
  try {
    const order = await db.order.findFirst({
      where: { id: req.params.id, userId: req.user!.id },
      include: {
        items: { include: { product: { select: { id: true, name: true, slug: true, images: true } } } },
        coupon: { select: { code: true } },
        address: true,
        shipment: {
          include: { histories: { orderBy: { createdAt: 'asc' } } },
        },
        histories: {
          orderBy: { createdAt: 'asc' },
          include: { user: { select: { id: true, name: true, role: true } } },
        },
      },
    })
    if (!order) return res.status(404).json(error('Order not found'))
    res.json(success(order))
  } catch (err: any) {
    res.status(500).json(error(err.message))
  }
})

// GET /api/orders/:id/tracking — customer-facing shipment tracking
ordersRouter.get('/:id/tracking', requireAuth, async (req, res) => {
  try {
    // Verify the order belongs to the authenticated user
    const order = await db.order.findFirst({
      where: { id: req.params.id, userId: req.user!.id },
      select: { id: true },
    })
    if (!order) return res.status(404).json(error('Order not found'))

    const shipment = await db.shipment.findUnique({
      where: { orderId: order.id },
      include: { histories: { orderBy: { createdAt: 'asc' }, select: { status: true, note: true, location: true, createdAt: true } } },
    })

    if (!shipment) {
      return res.status(404).json(error('Shipment not created yet'))
    }

    const timeline = shipment.histories.map((h) => ({
      status: h.status,
      date: h.createdAt,
      note: h.note,
      location: h.location,
    }))

    res.json(success({
      trackingNumber: shipment.trackingNumber,
      carrier: shipment.carrier,
      status: shipment.status,
      estimatedDelivery: shipment.estimatedDelivery,
      shippedAt: shipment.shippedAt,
      timeline,
    }))
  } catch (err: any) {
    res.status(500).json(error(err.message))
  }
})

// POST /api/orders — create order
ordersRouter.post('/', requireAuth, validate(createOrderSchema), async (req, res) => {
  try {
    const { items, couponCode, paymentMethod, addressId, notes, customerName, customerPhone, customerEmail, address: addressText, area } = req.body

    // Validate or create address
    let address: any = null
    if (addressId) {
      address = await db.userAddress.findFirst({
        where: { id: addressId, userId: req.user!.id, isDeleted: false },
      })
      if (!address) return res.status(400).json(error('Invalid or deleted address'))
    } else if (addressText && area) {
      address = await db.userAddress.create({
        data: {
          userId: req.user!.id,
          label: customerName || 'Checkout',
          fullName: customerName || '',
          phone: customerPhone || '',
          address: addressText,
          area,
          city: 'Dhaka',
          isDefault: false,
        },
      })
    } else {
      return res.status(400).json(error('Provide addressId or inline address + area'))
    }

    // Validate products and calculate subtotal
    const productIds = items.map((i: any) => i.productId)
    const products = await db.product.findMany({ where: { id: { in: productIds }, isActive: true } })
    if (products.length !== productIds.length) return res.status(400).json(error('Some products are unavailable'))

    // Collect variantIds and validate variants
    const variantIds = items.map((i: any) => i.variantId).filter(Boolean)
    let variants: any[] = []
    if (variantIds.length > 0) {
      variants = await db.productVariant.findMany({
        where: { id: { in: variantIds }, isActive: true },
      })
      if (variants.length !== variantIds.length) return res.status(400).json(error('Some variants are unavailable'))
    }

    // Check stock
    for (const item of items) {
      if (item.variantId) {
        const variant = variants.find((v: any) => v.id === item.variantId)
        if (!variant || variant.stock < item.quantity) return res.status(400).json(error(`Insufficient stock for variant`))
      } else {
        const product = products.find((p: any) => p.id === item.productId)
        if (!product || product.stock < item.quantity) return res.status(400).json(error(`Insufficient stock for ${product?.name || 'product'}`))
      }
    }

    let subtotal = 0
    const orderItems = items.map((item: any) => {
      const product = products.find((p: any) => p.id === item.productId)!
      let itemPrice: number
      let variantName: string | null = null

      if (item.variantId) {
        const variant = variants.find((v: any) => v.id === item.variantId)!
        itemPrice = Number(variant.salePrice || variant.price)
        variantName = variant.name
      } else {
        itemPrice = Number(product.salePrice || product.price)
      }

      subtotal += itemPrice * item.quantity
      return {
        productId: product.id,
        variantId: item.variantId || null,
        productName: product.name,
        productImage: product.images?.[0] || null,
        variantName,
        quantity: item.quantity,
        price: itemPrice,
        total: itemPrice * item.quantity,
      }
    })

    // Delivery charge using config
    const deliveryFee = getDeliveryCharge(address.address, subtotal)

    // Coupon
    let discount = 0
    let couponId: string | null = null
    if (couponCode) {
      const coupon = await db.coupon.findFirst({
        where: {
          code: couponCode.toUpperCase(),
          isActive: true,
          startDate: { lte: new Date() },
          endDate: { gte: new Date() },
        },
      })
      if (!coupon) return res.status(400).json(error('Invalid or expired coupon'))
      if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
        return res.status(400).json(error('Coupon usage limit reached'))
      }

      // Per-user usage check — each user may use a coupon only once
      const alreadyUsed = await db.couponUsage.findUnique({
        where: { couponId_userId: { couponId: coupon.id, userId: req.user!.id } },
      })
      if (alreadyUsed) return res.status(400).json(error('You have already used this coupon'))

      if (coupon.minOrder && subtotal < Number(coupon.minOrder)) {
        return res.status(400).json(error(`Minimum order ৳${coupon.minOrder} for this coupon`))
      }

      if (coupon.type === 'PERCENTAGE') {
        discount = Math.min(subtotal * Number(coupon.value) / 100, Number(coupon.maxDiscount || subtotal))
      } else {
        discount = Number(coupon.value)
      }
      couponId = coupon.id
    }

    const totalAmount = subtotal + deliveryFee - discount

    const orderNumber = 'EPF-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase()

    const order = await db.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          orderNumber,
          userId: req.user!.id,
          status: 'PENDING',
          subtotal,
          deliveryCharge: deliveryFee,
          discount,
          total: totalAmount,
          paymentMethod,
          paymentStatus: 'PENDING',
          couponId,
          addressId,
          notes: notes || null,
          items: { create: orderItems },
          payments: {
            create: [{
              amount: totalAmount,
              method: paymentMethod,
              status: 'PENDING',
              paymentData: { source: 'checkout', method: paymentMethod } as any,
            }],
          },
          histories: {
            create: [{
              userId: req.user!.id,
              status: 'PENDING',
              note: 'Order placed',
            }],
          },
        },
        include: { items: true, address: true, payments: true, histories: true },
      })

      // Update stock (product or variant) inside the same transaction
      for (const item of items) {
        if (item.variantId) {
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: { stock: { decrement: item.quantity } },
          })
        } else {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { decrement: item.quantity } },
          })
        }
      }

      return created
    })

    // Record coupon usage (per-user tracking) + increment global usedCount
    if (couponId) {
      await db.$transaction([
        db.couponUsage.create({
          data: { couponId, userId: req.user!.id, orderId: order.id },
        }),
        db.coupon.update({
          where: { id: couponId },
          data: { usedCount: { increment: 1 } },
        }),
      ])
    }

    // Clear cart
    await db.cartItem.deleteMany({ where: { userId: req.user!.id } })

    res.status(201).json(success(order, 'Order placed successfully'))
  } catch (err: any) {
    res.status(500).json(error(err.message || 'Failed to create order'))
  }
})

// POST /api/orders/:id/cancel — customer cancels their own order
ordersRouter.post('/:id/cancel', requireAuth, async (req, res) => {
  try {
    const order = await db.order.findFirst({
      where: { id: req.params.id, userId: req.user!.id },
    })
    if (!order) return res.status(404).json(error('Order not found'))

    // Only PENDING/CONFIRMED orders can be cancelled by the customer
    if (!['PENDING', 'CONFIRMED'].includes(order.status)) {
      return res.status(400).json(error(`Order cannot be cancelled (current status: ${order.status})`))
    }

    const [updated] = await db.$transaction([
      db.order.update({ where: { id: req.params.id }, data: { status: 'CANCELLED' } }),
      db.orderHistory.create({
        data: {
          orderId: req.params.id,
          userId: req.user!.id,
          status: 'CANCELLED',
          note: req.body?.note || 'Cancelled by customer',
        },
      }),
    ])

    // Restore stock on cancellation
    const items = await db.orderItem.findMany({ where: { orderId: req.params.id } })
    for (const item of items) {
      if (item.variantId) {
        await db.productVariant.update({
          where: { id: item.variantId },
          data: { stock: { increment: item.quantity } },
        })
      } else {
        await db.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        })
      }
    }

    res.json(success(updated, 'Order cancelled'))
  } catch (err: any) {
    res.status(500).json(error(err.message || 'Failed to cancel order'))
  }
})

// POST /api/orders/:id/return — customer requests a return/refund
const createReturnSchema = z.object({
  reason: z.string().min(10, 'Please describe the reason (min 10 chars)').max(2000),
})

ordersRouter.post('/:id/return', requireAuth, validate(createReturnSchema), async (req, res) => {
  try {
    // 1. Order must exist and belong to the authenticated user
    const order = await db.order.findFirst({
      where: { id: req.params.id, userId: req.user!.id },
    })
    if (!order) return res.status(404).json(error('Order not found'))

    // 2. Only delivered orders can be returned
    if (order.status !== 'DELIVERED') {
      return res.status(400).json(error('Only delivered orders can be returned'))
    }

    // 3. Prevent duplicate pending return requests
    const existing = await db.returnRequest.findFirst({
      where: { orderId: order.id, status: 'PENDING' },
    })
    if (existing) return res.status(409).json(error('Return request already exists'))

    const returnRequest = await db.returnRequest.create({
      data: {
        orderId: order.id,
        userId: req.user!.id,
        reason: req.body.reason,
      },
    })

    res.status(201).json(success(returnRequest, 'Return request submitted'))
  } catch (err: any) {
    res.status(500).json(error(err.message || 'Failed to create return request'))
  }
})
