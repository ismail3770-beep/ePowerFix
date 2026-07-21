// Payment routes: initiation, protected expiry cleanup, and gateway callbacks.
// Mounted at /api/payments in server.ts.

import { timingSafeEqual } from 'node:crypto'
import { Router } from 'express'
import { z } from 'zod'

import { db } from '../lib/db.js'
import { asyncHandler, ApiError, validateBody } from '../lib/api-handler.js'
import { requireAuth, getAuthUser } from '../lib/auth.js'
import { env } from '../config/env.js'
import { checkRateLimit } from '../lib/rate-limit.js'
import {
  initiatePayment,
  type PaymentResponse,
  validateBkashPayment,
  validateNagadPayment,
  validateSSLCommerzPayment,
  verifySSLCommerzFailureCallbackToken,
} from '../lib/payments.js'
import { verifyCallbackIp } from '../lib/payment-callback-security.js'
import {
  consumeTestPaymentToken,
  isTestPaymentMode,
  type TestPaymentGateway,
} from '../lib/test-payment.js'
import {
  releaseExpiredOrderReservations,
  releaseOrderReservation,
} from '../lib/order-reservations.js'
import { sendOrderConfirmation } from '../lib/email.js'

const router = Router()

type GatewayMethod = 'sslcommerz' | 'bkash' | 'nagad'
type PaymentMethod = 'SSLCOMMERZ' | 'BKASH' | 'NAGAD'
type PaymentCompletionStatus = 'PAID' | 'ALREADY_PAID' | 'MANUAL_REVIEW' | 'NOT_FOUND'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getClientIp(req: any): string {
  // Express derives req.ip from the configured trusted proxy chain. Reading a
  // caller-supplied X-Forwarded-For value directly would let clients rotate
  // the payment-attempt rate-limit key.
  return typeof req.ip === 'string' && req.ip.trim() ? req.ip : 'unknown'
}

function stringValue(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

function serializePaymentData(value: unknown): string {
  try {
    const serialized = JSON.stringify(value)
    // Gateway payloads are untrusted request data. Preserve diagnostics without
    // allowing an unusually large callback body to consume unbounded DB space.
    if (serialized.length <= 100_000) return serialized
    return JSON.stringify({ truncated: true, originalLength: serialized.length })
  } catch {
    return JSON.stringify({ unserializable: true })
  }
}

function storedPaymentUrl(paymentData: string | null | undefined): string | null {
  if (!paymentData) return null
  try {
    const parsed = JSON.parse(paymentData)
    return typeof parsed?.paymentUrl === 'string' ? parsed.paymentUrl : null
  } catch {
    return null
  }
}

function paymentPagePath(
  page: 'success' | 'fail',
  orderId?: string | null,
  method?: string,
  state?: 'pending' | 'review',
): string {
  const params = new URLSearchParams()
  if (orderId) params.set('order', orderId)
  if (method) params.set('method', method)
  if (state) params.set('state', state)
  const query = params.toString()
  return `/payment/${page}${query ? `?${query}` : ''}`
}

function redirect(res: any, path: string): void {
  const target = path.startsWith('http') ? path : `${env.WEB_URL}${path}`
  res.redirect(target)
}

function isReservationExpired(order: any): boolean {
  return Boolean(
    order.reservationStatus === 'ACTIVE' &&
      order.reservationExpiresAt &&
      new Date(order.reservationExpiresAt).getTime() <= Date.now(),
  )
}

const MONEY_COMPARISON_EPSILON = 0.000001

function amountMatchesExpected(
  verifiedAmount: number,
  expectedAmount: unknown,
): boolean {
  return (
    typeof expectedAmount === 'number' &&
    Number.isFinite(verifiedAmount) &&
    Number.isFinite(expectedAmount) &&
    Math.abs(verifiedAmount - expectedAmount) < MONEY_COMPARISON_EPSILON
  )
}

/**
 * Takes an UPDATE row lock on an active reservation without changing any
 * business state. Initiation and failure transitions use it before deciding
 * whether to create/release a pending payment attempt.
 */
async function lockActivePaymentReservation(tx: any, orderId: string): Promise<boolean> {
  const lock = await tx.order.updateMany({
    where: {
      id: orderId,
      reservationStatus: 'ACTIVE',
      paymentStatus: 'PENDING',
      status: { not: 'CANCELLED' },
    },
    data: { updatedAt: new Date() },
  })
  return lock.count === 1
}

function internalCleanupAuthorization(req: any): {
  configured: boolean
  authorized: boolean
} {
  const expected = env.PAYMENT_RESERVATION_CLEANUP_SECRET
  if (!expected) return { configured: false, authorized: false }

  const supplied = req.get('x-internal-job-secret') || ''
  const expectedBuffer = Buffer.from(expected)
  const suppliedBuffer = Buffer.from(supplied)
  if (expectedBuffer.length !== suppliedBuffer.length) {
    return { configured: true, authorized: false }
  }

  return {
    configured: true,
    authorized: timingSafeEqual(expectedBuffer, suppliedBuffer),
  }
}

async function findCallbackPayment(
  transactionId: string,
  method: PaymentMethod,
): Promise<any | null> {
  if (!transactionId) return null

  return (db as any).payment.findFirst({
    where: { transactionId, method },
    include: { order: true },
  })
}

function consumeSimulatedPaymentCallback(
  token: string,
  expectedGateway: TestPaymentGateway,
) {
  if (!token || !isTestPaymentMode()) return null
  return consumeTestPaymentToken(token, expectedGateway)
}

async function flagPaymentForManualReview(
  tx: any,
  payment: any,
  order: any,
  rawData: unknown,
  note: string,
): Promise<PaymentCompletionStatus> {
  if (payment.status === 'PAID') return 'ALREADY_PAID'
  if (payment.status === 'MANUAL_REVIEW') return 'MANUAL_REVIEW'

  const update = await tx.payment.updateMany({
    where: { id: payment.id, status: { not: 'PAID' } },
    data: {
      status: 'MANUAL_REVIEW',
      paymentData: serializePaymentData(rawData),
    },
  })

  if (update.count === 1) {
    // Never overwrite a valid payment that was completed by a separate attempt.
    await tx.order.updateMany({
      where: { id: order.id, paymentStatus: { not: 'PAID' } },
      data: { paymentStatus: 'MANUAL_REVIEW' },
    })
    await tx.orderHistory.create({
      data: {
        orderId: order.id,
        status: order.status,
        note,
      },
    })
  }

  return 'MANUAL_REVIEW'
}

/**
 * Transactionally completes one payment attempt. A released/expired order is
 * deliberately never re-stock-decremented: a late gateway success is retained
 * for manual review instead of silently fulfilling an unavailable order.
 */
async function markPaymentPaid(
  paymentId: string,
  orderId: string,
  expectedMethod: PaymentMethod,
  rawData: unknown,
  transactionId?: string,
  verifiedAmount?: number,
  verifiedAmountInvalid?: boolean,
  verifiedAmountMissing?: boolean,
): Promise<PaymentCompletionStatus> {
  return (db as any).$transaction(async (tx: any) => {
    const payment = await tx.payment.findUnique({ where: { id: paymentId } })
    if (
      !payment ||
      payment.orderId !== orderId ||
      payment.method !== expectedMethod
    ) {
      return 'NOT_FOUND'
    }
    if (payment.status === 'PAID') return 'ALREADY_PAID'

    const order = await tx.order.findUnique({ where: { id: orderId } })
    if (!order) return 'NOT_FOUND'

    if (
      !transactionId ||
      !payment.transactionId ||
      transactionId !== payment.transactionId
    ) {
      return flagPaymentForManualReview(
        tx,
        payment,
        order,
        rawData,
        'Gateway validation returned a missing or mismatched transaction ID; manual review required',
      )
    }

    if (payment.status !== 'PENDING') {
      return flagPaymentForManualReview(
        tx,
        payment,
        order,
        rawData,
        'Gateway reported payment success for a non-pending attempt; manual review required',
      )
    }

    if (isReservationExpired(order)) {
      await releaseOrderReservation(tx, order.id, 'EXPIRED')
      return flagPaymentForManualReview(
        tx,
        payment,
        order,
        rawData,
        'Gateway reported payment success after the reservation expired; manual review required',
      )
    }

    if (
      order.reservationStatus === 'RELEASED' ||
      order.status === 'CANCELLED' ||
      !['ACTIVE', 'NONE'].includes(order.reservationStatus)
    ) {
      return flagPaymentForManualReview(
        tx,
        payment,
        order,
        rawData,
        'Gateway reported payment success after the order reservation was released; manual review required',
      )
    }

    if (
      verifiedAmountMissing ||
      verifiedAmountInvalid ||
      (verifiedAmount !== undefined &&
        (!amountMatchesExpected(verifiedAmount, payment.amount) ||
          !amountMatchesExpected(verifiedAmount, order.total)))
    ) {
      return flagPaymentForManualReview(
        tx,
        payment,
        order,
        rawData,
        verifiedAmountMissing
          ? 'Gateway validation omitted the payment amount; manual review required'
          : verifiedAmountInvalid
            ? 'Gateway validation returned an invalid amount; manual review required'
            : 'Gateway-verified amount did not match the payment and order totals; manual review required',
      )
    }

    // Claim the order first. A second valid callback (or a callback for a
    // different attempt) sees paymentStatus=PAID and cannot fulfill twice.
    const orderClaim = await tx.order.updateMany({
      where: {
        id: order.id,
        paymentStatus: 'PENDING',
        reservationStatus: { in: ['ACTIVE', 'NONE'] },
        status: { not: 'CANCELLED' },
      },
      data: {
        status: 'CONFIRMED',
        paymentStatus: 'PAID',
        reservationStatus: 'COMMITTED',
        reservationExpiresAt: null,
      },
    })

    if (orderClaim.count !== 1) {
      const current = await tx.order.findUnique({ where: { id: order.id } })
      if (current?.paymentStatus === 'PAID') return 'ALREADY_PAID'
      return flagPaymentForManualReview(
        tx,
        payment,
        current || order,
        rawData,
        'Gateway reported payment success after an incompatible order transition; manual review required',
      )
    }

    const paymentClaim = await tx.payment.updateMany({
      where: { id: payment.id, status: 'PENDING' },
      data: {
        status: 'PAID',
        paidAt: new Date(),
        paymentData: serializePaymentData(rawData),
      },
    })

    if (paymentClaim.count !== 1) {
      // Throwing rolls the order claim back as well.
      throw new Error(`Unable to claim payment ${payment.id} for completion`)
    }

    // Any previous stale pending attempt is no longer usable. A later success
    // from it will be routed to manual review rather than double fulfillment.
    await tx.payment.updateMany({
      where: {
        orderId: order.id,
        id: { not: payment.id },
        status: 'PENDING',
      },
      data: { status: 'SUPERSEDED' },
    })

    await tx.orderHistory.create({
      data: {
        orderId: order.id,
        status: 'CONFIRMED',
        note: 'Online payment confirmed by gateway',
      },
    })

    return 'PAID'
  })
}

async function markPaymentFailed(
  paymentId: string,
  orderId: string,
  expectedMethod: PaymentMethod,
  rawData: unknown,
): Promise<boolean> {
  return (db as any).$transaction(async (tx: any) => {
    const reservationLocked = await lockActivePaymentReservation(tx, orderId)
    if (!reservationLocked) return false

    const paymentClaim = await tx.payment.updateMany({
      where: {
        id: paymentId,
        orderId,
        method: expectedMethod,
        status: 'PENDING',
      },
      data: {
        status: 'FAILED',
        paymentData: serializePaymentData(rawData),
      },
    })
    if (paymentClaim.count !== 1) return false

    // A concurrent initiation can leave another usable gateway attempt for the
    // same order. Mark this attempt failed, but keep the order reservation for
    // the still-pending attempt rather than cancelling it underneath the user.
    const remainingPendingAttempt = await tx.payment.findFirst({
      where: {
        orderId,
        id: { not: paymentId },
        status: 'PENDING',
      },
      select: { id: true },
    })
    if (remainingPendingAttempt) return false

    const release = await releaseOrderReservation(
      tx,
      orderId,
      'PAYMENT_CALLBACK_FAILED',
    )
    return release.released
  })
}

// ─── Protected internal expiry cleanup ────────────────────────────────────────

const cleanupSchema = z.object({
  limit: z.number().int().min(1).max(100).optional(),
})

router.post(
  '/internal/release-expired',
  asyncHandler(async (req, res) => {
    const authorization = internalCleanupAuthorization(req)
    if (!authorization.configured) {
      throw new ApiError('Payment reservation cleanup is not configured', 503)
    }
    if (!authorization.authorized) {
      throw new ApiError('Forbidden', 403)
    }

    const body = req.body && typeof req.body === 'object' ? req.body : {}
    const { limit } = cleanupSchema.parse(body)
    const result = await releaseExpiredOrderReservations(limit ?? 100)
    res.json({ success: true, data: result })
  }),
)

// ─── POST / and /initiate — initiate payment (auth required) ─────────────────

const initiatePaymentSchema = z.object({
  orderId: z.string().min(1, 'Order ID is required'),
  paymentMethod: z.enum(['sslcommerz', 'bkash', 'nagad']),
  // Existing clients send these fields. Only amount is compared; order contact
  // details are authoritative so a retry can supply just orderId + method.
  amount: z.number().positive('Amount must be positive').optional(),
  customerName: z.string().min(1).max(200).optional(),
  customerPhone: z.string().min(1).max(20).optional(),
  customerEmail: z.string().email().optional(),
  address: z.string().min(1).max(500).optional(),
})

const initiatePaymentHandler = asyncHandler(async (req, res) => {
  // Rate limit: 5 payment attempts per 10 min per IP.
  const ip = getClientIp(req)
  const rateLimit = await checkRateLimit(`payment:${ip}`, 5, 10 * 60 * 1000)
  if (!rateLimit.allowed) {
    throw new ApiError('Too many payment attempts. Try again later.', 429)
  }

  const parsed = validateBody(req, initiatePaymentSchema)
  const authUser = getAuthUser(req)
  const methodUpper = parsed.paymentMethod.toUpperCase() as PaymentMethod

  const order = await (db as any).order.findUnique({
    where: { id: parsed.orderId },
  })
  if (!order) throw new ApiError('Order not found', 404)

  // Online payment is available only to the account that owns the reservation.
  if (!order.userId) {
    throw new ApiError('Please log in to pay for this order online', 403)
  }
  if (order.userId !== authUser.id) {
    throw new ApiError('Forbidden: you do not own this order', 403)
  }
  if (order.paymentMethod !== methodUpper) {
    throw new ApiError('Payment method does not match this order', 409)
  }
  if (order.paymentStatus === 'PAID') {
    throw new ApiError('Order has already been paid', 409)
  }
  if (order.reservationStatus === 'RELEASED') {
    throw new ApiError('This payment reservation is no longer active', 409)
  }
  if (order.reservationStatus !== 'ACTIVE') {
    throw new ApiError('This order is not awaiting an online payment', 409)
  }

  if (isReservationExpired(order)) {
    const release = await (db as any).$transaction((tx: any) =>
      releaseOrderReservation(tx, order.id, 'EXPIRED'),
    )
    if (release.released) {
      throw new ApiError('This payment reservation has expired', 409)
    }
    throw new ApiError('This order is no longer awaiting an online payment', 409)
  }

  if (parsed.amount !== undefined && Number(order.total) !== parsed.amount) {
    throw new ApiError('Amount mismatch', 400)
  }

  const usableAttempt = await (db as any).payment.findFirst({
    where: {
      orderId: order.id,
      method: methodUpper,
      status: 'PENDING',
    },
    orderBy: { createdAt: 'desc' },
  })
  if (usableAttempt) {
    const paymentUrl = storedPaymentUrl(usableAttempt.paymentData)
    if (paymentUrl) {
      return res.json({
        paymentUrl,
        transactionId: usableAttempt.transactionId,
        reused: true,
      })
    }

    // Old records or interrupted writes without a URL cannot be safely reused.
    // Mark them terminal before creating a single new usable attempt.
    await (db as any).payment.updateMany({
      where: { id: usableAttempt.id, status: 'PENDING' },
      data: { status: 'SUPERSEDED' },
    })
  }

  const paymentResult = await initiatePayment(parsed.paymentMethod, {
    amount: Number(order.total),
    customerName: order.customerName || parsed.customerName || 'Customer',
    customerEmail: order.customerEmail || parsed.customerEmail || '',
    customerPhone: order.customerPhone || parsed.customerPhone || '',
    address: parsed.address || 'Dhaka',
    orderId: order.id,
    productName: `Order #${order.orderNumber}`,
    productCategory: 'electrical',
  })

  if (!paymentResult.success || !paymentResult.paymentUrl) {
    if (paymentResult.failureKind === 'DEFINITIVE') {
      await (db as any).$transaction(async (tx: any) => {
        // Serialize this decision with callback failures and successful
        // initiations. Do not cancel/re-stock an order if another request has
        // already persisted a usable payment attempt.
        const reservationLocked = await lockActivePaymentReservation(tx, order.id)
        if (!reservationLocked) return

        const livePendingAttempt = await tx.payment.findFirst({
          where: { orderId: order.id, status: 'PENDING' },
          select: { id: true },
        })
        if (livePendingAttempt) return

        await releaseOrderReservation(tx, order.id, 'PAYMENT_INITIATION_FAILED')
      })
    }
    throw new ApiError(
      paymentResult.error || 'Payment initiation failed',
      paymentResult.failureKind === 'DEFINITIVE' ? 400 : 502,
    )
  }

  const persisted = await (db as any).$transaction(async (tx: any) => {
    const currentOrder = await tx.order.findUnique({ where: { id: order.id } })
    const active =
      currentOrder &&
      currentOrder.reservationStatus === 'ACTIVE' &&
      currentOrder.paymentStatus === 'PENDING' &&
      !isReservationExpired(currentOrder)
    const reservationLocked =
      Boolean(active) && (await lockActivePaymentReservation(tx, order.id))

    if (!reservationLocked) {
      if (currentOrder && isReservationExpired(currentOrder)) {
        await releaseOrderReservation(tx, currentOrder.id, 'EXPIRED')
      }
      // The gateway link was already created but the reservation changed while
      // it was in flight. Keep an auditable attempt for any late callback; do
      // not return this link to the browser.
      await tx.payment.create({
        data: {
          orderId: order.id,
          amount: Number(order.total),
          method: methodUpper,
          status: 'MANUAL_REVIEW',
          transactionId: paymentResult.transactionId || null,
          paymentData: serializePaymentData({
            initiated: true,
            paymentUrl: paymentResult.paymentUrl,
            lateReservationState: currentOrder?.reservationStatus || 'MISSING',
          }),
        },
      })
      return false
    }

    // The reservation row lock makes this check race-safe with concurrent
    // initiation and failure callbacks. A second gateway link is retained for
    // audit only and never returned as a usable payment attempt.
    const existingPendingAttempt = await tx.payment.findFirst({
      where: { orderId: order.id, status: 'PENDING' },
      select: { id: true },
    })
    if (existingPendingAttempt) {
      await tx.payment.create({
        data: {
          orderId: order.id,
          amount: Number(order.total),
          method: methodUpper,
          status: 'MANUAL_REVIEW',
          transactionId: paymentResult.transactionId || null,
          paymentData: serializePaymentData({
            initiated: true,
            paymentUrl: paymentResult.paymentUrl,
            existingPendingAttemptId: existingPendingAttempt.id,
          }),
        },
      })
      return false
    }

    await tx.payment.create({
      data: {
        orderId: order.id,
        amount: Number(order.total),
        method: methodUpper,
        status: 'PENDING',
        transactionId: paymentResult.transactionId || null,
        paymentData: serializePaymentData({
          initiated: true,
          initiatedAt: new Date().toISOString(),
          paymentUrl: paymentResult.paymentUrl,
        }),
      },
    })
    return true
  })

  if (!persisted) {
    throw new ApiError(
      'A payment attempt is already active or this reservation is no longer available; any late payment requires manual review',
      409,
    )
  }

  res.json({
    paymentUrl: paymentResult.paymentUrl,
    transactionId: paymentResult.transactionId,
    reused: false,
  })
})

router.post('/', requireAuth, initiatePaymentHandler)
router.post('/initiate', requireAuth, initiatePaymentHandler)

// ─── GET /bkash/callback — browser redirect, gateway validation still required ─

router.get(
  '/bkash/callback',
  asyncHandler(async (req, res) => {
    const testToken = stringValue(req.query.token)
    const testPayment = consumeSimulatedPaymentCallback(testToken, 'BKASH')
    const paymentId = testPayment?.tranId || stringValue(req.query.paymentID)
    const orderReference = testPayment?.orderId || stringValue(req.query.order_id)

    if (testToken && !testPayment) {
      return redirect(res, paymentPagePath('fail', orderReference, 'bkash', 'pending'))
    }
    if (!paymentId) {
      return redirect(res, paymentPagePath('fail', orderReference, 'bkash', 'pending'))
    }

    const payment = await findCallbackPayment(paymentId, 'BKASH')
    if (!payment?.order || (testPayment && payment.order.id !== testPayment.orderId)) {
      return redirect(res, paymentPagePath('fail', orderReference, 'bkash', 'pending'))
    }

    const validation: PaymentResponse = testPayment
      ? { success: true, transactionId: testPayment.tranId }
      : await validateBkashPayment(paymentId)
    if (!validation.success) {
      // The redirect itself is untrusted, but validation above queried bKash
      // server-side. A definitive gateway failure may therefore safely release
      // this exact method-bound reservation; unknown outcomes remain pending.
      if (validation.failureKind === 'DEFINITIVE') {
        await markPaymentFailed(payment.id, payment.order.id, 'BKASH', {
          source: 'bkash-browser-callback',
          paymentID: paymentId,
          validationError: validation.error,
        })
        return redirect(res, paymentPagePath('fail', payment.order.id, 'bkash'))
      }
      return redirect(
        res,
        paymentPagePath('fail', payment.order.id, 'bkash', 'pending'),
      )
    }

    const completion = await markPaymentPaid(
      payment.id,
      payment.order.id,
      'BKASH',
      {
        source: testPayment ? 'bkash-test-mode' : 'bkash-browser-callback',
        paymentID: paymentId,
      },
      validation.transactionId,
      validation.verifiedAmount,
      validation.verifiedAmountInvalid,
      validation.verifiedAmountMissing,
    )
    if (completion === 'PAID') {
      void sendOrderConfirmation({
        orderNumber: payment.order.orderNumber,
        customerName: payment.order.customerName,
        customerEmail: payment.order.customerEmail,
        total: payment.order.total,
        paymentMethod: 'BKASH',
        address: null,
      })
    }
    if (completion === 'PAID' || completion === 'ALREADY_PAID') {
      return redirect(res, paymentPagePath('success', payment.order.id, 'bkash'))
    }
    return redirect(res, paymentPagePath('fail', payment.order.id, 'bkash', 'review'))
  }),
)

// ─── POST /bkash/callback — bKash server-to-server webhook ───────────────────

router.post(
  '/bkash/callback',
  asyncHandler(async (req, res) => {
    const ipCheck = verifyCallbackIp(req)
    if (!ipCheck.ok) {
      console.warn('[bKash Callback] Rejected IP:', ipCheck.ip)
      throw new ApiError('Forbidden', 403)
    }

    const body = req.body || {}
    const paymentId = stringValue(body.paymentID)
    if (!paymentId) throw new ApiError('paymentID is required', 400)

    const payment = await findCallbackPayment(paymentId, 'BKASH')
    if (!payment?.order) {
      console.warn('[bKash Callback] Payment/order not found for paymentID:', paymentId)
      throw new ApiError('Order not found', 404)
    }

    const validation = await validateBkashPayment(paymentId)
    if (!validation.success) {
      if (validation.failureKind === 'DEFINITIVE') {
        await markPaymentFailed(payment.id, payment.order.id, 'BKASH', body)
      }
      console.warn('[bKash Callback] Validation failed for paymentID:', paymentId)
      throw new ApiError('Payment validation failed', 400)
    }

    const completion = await markPaymentPaid(
      payment.id,
      payment.order.id,
      'BKASH',
      body,
      validation.transactionId,
      validation.verifiedAmount,
      validation.verifiedAmountInvalid,
      validation.verifiedAmountMissing,
    )
    res.json({ success: true, manualReview: completion === 'MANUAL_REVIEW' })
  }),
)

// ─── GET /nagad/callback — browser redirect, gateway validation still required ─

router.get(
  '/nagad/callback',
  asyncHandler(async (req, res) => {
    const testToken = stringValue(req.query.token)
    const testPayment = consumeSimulatedPaymentCallback(testToken, 'NAGAD')
    const paymentRefId = testPayment?.tranId || stringValue(req.query.payment_ref_id)
    const orderReference =
      testPayment?.orderId ||
      stringValue(req.query.merchantOrderId) ||
      stringValue(req.query.order_id)

    if (testToken && !testPayment) {
      return redirect(res, paymentPagePath('fail', orderReference, 'nagad', 'pending'))
    }
    if (!paymentRefId) {
      return redirect(res, paymentPagePath('fail', orderReference, 'nagad', 'pending'))
    }

    const payment = await findCallbackPayment(paymentRefId, 'NAGAD')
    if (!payment?.order || (testPayment && payment.order.id !== testPayment.orderId)) {
      return redirect(res, paymentPagePath('fail', orderReference, 'nagad', 'pending'))
    }

    const validation: PaymentResponse = testPayment
      ? { success: true, transactionId: testPayment.tranId }
      : await validateNagadPayment(paymentRefId)
    if (!validation.success) {
      // The redirect itself is untrusted, but validation above queried Nagad
      // server-side. A definitive gateway failure may therefore safely release
      // this exact method-bound reservation; unknown outcomes remain pending.
      if (validation.failureKind === 'DEFINITIVE') {
        await markPaymentFailed(payment.id, payment.order.id, 'NAGAD', {
          source: 'nagad-browser-callback',
          paymentRefId,
          validationError: validation.error,
        })
        return redirect(res, paymentPagePath('fail', payment.order.id, 'nagad'))
      }
      return redirect(
        res,
        paymentPagePath('fail', payment.order.id, 'nagad', 'pending'),
      )
    }

    const completion = await markPaymentPaid(
      payment.id,
      payment.order.id,
      'NAGAD',
      {
        source: testPayment ? 'nagad-test-mode' : 'nagad-browser-callback',
        paymentRefId,
      },
      validation.transactionId,
      validation.verifiedAmount,
      validation.verifiedAmountInvalid,
      validation.verifiedAmountMissing,
    )
    if (completion === 'PAID') {
      void sendOrderConfirmation({
        orderNumber: payment.order.orderNumber,
        customerName: payment.order.customerName,
        customerEmail: payment.order.customerEmail,
        total: payment.order.total,
        paymentMethod: 'NAGAD',
        address: null,
      })
    }
    if (completion === 'PAID' || completion === 'ALREADY_PAID') {
      return redirect(res, paymentPagePath('success', payment.order.id, 'nagad'))
    }
    return redirect(res, paymentPagePath('fail', payment.order.id, 'nagad', 'review'))
  }),
)

// ─── POST /nagad/callback — Nagad server-to-server webhook ───────────────────

router.post(
  '/nagad/callback',
  asyncHandler(async (req, res) => {
    const ipCheck = verifyCallbackIp(req)
    if (!ipCheck.ok) {
      console.warn('[Nagad Callback] Rejected IP:', ipCheck.ip)
      throw new ApiError('Forbidden', 403)
    }

    const body = req.body || {}
    const paymentRefId = stringValue(body.payment_ref_id)
    if (!paymentRefId) throw new ApiError('payment_ref_id is required', 400)

    const payment = await findCallbackPayment(paymentRefId, 'NAGAD')
    if (!payment?.order) {
      console.warn('[Nagad Callback] Payment/order not found for paymentRefId:', paymentRefId)
      throw new ApiError('Order not found', 404)
    }

    const validation = await validateNagadPayment(paymentRefId)
    if (!validation.success) {
      if (validation.failureKind === 'DEFINITIVE') {
        await markPaymentFailed(payment.id, payment.order.id, 'NAGAD', body)
      }
      console.warn('[Nagad Callback] Validation failed for paymentRefId:', paymentRefId)
      throw new ApiError('Payment validation failed', 400)
    }

    const completion = await markPaymentPaid(
      payment.id,
      payment.order.id,
      'NAGAD',
      body,
      validation.transactionId,
      validation.verifiedAmount,
      validation.verifiedAmountInvalid,
      validation.verifiedAmountMissing,
    )
    res.json({ success: true, manualReview: completion === 'MANUAL_REVIEW' })
  }),
)

// ─── /sslcommerz/fail — signed failure/cancellation return ───────────────────

const sslcommerzFailureCallback = asyncHandler(async (req, res) => {
  const token = stringValue(req.query.token)
  const tokenData = token ? verifySSLCommerzFailureCallbackToken(token) : null
  if (!tokenData) {
    return redirect(res, paymentPagePath('fail', undefined, 'sslcommerz', 'pending'))
  }

  // Do not use the generic order-reference fallback here. The signed token
  // must bind the exact pending SSLCommerz transaction to its order.
  const payment = await findCallbackPayment(tokenData.transactionId, 'SSLCOMMERZ')
  if (!payment?.order || payment.order.id !== tokenData.orderId) {
    return redirect(
      res,
      paymentPagePath('fail', tokenData.orderId, 'sslcommerz', 'pending'),
    )
  }

  await markPaymentFailed(payment.id, payment.order.id, 'SSLCOMMERZ', {
    source: 'sslcommerz-failure-or-cancel-callback',
    transactionId: tokenData.transactionId,
  })
  return redirect(res, paymentPagePath('fail', payment.order.id, 'sslcommerz'))
})

router.get('/sslcommerz/fail', sslcommerzFailureCallback)
router.post('/sslcommerz/fail', sslcommerzFailureCallback)

// ─── POST /sslcommerz/ipn — SSLCommerz IPN webhook ───────────────────────────

router.post(
  '/sslcommerz/ipn',
  asyncHandler(async (req, res) => {
    const ipCheck = verifyCallbackIp(req)
    if (!ipCheck.ok) {
      console.warn('[SSLCommerz IPN] Rejected IP:', ipCheck.ip)
      return res.status(200).type('text').send('INVALID')
    }

    const body = req.body || {}
    const transactionId = stringValue(body.tran_id)
    const validationId = stringValue(body.val_id)
    if (!transactionId || !validationId) {
      return res.status(200).type('text').send('INVALID')
    }

    const payment = await findCallbackPayment(transactionId, 'SSLCOMMERZ')
    if (!payment?.order) {
      console.warn('[SSLCommerz IPN] Payment/order not found for tran_id:', transactionId)
      return res.status(200).type('text').send('INVALID')
    }

    const validation = await validateSSLCommerzPayment(validationId)
    if (!validation.success) {
      if (validation.failureKind === 'DEFINITIVE') {
        await markPaymentFailed(payment.id, payment.order.id, 'SSLCOMMERZ', body)
      }
      console.warn('[SSLCommerz IPN] Validation failed for tran_id:', transactionId)
      return res.status(200).type('text').send('INVALID')
    }

    const completion = await markPaymentPaid(
      payment.id,
      payment.order.id,
      'SSLCOMMERZ',
      body,
      validation.transactionId,
      validation.verifiedAmount,
      validation.verifiedAmountInvalid,
      validation.verifiedAmountMissing,
    )
    // The payment is valid even when it requires manual reconciliation, so
    // acknowledge it to avoid repeated provider retries.
    return res.status(200).type('text').send(
      completion === 'NOT_FOUND' ? 'INVALID' : 'VALID',
    )
  }),
)

// ─── GET /sslcommerz/ipn — test-mode/browser return with server verification ──

router.get(
  '/sslcommerz/ipn',
  asyncHandler(async (req, res) => {
    const testToken = stringValue(req.query.token)
    const status = stringValue(req.query.status)
    const tokenData = consumeSimulatedPaymentCallback(testToken, 'SSLCOMMERZ')
    const transactionId = tokenData?.tranId || stringValue(req.query.tran_id)
    const validationId = tokenData?.tranId || stringValue(req.query.val_id)
    const orderReference = tokenData?.orderId || stringValue(req.query.order_id)

    if (
      !transactionId ||
      !validationId ||
      (testToken && !tokenData) ||
      (status && status !== 'SUCCESS')
    ) {
      return redirect(res, paymentPagePath('fail', orderReference, 'sslcommerz', 'pending'))
    }

    const payment = await findCallbackPayment(transactionId, 'SSLCOMMERZ')
    if (!payment?.order || (tokenData && payment.order.id !== tokenData.orderId)) {
      return redirect(res, paymentPagePath('fail', orderReference, 'sslcommerz', 'pending'))
    }

    const validation: PaymentResponse = tokenData
      ? { success: true, transactionId: tokenData.tranId }
      : await validateSSLCommerzPayment(validationId)
    if (!validation.success) {
      // A browser return can be forged or carry an invalid val_id. The signed
      // failure/cancel URL and the IP-checked POST callback own failure state.
      return redirect(
        res,
        paymentPagePath('fail', payment.order.id, 'sslcommerz', 'pending'),
      )
    }

    const completion = await markPaymentPaid(
      payment.id,
      payment.order.id,
      'SSLCOMMERZ',
      {
        source: tokenData ? 'test-mode' : 'sslcommerz-browser-callback',
        transactionId,
        validationId,
      },
      validation.transactionId,
      validation.verifiedAmount,
      validation.verifiedAmountInvalid,
      validation.verifiedAmountMissing,
    )
    if (completion === 'PAID') {
      void sendOrderConfirmation({
        orderNumber: payment.order.orderNumber,
        customerName: payment.order.customerName,
        customerEmail: payment.order.customerEmail,
        total: payment.order.total,
        paymentMethod: 'SSLCOMMERZ',
        address: null,
      })
    }
    if (completion === 'PAID' || completion === 'ALREADY_PAID') {
      return redirect(res, paymentPagePath('success', payment.order.id, 'sslcommerz'))
    }
    return redirect(res, paymentPagePath('fail', payment.order.id, 'sslcommerz', 'review'))
  }),
)

export default router
