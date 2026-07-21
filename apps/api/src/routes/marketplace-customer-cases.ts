import { Router } from 'express'
import { z } from 'zod'

import { ApiError, asyncHandler, validateBody } from '../lib/api-handler.js'
import { getAuthUser, requireAuth } from '../lib/auth.js'
import { db } from '../lib/db.js'
import { isMarketplaceUniqueConstraintError } from '../lib/marketplace-case.js'
import {
  enqueueMarketplaceNotification,
  marketplaceNotificationKey,
} from '../lib/marketplace-notifications.js'
import { assertMarketplaceTransition } from '../lib/marketplace-state.js'

const router = Router()

const idempotencyKey = z.string().trim().min(16).max(100).regex(/^[A-Za-z0-9_-]+$/)

const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().min(3).max(3000).optional().nullable(),
}).strict()

const warrantyClaimSchema = z.object({
  issue: z.string().trim().min(10).max(5000),
  idempotencyKey,
}).strict()

const disputeSchema = z.object({
  category: z.enum([
    'PAYMENT',
    'WORK_QUALITY',
    'PROVIDER_CONDUCT',
    'PROPERTY_DAMAGE',
    'NO_SHOW',
    'OTHER',
  ]),
  description: z.string().trim().min(10).max(5000),
  idempotencyKey,
}).strict()

type OwnedJob = Awaited<ReturnType<typeof getOwnedJob>>

async function getOwnedJob(jobId: string, customerId: string) {
  const job = await db.marketplaceJob.findFirst({
    where: { id: jobId, request: { customerId } },
    include: {
      request: { select: { id: true, customerId: true, status: true } },
      provider: { select: { id: true, userId: true, displayName: true } },
    },
  })
  if (!job) throw new ApiError('Marketplace job not found', 404)
  return job
}

function sameReview(
  review: { rating: number; comment: string | null },
  input: z.infer<typeof reviewSchema>,
): boolean {
  return review.rating === input.rating && review.comment === (input.comment || null)
}

function sameWarrantyClaim(
  claim: { jobId: string; issue: string },
  jobId: string,
  issue: string,
): boolean {
  return claim.jobId === jobId && claim.issue === issue
}

function sameDispute(
  dispute: { jobId: string; category: string; description: string },
  jobId: string,
  input: z.infer<typeof disputeSchema>,
): boolean {
  return (
    dispute.jobId === jobId &&
    dispute.category === input.category &&
    dispute.description === input.description
  )
}

async function idempotentWarrantyClaim(
  namespacedKey: string,
  jobId: string,
  issue: string,
) {
  const existing = await db.marketplaceWarrantyClaim.findUnique({
    where: { idempotencyKey: namespacedKey },
  })
  if (!existing) return null
  if (!sameWarrantyClaim(existing, jobId, issue)) {
    throw new ApiError('Idempotency key was already used for a different warranty claim', 409, {
      code: 'IDEMPOTENCY_CONFLICT',
    })
  }
  return existing
}

async function idempotentDispute(
  namespacedKey: string,
  jobId: string,
  input: z.infer<typeof disputeSchema>,
) {
  const existing = await db.marketplaceDispute.findUnique({
    where: { idempotencyKey: namespacedKey },
  })
  if (!existing) return null
  if (!sameDispute(existing, jobId, input)) {
    throw new ApiError('Idempotency key was already used for a different dispute', 409, {
      code: 'IDEMPOTENCY_CONFLICT',
    })
  }
  return existing
}

router.use(requireAuth)

router.get('/', asyncHandler(async (req, res) => {
  const user = getAuthUser(req)
  const [reviews, warrantyClaims, disputes] = await Promise.all([
    db.marketplaceReview.findMany({
      where: { customerId: user.id },
      include: { provider: { select: { id: true, displayName: true } } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    }),
    db.marketplaceWarrantyClaim.findMany({
      where: { customerId: user.id },
      include: {
        job: { select: { id: true, completedAt: true, warrantyEndsAt: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    }),
    db.marketplaceDispute.findMany({
      where: { openedById: user.id, job: { request: { customerId: user.id } } },
      include: { job: { select: { id: true, status: true, completedAt: true } } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    }),
  ])
  res.json({ data: { reviews, warrantyClaims, disputes } })
}))

router.post('/jobs/:jobId/review', asyncHandler(async (req, res) => {
  const body = validateBody(req, reviewSchema)
  const user = getAuthUser(req)
  const job = await getOwnedJob(String(req.params.jobId), user.id)
  if (job.status !== 'COMPLETED' || !job.providerId) {
    throw new ApiError('A review can be submitted only after the job is completed', 409)
  }

  const existing = await db.marketplaceReview.findUnique({
    where: { jobId_customerId: { jobId: job.id, customerId: user.id } },
  })
  if (existing) {
    if (!sameReview(existing, body)) {
      throw new ApiError('This completed job already has a different review', 409, {
        code: 'CASE_ALREADY_EXISTS',
      })
    }
    return res.json({ data: existing, reused: true })
  }

  try {
    const review = await db.$transaction(async (tx) => {
      const created = await tx.marketplaceReview.create({
        data: {
          jobId: job.id,
          customerId: user.id,
          providerId: job.providerId!,
          rating: body.rating,
          comment: body.comment || null,
        },
      })
      // One SQL statement serializes concurrent reviews for the same provider,
      // preventing lost review-count or weighted-average updates.
      await tx.$executeRaw`
        UPDATE provider_profiles
        SET rating = ROUND(((rating * review_count) + ${body.rating}) / (review_count + 1), 2),
            review_count = review_count + 1,
            updated_at = NOW()
        WHERE id = ${job.providerId}
      `
      await tx.marketplaceAuditEvent.create({
        data: {
          actorUserId: user.id,
          providerId: job.providerId,
          entityType: 'MARKETPLACE_REVIEW',
          entityId: created.id,
          action: 'REVIEW_PUBLISHED',
          toState: 'PUBLISHED',
          metadata: JSON.stringify({ rating: body.rating }),
        },
      })
      return created
    })
    return res.status(201).json({ data: review, reused: false })
  } catch (error) {
    if (!isMarketplaceUniqueConstraintError(error)) throw error
    const duplicate = await db.marketplaceReview.findUnique({
      where: { jobId_customerId: { jobId: job.id, customerId: user.id } },
    })
    if (duplicate && sameReview(duplicate, body)) {
      return res.json({ data: duplicate, reused: true })
    }
    throw new ApiError('This completed job already has a review', 409, {
      code: 'CASE_ALREADY_EXISTS',
    })
  }
}))

router.post('/jobs/:jobId/warranty-claims', asyncHandler(async (req, res) => {
  const body = validateBody(req, warrantyClaimSchema)
  const user = getAuthUser(req)
  const job = await getOwnedJob(String(req.params.jobId), user.id)
  const namespacedKey = `marketplace-warranty:${user.id}:${body.idempotencyKey}`
  const prior = await idempotentWarrantyClaim(namespacedKey, job.id, body.issue)
  if (prior) return res.json({ data: prior, reused: true })

  if (job.status !== 'COMPLETED' || !job.warrantyEndsAt) {
    throw new ApiError('Warranty claims require a completed job with active warranty', 409)
  }
  if (job.warrantyEndsAt.getTime() < Date.now()) {
    throw new ApiError('The warranty period for this job has expired', 409, {
      code: 'WARRANTY_EXPIRED',
      warrantyEndsAt: job.warrantyEndsAt.toISOString(),
    })
  }

  try {
    const claim = await db.$transaction(async (tx) => {
      const created = await tx.marketplaceWarrantyClaim.create({
        data: {
          jobId: job.id,
          customerId: user.id,
          idempotencyKey: namespacedKey,
          issue: body.issue,
        },
      })
      await tx.marketplaceAuditEvent.create({
        data: {
          actorUserId: user.id,
          providerId: job.providerId,
          entityType: 'MARKETPLACE_WARRANTY_CLAIM',
          entityId: created.id,
          action: 'WARRANTY_CLAIM_OPENED',
          toState: 'OPEN',
          metadata: JSON.stringify({ warrantyEndsAt: job.warrantyEndsAt!.toISOString() }),
        },
      })
      if (job.provider) {
        await enqueueMarketplaceNotification(
          (args) => tx.notificationDelivery.upsert(args),
          {
            userId: job.provider.userId,
            idempotencyKey: marketplaceNotificationKey(
              'WARRANTY_CLAIM_OPENED',
              created.id,
              job.provider.userId,
            ),
            template: 'WARRANTY_CLAIM_OPENED',
            title: 'New warranty claim',
            message: 'A customer opened a warranty claim for your completed job.',
            entityType: 'MARKETPLACE_WARRANTY_CLAIM',
            entityId: created.id,
            payload: { jobId: job.id, claimId: created.id },
          },
        )
      }
      return created
    })
    return res.status(201).json({ data: claim, reused: false })
  } catch (error) {
    if (!isMarketplaceUniqueConstraintError(error)) throw error
    const duplicate = await idempotentWarrantyClaim(namespacedKey, job.id, body.issue)
    if (duplicate) return res.json({ data: duplicate, reused: true })
    throw new ApiError('This job already has a warranty claim', 409, {
      code: 'CASE_ALREADY_EXISTS',
    })
  }
}))

router.post('/jobs/:jobId/disputes', asyncHandler(async (req, res) => {
  const body = validateBody(req, disputeSchema)
  const user = getAuthUser(req)
  const job = await getOwnedJob(String(req.params.jobId), user.id)
  const namespacedKey = `marketplace-dispute:${user.id}:${body.idempotencyKey}`
  const prior = await idempotentDispute(namespacedKey, job.id, body)
  if (prior) return res.json({ data: prior, reused: true })
  if (!job.providerId) throw new ApiError('This job has no assigned provider', 409)

  assertMarketplaceTransition('job', job.status, 'DISPUTED')
  assertMarketplaceTransition('request', job.request.status, 'DISPUTED')

  const active = await db.marketplaceDispute.findFirst({
    where: { jobId: job.id, status: { in: ['OPEN', 'UNDER_REVIEW'] } },
    select: { id: true },
  })
  if (active) {
    throw new ApiError('This job already has an active dispute', 409, {
      code: 'CASE_ALREADY_EXISTS',
    })
  }

  try {
    const dispute = await db.$transaction(async (tx) => {
      const created = await tx.marketplaceDispute.create({
        data: {
          jobId: job.id,
          openedById: user.id,
          idempotencyKey: namespacedKey,
          category: body.category,
          description: body.description,
        },
      })
      const jobClaim = await tx.marketplaceJob.updateMany({
        where: { id: job.id, status: job.status },
        data: { status: 'DISPUTED' },
      })
      const requestClaim = await tx.marketplaceServiceRequest.updateMany({
        where: { id: job.request.id, customerId: user.id, status: job.request.status },
        data: { status: 'DISPUTED' },
      })
      if (jobClaim.count !== 1 || requestClaim.count !== 1) {
        throw new ApiError('Job or request status changed; refresh and retry', 409)
      }
      await tx.jobStatusHistory.create({
        data: {
          jobId: job.id,
          actorUserId: user.id,
          fromStatus: job.status,
          toStatus: 'DISPUTED',
          note: body.description,
          metadata: JSON.stringify({ disputeId: created.id, category: body.category }),
        },
      })
      await tx.marketplaceAuditEvent.create({
        data: {
          actorUserId: user.id,
          providerId: job.providerId,
          entityType: 'MARKETPLACE_DISPUTE',
          entityId: created.id,
          action: 'DISPUTE_OPENED',
          toState: 'OPEN',
          metadata: JSON.stringify({ category: body.category }),
        },
      })
      if (job.provider) {
        await enqueueMarketplaceNotification(
          (args) => tx.notificationDelivery.upsert(args),
          {
            userId: job.provider.userId,
            idempotencyKey: marketplaceNotificationKey(
              'DISPUTE_OPENED',
              created.id,
              job.provider.userId,
            ),
            template: 'DISPUTE_OPENED',
            title: 'New service dispute',
            message: 'A customer opened a dispute for your marketplace job.',
            entityType: 'MARKETPLACE_DISPUTE',
            entityId: created.id,
            payload: {
              jobId: job.id,
              disputeId: created.id,
              category: body.category,
            },
          },
        )
      }
      return created
    })
    return res.status(201).json({ data: dispute, reused: false })
  } catch (error) {
    if (!isMarketplaceUniqueConstraintError(error)) throw error
    const duplicate = await idempotentDispute(namespacedKey, job.id, body)
    if (duplicate) return res.json({ data: duplicate, reused: true })
    throw new ApiError('A dispute conflict occurred; refresh and retry', 409, {
      code: 'CASE_ALREADY_EXISTS',
    })
  }
}))

export default router
