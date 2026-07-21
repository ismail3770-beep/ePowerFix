import { Router } from 'express'
import { z } from 'zod'

import { ApiError, asyncHandler, validateBody } from '../lib/api-handler.js'
import { generateArrivalOtp, hashArrivalOtp } from '../lib/marketplace-job.js'
import { getAuthUser, requireAuth } from '../lib/auth.js'
import { db } from '../lib/db.js'
import {
  enqueueMarketplaceNotification,
  marketplaceNotificationKey,
} from '../lib/marketplace-notifications.js'
import { assertMarketplaceTransition } from '../lib/marketplace-state.js'

const router = Router()

const quoteDecisionSchema = z.object({
  decision: z.enum(['APPROVE', 'REJECT']),
  note: z.string().trim().max(1000).optional().nullable(),
}).strict()

const jobInclude = {
  request: {
    include: {
      service: { select: { id: true, name: true, nameBn: true } },
      skill: { select: { id: true, name: true, nameBn: true } },
      serviceZone: { include: { district: true, upazila: true } },
    },
  },
  provider: {
    select: {
      id: true,
      displayName: true,
      displayNameBn: true,
      rating: true,
      reviewCount: true,
      jobsCompleted: true,
    },
  },
  statusHistory: { orderBy: { createdAt: 'desc' as const }, take: 50 },
  quotes: {
    include: { lineItems: { orderBy: { sortOrder: 'asc' as const } } },
    orderBy: { version: 'desc' as const },
  },
} as const

async function getOwnedJob(jobId: string, customerId: string) {
  const job = await db.marketplaceJob.findFirst({
    where: { id: jobId, request: { customerId } },
    include: jobInclude,
  })
  if (!job) throw new ApiError('Marketplace job not found', 404)
  return job
}

async function getProviderRecipientUserId(providerId: string | null): Promise<string | null> {
  if (!providerId) return null
  const provider = await db.providerProfile.findUnique({
    where: { id: providerId },
    select: { userId: true },
  })
  return provider?.userId ?? null
}

router.use(requireAuth)

router.get('/', asyncHandler(async (req, res) => {
  const user = getAuthUser(req)
  const jobs = await db.marketplaceJob.findMany({
    where: { request: { customerId: user.id } },
    include: jobInclude,
    orderBy: { createdAt: 'desc' },
    take: 100,
  })
  res.json({ data: jobs })
}))

router.get('/:id', asyncHandler(async (req, res) => {
  const user = getAuthUser(req)
  res.json({ data: await getOwnedJob(String(req.params.id), user.id) })
}))

router.post('/:id/arrival-otp', asyncHandler(async (req, res) => {
  const user = getAuthUser(req)
  const job = await getOwnedJob(String(req.params.id), user.id)
  if (job.status !== 'EN_ROUTE') {
    throw new ApiError('Arrival code is available only while the provider is en route', 409)
  }

  const code = generateArrivalOtp()
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000)
  await db.$transaction(async (tx) => {
    await tx.arrivalOtp.updateMany({
      where: {
        jobId: job.id,
        purpose: 'ARRIVAL',
        verifiedAt: null,
        invalidatedAt: null,
      },
      data: { invalidatedAt: new Date() },
    })
    await tx.arrivalOtp.create({
      data: {
        jobId: job.id,
        codeHash: hashArrivalOtp(job.id, code),
        expiresAt,
      },
    })
    await tx.marketplaceAuditEvent.create({
      data: {
        actorUserId: user.id,
        providerId: job.providerId,
        entityType: 'MARKETPLACE_JOB',
        entityId: job.id,
        action: 'ARRIVAL_OTP_CREATED',
        metadata: JSON.stringify({ expiresAt: expiresAt.toISOString() }),
      },
    })
  })

  res.json({ data: { code, expiresAt: expiresAt.toISOString() } })
}))

router.post('/:id/quote-decision', asyncHandler(async (req, res) => {
  const body = validateBody(req, quoteDecisionSchema)
  const user = getAuthUser(req)
  const job = await getOwnedJob(String(req.params.id), user.id)
  const quote = job.quotes.find((item) => ['SUBMITTED', 'ADMIN_REVIEW'].includes(item.status))
  if (!quote) throw new ApiError('Submitted quote not found', 404)
  if (quote.expiresAt && quote.expiresAt <= new Date()) {
    throw new ApiError('Quote has expired', 409)
  }

  const quoteStatus = body.decision === 'APPROVE'
    ? 'CUSTOMER_APPROVED'
    : 'CUSTOMER_REJECTED'
  const jobStatus = body.decision === 'APPROVE'
    ? 'QUOTE_APPROVED'
    : 'QUOTE_REJECTED'
  assertMarketplaceTransition('quote', quote.status, quoteStatus)
  assertMarketplaceTransition('job', job.status, jobStatus)
  const providerRecipientUserId = await getProviderRecipientUserId(job.providerId)

  await db.$transaction(async (tx) => {
    const quoteClaim = await tx.marketplaceQuote.updateMany({
      where: { id: quote.id, status: quote.status },
      data: {
        status: quoteStatus,
        customerDecisionById: user.id,
        customerDecisionAt: new Date(),
        customerDecisionNote: body.note || null,
      },
    })
    const jobClaim = await tx.marketplaceJob.updateMany({
      where: { id: job.id, status: job.status },
      data: { status: jobStatus },
    })
    if (quoteClaim.count !== 1 || jobClaim.count !== 1) {
      throw new ApiError('Quote or job status changed; refresh and retry', 409)
    }
    await tx.jobStatusHistory.create({
      data: {
        jobId: job.id,
        actorUserId: user.id,
        fromStatus: job.status,
        toStatus: jobStatus,
        note: body.note || null,
      },
    })
    await tx.marketplaceAuditEvent.create({
      data: {
        actorUserId: user.id,
        providerId: job.providerId,
        entityType: 'MARKETPLACE_QUOTE',
        entityId: quote.id,
        action: quoteStatus,
        fromState: quote.status,
        toState: quoteStatus,
      },
    })
    if (providerRecipientUserId) {
      await enqueueMarketplaceNotification(
        (args) => tx.notificationDelivery.upsert(args),
        {
          userId: providerRecipientUserId,
          idempotencyKey: marketplaceNotificationKey(
            quoteStatus,
            quote.id,
            providerRecipientUserId,
          ),
          template: quoteStatus,
          title: body.decision === 'APPROVE' ? 'Quote approved' : 'Quote rejected',
          message: body.decision === 'APPROVE'
            ? 'The customer approved your service quote.'
            : 'The customer rejected your service quote. Review their note and prepare a revision.',
          entityType: 'MARKETPLACE_QUOTE',
          entityId: quote.id,
          payload: {
            jobId: job.id,
            quoteId: quote.id,
            decision: body.decision,
            note: body.note || null,
          },
        },
      )
    }
  })
  res.json({ data: await getOwnedJob(job.id, user.id) })
}))

router.post('/:id/confirm-completion', asyncHandler(async (req, res) => {
  const user = getAuthUser(req)
  const job = await getOwnedJob(String(req.params.id), user.id)
  assertMarketplaceTransition('job', job.status, 'COMPLETED')
  assertMarketplaceTransition('request', job.request.status, 'COMPLETED')
  const now = new Date()

  const warrantySetting = await db.marketplaceSetting.findUnique({
    where: { key: 'warranty_days' },
    select: { value: true },
  })
  const parsedDays = Number.parseInt(warrantySetting?.value ?? '7', 10)
  const warrantyDays = Number.isInteger(parsedDays) && parsedDays >= 0 && parsedDays <= 365
    ? parsedDays
    : 7
  const warrantyEndsAt = new Date(now.getTime() + warrantyDays * 24 * 60 * 60 * 1000)
  const providerRecipientUserId = await getProviderRecipientUserId(job.providerId)

  await db.$transaction(async (tx) => {
    const jobClaim = await tx.marketplaceJob.updateMany({
      where: { id: job.id, status: job.status },
      data: {
        status: 'COMPLETED',
        customerConfirmedAt: now,
        completedAt: job.completedAt ?? now,
        warrantyEndsAt,
      },
    })
    const requestClaim = await tx.marketplaceServiceRequest.updateMany({
      where: { id: job.requestId, customerId: user.id, status: job.request.status },
      data: { status: 'COMPLETED', completedAt: now },
    })
    if (jobClaim.count !== 1 || requestClaim.count !== 1) {
      throw new ApiError('Job or request status changed; refresh and retry', 409)
    }
    if (job.providerId) {
      await tx.providerProfile.update({
        where: { id: job.providerId },
        data: { jobsCompleted: { increment: 1 } },
      })
    }
    await tx.jobStatusHistory.create({
      data: {
        jobId: job.id,
        actorUserId: user.id,
        fromStatus: job.status,
        toStatus: 'COMPLETED',
        note: 'Customer confirmed completion',
      },
    })
    await tx.marketplaceAuditEvent.create({
      data: {
        actorUserId: user.id,
        providerId: job.providerId,
        entityType: 'MARKETPLACE_JOB',
        entityId: job.id,
        action: 'CUSTOMER_CONFIRMED_COMPLETION',
        fromState: job.status,
        toState: 'COMPLETED',
        metadata: JSON.stringify({ warrantyDays, warrantyEndsAt: warrantyEndsAt.toISOString() }),
      },
    })
    if (providerRecipientUserId) {
      await enqueueMarketplaceNotification(
        (args) => tx.notificationDelivery.upsert(args),
        {
          userId: providerRecipientUserId,
          idempotencyKey: marketplaceNotificationKey(
            'COMPLETION_CONFIRMED',
            job.id,
            providerRecipientUserId,
          ),
          template: 'COMPLETION_CONFIRMED',
          title: 'Job completion confirmed',
          message: 'The customer confirmed completion of the service job.',
          entityType: 'MARKETPLACE_JOB',
          entityId: job.id,
          payload: {
            jobId: job.id,
            warrantyEndsAt: warrantyEndsAt.toISOString(),
          },
        },
      )
    }
  })
  res.json({ data: await getOwnedJob(job.id, user.id) })
}))

export default router
