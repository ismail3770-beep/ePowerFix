// Order routes: list, create, payment status, track, return request.
// Migrated from apps/web/src/app/api/orders/* (Next.js route handlers → Express).

import { Router } from 'express'
import { z } from 'zod'

import { db } from '../lib/db.js'
import { asyncHandler, ApiError, validateBody } from '../lib/api-handler.js'
import {
  requireAuth,
  optionalAuth,
  getAuthUser,
  type SessionUser,
} from '../lib/auth.js'
import { parseJsonField } from '../lib/helpers.js'
import {
  ONLINE_PAYMENT_METHODS,
  PAYMENT_RESERVATION_DURATION_MS,
  releaseOrderReservation,
} from '../lib/order-reservations.js'
import { sendOrderConfirmation } from '../lib/email.js'

const router = Router()

const SUPPORTED_PAYMENT_METHODS = ['COD', 'BKASH', 'NAGAD', 'SSLCOMMERZ'] as const

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Fire-and-forget: notify all active admin users of an event.
 * Errors are swallowed so a notification failure never breaks the parent flow.
 */
async function notifyAdmins(
  title: string,
  message: string,
  type: string = 'INFO',
  relatedId?: string,
): Promise<void> {
  try {
    const admins = await db.user.findMany({
      where: { role: 'ADMIN', isActive: true },
      select: { id: true },
    })
    if (admins.length === 0) return

    await db.notification.createMany({
      data: admins.map((admin: any) => ({
        userId: admin.id,
        title,
        message,
        type,
        relatedId: relatedId || null,
      })),
    })
  } catch (err) {
    console.error('[notifications] failed to notify admins:', err)
  }
}

/**
 * Builds a human-readable order number with a date prefix and a random suffix
 * to avoid collisions under concurrent inserts.
 */
function orderNumber(seq: number, rand: number = 0): string {
  const d = new Date()
  const ymd =
    `${d.getFullYear()}` +
    `${String(d.getMonth() + 1).padStart(2, '0')}` +
    `${String(d.getDate()).padStart(2, '0')}`
  return rand > 0
    ? `EPF-${ymd}-${String(seq).padStart(4, '0')}-${rand}`
    : `EPF-${ymd}-${String(seq).padStart(4, '0')}`
}

function addIdentityIssue(
  ctx: z.RefinementCtx,
  path: string,
  message: string,
): void {
  ctx.addIssue({ code: z.ZodIssueCode.custom, path: [path], message })
}

function requestParam(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] || '' : value || ''
}

function canReuseIdempotentOrder(
  order: any,
  userId: string | null,
  customerPhone: string,
): boolean {
  if (order.userId !== userId) return false
  // A guest has no authenticated principal. Requiring the original phone avoids
  // returning an order simply because a random idempotency key was guessed.
  return userId !== null || order.customerPhone === customerPhone
}

type ActiveOnlinePaymentReservation = {
  id: string
  orderNumber: string
  paymentMethod: string
  reservationExpiresAt: Date | null
}

/**
 * Finds the user's oldest viable online-payment reservation and releases any
 * malformed or expired ACTIVE rows first. The returned order is deliberately
 * minimal because it is sent to the authenticated owner as a retry marker.
 */
async function findActiveOnlinePaymentReservation(
  tx: any,
  userId: string,
): Promise<ActiveOnlinePaymentReservation | null> {
  const candidates = await tx.order.findMany({
    where: {
      userId,
      reservationStatus: 'ACTIVE',
      paymentStatus: 'PENDING',
      paymentMethod: { in: [...ONLINE_PAYMENT_METHODS] },
    },
    select: {
      id: true,
      orderNumber: true,
      paymentMethod: true,
      reservationExpiresAt: true,
    },
    orderBy: [{ reservationExpiresAt: 'asc' }, { createdAt: 'asc' }],
  })

  const now = Date.now()
  for (const candidate of candidates) {
    const expiresAt = candidate.reservationExpiresAt?.getTime() ?? 0
    if (expiresAt <= now) {
      await releaseOrderReservation(tx, candidate.id, 'EXPIRED')
      continue
    }

    return candidate
  }

  return null
}

/**
 * Serializes online order creation per customer. Without this lock, two tabs
 * could both observe no active reservation and reserve inventory twice before
 * either order row is committed.
 */
async function lockUserOnlineCheckout(tx: any, userId: string): Promise<void> {
  const lock = await tx.user.updateMany({
    where: { id: userId },
    // Updating only the audit timestamp takes a row lock for the transaction
    // without changing any customer profile data.
    data: { updatedAt: new Date() },
  })

  if (lock.count !== 1) {
    throw new ApiError('User session is no longer valid', 401)
  }
}

// ─── Zod Schemas ──────────────────────────────────────────────────────────────

const orderItemSchema = z
  .object({
    itemType: z.enum(['PRODUCT', 'SERVICE', 'PROJECT', 'PROJECT_KIT']).default('PRODUCT'),
    productId: z.string().optional(),
    serviceId: z.string().optional(),
    projectId: z.string().optional(),
    projectKitId: z.string().optional(),
    variantId: z.string().optional(),
    quantity: z.number().int().min(1).default(1),
  })
  .superRefine((item, ctx) => {
    if (item.itemType === 'PRODUCT' && !item.productId) {
      addIdentityIssue(ctx, 'productId', 'productId is required for product items')
    }
    if (item.itemType === 'SERVICE' && !item.serviceId) {
      addIdentityIssue(ctx, 'serviceId', 'serviceId is required for service items')
    }
    if (item.itemType === 'PROJECT_KIT' && !item.projectKitId) {
      addIdentityIssue(ctx, 'projectKitId', 'projectKitId is required for project kit items')
    }
    // PROJECT remains supported for actual portfolio Projects and for legacy
    // clients that sent a ProjectKit id as projectId. The server resolves the
    // latter to projectKitId before it is persisted.
    if (item.itemType === 'PROJECT' && !item.projectId && !item.projectKitId) {
      addIdentityIssue(ctx, 'projectId', 'projectId is required for project items')
    }
  })

const createOrderSchema = z.object({
  customerName: z.string().min(1).max(200),
  customerPhone: z.string().min(6).max(20),
  customerEmail: z.string().email().optional().or(z.literal('')),
  address: z.string().min(1).max(500),
  area: z.string().optional(),
  notes: z.string().max(2000).optional(),
  couponCode: z.string().max(50).optional(),
  paymentMethod: z.string().trim().min(1).max(50),
  idempotencyKey: z.string().trim().min(16).max(200).optional(),
  items: z.array(orderItemSchema).min(1, 'At least one item is required'),
})

const createReturnSchema = z
  .object({
    reason: z.string().min(1),
  })
  .passthrough()

// ─── GET /api/orders — list current user's orders ─────────────────────────────

router.get(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = getAuthUser(req)
    const limit = Math.min(
      50,
      Math.max(1, parseInt((req.query.limit as string) || '20', 10)),
    )

    const orders = await db.order.findMany({
      where: { userId: user.id },
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { items: true },
    })

    res.json({ data: orders })
  }),
)

// ─── GET /api/orders/track — public order tracking ────────────────────────────
// IMPORTANT: declared before /:id so the literal path isn't shadowed.

router.get(
  '/track',
  asyncHandler(async (req, res) => {
    const orderNumberValue =
      typeof req.query.orderNumber === 'string' ? req.query.orderNumber.trim() : ''
    const phone =
      typeof req.query.phone === 'string' ? req.query.phone.trim() : ''

    if (!orderNumberValue || !phone) {
      throw new ApiError('orderNumber and phone are required', 400)
    }

    const order = await db.order.findFirst({
      where: { orderNumber: orderNumberValue, customerPhone: phone },
      include: { items: true },
    })

    if (!order) {
      throw new ApiError('Order not found', 404)
    }

    const histories = await db.orderHistory.findMany({
      where: { orderId: order.id },
      orderBy: { createdAt: 'asc' },
    })

    res.json({
      data: {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        paymentStatus: order.paymentStatus,
        paymentMethod: order.paymentMethod,
        total: order.total,
        subtotal: order.subtotal,
        deliveryCharge: order.deliveryCharge,
        discount: order.discount,
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        createdAt: order.createdAt,
        items: order.items,
        histories,
      },
    })
  }),
)

// ─── GET /api/orders/active-payment-reservation — owner-only recovery ────────

router.get(
  '/active-payment-reservation',
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = getAuthUser(req)
    const reservation = await (db as any).$transaction((tx: any) =>
      findActiveOnlinePaymentReservation(tx, user.id),
    )

    res.json({ data: reservation })
  }),
)

// ─── GET /api/orders/:id/payment-status — owner-only payment verification ─────

router.get(
  '/:id/payment-status',
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = getAuthUser(req)
    const id = requestParam(req.params.id)
    if (!id) throw new ApiError('Order ID is required', 400)

    const order = await (db as any).order.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        orderNumber: true,
        status: true,
        paymentStatus: true,
        paymentMethod: true,
        reservationStatus: true,
        reservationExpiresAt: true,
      },
    })

    if (!order) throw new ApiError('Order not found', 404)
    if (order.userId !== user.id) throw new ApiError('Forbidden', 403)

    res.json({ data: order })
  }),
)

// ─── POST /api/orders — create order (public; attaches to user if logged in) ──

router.post(
  '/',
  optionalAuth,
  asyncHandler(async (req, res) => {
    const {
      customerName,
      customerPhone,
      customerEmail,
      area,
      notes,
      couponCode,
      paymentMethod,
      idempotencyKey,
      items,
    } = validateBody(req, createOrderSchema)

    const normalizedPaymentMethod = paymentMethod.toUpperCase()
    if (!SUPPORTED_PAYMENT_METHODS.includes(normalizedPaymentMethod as any)) {
      throw new ApiError('Unsupported payment method', 400)
    }

    // optionalAuth attaches the user if a valid session exists; otherwise we
    // proceed as a guest checkout (userId = null).
    const authUser = getAuthUser(req) as SessionUser | undefined
    const userId = authUser?.id ?? null
    const isOnlinePayment = ONLINE_PAYMENT_METHODS.has(normalizedPaymentMethod)

    // Online attempts must be attached to an account before stock, coupons, or
    // an order row are mutated. COD remains available to guests.
    if (isOnlinePayment && !userId) {
      throw new ApiError('Please log in before using an online payment method', 403)
    }

    const reservationExpiresAt = isOnlinePayment
      ? new Date(Date.now() + PAYMENT_RESERVATION_DURATION_MS)
      : null

    let orderResult: { order: any; reused: boolean }

    try {
      orderResult = await (db as any).$transaction(async (tx: any) => {
        // Acquire the per-user transaction lock before checking idempotency.
        // Concurrent retries with the same key must still return the first
        // order rather than being mistaken for a separate pending checkout.
        if (isOnlinePayment && userId) {
          await lockUserOnlineCheckout(tx, userId)
        }

        if (idempotencyKey) {
          const existing = await tx.order.findUnique({
            where: { idempotencyKey },
            include: { items: true },
          })
          if (existing) {
            if (!canReuseIdempotentOrder(existing, userId, customerPhone)) {
              throw new ApiError('Idempotency key is already in use', 409)
            }
            return { order: existing, reused: true }
          }
        }

        if (isOnlinePayment && userId) {
          const activeReservation = await findActiveOnlinePaymentReservation(
            tx,
            userId,
          )
          if (activeReservation) {
            throw new ApiError(
              'An online payment is already pending. Resume or verify that payment before creating another online order.',
              409,
            )
          }
        }

        // Prices and inventory are resolved inside the same transaction as the
        // order write. Client cart prices are display-only and never trusted.
        const lineItems: any[] = []
        let subtotal = 0

        for (const item of items) {
          const qty = Math.max(1, item.quantity)
          let unitPrice = 0
          let productName = ''
          let productImage: string | null = null
          let variantName: string | null = null
          let itemType = item.itemType
          let productId: string | null = null
          let variantId: string | null = null
          let serviceId: string | null = null
          let projectId: string | null = null
          let projectKitId: string | null = null
          let inventoryReserved = false

          if (item.itemType === 'SERVICE') {
            const service = await tx.service.findFirst({
              where: { id: item.serviceId, isActive: true, isDeleted: false },
            })
            if (!service) throw new ApiError('Service is not available', 400)

            unitPrice = service.basePrice
            productName = service.name
            productImage = parseJsonField(service.images)[0] || null
            serviceId = service.id
          } else if (item.itemType === 'PROJECT_KIT') {
            const kit = await tx.projectKit.findFirst({
              where: {
                id: item.projectKitId,
                isActive: true,
                isDeleted: false,
              },
            })
            if (!kit) throw new ApiError('Project kit is not available', 400)

            const reservation = await tx.projectKit.updateMany({
              where: {
                id: kit.id,
                isActive: true,
                isDeleted: false,
                stock: { gte: qty },
              },
              data: { stock: { decrement: qty } },
            })
            if (reservation.count !== 1) {
              throw new ApiError('Project kit is out of stock or no longer available', 409)
            }

            unitPrice = kit.salePrice ?? kit.price
            productName = kit.title
            productImage = kit.coverImage || parseJsonField(kit.images)[0] || null
            projectKitId = kit.id
            inventoryReserved = isOnlinePayment
          } else if (item.itemType === 'PROJECT') {
            // Legacy carts used PROJECT + projectId for ProjectKit ids. Prefer a
            // live kit match so legacy checkout remains functional, but persist
            // the canonical PROJECT_KIT itemType and projectKitId relation.
            const legacyKitId = item.projectKitId ?? item.projectId
            const kit = legacyKitId
              ? await tx.projectKit.findFirst({
                  where: { id: legacyKitId, isActive: true, isDeleted: false },
                })
              : null

            if (kit) {
              const reservation = await tx.projectKit.updateMany({
                where: {
                  id: kit.id,
                  isActive: true,
                  isDeleted: false,
                  stock: { gte: qty },
                },
                data: { stock: { decrement: qty } },
              })
              if (reservation.count !== 1) {
                throw new ApiError('Project kit is out of stock or no longer available', 409)
              }

              itemType = 'PROJECT_KIT'
              unitPrice = kit.salePrice ?? kit.price
              productName = kit.title
              productImage = kit.coverImage || parseJsonField(kit.images)[0] || null
              projectKitId = kit.id
              inventoryReserved = isOnlinePayment
            } else {
              const project = await tx.project.findFirst({
                where: { id: item.projectId, isSellable: true, isDeleted: false },
              })
              if (!project || (project.price === null && project.salePrice === null)) {
                throw new ApiError('Project is not available', 400)
              }

              unitPrice = project.salePrice ?? project.price!
              productName = project.title
              productImage = project.coverImage || parseJsonField(project.images)[0] || null
              projectId = project.id
            }
          } else {
            const product = await tx.product.findFirst({
              where: { id: item.productId, isActive: true, isDeleted: false },
              include: { variants: true },
            })
            if (!product) throw new ApiError('Product is not available', 400)

            if (item.variantId) {
              const variant = product.variants.find(
                (candidate: any) => candidate.id === item.variantId && candidate.isActive,
              )
              if (!variant) throw new ApiError('Variant is not available', 400)

              if (!product.isDigital) {
                const reservation = await tx.productVariant.updateMany({
                  where: {
                    id: variant.id,
                    productId: product.id,
                    isActive: true,
                    stock: { gte: qty },
                  },
                  data: { stock: { decrement: qty } },
                })
                if (reservation.count !== 1) {
                  throw new ApiError('Product variant is out of stock', 409)
                }
                inventoryReserved = isOnlinePayment
              }

              unitPrice = variant.salePrice ?? variant.price
              variantName = variant.name
              variantId = variant.id
            } else {
              if (!product.isDigital) {
                const reservation = await tx.product.updateMany({
                  where: {
                    id: product.id,
                    isActive: true,
                    isDeleted: false,
                    isDigital: false,
                    stock: { gte: qty },
                  },
                  data: { stock: { decrement: qty } },
                })
                if (reservation.count !== 1) {
                  throw new ApiError('Product is out of stock or no longer available', 409)
                }
                inventoryReserved = isOnlinePayment
              }

              unitPrice = product.salePrice ?? product.price
            }

            productName = product.name
            productImage = parseJsonField(product.images)[0] || null
            productId = product.id
          }

          const lineTotal = unitPrice * qty
          subtotal += lineTotal
          lineItems.push({
            itemType,
            productId,
            variantId,
            serviceId,
            projectId,
            projectKitId,
            productName,
            productImage,
            variantName,
            price: unitPrice,
            quantity: qty,
            total: lineTotal,
            inventoryReserved,
          })
        }

        // Delivery charge — read from site settings; fall back to defaults.
        let siteSettings: any = null
        try {
          siteSettings = await tx.siteSettings.findUnique({ where: { id: 'default' } })
        } catch {
          // Ignore a missing settings record and retain current checkout defaults.
        }
        const insideDhakaRate = siteSettings?.shippingInsideDhaka ?? 60
        const outsideDhakaRate = siteSettings?.shippingOutsideDhaka ?? 120
        const freeShippingThreshold = siteSettings?.freeShippingThreshold ?? 0

        const isInsideDhaka = !!(area && /dhaka|ঢাকা/i.test(area))
        let deliveryCharge = isInsideDhaka ? insideDhakaRate : outsideDhakaRate
        if (freeShippingThreshold > 0 && subtotal >= freeShippingThreshold) {
          deliveryCharge = 0
        }

        // Coupon values are calculated from the authoritative transaction
        // subtotal. A later conditional increment reserves limited coupons.
        let discount = 0
        let couponId: string | null = null
        let couponUsageLimit: number | null = null
        if (couponCode) {
          const now = new Date()
          const coupon = await tx.coupon.findFirst({
            where: {
              code: couponCode.trim().toUpperCase(),
              isActive: true,
              isDeleted: false,
              startDate: { lte: now },
              endDate: { gte: now },
            },
          })
          const meetsMinimum =
            coupon?.minOrder === null ||
            coupon?.minOrder === undefined ||
            subtotal >= coupon.minOrder
          const hasUsageRemaining =
            coupon?.usageLimit === null ||
            coupon?.usageLimit === undefined ||
            coupon.usedCount < coupon.usageLimit

          if (coupon && meetsMinimum && hasUsageRemaining) {
            if (coupon.type === 'PERCENTAGE') {
              discount = (subtotal * coupon.value) / 100
              if (coupon.maxDiscount !== null) {
                discount = Math.min(discount, coupon.maxDiscount)
              }
            } else {
              discount = coupon.value
            }
            // Discount cannot exceed the subtotal (delivery is never discounted).
            discount = Math.min(discount, subtotal)
            couponId = coupon.id
            couponUsageLimit = coupon.usageLimit
          }
        }

        // Total cannot go negative even if discount somehow exceeds subtotal + delivery.
        const total = Math.max(0, subtotal + deliveryCharge - discount)

        // Generate a unique order number. Pure count-based numbers can collide
        // under concurrent inserts; the random suffix preserves the existing
        // order-number contract while making collisions exceptionally unlikely.
        const seqHint = await tx.order.count({
          where: { createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
        })
        const rand = Math.floor(1000 + Math.random() * 9000)
        const newOrderNumber = orderNumber(seqHint + 1, rand)

        const created = await tx.order.create({
          data: {
            orderNumber: newOrderNumber,
            userId,
            customerName,
            customerPhone,
            customerEmail: customerEmail || null,
            subtotal,
            deliveryCharge,
            discount,
            taxAmount: 0,
            total,
            status: 'PENDING',
            paymentStatus: 'PENDING',
            paymentMethod: normalizedPaymentMethod,
            idempotencyKey: idempotencyKey || null,
            reservationStatus: isOnlinePayment ? 'ACTIVE' : 'COMMITTED',
            reservationExpiresAt,
            couponId,
            notes: notes || null,
            items: { create: lineItems },
          },
          include: { items: true },
        })

        // CouponUsage's unique key makes authenticated double-submission safe;
        // updateMany atomically enforces a global usage limit for all checkouts.
        if (couponId) {
          if (userId) {
            const usage = await tx.couponUsage.createMany({
              data: [{ couponId, userId, orderId: created.id }],
              skipDuplicates: true,
            })
            if (usage.count !== 1) {
              throw new ApiError('This coupon has already been used by this account', 409)
            }
          }

          const now = new Date()
          const couponReservation = await tx.coupon.updateMany({
            where: {
              id: couponId,
              isActive: true,
              isDeleted: false,
              startDate: { lte: now },
              endDate: { gte: now },
              ...(couponUsageLimit === null ? {} : { usedCount: { lt: couponUsageLimit } }),
            },
            data: { usedCount: { increment: 1 } },
          })
          if (couponReservation.count !== 1) {
            throw new ApiError('Coupon is no longer available', 409)
          }
        }

        await tx.orderHistory.create({
          data: {
            orderId: created.id,
            userId,
            status: 'PENDING',
            note: isOnlinePayment
              ? 'Order placed; inventory reserved pending online payment'
              : 'Order placed',
          },
        })

        return { order: created, reused: false }
      })
    } catch (error: any) {
      // A concurrent request with the same key can race past the initial
      // lookup. The unique index is the source of truth; safely return the
      // already-created order only to its original owner.
      if (idempotencyKey && error?.code === 'P2002') {
        const existing = await (db as any).order.findUnique({
          where: { idempotencyKey },
          include: { items: true },
        })
        if (existing) {
          if (!canReuseIdempotentOrder(existing, userId, customerPhone)) {
            throw new ApiError('Idempotency key is already in use', 409)
          }
          orderResult = { order: existing, reused: true }
        } else {
          throw error
        }
      } else {
        throw error
      }
    }

    if (!orderResult.reused) {
      // Notify all admins about the new order (shows up in the admin bell icon).
      await notifyAdmins(
        'New Order Placed',
        `Order ${orderResult.order.orderNumber} (৳${orderResult.order.total}) has been placed by ${customerName}.`,
        'ORDER',
        orderResult.order.id,
      )

      // Send order confirmation email to the customer (COD orders only — online
      // payment orders are emailed after the gateway callback confirms payment).
      const isOnlinePaymentOrder = ONLINE_PAYMENT_METHODS.has(
        orderResult.order.paymentMethod,
      )
      if (!isOnlinePaymentOrder) {
        void sendOrderConfirmation({
          orderNumber: orderResult.order.orderNumber,
          customerName: orderResult.order.customerName,
          customerEmail: orderResult.order.customerEmail,
          total: orderResult.order.total,
          paymentMethod: orderResult.order.paymentMethod,
          address: orderResult.order.shippingAddress
            ? JSON.stringify(orderResult.order.shippingAddress)
            : null,
        })
      }
    }

    res.status(orderResult.reused ? 200 : 201).json({
      success: true,
      data: orderResult.order,
      message: orderResult.reused
        ? 'Existing order returned for this idempotency key'
        : 'Order created successfully',
    })
  }),
)

// ─── POST /api/orders/:id/return — request a return for an order ──────────────

router.post(
  '/:id/return',
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = getAuthUser(req)
    const id = requestParam(req.params.id)
    const body = validateBody(req, createReturnSchema)

    const reason = (body.reason || '').trim()
    if (!reason) throw new ApiError('reason is required', 400)

    // The order must belong to the requesting user.
    const order = await db.order.findUnique({ where: { id } })
    if (!order) throw new ApiError('Order not found', 404)
    if (order.userId !== user.id) throw new ApiError('Forbidden', 403)

    // Only allow returns for orders that have been delivered or confirmed.
    if (!['DELIVERED', 'CONFIRMED'].includes(order.status)) {
      throw new ApiError('This order cannot be returned in its current status', 400)
    }

    const existing = await db.returnRequest.findFirst({
      where: { orderId: id, userId: user.id },
    })
    if (existing) {
      throw new ApiError('Return request already exists for this order', 409)
    }

    const returnRequest = await db.returnRequest.create({
      data: {
        orderId: id,
        userId: user.id,
        reason,
        status: 'PENDING',
        refundAmount: order.total,
      },
    })

    // Notify all admins that a return request was submitted.
    await notifyAdmins(
      'Return Request Submitted',
      `A return request was submitted for order ${order.orderNumber} (৳${order.total}).`,
      'RETURN',
      returnRequest.id,
    )

    res.status(201).json({ data: returnRequest, message: 'Return request submitted' })
  }),
)

export default router
