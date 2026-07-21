import { Router } from 'express'
import { z } from 'zod'

import { env } from '../config/env.js'
import { ApiError, asyncHandler, validateBody } from '../lib/api-handler.js'
import { requireAuth } from '../lib/auth.js'
import { db } from '../lib/db.js'
import {
  getMarketplaceProvider,
  requireVerifiedProvider,
} from '../lib/marketplace-auth.js'
import {
  calculateQuoteLines,
  verifyArrivalOtp,
} from '../lib/marketplace-job.js'
import {
  enqueueMarketplaceNotification,
  marketplaceNotificationKey,
} from '../lib/marketplace-notifications.js'
import { assertMarketplaceTransition } from '../lib/marketplace-state.js'

const router = Router()

const otpSchema = z.object({
  code: z.string().regex(/^\d{6}$/),
}).strict()

const declineSchema = z.object({
  reason: z.string().trim().min(5).max(1000),
}).strict()

const quoteSchema = z.object({
  notes: z.string().trim().max(2000).optional().nullable(),
  expiresAt: z.string().datetime().optional().nullable(),
  lines: z.array(z.object({
    type: z.enum(['LABOR', 'MATERIAL', 'OTHER']),
    description: z.string().trim().min(2).max(500),
    quantity: z.string().regex(/^\d{1,4}(?:\.\d{1,2})?$/),
    unitPrice: z.string().regex(/^\d{1,10}(?:\.\d{1,2})?$/),
  }).strict()).min(1).max(50),
}).strict()

const jobInclude = {
  request: {
    include: {
      // Contact details stay hidden from provider payloads; expose them later only
      // through an explicit post-accept contact policy.
      customer: { select: { id: true, name: true } },
      service: { select: { id: true, name: true, nameBn: true } },
      skill: { select: { id: true, name: true, nameBn: true } },
      serviceZone: {
        include: { district: { include: { division: true } }, upazila: true },
      },
      attachments: { orderBy: { sortOrder: 'asc' as const } },
    },
  },
  assignments: {
    orderBy: { offeredAt: 'desc' as const },
    take: 10,
  },
  statusHistory: { orderBy: { createdAt: 'desc' as const }, take: 50 },
  quotes: {
    include: { lineItems: { orderBy: { sortOrder: 'asc' as const } } },
    orderBy: { version: 'desc' as const },
  },
} as const

async function getOwnedJob(jobId: string, providerId: string) {
  const job = await db.marketplaceJob.findFirst({
    where: { id: jobId, providerId },
    include: jobInclude,
  })
  if (!job) throw new ApiError('Marketplace job not found', 404)
  return job
}

async function transitionJob(input: {
  jobId: string
  providerId: string
  actorUserId: string
  from: string
  to: string
  action: string
  note?: string
  data?: Record<string, unknown>
  notification?: {
    userId: string
    template: string
    title: string
    message: string
    payload?: Record<string, unknown>
  }
}) {
  assertMarketplaceTransition('job', input.from, input.to)
  await db.$transaction(async (tx) => {
    const claim = await tx.marketplaceJob.updateMany({
      where: { id: input.jobId, providerId: input.providerId, status: input.from },
      data: { status: input.to, ...(input.data ?? {}) },
    })
    if (claim.count !== 1) throw new ApiError('Job status changed; refresh and retry', 409)
    await tx.jobStatusHistory.create({
      data: {
        jobId: input.jobId,
        actorUserId: input.actorUserId,
        fromStatus: input.from,
        toStatus: input.to,
        note: input.note,
      },
    })
    await tx.marketplaceAuditEvent.create({
      data: {
        actorUserId: input.actorUserId,
        providerId: input.providerId,
        entityType: 'MARKETPLACE_JOB',
        entityId: input.jobId,
        action: input.action,
        fromState: input.from,
        toState: input.to,
      },
    })
    if (input.notification) {
      await enqueueMarketplaceNotification(
        (args) => tx.notificationDelivery.upsert(args),
        {
          userId: input.notification.userId,
          idempotencyKey: marketplaceNotificationKey(
            input.notification.template,
            input.jobId,
            input.notification.userId,
          ),
          template: input.notification.template,
          title: input.notification.title,
          message: input.notification.message,
          entityType: 'MARKETPLACE_JOB',
          entityId: input.jobId,
          payload: input.notification.payload,
        },
      )
    }
  })
}

router.use(requireAuth, requireVerifiedProvider)

router.get('/', asyncHandler(async (req, res) => {
  const provider = getMarketplaceProvider(req)
  const jobs = await db.marketplaceJob.findMany({
    where: { providerId: provider.id },
    include: jobInclude,
    orderBy: { createdAt: 'desc' },
    take: 100,
  })
  res.json({ data: jobs })
}))

router.get('/:id', asyncHandler(async (req, res) => {
  const provider = getMarketplaceProvider(req)
  res.json({ data: await getOwnedJob(String(req.params.id), provider.id) })
}))

router.post('/:id/accept', asyncHandler(async (req, res) => {
  const provider = getMarketplaceProvider(req)
  const job = await getOwnedJob(String(req.params.id), provider.id)
  assertMarketplaceTransition('job', job.status, 'ACCEPTED')

  await db.$transaction(async (tx) => {
    const claim = await tx.marketplaceJob.updateMany({
      where: { id: job.id, providerId: provider.id, status: job.status },
      data: { status: 'ACCEPTED', acceptedAt: new Date() },
    })
    if (claim.count !== 1) throw new ApiError('Job status changed; refresh and retry', 409)
    await tx.jobAssignment.updateMany({
      where: { jobId: job.id, providerId: provider.id, status: 'OFFERED' },
      data: { status: 'ACCEPTED', respondedAt: new Date() },
    })
    await tx.jobStatusHistory.create({
      data: {
        jobId: job.id,
        actorUserId: provider.userId,
        fromStatus: job.status,
        toStatus: 'ACCEPTED',
      },
    })
    await tx.marketplaceAuditEvent.create({
      data: {
        actorUserId: provider.userId,
        providerId: provider.id,
        entityType: 'MARKETPLACE_JOB',
        entityId: job.id,
        action: 'ACCEPTED',
        fromState: job.status,
        toState: 'ACCEPTED',
      },
    })
  })
  res.json({ data: await getOwnedJob(job.id, provider.id) })
}))

router.post('/:id/decline', asyncHandler(async (req, res) => {
  const { reason } = validateBody(req, declineSchema)
  const provider = getMarketplaceProvider(req)
  const job = await getOwnedJob(String(req.params.id), provider.id)
  assertMarketplaceTransition('job', job.status, 'REJECTED')
  assertMarketplaceTransition('request', job.request.status, 'DISPATCHING')
  const now = new Date()

  await db.$transaction(async (tx) => {
    const jobClaim = await tx.marketplaceJob.updateMany({
      where: { id: job.id, providerId: provider.id, status: job.status },
      data: { status: 'REJECTED', providerId: null },
    })
    const requestClaim = await tx.marketplaceServiceRequest.updateMany({
      where: { id: job.requestId, status: job.request.status },
      data: { status: 'DISPATCHING' },
    })
    if (jobClaim.count !== 1 || requestClaim.count !== 1) {
      throw new ApiError('Job or request status changed; refresh and retry', 409)
    }
    await tx.jobAssignment.updateMany({
      where: { jobId: job.id, providerId: provider.id, status: 'OFFERED' },
      data: { status: 'REJECTED', respondedAt: now, responseNote: reason },
    })
    await tx.jobStatusHistory.create({
      data: {
        jobId: job.id,
        actorUserId: provider.userId,
        fromStatus: job.status,
        toStatus: 'REJECTED',
        note: reason,
      },
    })
    await tx.marketplaceAuditEvent.create({
      data: {
        actorUserId: provider.userId,
        providerId: provider.id,
        entityType: 'MARKETPLACE_JOB',
        entityId: job.id,
        action: 'OFFER_DECLINED',
        fromState: job.status,
        toState: 'REJECTED',
        metadata: JSON.stringify({ reason, requestState: 'DISPATCHING' }),
      },
    })
  })

  res.json({
    data: {
      id: job.id,
      status: 'REJECTED',
      requestId: job.requestId,
      requestStatus: 'DISPATCHING',
    },
  })
}))

router.post('/:id/en-route', asyncHandler(async (req, res) => {
  const provider = getMarketplaceProvider(req)
  const job = await getOwnedJob(String(req.params.id), provider.id)
  await transitionJob({
    jobId: job.id,
    providerId: provider.id,
    actorUserId: provider.userId,
    from: job.status,
    to: 'EN_ROUTE',
    action: 'EN_ROUTE',
    data: { enRouteAt: new Date() },
  })
  res.json({ data: await getOwnedJob(job.id, provider.id) })
}))

router.post('/:id/verify-arrival', asyncHandler(async (req, res) => {
  const { code } = validateBody(req, otpSchema)
  const provider = getMarketplaceProvider(req)
  const job = await getOwnedJob(String(req.params.id), provider.id)
  assertMarketplaceTransition('job', job.status, 'ARRIVED')
  const now = new Date()
  const otp = await db.arrivalOtp.findFirst({
    where: {
      jobId: job.id,
      purpose: 'ARRIVAL',
      verifiedAt: null,
      invalidatedAt: null,
      expiresAt: { gt: now },
    },
    orderBy: { createdAt: 'desc' },
  })
  if (!otp || otp.attempts >= otp.maxAttempts) {
    throw new ApiError('Arrival code is invalid or expired', 400)
  }

  if (!verifyArrivalOtp(job.id, code, otp.codeHash)) {
    await db.arrivalOtp.updateMany({
      where: { id: otp.id, attempts: otp.attempts, verifiedAt: null, invalidatedAt: null },
      data: {
        attempts: { increment: 1 },
        ...(otp.attempts + 1 >= otp.maxAttempts ? { invalidatedAt: now } : {}),
      },
    })
    throw new ApiError('Arrival code is invalid or expired', 400)
  }

  await db.$transaction(async (tx) => {
    const otpClaim = await tx.arrivalOtp.updateMany({
      where: {
        id: otp.id,
        attempts: otp.attempts,
        verifiedAt: null,
        invalidatedAt: null,
        expiresAt: { gt: now },
      },
      data: { verifiedAt: now },
    })
    if (otpClaim.count !== 1) throw new ApiError('Arrival code was already used', 409)
    const jobClaim = await tx.marketplaceJob.updateMany({
      where: { id: job.id, providerId: provider.id, status: job.status },
      data: { status: 'ARRIVED', arrivedAt: now },
    })
    if (jobClaim.count !== 1) throw new ApiError('Job status changed; refresh and retry', 409)
    await tx.jobStatusHistory.create({
      data: {
        jobId: job.id,
        actorUserId: provider.userId,
        fromStatus: job.status,
        toStatus: 'ARRIVED',
        note: 'Customer arrival OTP verified',
      },
    })
    await tx.marketplaceAuditEvent.create({
      data: {
        actorUserId: provider.userId,
        providerId: provider.id,
        entityType: 'MARKETPLACE_JOB',
        entityId: job.id,
        action: 'ARRIVAL_VERIFIED',
        fromState: job.status,
        toState: 'ARRIVED',
      },
    })
  })
  res.json({ data: await getOwnedJob(job.id, provider.id) })
}))

router.post('/:id/start-inspection', asyncHandler(async (req, res) => {
  const provider = getMarketplaceProvider(req)
  const job = await getOwnedJob(String(req.params.id), provider.id)
  assertMarketplaceTransition('job', job.status, 'INSPECTION')
  assertMarketplaceTransition('request', job.request.status, 'IN_SERVICE')

  await db.$transaction(async (tx) => {
    const jobClaim = await tx.marketplaceJob.updateMany({
      where: { id: job.id, providerId: provider.id, status: job.status },
      data: { status: 'INSPECTION' },
    })
    const requestClaim = await tx.marketplaceServiceRequest.updateMany({
      where: { id: job.requestId, status: job.request.status },
      data: { status: 'IN_SERVICE' },
    })
    if (jobClaim.count !== 1 || requestClaim.count !== 1) {
      throw new ApiError('Job or request status changed; refresh and retry', 409)
    }
    await tx.jobStatusHistory.create({
      data: {
        jobId: job.id,
        actorUserId: provider.userId,
        fromStatus: job.status,
        toStatus: 'INSPECTION',
      },
    })
    await tx.marketplaceAuditEvent.create({
      data: {
        actorUserId: provider.userId,
        providerId: provider.id,
        entityType: 'MARKETPLACE_JOB',
        entityId: job.id,
        action: 'INSPECTION_STARTED',
        fromState: job.status,
        toState: 'INSPECTION',
      },
    })
  })
  res.json({ data: await getOwnedJob(job.id, provider.id) })
}))

router.put('/:id/quote', asyncHandler(async (req, res) => {
  const body = validateBody(req, quoteSchema)
  const provider = getMarketplaceProvider(req)
  const job = await getOwnedJob(String(req.params.id), provider.id)
  if (job.status !== 'INSPECTION') {
    throw new ApiError('A quote can only be drafted during inspection', 409)
  }
  const calculated = calculateQuoteLines(body.lines)
  const existingDraft = job.quotes.find((quote) => quote.status === 'DRAFT')

  const quote = await db.$transaction(async (tx) => {
    if (existingDraft) {
      await tx.quoteLineItem.deleteMany({ where: { quoteId: existingDraft.id } })
      return tx.marketplaceQuote.update({
        where: { id: existingDraft.id },
        data: {
          subtotal: calculated.subtotal,
          total: calculated.total,
          notes: body.notes || null,
          expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
          lineItems: {
            create: calculated.lines.map((line, index) => ({ ...line, sortOrder: index })),
          },
        },
        include: { lineItems: { orderBy: { sortOrder: 'asc' } } },
      })
    }

    const latestVersion = job.quotes.reduce((max, item) => Math.max(max, item.version), 0)
    return tx.marketplaceQuote.create({
      data: {
        jobId: job.id,
        providerId: provider.id,
        version: latestVersion + 1,
        subtotal: calculated.subtotal,
        total: calculated.total,
        notes: body.notes || null,
        expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
        lineItems: {
          create: calculated.lines.map((line, index) => ({ ...line, sortOrder: index })),
        },
      },
      include: { lineItems: { orderBy: { sortOrder: 'asc' } } },
    })
  })
  res.json({ data: quote })
}))

router.post('/:id/quote/submit', asyncHandler(async (req, res) => {
  const provider = getMarketplaceProvider(req)
  const job = await getOwnedJob(String(req.params.id), provider.id)
  assertMarketplaceTransition('job', job.status, 'QUOTE_PENDING')
  const quote = job.quotes.find((item) => item.status === 'DRAFT')
  if (!quote) throw new ApiError('Draft quote not found', 404)
  assertMarketplaceTransition('quote', quote.status, 'SUBMITTED')
  if (quote.expiresAt && quote.expiresAt <= new Date()) {
    throw new ApiError('Quote expiry must be in the future', 409)
  }

  await db.$transaction(async (tx) => {
    const quoteClaim = await tx.marketplaceQuote.updateMany({
      where: { id: quote.id, providerId: provider.id, status: quote.status },
      data: { status: 'SUBMITTED', submittedAt: new Date() },
    })
    const jobClaim = await tx.marketplaceJob.updateMany({
      where: { id: job.id, providerId: provider.id, status: job.status },
      data: { status: 'QUOTE_PENDING' },
    })
    if (quoteClaim.count !== 1 || jobClaim.count !== 1) {
      throw new ApiError('Quote or job status changed; refresh and retry', 409)
    }
    await tx.jobStatusHistory.create({
      data: {
        jobId: job.id,
        actorUserId: provider.userId,
        fromStatus: job.status,
        toStatus: 'QUOTE_PENDING',
      },
    })
    await tx.marketplaceAuditEvent.create({
      data: {
        actorUserId: provider.userId,
        providerId: provider.id,
        entityType: 'MARKETPLACE_QUOTE',
        entityId: quote.id,
        action: 'SUBMITTED',
        fromState: quote.status,
        toState: 'SUBMITTED',
      },
    })
    await enqueueMarketplaceNotification(
      (args) => tx.notificationDelivery.upsert(args),
      {
        userId: job.request.customer.id,
        idempotencyKey: marketplaceNotificationKey(
          'QUOTE_SUBMITTED',
          quote.id,
          job.request.customer.id,
        ),
        template: 'QUOTE_SUBMITTED',
        title: 'Service quote ready',
        message: 'Your electrician submitted a quote for review.',
        entityType: 'MARKETPLACE_QUOTE',
        entityId: quote.id,
        payload: {
          jobId: job.id,
          quoteId: quote.id,
          version: quote.version,
          total: quote.total.toString(),
          expiresAt: quote.expiresAt?.toISOString() ?? null,
        },
      },
    )
  })
  res.json({ data: await getOwnedJob(job.id, provider.id) })
}))

router.post('/:id/reinspect', asyncHandler(async (req, res) => {
  const provider = getMarketplaceProvider(req)
  const job = await getOwnedJob(String(req.params.id), provider.id)
  assertMarketplaceTransition('job', job.status, 'INSPECTION')
  const rejected = job.quotes.find((quote) => quote.status === 'CUSTOMER_REJECTED')

  await db.$transaction(async (tx) => {
    const claim = await tx.marketplaceJob.updateMany({
      where: { id: job.id, providerId: provider.id, status: job.status },
      data: { status: 'INSPECTION' },
    })
    if (claim.count !== 1) throw new ApiError('Job status changed; refresh and retry', 409)
    if (rejected) {
      assertMarketplaceTransition('quote', rejected.status, 'SUPERSEDED')
      await tx.marketplaceQuote.updateMany({
        where: { id: rejected.id, status: rejected.status },
        data: { status: 'SUPERSEDED' },
      })
    }
    await tx.jobStatusHistory.create({
      data: {
        jobId: job.id,
        actorUserId: provider.userId,
        fromStatus: job.status,
        toStatus: 'INSPECTION',
        note: 'Preparing a revised quote',
      },
    })
  })
  res.json({ data: await getOwnedJob(job.id, provider.id) })
}))

router.post('/:id/start-work', asyncHandler(async (req, res) => {
  const provider = getMarketplaceProvider(req)
  const job = await getOwnedJob(String(req.params.id), provider.id)
  if (env.MARKETPLACE_PAYMENTS_ENABLED) {
    const approvedQuote = job.quotes.find((quote) => quote.status === 'CUSTOMER_APPROVED')
    if (!approvedQuote) throw new ApiError('Approved final quote not found', 409)
    const paid = await db.marketplacePayment.findFirst({
      where: {
        jobId: job.id,
        quoteId: approvedQuote.id,
        providerId: provider.id,
        type: 'FINAL_QUOTE',
        status: 'PAID',
      },
      select: { id: true },
    })
    if (!paid) {
      throw new ApiError('Customer payment is required before work can start', 409, {
        code: 'MARKETPLACE_PAYMENT_REQUIRED',
      })
    }
  }
  await transitionJob({
    jobId: job.id,
    providerId: provider.id,
    actorUserId: provider.userId,
    from: job.status,
    to: 'IN_PROGRESS',
    action: 'WORK_STARTED',
    data: { workStartedAt: new Date() },
  })
  res.json({ data: await getOwnedJob(job.id, provider.id) })
}))

router.post('/:id/complete', asyncHandler(async (req, res) => {
  const provider = getMarketplaceProvider(req)
  const job = await getOwnedJob(String(req.params.id), provider.id)
  await transitionJob({
    jobId: job.id,
    providerId: provider.id,
    actorUserId: provider.userId,
    from: job.status,
    to: 'COMPLETED_PENDING_CONFIRMATION',
    action: 'WORK_COMPLETED',
    data: { completedAt: new Date() },
    notification: {
      userId: job.request.customer.id,
      template: 'WORK_AWAITING_CONFIRMATION',
      title: 'Please confirm job completion',
      message: 'Your electrician marked the work complete. Review and confirm the job.',
      payload: { jobId: job.id },
    },
  })
  res.json({ data: await getOwnedJob(job.id, provider.id) })
}))

export default router
