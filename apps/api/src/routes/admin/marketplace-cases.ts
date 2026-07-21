import { Router } from 'express'
import { z } from 'zod'

import { ApiError, asyncHandler, validateBody } from '../../lib/api-handler.js'
import { getAuthUser } from '../../lib/auth.js'
import { db } from '../../lib/db.js'
import { assertMarketplaceCaseTransition } from '../../lib/marketplace-case.js'
import { requireMarketplaceEnabled } from '../../lib/marketplace-auth.js'
import {
  enqueueMarketplaceNotification,
  marketplaceNotificationKey,
} from '../../lib/marketplace-notifications.js'
import { assertMarketplaceTransition } from '../../lib/marketplace-state.js'

const router = Router()

const resolutionSchema = z.object({
  decision: z.enum(['RESOLVED', 'REJECTED']),
  resolution: z.string().trim().min(10).max(5000),
}).strict()

const allowedStatuses = new Set(['OPEN', 'UNDER_REVIEW', 'RESOLVED', 'REJECTED'])

router.use(requireMarketplaceEnabled)

router.get('/', asyncHandler(async (req, res) => {
  const status = typeof req.query.status === 'string' ? req.query.status.toUpperCase() : undefined
  const type = typeof req.query.type === 'string' ? req.query.type.toUpperCase() : undefined
  if (status && !allowedStatuses.has(status)) throw new ApiError('Invalid case status', 400)
  if (type && !['WARRANTY', 'DISPUTE'].includes(type)) throw new ApiError('Invalid case type', 400)

  const [warrantyClaims, disputes] = await Promise.all([
    type === 'DISPUTE'
      ? Promise.resolve([])
      : db.marketplaceWarrantyClaim.findMany({
          where: status ? { status } : {},
          include: {
            customer: { select: { id: true, name: true, email: true, phone: true } },
            job: {
              include: {
                provider: { select: { id: true, displayName: true } },
                request: { select: { id: true, problemSummary: true, serviceAddress: true } },
              },
            },
            resolvedBy: { select: { id: true, name: true, email: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 200,
        }),
    type === 'WARRANTY'
      ? Promise.resolve([])
      : db.marketplaceDispute.findMany({
          where: status ? { status } : {},
          include: {
            openedBy: { select: { id: true, name: true, email: true, phone: true } },
            job: {
              include: {
                provider: { select: { id: true, displayName: true } },
                request: { select: { id: true, problemSummary: true, serviceAddress: true } },
              },
            },
            resolvedBy: { select: { id: true, name: true, email: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 200,
        }),
  ])
  res.json({ data: { warrantyClaims, disputes } })
}))

router.post('/warranty-claims/:id/start-review', asyncHandler(async (req, res) => {
  const admin = getAuthUser(req)
  const claim = await db.marketplaceWarrantyClaim.findUnique({
    where: { id: String(req.params.id) },
    include: { job: { select: { providerId: true } } },
  })
  if (!claim) throw new ApiError('Warranty claim not found', 404)
  assertMarketplaceCaseTransition(claim.status, 'UNDER_REVIEW')

  await db.$transaction(async (tx) => {
    const stateClaim = await tx.marketplaceWarrantyClaim.updateMany({
      where: { id: claim.id, status: claim.status },
      data: { status: 'UNDER_REVIEW' },
    })
    if (stateClaim.count !== 1) throw new ApiError('Claim status changed; refresh and retry', 409)
    await tx.marketplaceAuditEvent.create({
      data: {
        actorUserId: admin.id,
        providerId: claim.job.providerId,
        entityType: 'MARKETPLACE_WARRANTY_CLAIM',
        entityId: claim.id,
        action: 'CASE_REVIEW_STARTED',
        fromState: claim.status,
        toState: 'UNDER_REVIEW',
      },
    })
  })
  res.json({ data: await db.marketplaceWarrantyClaim.findUnique({ where: { id: claim.id } }) })
}))

router.post('/warranty-claims/:id/resolve', asyncHandler(async (req, res) => {
  const body = validateBody(req, resolutionSchema)
  const admin = getAuthUser(req)
  const claim = await db.marketplaceWarrantyClaim.findUnique({
    where: { id: String(req.params.id) },
    include: {
      job: {
        select: {
          providerId: true,
          provider: { select: { userId: true } },
        },
      },
    },
  })
  if (!claim) throw new ApiError('Warranty claim not found', 404)
  assertMarketplaceCaseTransition(claim.status, body.decision)
  const now = new Date()

  await db.$transaction(async (tx) => {
    const stateClaim = await tx.marketplaceWarrantyClaim.updateMany({
      where: { id: claim.id, status: claim.status },
      data: {
        status: body.decision,
        resolution: body.resolution,
        resolvedById: admin.id,
        resolvedAt: now,
      },
    })
    if (stateClaim.count !== 1) throw new ApiError('Claim status changed; refresh and retry', 409)
    await tx.marketplaceAuditEvent.create({
      data: {
        actorUserId: admin.id,
        providerId: claim.job.providerId,
        entityType: 'MARKETPLACE_WARRANTY_CLAIM',
        entityId: claim.id,
        action: body.decision === 'RESOLVED' ? 'CASE_RESOLVED' : 'CASE_REJECTED',
        fromState: claim.status,
        toState: body.decision,
        metadata: JSON.stringify({ resolution: body.resolution }),
      },
    })
    const warrantyRecipients = new Set([
      claim.customerId,
      claim.job.provider?.userId,
    ].filter((userId): userId is string => Boolean(userId)))
    for (const userId of warrantyRecipients) {
      await enqueueMarketplaceNotification(
        (args) => tx.notificationDelivery.upsert(args),
        {
          userId,
          idempotencyKey: marketplaceNotificationKey(
            `WARRANTY_CASE_${body.decision}`,
            claim.id,
            userId,
          ),
          template: `WARRANTY_CASE_${body.decision}`,
          title: body.decision === 'RESOLVED'
            ? 'Warranty claim resolved'
            : 'Warranty claim rejected',
          message: 'An administrator finalized the warranty claim. Open the case to review the decision.',
          entityType: 'MARKETPLACE_WARRANTY_CLAIM',
          entityId: claim.id,
          payload: {
            jobId: claim.jobId,
            claimId: claim.id,
            decision: body.decision,
            resolution: body.resolution,
          },
        },
      )
    }
  })
  res.json({ data: await db.marketplaceWarrantyClaim.findUnique({ where: { id: claim.id } }) })
}))

router.post('/disputes/:id/start-review', asyncHandler(async (req, res) => {
  const admin = getAuthUser(req)
  const dispute = await db.marketplaceDispute.findUnique({
    where: { id: String(req.params.id) },
    include: { job: { select: { providerId: true } } },
  })
  if (!dispute) throw new ApiError('Dispute not found', 404)
  assertMarketplaceCaseTransition(dispute.status, 'UNDER_REVIEW')

  await db.$transaction(async (tx) => {
    const stateClaim = await tx.marketplaceDispute.updateMany({
      where: { id: dispute.id, status: dispute.status },
      data: { status: 'UNDER_REVIEW' },
    })
    if (stateClaim.count !== 1) throw new ApiError('Dispute status changed; refresh and retry', 409)
    await tx.marketplaceAuditEvent.create({
      data: {
        actorUserId: admin.id,
        providerId: dispute.job.providerId,
        entityType: 'MARKETPLACE_DISPUTE',
        entityId: dispute.id,
        action: 'CASE_REVIEW_STARTED',
        fromState: dispute.status,
        toState: 'UNDER_REVIEW',
      },
    })
  })
  res.json({ data: await db.marketplaceDispute.findUnique({ where: { id: dispute.id } }) })
}))

router.post('/disputes/:id/resolve', asyncHandler(async (req, res) => {
  const body = validateBody(req, resolutionSchema)
  const admin = getAuthUser(req)
  const dispute = await db.marketplaceDispute.findUnique({
    where: { id: String(req.params.id) },
    include: {
      job: {
        include: {
          provider: { select: { userId: true } },
          request: { select: { id: true, status: true } },
        },
      },
    },
  })
  if (!dispute) throw new ApiError('Dispute not found', 404)
  assertMarketplaceCaseTransition(dispute.status, body.decision)
  assertMarketplaceTransition('job', dispute.job.status, 'RESOLVED')
  assertMarketplaceTransition('request', dispute.job.request.status, 'RESOLVED')
  const now = new Date()

  await db.$transaction(async (tx) => {
    const disputeClaim = await tx.marketplaceDispute.updateMany({
      where: { id: dispute.id, status: dispute.status },
      data: {
        status: body.decision,
        resolution: body.resolution,
        resolvedById: admin.id,
        resolvedAt: now,
      },
    })
    const jobClaim = await tx.marketplaceJob.updateMany({
      where: { id: dispute.jobId, status: dispute.job.status },
      data: { status: 'RESOLVED' },
    })
    const requestClaim = await tx.marketplaceServiceRequest.updateMany({
      where: { id: dispute.job.request.id, status: dispute.job.request.status },
      data: { status: 'RESOLVED' },
    })
    if (disputeClaim.count !== 1 || jobClaim.count !== 1 || requestClaim.count !== 1) {
      throw new ApiError('Case, job, or request status changed; refresh and retry', 409)
    }
    await tx.jobStatusHistory.create({
      data: {
        jobId: dispute.jobId,
        actorUserId: admin.id,
        fromStatus: dispute.job.status,
        toStatus: 'RESOLVED',
        note: body.resolution,
        metadata: JSON.stringify({ disputeId: dispute.id, decision: body.decision }),
      },
    })
    await tx.marketplaceAuditEvent.create({
      data: {
        actorUserId: admin.id,
        providerId: dispute.job.providerId,
        entityType: 'MARKETPLACE_DISPUTE',
        entityId: dispute.id,
        action: body.decision === 'RESOLVED' ? 'CASE_RESOLVED' : 'CASE_REJECTED',
        fromState: dispute.status,
        toState: body.decision,
        metadata: JSON.stringify({ resolution: body.resolution }),
      },
    })
    const disputeRecipients = new Set([
      dispute.openedById,
      dispute.job.provider?.userId,
    ].filter((userId): userId is string => Boolean(userId)))
    for (const userId of disputeRecipients) {
      await enqueueMarketplaceNotification(
        (args) => tx.notificationDelivery.upsert(args),
        {
          userId,
          idempotencyKey: marketplaceNotificationKey(
            `DISPUTE_CASE_${body.decision}`,
            dispute.id,
            userId,
          ),
          template: `DISPUTE_CASE_${body.decision}`,
          title: body.decision === 'RESOLVED'
            ? 'Dispute resolved'
            : 'Dispute rejected',
          message: 'An administrator finalized the dispute. Open the case to review the decision.',
          entityType: 'MARKETPLACE_DISPUTE',
          entityId: dispute.id,
          payload: {
            jobId: dispute.jobId,
            disputeId: dispute.id,
            decision: body.decision,
            resolution: body.resolution,
          },
        },
      )
    }
  })
  res.json({ data: await db.marketplaceDispute.findUnique({ where: { id: dispute.id } }) })
}))

export default router
