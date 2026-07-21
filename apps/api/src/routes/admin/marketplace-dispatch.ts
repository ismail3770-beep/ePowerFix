import { Router } from 'express'
import { z } from 'zod'

import { ApiError, asyncHandler, validateBody } from '../../lib/api-handler.js'
import { getAuthUser } from '../../lib/auth.js'
import { db } from '../../lib/db.js'
import { getPagination, listResponse } from '../../lib/helpers.js'
import { requireMarketplaceEnabled } from '../../lib/marketplace-auth.js'
import {
  evaluateProviderSchedule,
  scoreProviderRecommendation,
} from '../../lib/marketplace-matching.js'
import {
  enqueueMarketplaceNotification,
  marketplaceNotificationKey,
} from '../../lib/marketplace-notifications.js'
import { assertMarketplaceTransition } from '../../lib/marketplace-state.js'

const router = Router()

const assignmentSchema = z.object({
  providerId: z.string().uuid(),
  note: z.string().trim().max(1000).optional(),
  expiresAt: z.string().datetime().optional().nullable(),
}).strict()

const requestDetailInclude = {
  customer: { select: { id: true, name: true, email: true, phone: true } },
  service: { select: { id: true, name: true, nameBn: true, slug: true } },
  skill: { select: { id: true, name: true, nameBn: true, slug: true } },
  serviceZone: {
    include: { district: { include: { division: true } }, upazila: true },
  },
  attachments: { orderBy: { sortOrder: 'asc' as const } },
  job: {
    include: {
      provider: {
        include: { user: { select: { id: true, name: true, phone: true } } },
      },
      assignments: {
        include: {
          provider: { select: { id: true, displayName: true, status: true } },
          assignedBy: { select: { id: true, name: true, email: true } },
        },
        orderBy: { offeredAt: 'desc' as const },
      },
      statusHistory: { orderBy: { createdAt: 'desc' as const } },
    },
  },
} as const

async function getDispatchRequest(id: string) {
  const request = await db.marketplaceServiceRequest.findUnique({
    where: { id },
    include: requestDetailInclude,
  })
  if (!request) throw new ApiError('Marketplace service request not found', 404)
  return request
}

router.use(requireMarketplaceEnabled)

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const query = req.query as Record<string, string | undefined>
    const { page, limit, skip, search } = getPagination(query)
    const status = query.status?.trim().toUpperCase()
    const allowedStatuses = new Set([
      'SUBMITTED',
      'DISPATCHING',
      'ASSIGNED',
      'IN_SERVICE',
      'COMPLETED',
      'CANCELLED',
      'DISPUTED',
      'RESOLVED',
    ])
    if (status && !allowedStatuses.has(status)) throw new ApiError('Invalid request status', 400)

    const where = {
      ...(status ? { status } : { status: { not: 'DRAFT' } }),
      ...(query.serviceZoneId ? { serviceZoneId: query.serviceZoneId } : {}),
      ...(query.isEmergency === 'true' ? { isEmergency: true } : {}),
      ...(search
        ? {
            OR: [
              { problemSummary: { contains: search, mode: 'insensitive' as const } },
              { customer: { name: { contains: search, mode: 'insensitive' as const } } },
              { customer: { phone: { contains: search } } },
            ],
          }
        : {}),
    }

    const [requests, total] = await Promise.all([
      db.marketplaceServiceRequest.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ isEmergency: 'desc' }, { submittedAt: 'asc' }, { createdAt: 'asc' }],
        select: {
          id: true,
          status: true,
          problemSummary: true,
          serviceAddress: true,
          areaName: true,
          scheduledFor: true,
          isEmergency: true,
          emergencySurcharge: true,
          submittedAt: true,
          createdAt: true,
          customer: { select: { id: true, name: true, phone: true } },
          service: { select: { id: true, name: true } },
          skill: { select: { id: true, name: true } },
          serviceZone: { select: { id: true, name: true } },
          job: { select: { id: true, providerId: true, status: true } },
        },
      }),
      db.marketplaceServiceRequest.count({ where }),
    ])

    res.json(listResponse(requests, total, page, limit))
  }),
)

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    res.json({ data: await getDispatchRequest(String(req.params.id)) })
  }),
)

router.get(
  '/:id/recommendations',
  asyncHandler(async (req, res) => {
    const request = await getDispatchRequest(String(req.params.id))
    if (!['SUBMITTED', 'DISPATCHING'].includes(request.status)) {
      throw new ApiError('Recommendations are available only while a request awaits dispatch', 409)
    }

    const targetAt = request.scheduledFor && request.scheduledFor.getTime() > Date.now()
      ? request.scheduledFor
      : new Date()
    const previouslyOfferedProviderIds = request.job?.assignments.map(
      (assignment) => assignment.providerId,
    ) ?? []
    const activeJobStatuses = [
      'ASSIGNED',
      'ACCEPTED',
      'EN_ROUTE',
      'ARRIVED',
      'INSPECTION',
      'QUOTE_PENDING',
      'QUOTE_APPROVED',
      'IN_PROGRESS',
      'COMPLETED_PENDING_CONFIRMATION',
    ]

    const providers = await db.providerProfile.findMany({
      where: {
        status: 'VERIFIED',
        isActive: true,
        ...(previouslyOfferedProviderIds.length > 0
          ? { id: { notIn: previouslyOfferedProviderIds } }
          : {}),
        ...(request.isEmergency ? { emergencyAvailable: true } : {}),
        serviceZones: {
          some: {
            serviceZoneId: request.serviceZoneId,
            isActive: true,
            ...(request.isEmergency ? { emergencyAvailable: true } : {}),
          },
        },
        ...(request.skillId
          ? { skills: { some: { skillId: request.skillId, isVerified: true } } }
          : {}),
        timeOff: {
          none: { startsAt: { lte: targetAt }, endsAt: { gte: targetAt } },
        },
      },
      select: {
        id: true,
        displayName: true,
        rating: true,
        reviewCount: true,
        jobsCompleted: true,
        yearsExperience: true,
        emergencyAvailable: true,
        availability: {
          where: { isActive: true },
          select: { dayOfWeek: true, startTime: true, endTime: true, isActive: true },
        },
        skills: request.skillId
          ? {
              where: { skillId: request.skillId, isVerified: true },
              select: { yearsExperience: true, proficiency: true },
              take: 1,
            }
          : {
              where: { isVerified: true },
              select: { yearsExperience: true, proficiency: true },
              take: 1,
            },
        serviceZones: {
          where: { serviceZoneId: request.serviceZoneId, isActive: true },
          select: { emergencyAvailable: true, travelRadiusKm: true },
          take: 1,
        },
        jobs: {
          where: { status: { in: activeJobStatuses } },
          select: { id: true },
        },
      },
      orderBy: [{ rating: 'desc' }, { jobsCompleted: 'desc' }, { createdAt: 'asc' }],
      take: 100,
    })

    const recommendations = providers
      .map((provider) => {
        const scheduleStatus = evaluateProviderSchedule(provider.availability, targetAt)
        const skill = provider.skills[0]
        const scored = scoreProviderRecommendation({
          rating: Number(provider.rating),
          yearsExperience: provider.yearsExperience,
          skillYearsExperience: skill?.yearsExperience ?? null,
          skillProficiency: skill?.proficiency ?? null,
          jobsCompleted: provider.jobsCompleted,
          activeJobs: provider.jobs.length,
          scheduleStatus,
        })
        return {
          providerId: provider.id,
          displayName: provider.displayName,
          score: scored.score,
          scheduleStatus,
          rating: provider.rating.toString(),
          reviewCount: provider.reviewCount,
          jobsCompleted: provider.jobsCompleted,
          activeJobs: provider.jobs.length,
          factors: scored.factors,
          warnings: scheduleStatus === 'UNCONFIGURED'
            ? ['Provider schedule is not configured; confirm availability before assignment']
            : scheduleStatus === 'UNAVAILABLE'
              ? ['Provider schedule does not cover the requested time']
              : [],
          eligibility: {
            verified: true,
            exactServiceZone: true,
            verifiedSkill: request.skillId ? Boolean(skill) : null,
            emergencyCapable: request.isEmergency ? provider.emergencyAvailable : null,
            activeTimeOffAtTarget: false,
          },
        }
      })
      .sort((left, right) => (
        right.score - left.score ||
        Number(right.rating) - Number(left.rating) ||
        right.jobsCompleted - left.jobsCompleted ||
        left.providerId.localeCompare(right.providerId)
      ))
      .slice(0, 20)

    res.json({
      data: {
        mode: 'ADMIN_ADVISORY',
        automaticAssignment: false,
        requestId: request.id,
        targetAt: targetAt.toISOString(),
        generatedAt: new Date().toISOString(),
        excludedPreviouslyOfferedProviders: previouslyOfferedProviderIds.length,
        recommendations,
      },
    })
  }),
)

router.post(
  '/:id/start-dispatch',
  asyncHandler(async (req, res) => {
    const request = await getDispatchRequest(String(req.params.id))
    const admin = getAuthUser(req)
    assertMarketplaceTransition('request', request.status, 'DISPATCHING')

    await db.$transaction(async (tx) => {
      const claim = await tx.marketplaceServiceRequest.updateMany({
        where: { id: request.id, status: request.status },
        data: { status: 'DISPATCHING' },
      })
      if (claim.count !== 1) throw new ApiError('Request status changed; refresh and retry', 409)
      await tx.marketplaceAuditEvent.create({
        data: {
          actorUserId: admin.id,
          entityType: 'SERVICE_REQUEST',
          entityId: request.id,
          action: 'DISPATCH_STARTED',
          fromState: request.status,
          toState: 'DISPATCHING',
        },
      })
    })

    res.json({ data: await getDispatchRequest(request.id) })
  }),
)

router.post(
  '/:id/assign',
  asyncHandler(async (req, res) => {
    const body = validateBody(req, assignmentSchema)
    const request = await getDispatchRequest(String(req.params.id))
    const admin = getAuthUser(req)
    assertMarketplaceTransition('request', request.status, 'ASSIGNED')

    const provider = await db.providerProfile.findFirst({
      where: {
        id: body.providerId,
        status: 'VERIFIED',
        isActive: true,
        serviceZones: {
          some: { serviceZoneId: request.serviceZoneId, isActive: true },
        },
        ...(request.skillId
          ? { skills: { some: { skillId: request.skillId, isVerified: true } } }
          : {}),
      },
      select: { id: true, userId: true, displayName: true },
    })
    if (!provider) {
      throw new ApiError('Provider is unavailable, unverified, or outside the required coverage', 409)
    }

    const result = await db.$transaction(async (tx) => {
      const requestClaim = await tx.marketplaceServiceRequest.updateMany({
        where: { id: request.id, status: request.status },
        data: { status: 'ASSIGNED' },
      })
      if (requestClaim.count !== 1) {
        throw new ApiError('Request status changed; refresh and retry', 409)
      }

      let job = await tx.marketplaceJob.findUnique({ where: { requestId: request.id } })
      if (!job) {
        job = await tx.marketplaceJob.create({
          data: {
            requestId: request.id,
            providerId: provider.id,
            status: 'ASSIGNED',
            assignedAt: new Date(),
          },
        })
        await tx.jobStatusHistory.create({
          data: {
            jobId: job.id,
            actorUserId: admin.id,
            toStatus: 'ASSIGNED',
            note: 'Initial admin dispatch',
          },
        })
      } else {
        if (job.status !== 'REJECTED' || job.providerId !== null) {
          throw new ApiError('Job is not available for reassignment; refresh and retry', 409)
        }
        assertMarketplaceTransition('job', job.status, 'ASSIGNED')
        const jobClaim = await tx.marketplaceJob.updateMany({
          where: { id: job.id, status: job.status, providerId: null },
          data: { status: 'ASSIGNED', providerId: provider.id, assignedAt: new Date() },
        })
        if (jobClaim.count !== 1) {
          throw new ApiError('Job is already assigned; refresh and retry', 409)
        }
        await tx.jobStatusHistory.create({
          data: {
            jobId: job.id,
            actorUserId: admin.id,
            fromStatus: job.status,
            toStatus: 'ASSIGNED',
            note: 'Admin reassigned after provider decline',
          },
        })
        job = await tx.marketplaceJob.findUniqueOrThrow({ where: { id: job.id } })
      }

      const attempt = await tx.jobAssignment.count({ where: { jobId: job.id } }) + 1
      const assignment = await tx.jobAssignment.create({
        data: {
          jobId: job.id,
          providerId: provider.id,
          assignedById: admin.id,
          attempt,
          status: 'OFFERED',
          expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
          responseNote: body.note || null,
        },
      })
      await tx.marketplaceAuditEvent.create({
        data: {
          actorUserId: admin.id,
          providerId: provider.id,
          entityType: 'SERVICE_REQUEST',
          entityId: request.id,
          action: 'PROVIDER_ASSIGNED',
          fromState: request.status,
          toState: 'ASSIGNED',
          metadata: JSON.stringify({ jobId: job.id, assignmentId: assignment.id, attempt }),
        },
      })
      await enqueueMarketplaceNotification(
        (args) => tx.notificationDelivery.upsert(args),
        {
        userId: provider.userId,
        idempotencyKey: marketplaceNotificationKey(
          'PROVIDER_ASSIGNED',
          assignment.id,
          provider.userId,
        ),
        template: 'PROVIDER_ASSIGNED',
        title: 'New service job assigned',
        message: 'A new marketplace service job is waiting for your response.',
        entityType: 'MARKETPLACE_JOB',
        entityId: job.id,
        payload: {
          requestId: request.id,
          jobId: job.id,
          assignmentId: assignment.id,
          attempt,
          expiresAt: assignment.expiresAt?.toISOString() ?? null,
        },
      })
      return { job, assignment }
    })

    res.status(201).json({ data: result })
  }),
)

export default router
