import { Router } from 'express'
import { z } from 'zod'

import { ApiError, asyncHandler, validateBody } from '../lib/api-handler.js'
import { getAuthUser, requireAuth } from '../lib/auth.js'
import { db } from '../lib/db.js'
import {
  getRequestSubmissionIssues,
  isOwnedCustomerRequestStorageKey,
  normalizeMarketplaceMoney,
} from '../lib/marketplace-request.js'
import { assertMarketplaceTransition } from '../lib/marketplace-state.js'

const router = Router()

const attachmentSchema = z.object({
  type: z.enum(['IMAGE', 'VIDEO', 'DOCUMENT']).default('IMAGE'),
  storageKey: z.string().trim().min(10).max(500),
  caption: z.string().trim().max(300).optional().nullable(),
}).strict()

const requestSchema = z.object({
  serviceId: z.string().uuid().optional().nullable(),
  skillId: z.string().uuid().optional().nullable(),
  serviceZoneId: z.string().uuid(),
  idempotencyKey: z.string().uuid().optional(),
  problemSummary: z.string().trim().min(5).max(200),
  description: z.string().trim().max(3000).optional().nullable(),
  serviceAddress: z.string().trim().min(5).max(500),
  areaName: z.string().trim().max(150).optional().nullable(),
  latitude: z.number().min(-90).max(90).optional().nullable(),
  longitude: z.number().min(-180).max(180).optional().nullable(),
  scheduledFor: z.string().datetime().optional().nullable(),
  isEmergency: z.boolean().default(false),
  emergencySurchargeAccepted: z.boolean().default(false),
  attachments: z.array(attachmentSchema).max(8).default([]),
}).strict().refine(
  (body) => (body.latitude == null) === (body.longitude == null),
  { message: 'latitude and longitude must be provided together', path: ['latitude'] },
)

const cancelSchema = z.object({
  reason: z.string().trim().min(5).max(1000),
}).strict()

const requestInclude = {
  service: { select: { id: true, name: true, nameBn: true, slug: true } },
  skill: { select: { id: true, name: true, nameBn: true, slug: true } },
  serviceZone: {
    include: { district: { include: { division: true } }, upazila: true },
  },
  attachments: { orderBy: { sortOrder: 'asc' as const } },
  job: {
    select: {
      id: true,
      providerId: true,
      status: true,
      assignedAt: true,
      acceptedAt: true,
      enRouteAt: true,
      arrivedAt: true,
      completedAt: true,
      provider: {
        select: { id: true, displayName: true, rating: true, jobsCompleted: true },
      },
    },
  },
} as const

async function getOwnedRequest(id: string, customerId: string) {
  const request = await db.marketplaceServiceRequest.findFirst({
    where: { id, customerId },
    include: requestInclude,
  })
  if (!request) throw new ApiError('Marketplace service request not found', 404)
  return request
}

async function validateCatalogReferences(body: z.infer<typeof requestSchema>): Promise<void> {
  const [zone, service, skill] = await Promise.all([
    db.serviceZone.findFirst({ where: { id: body.serviceZoneId, isActive: true } }),
    body.serviceId
      ? db.service.findFirst({ where: { id: body.serviceId, isActive: true } })
      : null,
    body.skillId
      ? db.skill.findFirst({ where: { id: body.skillId, isActive: true } })
      : null,
  ])
  if (!zone) throw new ApiError('Service zone is unavailable', 400)
  if (body.serviceId && !service) throw new ApiError('Service is unavailable', 400)
  if (body.skillId && !skill) throw new ApiError('Skill is unavailable', 400)
}

async function getEmergencySurcharge(): Promise<string> {
  const setting = await db.marketplaceSetting.findUnique({
    where: { key: 'emergency_surcharge_bdt' },
    select: { value: true },
  })
  return normalizeMarketplaceMoney(setting?.value)
}

router.use(requireAuth)

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const user = getAuthUser(req)
    const requests = await db.marketplaceServiceRequest.findMany({
      where: { customerId: user.id },
      include: requestInclude,
      orderBy: { createdAt: 'desc' },
      take: 100,
    })
    res.json({ data: requests })
  }),
)

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const body = validateBody(req, requestSchema)
    const user = getAuthUser(req)

    if (body.idempotencyKey) {
      const existing = await db.marketplaceServiceRequest.findUnique({
        where: { idempotencyKey: body.idempotencyKey },
        include: requestInclude,
      })
      if (existing) {
        if (existing.customerId !== user.id) {
          throw new ApiError('Idempotency key is already in use', 409, {
            code: 'IDEMPOTENCY_CONFLICT',
          })
        }
        return res.json({ data: existing, idempotent: true })
      }
    }

    await validateCatalogReferences(body)
    for (const attachment of body.attachments) {
      if (!isOwnedCustomerRequestStorageKey(attachment.storageKey, user.id)) {
        throw new ApiError('Attachment storage key is outside the customer request namespace', 400)
      }
    }

    const emergencySurcharge = body.isEmergency
      ? await getEmergencySurcharge()
      : '0.00'
    const issues = getRequestSubmissionIssues({
      serviceId: body.serviceId ?? null,
      skillId: body.skillId ?? null,
      scheduledFor: body.scheduledFor ? new Date(body.scheduledFor) : null,
      isEmergency: body.isEmergency,
      emergencySurcharge,
      emergencySurchargeAccepted: body.emergencySurchargeAccepted,
    })
    if (issues.includes('EMERGENCY_SURCHARGE_CONFIRMATION_REQUIRED')) {
      throw new ApiError('Emergency surcharge confirmation is required', 409, {
        code: 'EMERGENCY_SURCHARGE_CONFIRMATION_REQUIRED',
        amount: emergencySurcharge,
        currency: 'BDT',
      })
    }

    const created = await db.$transaction(async (tx) => {
      const request = await tx.marketplaceServiceRequest.create({
        data: {
          customerId: user.id,
          serviceId: body.serviceId ?? null,
          skillId: body.skillId ?? null,
          serviceZoneId: body.serviceZoneId,
          idempotencyKey: body.idempotencyKey ?? null,
          problemSummary: body.problemSummary,
          description: body.description || null,
          serviceAddress: body.serviceAddress,
          areaName: body.areaName || null,
          latitude: body.latitude ?? null,
          longitude: body.longitude ?? null,
          scheduledFor: body.scheduledFor ? new Date(body.scheduledFor) : null,
          isEmergency: body.isEmergency,
          emergencySurcharge,
          attachments: body.attachments.length > 0
            ? {
                create: body.attachments.map((attachment, index) => ({
                  type: attachment.type,
                  storageKey: attachment.storageKey,
                  caption: attachment.caption || null,
                  sortOrder: index,
                })),
              }
            : undefined,
        },
      })
      await tx.marketplaceAuditEvent.create({
        data: {
          actorUserId: user.id,
          entityType: 'SERVICE_REQUEST',
          entityId: request.id,
          action: 'CREATED',
          toState: 'DRAFT',
        },
      })
      return request
    })

    const request = await getOwnedRequest(created.id, user.id)
    res.status(201).json({ data: request })
  }),
)

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const user = getAuthUser(req)
    const request = await getOwnedRequest(String(req.params.id), user.id)
    res.json({ data: request })
  }),
)

router.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const body = validateBody(req, requestSchema.omit({ idempotencyKey: true }))
    const user = getAuthUser(req)
    const existing = await getOwnedRequest(String(req.params.id), user.id)
    if (existing.status !== 'DRAFT') {
      throw new ApiError('Only draft requests can be changed', 409)
    }

    await validateCatalogReferences(body)
    for (const attachment of body.attachments) {
      if (!isOwnedCustomerRequestStorageKey(attachment.storageKey, user.id)) {
        throw new ApiError('Attachment storage key is outside the customer request namespace', 400)
      }
    }
    const emergencySurcharge = body.isEmergency
      ? await getEmergencySurcharge()
      : '0.00'
    if (
      body.isEmergency &&
      Number(emergencySurcharge) > 0 &&
      !body.emergencySurchargeAccepted
    ) {
      throw new ApiError('Emergency surcharge confirmation is required', 409, {
        code: 'EMERGENCY_SURCHARGE_CONFIRMATION_REQUIRED',
        amount: emergencySurcharge,
        currency: 'BDT',
      })
    }

    await db.$transaction(async (tx) => {
      const claim = await tx.marketplaceServiceRequest.updateMany({
        where: { id: existing.id, customerId: user.id, status: 'DRAFT' },
        data: {
          serviceId: body.serviceId ?? null,
          skillId: body.skillId ?? null,
          serviceZoneId: body.serviceZoneId,
          problemSummary: body.problemSummary,
          description: body.description || null,
          serviceAddress: body.serviceAddress,
          areaName: body.areaName || null,
          latitude: body.latitude ?? null,
          longitude: body.longitude ?? null,
          scheduledFor: body.scheduledFor ? new Date(body.scheduledFor) : null,
          isEmergency: body.isEmergency,
          emergencySurcharge,
        },
      })
      if (claim.count !== 1) throw new ApiError('Request changed; refresh and retry', 409)
      await tx.serviceRequestAttachment.deleteMany({ where: { requestId: existing.id } })
      if (body.attachments.length > 0) {
        await tx.serviceRequestAttachment.createMany({
          data: body.attachments.map((attachment, index) => ({
            requestId: existing.id,
            type: attachment.type,
            storageKey: attachment.storageKey,
            caption: attachment.caption || null,
            sortOrder: index,
          })),
        })
      }
      await tx.marketplaceAuditEvent.create({
        data: {
          actorUserId: user.id,
          entityType: 'SERVICE_REQUEST',
          entityId: existing.id,
          action: 'UPDATED',
          fromState: 'DRAFT',
          toState: 'DRAFT',
        },
      })
    })

    res.json({ data: await getOwnedRequest(existing.id, user.id) })
  }),
)

router.post(
  '/:id/submit',
  asyncHandler(async (req, res) => {
    const user = getAuthUser(req)
    const request = await getOwnedRequest(String(req.params.id), user.id)
    assertMarketplaceTransition('request', request.status, 'SUBMITTED')

    const issues = getRequestSubmissionIssues({
      serviceId: request.serviceId,
      skillId: request.skillId,
      scheduledFor: request.scheduledFor,
      isEmergency: request.isEmergency,
      emergencySurcharge: request.emergencySurcharge.toString(),
      emergencySurchargeAccepted: true,
    })
    if (issues.length > 0) {
      throw new ApiError('Marketplace request is incomplete', 409, {
        code: 'MARKETPLACE_REQUEST_INCOMPLETE',
        issues,
      })
    }

    await db.$transaction(async (tx) => {
      const claim = await tx.marketplaceServiceRequest.updateMany({
        where: { id: request.id, customerId: user.id, status: request.status },
        data: { status: 'SUBMITTED', submittedAt: new Date() },
      })
      if (claim.count !== 1) throw new ApiError('Request status changed; refresh and retry', 409)
      await tx.marketplaceAuditEvent.create({
        data: {
          actorUserId: user.id,
          entityType: 'SERVICE_REQUEST',
          entityId: request.id,
          action: 'SUBMITTED',
          fromState: request.status,
          toState: 'SUBMITTED',
        },
      })
    })

    res.json({ data: await getOwnedRequest(request.id, user.id) })
  }),
)

router.post(
  '/:id/cancel',
  asyncHandler(async (req, res) => {
    const { reason } = validateBody(req, cancelSchema)
    const user = getAuthUser(req)
    const request = await getOwnedRequest(String(req.params.id), user.id)
    if (!['DRAFT', 'SUBMITTED', 'DISPATCHING'].includes(request.status)) {
      throw new ApiError('Assigned or active work requires support-assisted cancellation', 409)
    }
    assertMarketplaceTransition('request', request.status, 'CANCELLED')

    await db.$transaction(async (tx) => {
      const claim = await tx.marketplaceServiceRequest.updateMany({
        where: { id: request.id, customerId: user.id, status: request.status },
        data: {
          status: 'CANCELLED',
          cancellationReason: reason,
          cancelledAt: new Date(),
        },
      })
      if (claim.count !== 1) throw new ApiError('Request status changed; refresh and retry', 409)
      await tx.marketplaceAuditEvent.create({
        data: {
          actorUserId: user.id,
          entityType: 'SERVICE_REQUEST',
          entityId: request.id,
          action: 'CANCELLED',
          fromState: request.status,
          toState: 'CANCELLED',
          metadata: JSON.stringify({ reason }),
        },
      })
    })

    res.json({ data: await getOwnedRequest(request.id, user.id) })
  }),
)

export default router
