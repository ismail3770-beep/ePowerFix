// Payment routes: initiate + bKash/Nagad/SSLCommerz callbacks.
// Mounted at /api/payments in server.ts.
//
// Routes:
//   POST /                  → initiate payment (auth required)
//   GET  /bkash/callback    → bKash success redirect (browser)
//   POST /bkash/callback    → bKash server-to-server webhook
//   GET  /nagad/callback    → Nagad success redirect (browser)
//   POST /nagad/callback    → Nagad server-to-server webhook
//   GET  /sslcommerz/ipn    → SSLCommerz test-mode success redirect (browser)
//   POST /sslcommerz/ipn    → SSLCommerz IPN webhook
//
// Migrated from:
//   apps/web/src/app/api/payments/initiate/route.ts
//   apps/web/src/app/api/payments/bkash/callback/route.ts
//   apps/web/src/app/api/payments/nagad/callback/route.ts
//   apps/web/src/app/api/payments/sslcommerz/ipn/route.ts

import { Router } from 'express'
import { z } from 'zod'

import { db } from '../lib/db.js'
import { asyncHandler, ApiError, validateBody } from '../lib/api-handler.js'
import { requireAuth, getAuthUser } from '../lib/auth.js'
import { env } from '../config/env.js'
import { checkRateLimit } from '../lib/rate-limit.js'
import {
  initiatePayment,
  validateBkashPayment,
  validateNagadPayment,
  validateSSLCommerzPayment,
} from '../lib/payments.js'
import { verifyCallbackIp } from '../lib/payment-callback-security.js'
import { consumeTestPaymentToken } from '../lib/test-payment.js'

const router = Router()

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getClientIp(req: any): string {
  const xff = (req.headers['x-forwarded-for'] as string | undefined) || ''
  return xff.split(',')[0].trim() || req.ip || 'unknown'
}

/**
 * Marks a Payment record as PAID and updates the denormalized order status to
 * CONFIRMED. Returns true if the payment was newly completed, false if it had
 * already been processed (idempotency check).
 */
async function markPaymentPaid(
  paymentId: string,
  orderId: string,
  rawData: unknown
): Promise<boolean> {
  const payment = await db.payment.findUnique({
    where: { id: paymentId },
    select: { id: true, status: true },
  })
  if (!payment) return false
  if (payment.status === 'PAID') return false

  await db.payment.update({
    where: { id: payment.id },
    // Schema stores paymentData as String? — serialize the raw gateway payload.
    data: { status: 'PAID', paidAt: new Date(), paymentData: JSON.stringify(rawData) },
  })

  await db.order.update({
    where: { id: orderId },
    data: { status: 'CONFIRMED', paymentStatus: 'PAID' },
  })

  return true
}

function redirect(res: any, path: string): void {
  const target = path.startsWith('http') ? path : `${env.WEB_URL}${path}`
  res.redirect(target)
}

// ─── POST / — initiate payment (auth required) ────────────────────────────────

const initiatePaymentSchema = z.object({
  orderId: z.string().min(1, 'Order ID is required'),
  paymentMethod: z.enum(['sslcommerz', 'bkash', 'nagad']),
  amount: z.number().positive('Amount must be positive'),
  customerName: z.string().min(1, 'Customer name is required'),
  customerPhone: z.string().min(1, 'Customer phone is required'),
  customerEmail: z.string().optional(),
  address: z.string().min(1, 'Address is required'),
})

router.post(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    // Rate limit: 5 payment attempts per 10 min per IP.
    const ip = getClientIp(req)
    const rl = await checkRateLimit(`payment:${ip}`, 5, 10 * 60 * 1000)
    if (!rl.allowed) {
      throw new ApiError('Too many payment attempts. Try again later.', 429)
    }

    const parsed = validateBody(req, initiatePaymentSchema)
    const authUser = getAuthUser(req)

    // Find the order and verify status
    const order = await db.order.findUnique({
      where: { id: parsed.orderId },
    })

    if (!order) {
      throw new ApiError('Order not found', 404)
    }

    // Ownership check: the order must belong to the authenticated user.
    // Guest orders (userId null) cannot be paid for online.
    if (!order.userId) {
      throw new ApiError('Please log in to pay for this order online', 403)
    }
    if (order.userId !== authUser.id) {
      throw new ApiError('Forbidden: you do not own this order', 403)
    }

    if (order.status !== 'PENDING') {
      throw new ApiError(`Order is already ${order.status}, cannot initiate payment`, 400)
    }

    if (Number(order.total) !== parsed.amount) {
      throw new ApiError('Amount mismatch', 400)
    }

    // Initiate payment with the selected gateway
    const paymentResult = await initiatePayment(parsed.paymentMethod, {
      amount: parsed.amount,
      orderId: order.id,
      customerName: parsed.customerName,
      customerEmail: parsed.customerEmail || '',
      customerPhone: parsed.customerPhone,
      address: parsed.address,
      productName: `Order #${order.orderNumber}`,
      productCategory: 'electrical',
    })

    if (!paymentResult.success || !paymentResult.paymentUrl) {
      throw new ApiError(paymentResult.error || 'Payment initiation failed', 400)
    }

    const methodUpper = parsed.paymentMethod.toUpperCase() as
      | 'SSLCOMMERZ'
      | 'BKASH'
      | 'NAGAD'

    // Update order with payment method (denormalized status stays PENDING until webhook)
    await db.order.update({
      where: { id: order.id },
      data: {
        paymentMethod: methodUpper,
        paymentStatus: 'PENDING',
      },
    })

    // Create a Payment record storing the gateway transactionId
    await db.payment.create({
      data: {
        orderId: order.id,
        amount: parsed.amount,
        method: methodUpper,
        status: 'PENDING',
        transactionId: paymentResult.transactionId || null,
        paymentData: JSON.stringify({ initiated: true }),
      },
    })

    res.json({
      paymentUrl: paymentResult.paymentUrl,
      transactionId: paymentResult.transactionId,
    })
  })
)

// ─── GET /bkash/callback — bKash success redirect (browser) ──────────────────
//
// After the customer completes payment on bKash's hosted page, bKash redirects
// their browser here with status/paymentID/order_id query params. We don't
// trust this for fulfillment (the POST webhook is authoritative), we just
// bounce the user to the web app's success/fail page.

router.get(
  '/bkash/callback',
  asyncHandler(async (req, res) => {
    const status = (req.query.status as string) || ''
    const paymentID = (req.query.paymentID as string) || ''
    const orderId = (req.query.order_id as string) || ''

    if (status.toLowerCase() !== 'success') {
      return redirect(res, '/payment/fail')
    }

    // Try to mark paid optimistically using the webhook-validation flow.
    // The authoritative update happens in the POST webhook — this is best-effort
    // so the user sees an up-to-date order page after the redirect.
    if (paymentID) {
      const validation = await validateBkashPayment(paymentID)
      if (validation.success) {
        const payment = await db.payment.findUnique({
          where: { transactionId: paymentID },
          include: { order: true },
        })
        if (payment && payment.order) {
          await markPaymentPaid(payment.id, payment.order.id, { source: 'bkash-redirect', paymentID })
          const successUrl = `/payment/success?order=${payment.order.id}&method=bkash`
          return redirect(res, successUrl)
        }
      }
    }

    // Fallback: redirect to success page even if we couldn't validate, since
    // bKash already reported success. The webhook will reconcile the order.
    const fallbackUrl = orderId
      ? `/payment/success?order=${orderId}&method=bkash`
      : '/payment/success?method=bkash'
    redirect(res, fallbackUrl)
  })
)

// ─── POST /bkash/callback — bKash server-to-server webhook ───────────────────

router.post(
  '/bkash/callback',
  asyncHandler(async (req, res) => {
    // H10: Reject callbacks from IPs not on the gateway whitelist (if configured).
    const ipCheck = verifyCallbackIp(req)
    if (!ipCheck.ok) {
      console.warn('[bKash Callback] Rejected IP:', ipCheck.ip)
      throw new ApiError('Forbidden', 403)
    }

    const body = req.body || {}
    const paymentID: string = body.paymentID || ''
    const orderNumber: string = body.merchantInvoiceNumber || ''

    const validation = await validateBkashPayment(paymentID)
    if (!validation.success) {
      console.warn('[bKash Callback] Validation failed for paymentID:', paymentID)
      throw new ApiError('Payment validation failed', 400)
    }

    // Look up the Payment record by transactionId (bKash paymentID)
    let payment = await db.payment.findUnique({
      where: { transactionId: paymentID },
      include: { order: true },
    })

    // Fallback: find by order number if transactionId not yet stored
    if (!payment && orderNumber) {
      const order = await db.order.findUnique({ where: { orderNumber } })
      if (order) {
        payment = await db.payment.findFirst({
          where: { orderId: order.id, method: 'BKASH' },
          include: { order: true },
        })
      }
    }

    if (!payment || !payment.order) {
      console.warn('[bKash Callback] Payment/order not found for paymentID:', paymentID)
      throw new ApiError('Order not found', 404)
    }

    if (payment.status === 'PAID') {
      return res.json({ success: true, message: 'Already processed' })
    }

    await markPaymentPaid(payment.id, payment.order.id, body)
    res.json({ success: true })
  })
)

// ─── GET /nagad/callback — Nagad success redirect (browser) ──────────────────

router.get(
  '/nagad/callback',
  asyncHandler(async (req, res) => {
    const status = (req.query.status as string) || ''
    const paymentRefId = (req.query.payment_ref_id as string) || ''
    const orderId = (req.query.order_id as string) || ''

    if (status.toLowerCase() !== 'success') {
      return redirect(res, '/payment/fail')
    }

    if (paymentRefId) {
      const validation = await validateNagadPayment(paymentRefId)
      if (validation.success) {
        const payment = await db.payment.findUnique({
          where: { transactionId: paymentRefId },
          include: { order: true },
        })
        if (payment && payment.order) {
          await markPaymentPaid(payment.id, payment.order.id, {
            source: 'nagad-redirect',
            paymentRefId,
          })
          const successUrl = `/payment/success?order=${payment.order.id}&method=nagad`
          return redirect(res, successUrl)
        }
      }
    }

    const fallbackUrl = orderId
      ? `/payment/success?order=${orderId}&method=nagad`
      : '/payment/success?method=nagad'
    redirect(res, fallbackUrl)
  })
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
    const paymentRefId: string = body.payment_ref_id || ''
    const orderId: string = body.merchantOrderId || body.order_id || ''

    const validation = await validateNagadPayment(paymentRefId)
    if (!validation.success) {
      console.warn('[Nagad Callback] Validation failed for paymentRefId:', paymentRefId)
      throw new ApiError('Payment validation failed', 400)
    }

    // Look up the Payment record by transactionId (Nagad payment_ref_id)
    let payment = await db.payment.findUnique({
      where: { transactionId: paymentRefId },
      include: { order: true },
    })

    // Fallback: find by order id if transactionId not yet stored
    if (!payment && orderId) {
      payment = await db.payment.findFirst({
        where: { orderId, method: 'NAGAD' },
        include: { order: true },
      })
    }

    if (!payment || !payment.order) {
      console.warn('[Nagad Callback] Payment/order not found for paymentRefId:', paymentRefId)
      throw new ApiError('Order not found', 404)
    }

    if (payment.status === 'PAID') {
      return res.json({ success: true, message: 'Already processed' })
    }

    await markPaymentPaid(payment.id, payment.order.id, body)
    res.json({ success: true })
  })
)

// ─── POST /sslcommerz/ipn — SSLCommerz IPN webhook ───────────────────────────
//
// SSLCommerz expects a plain-text "VALID" / "INVALID" response (not JSON).
// We always respond 200 so the gateway stops retrying.

router.post(
  '/sslcommerz/ipn',
  asyncHandler(async (req, res) => {
    const ipCheck = verifyCallbackIp(req)
    if (!ipCheck.ok) {
      console.warn('[SSLCommerz IPN] Rejected IP:', ipCheck.ip)
      return res.status(200).type('text').send('INVALID')
    }

    const body = req.body || {}
    const tranId: string = body.tran_id || ''

    const validation = await validateSSLCommerzPayment(tranId)
    if (!validation.success) {
      console.warn('[SSLCommerz IPN] Validation failed for tran_id:', tranId)
      return res.status(200).type('text').send('INVALID')
    }

    const payment = await db.payment.findUnique({
      where: { transactionId: tranId },
      include: { order: true },
    })

    if (!payment || !payment.order) {
      console.warn('[SSLCommerz IPN] Payment/order not found for tran_id:', tranId)
      return res.status(200).type('text').send('INVALID')
    }

    if (payment.status === 'PAID') {
      return res.status(200).type('text').send('VALID')
    }

    await markPaymentPaid(payment.id, payment.order.id, body)
    return res.status(200).type('text').send('VALID')
  })
)

// ─── GET /sslcommerz/ipn — test-mode ONLY success redirect ───────────────────
//
// Requires a valid one-time token generated server-side by initiateSSLCommerzPayment
// when running without real SSLCommerz credentials. In production with real
// credentials, SSLCommerz POSTs to the IPN endpoint above and redirects the
// browser to the success_url configured at initiation time.

router.get(
  '/sslcommerz/ipn',
  asyncHandler(async (req, res) => {
    const token = (req.query.token as string) || ''
    const status = (req.query.status as string) || ''

    if (status !== 'SUCCESS') {
      return redirect(res, '/payment/fail')
    }

    const tokenData = consumeTestPaymentToken(token)
    if (!tokenData) {
      console.warn('[SSLCommerz IPN] Invalid or expired test token')
      return redirect(res, '/payment/fail')
    }

    const payment = await db.payment.findUnique({
      where: { transactionId: tokenData.tranId },
      include: { order: true },
    })

    if (payment && payment.order && payment.status !== 'PAID') {
      await markPaymentPaid(payment.id, payment.order.id, {
        source: 'test-mode',
        token: tokenData.tranId,
      })
    }

    const successUrl = payment?.order
      ? `/payment/success?order=${payment.order.id}&method=sslcommerz`
      : '/payment/success?method=sslcommerz'
    redirect(res, successUrl)
  })
)

export default router
