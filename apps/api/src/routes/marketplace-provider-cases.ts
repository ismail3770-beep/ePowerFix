import { Router } from 'express'
import { z } from 'zod'

import { ApiError, asyncHandler, validateBody } from '../lib/api-handler.js'
import { requireAuth } from '../lib/auth.js'
import { db } from '../lib/db.js'
import {
  getMarketplaceProvider,
  requireVerifiedProvider,
} from '../lib/marketplace-auth.js'
import {
  enqueueMarketplaceNotification,
  marketplaceNotificationKey,
} from '../lib/marketplace-notifications.js'

const router = Router()

const responseSchema = z.object({
  response: z.string().trim().min(10).max(5000),
}).strict()

router.use(requireAuth, requireVerifiedProvider)

router.get('/', asyncHandler(async (req, res) => {
  const provider = getMarketplaceProvider(req)
  const status = typeof req.query.status === 'string' ? req.query.status.toUpperCase() : undefined
  const allowed = new Set(['OPEN', 'UNDER_REVIEW', 'RESOLVED', 'REJECTED'])
  if (status && !allowed.has(status)) throw new ApiError('Invalid case status', 400)

  const [warrantyClaims, disputes] = await Promise.all([
    db.marketplaceWarrantyClaim.findMany({
      where: { job: { providerId: provider.id }, ...(status ? { status } : {}) },
      include: {
        job: { select: { id: true, completedAt: true, warrantyEndsAt: true } },
        customer: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    }),
    db.marketplaceDispute.findMany({
      where: { job: { providerId: provider.id }, ...(status ? { status } : {}) },
      include: {
        job: { select: { id: true, completedAt: true } },
        openedBy: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    }),
  ])
  res.json({ data: { warrantyClaims, disputes } })
}))

router.post('/warranty-claims/:id/respond', asyncHandler(async (req, res) => {
  const body = validateBody(req, responseSchema)
  const provider = getMarketplaceProvider(req)
  const claim = await db.marketplaceWarrantyClaim.findFirst({
    where: { id: String(req.params.id), job: { providerId: provider.id } },
  })
  if (!claim) throw new ApiError('Warranty claim not found', 404)
  if (!['OPEN', 'UNDER_REVIEW'].includes(claim.status)) {
    throw new ApiError('This warranty claim no longer accepts responses', 409)
  }
  if (claim.providerResponse) throw new ApiError('A provider response was already submitted', 409)

  const updated = await db.$transaction(async (tx) => {
    const responseClaim = await tx.marketplaceWarrantyClaim.updateMany({
      where: {
        id: claim.id,
        status: claim.status,
        providerResponse: null,
        job: { providerId: provider.id },
      },
      data: { providerResponse: body.response, providerRespondedAt: new Date() },
    })
    if (responseClaim.count !== 1) throw new ApiError('Claim changed; refresh and retry', 409)
    await tx.marketplaceAuditEvent.create({
      data: {
        actorUserId: provider.userId,
        providerId: provider.id,
        entityType: 'MARKETPLACE_WARRANTY_CLAIM',
        entityId: claim.id,
        action: 'PROVIDER_RESPONSE_SUBMITTED',
      },
    })
    await enqueueMarketplaceNotification(
      (args) => tx.notificationDelivery.upsert(args),
      {
        userId: claim.customerId,
        idempotencyKey: marketplaceNotificationKey(
          'WARRANTY_PROVIDER_RESPONDED',
          claim.id,
          claim.customerId,
        ),
        template: 'WARRANTY_PROVIDER_RESPONDED',
        title: 'Electrician responded to your claim',
        message: 'Your electrician submitted a response to the warranty claim.',
        entityType: 'MARKETPLACE_WARRANTY_CLAIM',
        entityId: claim.id,
        payload: { jobId: claim.jobId, claimId: claim.id },
      },
    )
    return tx.marketplaceWarrantyClaim.findUnique({ where: { id: claim.id } })
  })
  res.json({ data: updated })
}))

router.post('/disputes/:id/respond', asyncHandler(async (req, res) => {
  const body = validateBody(req, responseSchema)
  const provider = getMarketplaceProvider(req)
  const dispute = await db.marketplaceDispute.findFirst({
    where: { id: String(req.params.id), job: { providerId: provider.id } },
  })
  if (!dispute) throw new ApiError('Dispute not found', 404)
  if (!['OPEN', 'UNDER_REVIEW'].includes(dispute.status)) {
    throw new ApiError('This dispute no longer accepts responses', 409)
  }
  if (dispute.providerResponse) throw new ApiError('A provider response was already submitted', 409)

  const updated = await db.$transaction(async (tx) => {
    const responseClaim = await tx.marketplaceDispute.updateMany({
      where: {
        id: dispute.id,
        status: dispute.status,
        providerResponse: null,
        job: { providerId: provider.id },
      },
      data: { providerResponse: body.response, providerRespondedAt: new Date() },
    })
    if (responseClaim.count !== 1) throw new ApiError('Dispute changed; refresh and retry', 409)
    await tx.marketplaceAuditEvent.create({
      data: {
        actorUserId: provider.userId,
        providerId: provider.id,
        entityType: 'MARKETPLACE_DISPUTE',
        entityId: dispute.id,
        action: 'PROVIDER_RESPONSE_SUBMITTED',
      },
    })
    await enqueueMarketplaceNotification(
      (args) => tx.notificationDelivery.upsert(args),
      {
        userId: dispute.openedById,
        idempotencyKey: marketplaceNotificationKey(
          'DISPUTE_PROVIDER_RESPONDED',
          dispute.id,
          dispute.openedById,
        ),
        template: 'DISPUTE_PROVIDER_RESPONDED',
        title: 'Electrician responded to your dispute',
        message: 'Your electrician submitted a response to the marketplace dispute.',
        entityType: 'MARKETPLACE_DISPUTE',
        entityId: dispute.id,
        payload: { jobId: dispute.jobId, disputeId: dispute.id },
      },
    )
    return tx.marketplaceDispute.findUnique({ where: { id: dispute.id } })
  })
  res.json({ data: updated })
}))

export default router
