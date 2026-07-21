import { Router } from 'express'
import { z } from 'zod'

import { ApiError, asyncHandler, validateBody } from '../lib/api-handler.js'
import { getAuthUser, requireAuth } from '../lib/auth.js'
import { env } from '../config/env.js'
import { db } from '../lib/db.js'
import {
  getMarketplaceProvider,
  requireMarketplaceEnabled,
  requireProvider,
  requireProviderOnboardingEnabled,
} from '../lib/marketplace-auth.js'
import { getProviderSubmissionIssues } from '../lib/marketplace-provider.js'
import { assertMarketplaceTransition } from '../lib/marketplace-state.js'
import marketplaceRequestsRouter from './marketplace-requests.js'
import marketplaceCustomerJobsRouter from './marketplace-customer-jobs.js'
import marketplaceCustomerCasesRouter from './marketplace-customer-cases.js'
import marketplaceProviderJobsRouter from './marketplace-provider-jobs.js'
import marketplaceProviderFinanceRouter from './marketplace-provider-finance.js'
import marketplaceProviderCasesRouter from './marketplace-provider-cases.js'
import marketplaceProviderDocumentsRouter from './marketplace-provider-documents.js'
import marketplaceProviderProfileRouter from './marketplace-provider-profile.js'
import marketplacePaymentsRouter from './marketplace-payments.js'
import marketplaceNotificationsRouter from './marketplace-notifications.js'

const router = Router()

const editableProfileStatuses = new Set(['DRAFT', 'REJECTED'])
const editableOperationalStatuses = new Set(['DRAFT', 'REJECTED', 'VERIFIED'])

const profileSchema = z.object({
  displayName: z.string().trim().min(2).max(100),
  displayNameBn: z.string().trim().min(2).max(100).optional().nullable(),
  bio: z.string().trim().max(2000).optional().nullable(),
  yearsExperience: z.number().int().min(0).max(60),
  emergencyAvailable: z.boolean().optional().default(false),
}).strict()

const replaceSkillsSchema = z.object({
  skills: z.array(z.object({
    skillId: z.string().uuid(),
    yearsExperience: z.number().int().min(0).max(60),
    proficiency: z.enum(['STANDARD', 'ADVANCED', 'EXPERT']).default('STANDARD'),
  }).strict()).min(1).max(30),
}).strict()

const replaceZonesSchema = z.object({
  zones: z.array(z.object({
    serviceZoneId: z.string().uuid(),
    travelRadiusKm: z.number().int().min(1).max(100).default(10),
    emergencyAvailable: z.boolean().default(false),
  }).strict()).min(1).max(50),
}).strict()

const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/
const replaceAvailabilitySchema = z.object({
  availability: z.array(z.object({
    dayOfWeek: z.number().int().min(0).max(6),
    startTime: z.string().regex(timePattern),
    endTime: z.string().regex(timePattern),
  }).strict().refine((slot) => slot.startTime < slot.endTime, {
    message: 'endTime must be after startTime',
    path: ['endTime'],
  })).min(1).max(28),
}).strict()

const profileInclude = {
  documents: {
    select: {
      id: true,
      type: true,
      status: true,
      rejectionReason: true,
      expiresAt: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { type: 'asc' as const },
  },
  skills: {
    include: { skill: true },
    orderBy: { createdAt: 'asc' as const },
  },
  serviceZones: {
    include: {
      serviceZone: { include: { district: true, upazila: true } },
    },
    orderBy: { createdAt: 'asc' as const },
  },
  availability: { orderBy: { dayOfWeek: 'asc' as const } },
  timeOff: { where: { endsAt: { gte: new Date() } }, orderBy: { startsAt: 'asc' as const } },
}

function assertEditable(status: string): void {
  if (!editableProfileStatuses.has(status)) {
    throw new ApiError('Identity and verification fields cannot be changed in this profile state', 409, {
      code: 'ILLEGAL_STATE_TRANSITION',
      status,
    })
  }
}

function assertOperationalEditable(status: string): void {
  if (!editableOperationalStatuses.has(status)) {
    throw new ApiError('Coverage and availability cannot be changed in this profile state', 409, {
      code: 'ILLEGAL_STATE_TRANSITION',
      status,
    })
  }
}

function assertUnique(values: string[], field: string): void {
  if (new Set(values).size !== values.length) {
    throw new ApiError(`${field} contains duplicate values`, 400)
  }
}

// Payment callbacks remain reachable for in-flight reconciliation even if the
// marketplace is emergency-disabled. Customer initiation is independently
// protected by requireMarketplacePaymentsEnabled inside the payment router.
router.use('/payments', marketplacePaymentsRouter)
router.use(requireMarketplaceEnabled)

router.get('/config', (_req, res) => {
  res.json({
    data: {
      enabled: env.MARKETPLACE_ENABLED,
      providerOnboardingEnabled: env.PROVIDER_ONBOARDING_ENABLED,
      paymentsEnabled: env.MARKETPLACE_PAYMENTS_ENABLED,
      liveTrackingEnabled: env.LIVE_TRACKING_ENABLED,
      autoMatchingEnabled: env.AUTO_MATCHING_ENABLED,
    },
  })
})

router.get('/skills', asyncHandler(async (_req, res) => {
  const skills = await db.skill.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
  })
  res.json({ data: skills })
}))

router.get('/service-zones', asyncHandler(async (_req, res) => {
  const zones = await db.serviceZone.findMany({
    where: { isActive: true },
    include: { district: { include: { division: true } }, upazila: true },
    orderBy: [{ district: { name: 'asc' } }, { name: 'asc' }],
  })
  res.json({ data: zones })
}))

router.use('/requests', marketplaceRequestsRouter)
router.use('/jobs', marketplaceCustomerJobsRouter)
router.use('/cases', marketplaceCustomerCasesRouter)
router.use('/notifications', marketplaceNotificationsRouter)
router.use('/provider/jobs', marketplaceProviderJobsRouter)
router.use('/provider/finance', marketplaceProviderFinanceRouter)
router.use('/provider/cases', marketplaceProviderCasesRouter)
router.use('/provider/documents', marketplaceProviderDocumentsRouter)
router.use(marketplaceProviderProfileRouter)

router.post(
  '/provider/profile',
  requireProviderOnboardingEnabled,
  requireAuth,
  asyncHandler(async (req, res) => {
    const body = validateBody(req, profileSchema)
    const user = getAuthUser(req)
    if (!['CUSTOMER', 'ELECTRICIAN'].includes(user.role)) {
      throw new ApiError('This account cannot create a provider profile', 403)
    }

    const existing = await db.providerProfile.findUnique({ where: { userId: user.id } })
    if (existing) throw new ApiError('Provider profile already exists', 409)

    const profile = await db.$transaction(async (tx) => {
      const created = await tx.providerProfile.create({
        data: {
          userId: user.id,
          displayName: body.displayName,
          displayNameBn: body.displayNameBn || null,
          bio: body.bio || null,
          yearsExperience: body.yearsExperience,
          emergencyAvailable: body.emergencyAvailable,
        },
      })
      await tx.user.update({ where: { id: user.id }, data: { role: 'ELECTRICIAN' } })
      await tx.marketplaceAuditEvent.create({
        data: {
          actorUserId: user.id,
          providerId: created.id,
          entityType: 'PROVIDER_PROFILE',
          entityId: created.id,
          action: 'CREATED',
          toState: 'DRAFT',
        },
      })
      return created
    })

    res.status(201).json({ data: profile })
  }),
)

router.get(
  '/provider/profile',
  requireAuth,
  requireProvider,
  asyncHandler(async (req, res) => {
    const provider = getMarketplaceProvider(req)
    const profile = await db.providerProfile.findUnique({
      where: { id: provider.id },
      include: profileInclude,
    })
    if (!profile) throw new ApiError('Provider profile not found', 404)
    res.json({ data: profile })
  }),
)

router.put(
  '/provider/profile',
  requireProviderOnboardingEnabled,
  requireAuth,
  requireProvider,
  asyncHandler(async (req, res) => {
    const body = validateBody(req, profileSchema)
    const provider = getMarketplaceProvider(req)
    const existing = await db.providerProfile.findUnique({ where: { id: provider.id } })
    if (!existing) throw new ApiError('Provider profile not found', 404)
    if (provider.status === 'VERIFIED') {
      if (body.displayName !== existing.displayName || body.yearsExperience !== existing.yearsExperience) {
        throw new ApiError('Verified name and experience changes require admin review', 409)
      }
    } else {
      assertEditable(provider.status)
    }

    const updated = await db.$transaction(async (tx) => {
      const profile = await tx.providerProfile.update({
        where: { id: provider.id },
        data: {
          displayName: body.displayName,
          displayNameBn: body.displayNameBn || null,
          bio: body.bio || null,
          yearsExperience: body.yearsExperience,
          emergencyAvailable: body.emergencyAvailable,
          ...(provider.status === 'REJECTED'
            ? { status: 'DRAFT', rejectionReason: null, reviewedAt: null, reviewedById: null }
            : {}),
        },
      })
      await tx.marketplaceAuditEvent.create({
        data: {
          actorUserId: provider.userId,
          providerId: provider.id,
          entityType: 'PROVIDER_PROFILE',
          entityId: provider.id,
          action: provider.status === 'VERIFIED' ? 'PUBLIC_FIELDS_UPDATED' : 'UPDATED',
          fromState: provider.status,
          toState: profile.status,
        },
      })
      return profile
    })
    res.json({ data: updated })
  }),
)

router.put(
  '/provider/skills',
  requireProviderOnboardingEnabled,
  requireAuth,
  requireProvider,
  asyncHandler(async (req, res) => {
    const { skills } = validateBody(req, replaceSkillsSchema)
    const provider = getMarketplaceProvider(req)
    assertEditable(provider.status)
    assertUnique(skills.map((skill) => skill.skillId), 'skills')

    const activeCount = await db.skill.count({
      where: { id: { in: skills.map((skill) => skill.skillId) }, isActive: true },
    })
    if (activeCount !== skills.length) throw new ApiError('One or more skills are unavailable', 400)

    await db.$transaction(async (tx) => {
      await tx.providerSkill.deleteMany({ where: { providerId: provider.id } })
      await tx.providerSkill.createMany({
        data: skills.map((skill) => ({ ...skill, providerId: provider.id })),
      })
      await tx.marketplaceAuditEvent.create({
        data: {
          actorUserId: provider.userId,
          providerId: provider.id,
          entityType: 'PROVIDER_SKILLS',
          entityId: provider.id,
          action: 'REPLACED',
          metadata: JSON.stringify({ count: skills.length }),
        },
      })
    })
    res.json({ data: { count: skills.length } })
  }),
)

router.put(
  '/provider/service-zones',
  requireProviderOnboardingEnabled,
  requireAuth,
  requireProvider,
  asyncHandler(async (req, res) => {
    const { zones } = validateBody(req, replaceZonesSchema)
    const provider = getMarketplaceProvider(req)
    assertOperationalEditable(provider.status)
    assertUnique(zones.map((zone) => zone.serviceZoneId), 'zones')

    const activeCount = await db.serviceZone.count({
      where: { id: { in: zones.map((zone) => zone.serviceZoneId) }, isActive: true },
    })
    if (activeCount !== zones.length) throw new ApiError('One or more service zones are unavailable', 400)

    await db.$transaction(async (tx) => {
      await tx.providerServiceZone.deleteMany({ where: { providerId: provider.id } })
      await tx.providerServiceZone.createMany({
        data: zones.map((zone) => ({ ...zone, providerId: provider.id })),
      })
      await tx.marketplaceAuditEvent.create({
        data: {
          actorUserId: provider.userId,
          providerId: provider.id,
          entityType: 'PROVIDER_SERVICE_ZONES',
          entityId: provider.id,
          action: 'REPLACED',
          metadata: JSON.stringify({ count: zones.length }),
        },
      })
    })
    res.json({ data: { count: zones.length } })
  }),
)

router.put(
  '/provider/availability',
  requireProviderOnboardingEnabled,
  requireAuth,
  requireProvider,
  asyncHandler(async (req, res) => {
    const { availability } = validateBody(req, replaceAvailabilitySchema)
    const provider = getMarketplaceProvider(req)
    assertOperationalEditable(provider.status)
    assertUnique(
      availability.map((slot) => `${slot.dayOfWeek}:${slot.startTime}:${slot.endTime}`),
      'availability',
    )

    await db.$transaction(async (tx) => {
      await tx.providerAvailability.deleteMany({ where: { providerId: provider.id } })
      await tx.providerAvailability.createMany({
        data: availability.map((slot) => ({ ...slot, providerId: provider.id })),
      })
      await tx.marketplaceAuditEvent.create({
        data: {
          actorUserId: provider.userId,
          providerId: provider.id,
          entityType: 'PROVIDER_AVAILABILITY',
          entityId: provider.id,
          action: 'REPLACED',
          metadata: JSON.stringify({ count: availability.length }),
        },
      })
    })
    res.json({ data: { count: availability.length } })
  }),
)

router.post(
  '/provider/submit',
  requireProviderOnboardingEnabled,
  requireAuth,
  requireProvider,
  asyncHandler(async (req, res) => {
    const user = getAuthUser(req)
    const provider = getMarketplaceProvider(req)
    assertMarketplaceTransition('provider', provider.status, 'SUBMITTED')

    const profile = await db.providerProfile.findUnique({
      where: { id: provider.id },
      include: { documents: true, skills: true, serviceZones: true, availability: true },
    })
    if (!profile) throw new ApiError('Provider profile not found', 404)

    const issues = getProviderSubmissionIssues(profile)
    if (issues.length > 0) {
      throw new ApiError('Provider profile is incomplete', 409, {
        code: 'PROVIDER_PROFILE_INCOMPLETE',
        issues,
      })
    }

    const submitted = await db.$transaction(async (tx) => {
      const updated = await tx.providerProfile.update({
        where: { id: provider.id, status: provider.status },
        data: {
          status: 'SUBMITTED',
          submittedAt: new Date(),
          rejectionReason: null,
          reviewedAt: null,
          reviewedById: null,
        },
      })
      await tx.marketplaceAuditEvent.create({
        data: {
          actorUserId: user.id,
          providerId: provider.id,
          entityType: 'PROVIDER_PROFILE',
          entityId: provider.id,
          action: 'SUBMITTED',
          fromState: provider.status,
          toState: 'SUBMITTED',
        },
      })
      return updated
    })
    res.json({ data: submitted })
  }),
)

export default router
