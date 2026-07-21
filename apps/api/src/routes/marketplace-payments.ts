import { Router } from 'express'
import { z } from 'zod'

import { env } from '../config/env.js'
import { ApiError, asyncHandler, validateBody } from '../lib/api-handler.js'
import { getAuthUser, requireAuth } from '../lib/auth.js'
import { db } from '../lib/db.js'
import { requireMarketplacePaymentsEnabled } from '../lib/marketplace-auth.js'
import {
  calculateMarketplacePaymentSplit,
  marketplaceLedgerKey,
  marketplacePaymentAmountMatches,
  normalizeCommissionRate,
} from '../lib/marketplace-finance.js'
import {
  enqueueMarketplaceNotification,
  marketplaceNotificationKey,
} from '../lib/marketplace-notifications.js'
import { verifyCallbackIp } from '../lib/payment-callback-security.js'
import {
  initiatePayment,
  type PaymentResponse,
  validateBkashPayment,
  validateNagadPayment,
  validateSSLCommerzPayment,
  verifySSLCommerzFailureCallbackToken,
} from '../lib/payments.js'
import { checkRateLimit } from '../lib/rate-limit.js'
import {
  consumeTestPaymentToken,
  isTestPaymentMode,
  type TestPaymentGateway,
} from '../lib/test-payment.js'

const router = Router()

type MarketplaceGateway = 'SSLCOMMERZ' | 'BKASH' | 'NAGAD'
type CompletionStatus = 'PAID' | 'ALREADY_PAID' | 'MANUAL_REVIEW' | 'NOT_FOUND'

const initiateSchema = z.object({
  jobId: z.string().uuid(),
  paymentMethod: z.enum(['sslcommerz', 'bkash', 'nagad']),
  idempotencyKey: z.string().trim().min(16).max(100).regex(/^[A-Za-z0-9_-]+$/),
}).strict()

function stringValue(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

function serializeGatewayData(value: unknown): string {
  try {
    const serialized = JSON.stringify(value)
    return serialized.length <= 100_000
      ? serialized
      : JSON.stringify({ truncated: true, originalLength: serialized.length })
  } catch {
    return JSON.stringify({ unserializable: true })
  }
}

function storedPaymentUrl(gatewayData: string | null): string | null {
  if (!gatewayData) return null
  try {
    const parsed = JSON.parse(gatewayData)
    return typeof parsed?.paymentUrl === 'string' ? parsed.paymentUrl : null
  } catch {
    return null
  }
}

function paymentResponse(payment: any, paymentUrl?: string | null, reused = false) {
  return {
    id: payment.id,
    jobId: payment.jobId,
    quoteId: payment.quoteId,
    type: payment.type,
    method: payment.method,
    status: payment.status,
    currency: payment.currency,
    amount: String(payment.amount),
    commissionRate: String(payment.commissionRate),
    commissionAmount: String(payment.commissionAmount),
    providerNetAmount: String(payment.providerNetAmount),
    externalTransactionId: payment.externalTransactionId,
    paymentUrl: paymentUrl || null,
    reused,
    paidAt: payment.paidAt,
    createdAt: payment.createdAt,
  }
}

function callbackUrl(path: string): string {
  return `${env.WEB_URL}/api/marketplace/payments/${path}`
}

function resultPath(
  jobId: string | null | undefined,
  state: 'success' | 'failed' | 'pending' | 'review',
): string {
  const params = new URLSearchParams({ payment: state })
  return `/marketplace/jobs/${encodeURIComponent(jobId || '')}?${params.toString()}`
}

function redirectToResult(res: any, jobId: string | null | undefined, state: Parameters<typeof resultPath>[1]) {
  res.redirect(`${env.WEB_URL}${resultPath(jobId, state)}`)
}

function consumeSimulatedCallback(token: string, gateway: TestPaymentGateway) {
  if (!token || !isTestPaymentMode()) return null
  return consumeTestPaymentToken(token, gateway)
}

async function findPayment(externalTransactionId: string, method: MarketplaceGateway) {
  if (!externalTransactionId) return null
  return db.marketplacePayment.findFirst({
    where: { externalTransactionId, method },
    include: { job: true },
  })
}

async function markFailed(
  externalTransactionId: string,
  method: MarketplaceGateway,
  rawData: unknown,
): Promise<boolean> {
  const update = await db.marketplacePayment.updateMany({
    where: { externalTransactionId, method, status: 'PENDING' },
    data: {
      status: 'FAILED',
      failedAt: new Date(),
      gatewayData: serializeGatewayData(rawData),
    },
  })
  return update.count === 1
}

async function markManualReview(
  paymentId: string,
  rawData: unknown,
): Promise<CompletionStatus> {
  await db.marketplacePayment.updateMany({
    where: { id: paymentId, status: { notIn: ['PAID', 'REFUNDED'] } },
    data: { status: 'MANUAL_REVIEW', gatewayData: serializeGatewayData(rawData) },
  })
  return 'MANUAL_REVIEW'
}

async function completePayment(
  externalTransactionId: string,
  method: MarketplaceGateway,
  validation: PaymentResponse,
  rawData: unknown,
): Promise<CompletionStatus> {
  return db.$transaction(async (tx) => {
    const payment = await tx.marketplacePayment.findFirst({
      where: { externalTransactionId, method },
      include: { provider: { select: { userId: true } } },
    })
    if (!payment) return 'NOT_FOUND'
    if (payment.status === 'PAID') return 'ALREADY_PAID'

    if (
      !validation.success ||
      !validation.transactionId ||
      validation.transactionId !== payment.externalTransactionId ||
      !marketplacePaymentAmountMatches(
        String(payment.amount),
        validation.verifiedAmount,
        validation.verifiedAmountInvalid,
        validation.verifiedAmountMissing,
      ) ||
      !payment.providerId
    ) {
      await tx.marketplacePayment.updateMany({
        where: { id: payment.id, status: { notIn: ['PAID', 'REFUNDED'] } },
        data: { status: 'MANUAL_REVIEW', gatewayData: serializeGatewayData(rawData) },
      })
      return 'MANUAL_REVIEW'
    }

    const claim = await tx.marketplacePayment.updateMany({
      where: { id: payment.id, status: 'PENDING' },
      data: {
        status: 'PAID',
        paidAt: new Date(),
        gatewayData: serializeGatewayData(rawData),
      },
    })
    if (claim.count !== 1) {
      const current = await tx.marketplacePayment.findUnique({ where: { id: payment.id } })
      return current?.status === 'PAID' ? 'ALREADY_PAID' : 'MANUAL_REVIEW'
    }

    await tx.financialLedgerEntry.createMany({
      skipDuplicates: true,
      data: [
        {
          providerId: payment.providerId,
          paymentId: payment.id,
          idempotencyKey: marketplaceLedgerKey(payment.id, 'GROSS_EARNING'),
          type: 'GROSS_EARNING',
          direction: 'CREDIT',
          currency: payment.currency,
          amount: payment.amount,
          referenceType: 'MARKETPLACE_JOB',
          referenceId: payment.jobId,
          description: 'Gross marketplace service earning',
        },
        {
          providerId: payment.providerId,
          paymentId: payment.id,
          idempotencyKey: marketplaceLedgerKey(payment.id, 'PLATFORM_COMMISSION'),
          type: 'PLATFORM_COMMISSION',
          direction: 'DEBIT',
          currency: payment.currency,
          amount: payment.commissionAmount,
          referenceType: 'MARKETPLACE_JOB',
          referenceId: payment.jobId,
          description: 'Marketplace platform commission',
        },
      ],
    })
    await tx.marketplaceAuditEvent.create({
      data: {
        providerId: payment.providerId,
        entityType: 'MARKETPLACE_PAYMENT',
        entityId: payment.id,
        action: 'PAYMENT_CONFIRMED',
        fromState: payment.status,
        toState: 'PAID',
        metadata: JSON.stringify({ method, externalTransactionId }),
      },
    })
    await enqueueMarketplaceNotification(
      (args) => tx.notificationDelivery.upsert(args),
      {
        userId: payment.customerId,
        idempotencyKey: marketplaceNotificationKey(
          'PAYMENT_CONFIRMED',
          payment.id,
          payment.customerId,
        ),
        template: 'PAYMENT_CONFIRMED',
        title: 'Payment confirmed',
        message: 'Your marketplace service payment was confirmed successfully.',
        entityType: 'MARKETPLACE_PAYMENT',
        entityId: payment.id,
        payload: {
          paymentId: payment.id,
          jobId: payment.jobId,
          amount: payment.amount.toString(),
          currency: payment.currency,
          method,
        },
      },
    )
    if (payment.provider) {
      await enqueueMarketplaceNotification(
        (args) => tx.notificationDelivery.upsert(args),
        {
          userId: payment.provider.userId,
          idempotencyKey: marketplaceNotificationKey(
            'PAYMENT_RECEIVED',
            payment.id,
            payment.provider.userId,
          ),
          template: 'PAYMENT_RECEIVED',
          title: 'Service payment received',
          message: 'The customer payment for your marketplace job was confirmed.',
          entityType: 'MARKETPLACE_PAYMENT',
          entityId: payment.id,
          payload: {
            paymentId: payment.id,
            jobId: payment.jobId,
            grossAmount: payment.amount.toString(),
            commissionAmount: payment.commissionAmount.toString(),
            netAmount: payment.providerNetAmount.toString(),
            currency: payment.currency,
          },
        },
      )
    }
    return 'PAID'
  })
}

router.post(
  '/initiate',
  requireAuth,
  requireMarketplacePaymentsEnabled,
  asyncHandler(async (req, res) => {
    const body = validateBody(req, initiateSchema)
    const user = getAuthUser(req)
    const limit = await checkRateLimit(`marketplace-payment:${user.id}`, 10, 10 * 60 * 1000)
    if (!limit.allowed) {
      res.setHeader('Retry-After', Math.max(1, Math.ceil(limit.retryAfterMs / 1000)))
      throw new ApiError('Too many payment attempts; please try again later', 429)
    }

    const job = await db.marketplaceJob.findFirst({
      where: { id: body.jobId, request: { customerId: user.id } },
      include: {
        request: { include: { customer: true } },
        provider: true,
        quotes: {
          where: { status: 'CUSTOMER_APPROVED' },
          orderBy: { version: 'desc' },
          take: 1,
        },
      },
    })
    if (!job) throw new ApiError('Marketplace job not found', 404)
    if (job.status !== 'QUOTE_APPROVED') {
      throw new ApiError('The final quote must be approved before payment', 409)
    }
    const quote = job.quotes[0]
    if (!quote || !job.provider) {
      throw new ApiError('Approved quote or assigned provider not found', 409)
    }

    const method = body.paymentMethod.toUpperCase() as MarketplaceGateway
    const split = calculateMarketplacePaymentSplit(
      String(quote.total),
      normalizeCommissionRate(String(job.provider.commissionRate)),
    )
    const idempotencyKey = `marketplace:${user.id}:${body.idempotencyKey}`
    const payment = await db.marketplacePayment.upsert({
      where: { idempotencyKey },
      update: {},
      create: {
        jobId: job.id,
        quoteId: quote.id,
        customerId: user.id,
        providerId: job.provider.id,
        idempotencyKey,
        type: 'FINAL_QUOTE',
        method,
        status: 'CREATED',
        amount: split.grossAmount,
        commissionRate: split.commissionRate,
        commissionAmount: split.commissionAmount,
        providerNetAmount: split.providerNetAmount,
      },
    })

    if (
      payment.jobId !== job.id ||
      payment.quoteId !== quote.id ||
      payment.method !== method ||
      String(payment.amount) !== split.grossAmount
    ) {
      throw new ApiError('Idempotency key was already used for a different payment', 409)
    }
    if (payment.status === 'PAID') {
      return res.json({ data: paymentResponse(payment, null, true) })
    }
    if (payment.status === 'PENDING') {
      const paymentUrl = storedPaymentUrl(payment.gatewayData)
      if (paymentUrl) return res.json({ data: paymentResponse(payment, paymentUrl, true) })
      throw new ApiError('Payment is pending gateway reconciliation', 409)
    }
    if (payment.status !== 'CREATED') {
      throw new ApiError(`Payment cannot be initiated while ${payment.status.toLowerCase()}`, 409)
    }

    const claim = await db.marketplacePayment.updateMany({
      where: { id: payment.id, status: 'CREATED' },
      data: { status: 'INITIATING' },
    })
    if (claim.count !== 1) {
      throw new ApiError('Payment initiation is already in progress', 409)
    }

    const gatewayResult = await initiatePayment(body.paymentMethod, {
      amount: Number(split.grossAmount),
      orderId: payment.id,
      customerName: job.request.customer.name,
      customerEmail: job.request.customer.email,
      customerPhone: job.request.customer.phone,
      address: job.request.serviceAddress,
      productName: `Electrical service job ${job.id}`,
      productCategory: 'electrical-service',
      callbackUrl: callbackUrl(
        method === 'SSLCOMMERZ'
          ? 'sslcommerz/return'
          : `${body.paymentMethod}/callback`,
      ),
      ipnCallbackUrl:
        method === 'SSLCOMMERZ' ? callbackUrl('sslcommerz/ipn') : undefined,
      failureCallbackUrl:
        method === 'SSLCOMMERZ' ? callbackUrl('sslcommerz/fail') : undefined,
    })

    if (!gatewayResult.success || !gatewayResult.paymentUrl || !gatewayResult.transactionId) {
      const status = gatewayResult.failureKind === 'DEFINITIVE' ? 'FAILED' : 'MANUAL_REVIEW'
      await db.marketplacePayment.updateMany({
        where: { id: payment.id, status: 'INITIATING' },
        data: {
          status,
          failedAt: status === 'FAILED' ? new Date() : null,
          gatewayData: serializeGatewayData({
            initiationError: gatewayResult.error,
            failureKind: gatewayResult.failureKind,
          }),
        },
      })
      throw new ApiError(
        gatewayResult.error || 'Payment initiation failed',
        gatewayResult.failureKind === 'DEFINITIVE' ? 400 : 502,
      )
    }

    const gatewayData = serializeGatewayData({ paymentUrl: gatewayResult.paymentUrl })
    const persisted = await db.marketplacePayment.updateMany({
      where: { id: payment.id, status: 'INITIATING' },
      data: {
        status: 'PENDING',
        externalTransactionId: gatewayResult.transactionId,
        gatewayReference: gatewayResult.transactionId,
        gatewayData,
      },
    })
    if (persisted.count !== 1) {
      throw new ApiError('Payment state changed during gateway initiation', 409)
    }
    const pending = await db.marketplacePayment.findUniqueOrThrow({ where: { id: payment.id } })
    return res.status(201).json({
      data: paymentResponse(pending, gatewayResult.paymentUrl),
    })
  }),
)

router.get(
  '/job/:jobId',
  requireAuth,
  requireMarketplacePaymentsEnabled,
  asyncHandler(async (req, res) => {
    const user = getAuthUser(req)
    const payments = await db.marketplacePayment.findMany({
      where: {
        jobId: String(req.params.jobId),
        customerId: user.id,
        job: { request: { customerId: user.id } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })
    res.json({ data: payments.map((payment) => paymentResponse(payment)) })
  }),
)

async function browserGatewayCallback(
  req: any,
  res: any,
  gateway: MarketplaceGateway,
  externalTransactionId: string,
  validationId?: string,
) {
  const testToken = stringValue(req.query?.token)
  const testPayment = consumeSimulatedCallback(testToken, gateway)
  const reference = testPayment?.tranId || externalTransactionId
  if (!reference || (testToken && !testPayment)) {
    return redirectToResult(res, null, 'pending')
  }
  const payment = await findPayment(reference, gateway)
  if (!payment || (testPayment && payment.id !== testPayment.orderId)) {
    return redirectToResult(res, null, 'pending')
  }

  const validation: PaymentResponse = testPayment
    ? {
        success: true,
        transactionId: testPayment.tranId,
        verifiedAmount: Number(payment.amount),
      }
    : gateway === 'SSLCOMMERZ'
      ? await validateSSLCommerzPayment(validationId || '')
      : gateway === 'BKASH'
        ? await validateBkashPayment(reference)
        : await validateNagadPayment(reference)

  if (!validation.success) {
    if (validation.failureKind === 'DEFINITIVE') {
      await markFailed(reference, gateway, {
        source: `${gateway.toLowerCase()}-browser-callback`,
        error: validation.error,
      })
      return redirectToResult(res, payment.jobId, 'failed')
    }
    return redirectToResult(res, payment.jobId, 'pending')
  }

  const completion = await completePayment(reference, gateway, validation, {
    source: testPayment ? `${gateway.toLowerCase()}-test-mode` : `${gateway.toLowerCase()}-browser-callback`,
    externalTransactionId: reference,
  })
  return redirectToResult(
    res,
    payment.jobId,
    completion === 'PAID' || completion === 'ALREADY_PAID' ? 'success' : 'review',
  )
}

router.get('/bkash/callback', asyncHandler(async (req, res) => {
  const token = stringValue(req.query.token)
  const tokenData = token ? consumeSimulatedCallback(token, 'BKASH') : null
  if (token) {
    if (!tokenData) return redirectToResult(res, null, 'pending')
    const payment = await findPayment(tokenData.tranId, 'BKASH')
    if (!payment || payment.id !== tokenData.orderId) return redirectToResult(res, null, 'pending')
    const completion = await completePayment(tokenData.tranId, 'BKASH', {
      success: true,
      transactionId: tokenData.tranId,
      verifiedAmount: Number(payment.amount),
    }, { source: 'bkash-test-mode' })
    return redirectToResult(res, payment.jobId, completion === 'PAID' || completion === 'ALREADY_PAID' ? 'success' : 'review')
  }
  return browserGatewayCallback(req, res, 'BKASH', stringValue(req.query.paymentID))
}))

router.post('/bkash/callback', asyncHandler(async (req, res) => {
  const ipCheck = verifyCallbackIp(req)
  if (!ipCheck.ok) throw new ApiError('Forbidden', 403)
  const paymentId = stringValue(req.body?.paymentID)
  if (!paymentId) throw new ApiError('paymentID is required', 400)
  const validation = await validateBkashPayment(paymentId)
  if (!validation.success) {
    if (validation.failureKind === 'DEFINITIVE') await markFailed(paymentId, 'BKASH', req.body)
    throw new ApiError('Payment validation failed', 400)
  }
  const completion = await completePayment(paymentId, 'BKASH', validation, req.body)
  res.json({ success: completion !== 'NOT_FOUND', manualReview: completion === 'MANUAL_REVIEW' })
}))

router.get('/nagad/callback', asyncHandler(async (req, res) => {
  const token = stringValue(req.query.token)
  const tokenData = token ? consumeSimulatedCallback(token, 'NAGAD') : null
  if (token) {
    if (!tokenData) return redirectToResult(res, null, 'pending')
    const payment = await findPayment(tokenData.tranId, 'NAGAD')
    if (!payment || payment.id !== tokenData.orderId) return redirectToResult(res, null, 'pending')
    const completion = await completePayment(tokenData.tranId, 'NAGAD', {
      success: true,
      transactionId: tokenData.tranId,
      verifiedAmount: Number(payment.amount),
    }, { source: 'nagad-test-mode' })
    return redirectToResult(res, payment.jobId, completion === 'PAID' || completion === 'ALREADY_PAID' ? 'success' : 'review')
  }
  const reference = stringValue(req.query.payment_ref_id)
  return browserGatewayCallback(req, res, 'NAGAD', reference)
}))

router.post('/nagad/callback', asyncHandler(async (req, res) => {
  const ipCheck = verifyCallbackIp(req)
  if (!ipCheck.ok) throw new ApiError('Forbidden', 403)
  const reference = stringValue(req.body?.payment_ref_id)
  if (!reference) throw new ApiError('payment_ref_id is required', 400)
  const validation = await validateNagadPayment(reference)
  if (!validation.success) {
    if (validation.failureKind === 'DEFINITIVE') await markFailed(reference, 'NAGAD', req.body)
    throw new ApiError('Payment validation failed', 400)
  }
  const completion = await completePayment(reference, 'NAGAD', validation, req.body)
  res.json({ success: completion !== 'NOT_FOUND', manualReview: completion === 'MANUAL_REVIEW' })
}))

const sslReturn = asyncHandler(async (req, res) => {
  const source = req.method === 'GET' ? req.query : req.body
  const token = stringValue(req.query.token)
  const tokenData = token ? consumeSimulatedCallback(token, 'SSLCOMMERZ') : null
  if (token) {
    if (!tokenData) return redirectToResult(res, null, 'pending')
    const payment = await findPayment(tokenData.tranId, 'SSLCOMMERZ')
    if (!payment || payment.id !== tokenData.orderId) return redirectToResult(res, null, 'pending')
    const completion = await completePayment(tokenData.tranId, 'SSLCOMMERZ', {
      success: true,
      transactionId: tokenData.tranId,
      verifiedAmount: Number(payment.amount),
    }, { source: 'sslcommerz-test-mode' })
    return redirectToResult(res, payment.jobId, completion === 'PAID' || completion === 'ALREADY_PAID' ? 'success' : 'review')
  }
  const transactionId = stringValue(source?.tran_id)
  const validationId = stringValue(source?.val_id)
  return browserGatewayCallback(req, res, 'SSLCOMMERZ', transactionId, validationId)
})
router.get('/sslcommerz/return', sslReturn)
router.post('/sslcommerz/return', sslReturn)

const sslFailure = asyncHandler(async (req, res) => {
  const token = stringValue(req.query.token)
  const tokenData = token ? verifySSLCommerzFailureCallbackToken(token) : null
  if (!tokenData) return redirectToResult(res, null, 'pending')
  const payment = await db.marketplacePayment.findFirst({
    where: {
      id: tokenData.orderId,
      externalTransactionId: tokenData.transactionId,
      method: 'SSLCOMMERZ',
    },
  })
  if (!payment) return redirectToResult(res, null, 'pending')
  await markFailed(tokenData.transactionId, 'SSLCOMMERZ', {
    source: 'sslcommerz-failure-or-cancel-callback',
  })
  return redirectToResult(res, payment.jobId, 'failed')
})
router.get('/sslcommerz/fail', sslFailure)
router.post('/sslcommerz/fail', sslFailure)

router.post('/sslcommerz/ipn', asyncHandler(async (req, res) => {
  const ipCheck = verifyCallbackIp(req)
  if (!ipCheck.ok) return res.status(200).type('text').send('INVALID')
  const transactionId = stringValue(req.body?.tran_id)
  const validationId = stringValue(req.body?.val_id)
  if (!transactionId || !validationId) return res.status(200).type('text').send('INVALID')
  const validation = await validateSSLCommerzPayment(validationId)
  if (!validation.success) {
    if (validation.failureKind === 'DEFINITIVE') {
      await markFailed(transactionId, 'SSLCOMMERZ', req.body)
    }
    return res.status(200).type('text').send('INVALID')
  }
  const completion = await completePayment(transactionId, 'SSLCOMMERZ', validation, req.body)
  return res.status(200).type('text').send(completion === 'NOT_FOUND' ? 'INVALID' : 'VALID')
}))

export default router
