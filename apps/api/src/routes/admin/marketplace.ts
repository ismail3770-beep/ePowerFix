import { Router } from 'express'
import { z } from 'zod'

import { ApiError, asyncHandler, validateBody } from '../../lib/api-handler.js'
import { getAuthUser } from '../../lib/auth.js'
import { db } from '../../lib/db.js'
import { getPagination, listResponse } from '../../lib/helpers.js'
import { requireMarketplaceEnabled } from '../../lib/marketplace-auth.js'
import { getProviderApprovalIssues } from '../../lib/marketplace-provider.js'
import { assertMarketplaceTransition } from '../../lib/marketplace-state.js'
import {
  providerDocumentMimeFromKey,
  readProviderDocument,
} from '../../lib/provider-document-storage.js'

const router = Router()

const documentDecisionSchema = z.discriminatedUnion('status', [
  z.object({ status: z.literal('APPROVED') }).strict(),
  z.object({
    status: z.literal('REJECTED'),
    reason: z.string().trim().min(5).max(1000),
  }).strict(),
])

const providerDecisionSchema = z.discriminatedUnion('status', [
  z.object({ status: z.literal('VERIFIED') }).strict(),
  z.object({
    status: z.literal('REJECTED'),
    reason: z.string().trim().min(5).max(2000),
  }).strict(),
])

const suspensionSchema = z.object({
  reason: z.string().trim().min(5).max(2000),
}).strict()

const skillDecisionSchema = z.object({
  isVerified: z.boolean(),
}).strict()

const recoverySchema = z.object({
  status: z.enum(['UNDER_REVIEW', 'VERIFIED']),
  note: z.string().trim().min(5).max(2000).optional(),
}).strict()

const providerDetailInclude = {
  user: {
    select: {
      id: true,
      name: true,
      nameBn: true,
      email: true,
      phone: true,
      avatar: true,
      emailVerified: true,
      isActive: true,
      createdAt: true,
    },
  },
  documents: {
    include: {
      reviewedBy: { select: { id: true, name: true, email: true } },
    },
    orderBy: { type: 'asc' as const },
  },
  skills: {
    include: { skill: true },
    orderBy: { createdAt: 'asc' as const },
  },
  serviceZones: {
    include: {
      serviceZone: {
        include: {
          district: { include: { division: true } },
          upazila: true,
        },
      },
    },
    orderBy: { createdAt: 'asc' as const },
  },
  availability: { orderBy: { dayOfWeek: 'asc' as const } },
  timeOff: { orderBy: { startsAt: 'asc' as const } },
  reviewedBy: { select: { id: true, name: true, email: true } },
} as const

async function getProviderForReview(id: string) {
  const provider = await db.providerProfile.findUnique({
    where: { id },
    include: providerDetailInclude,
  })
  if (!provider) throw new ApiError('Provider profile not found', 404)
  return provider
}

router.use(requireMarketplaceEnabled)

router.get(
  '/providers/summary',
  asyncHandler(async (_req, res) => {
    const grouped = await db.providerProfile.groupBy({
      by: ['status'],
      _count: { _all: true },
    })
    const byStatus = Object.fromEntries(grouped.map((item) => [item.status, item._count._all]))
    res.json({
      data: {
        total: grouped.reduce((sum, item) => sum + item._count._all, 0),
        byStatus,
        awaitingReview: (byStatus.SUBMITTED || 0) + (byStatus.UNDER_REVIEW || 0),
      },
    })
  }),
)

router.get(
  '/providers',
  asyncHandler(async (req, res) => {
    const query = req.query as Record<string, string | undefined>
    const { page, limit, skip, search } = getPagination(query)
    const status = query.status?.trim().toUpperCase()
    const allowedStatuses = new Set([
      'DRAFT',
      'SUBMITTED',
      'UNDER_REVIEW',
      'VERIFIED',
      'REJECTED',
      'SUSPENDED',
    ])
    if (status && !allowedStatuses.has(status)) {
      throw new ApiError('Invalid provider status', 400)
    }

    const where = {
      ...(status ? { status } : {}),
      ...(search
        ? {
            OR: [
              { displayName: { contains: search, mode: 'insensitive' as const } },
              { user: { name: { contains: search, mode: 'insensitive' as const } } },
              { user: { email: { contains: search, mode: 'insensitive' as const } } },
              { user: { phone: { contains: search } } },
            ],
          }
        : {}),
    }

    const [providers, total] = await Promise.all([
      db.providerProfile.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ submittedAt: 'desc' }, { createdAt: 'desc' }],
        select: {
          id: true,
          status: true,
          displayName: true,
          yearsExperience: true,
          rating: true,
          reviewCount: true,
          jobsCompleted: true,
          emergencyAvailable: true,
          submittedAt: true,
          reviewedAt: true,
          rejectionReason: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          user: {
            select: { id: true, name: true, email: true, phone: true, avatar: true },
          },
          _count: {
            select: { documents: true, skills: true, serviceZones: true },
          },
        },
      }),
      db.providerProfile.count({ where }),
    ])

    res.json(listResponse(providers, total, page, limit))
  }),
)

router.get(
  '/providers/:id',
  asyncHandler(async (req, res) => {
    const provider = await getProviderForReview(String(req.params.id))
    res.json({ data: provider })
  }),
)

router.post(
  '/providers/:id/start-review',
  asyncHandler(async (req, res) => {
    const provider = await getProviderForReview(String(req.params.id))
    const admin = getAuthUser(req)
    assertMarketplaceTransition('provider', provider.status, 'UNDER_REVIEW')

    const updated = await db.$transaction(async (tx) => {
      const claim = await tx.providerProfile.updateMany({
        where: { id: provider.id, status: provider.status },
        data: {
          status: 'UNDER_REVIEW',
          reviewedById: admin.id,
          reviewedAt: null,
          rejectionReason: null,
        },
      })
      if (claim.count !== 1) {
        throw new ApiError('Provider status changed; refresh and retry', 409)
      }
      await tx.marketplaceAuditEvent.create({
        data: {
          actorUserId: admin.id,
          providerId: provider.id,
          entityType: 'PROVIDER_PROFILE',
          entityId: provider.id,
          action: 'REVIEW_STARTED',
          fromState: provider.status,
          toState: 'UNDER_REVIEW',
        },
      })
      return tx.providerProfile.findUnique({ where: { id: provider.id } })
    })

    res.json({ data: updated })
  }),
)

router.get(
  '/providers/:providerId/documents/:documentId/file',
  asyncHandler(async (req, res) => {
    const document = await db.providerDocument.findFirst({
      where: {
        id: String(req.params.documentId),
        providerId: String(req.params.providerId),
      },
      select: { storageKey: true, type: true },
    })
    if (!document) throw new ApiError('Provider document not found', 404)
    try {
      const data = await readProviderDocument(document.storageKey)
      res.setHeader('Content-Type', providerDocumentMimeFromKey(document.storageKey))
      res.setHeader('Content-Disposition', `inline; filename="${document.type.toLowerCase()}"`)
      res.setHeader('Cache-Control', 'private, no-store')
      res.setHeader('X-Content-Type-Options', 'nosniff')
      res.send(data)
    } catch {
      throw new ApiError('Stored provider document is unavailable', 404)
    }
  }),
)

router.put(
  '/providers/:providerId/skills/:providerSkillId/review',
  asyncHandler(async (req, res) => {
    const { isVerified } = validateBody(req, skillDecisionSchema)
    const providerId = String(req.params.providerId)
    const providerSkillId = String(req.params.providerSkillId)
    const provider = await db.providerProfile.findUnique({ where: { id: providerId } })
    if (!provider) throw new ApiError('Provider profile not found', 404)
    if (provider.status !== 'UNDER_REVIEW') {
      throw new ApiError('Skills can only be reviewed while the profile is under review', 409)
    }
    const skill = await db.providerSkill.findFirst({ where: { id: providerSkillId, providerId } })
    if (!skill) throw new ApiError('Provider skill not found', 404)
    const admin = getAuthUser(req)
    const updated = await db.$transaction(async (tx) => {
      const result = await tx.providerSkill.update({
        where: { id: skill.id },
        data: { isVerified, verifiedAt: isVerified ? new Date() : null },
        include: { skill: true },
      })
      await tx.marketplaceAuditEvent.create({
        data: {
          actorUserId: admin.id,
          providerId,
          entityType: 'PROVIDER_SKILL',
          entityId: skill.id,
          action: isVerified ? 'VERIFIED' : 'UNVERIFIED',
          fromState: skill.isVerified ? 'VERIFIED' : 'UNVERIFIED',
          toState: isVerified ? 'VERIFIED' : 'UNVERIFIED',
        },
      })
      return result
    })
    res.json({ data: updated })
  }),
)

router.put(
  '/providers/:providerId/documents/:documentId/review',
  asyncHandler(async (req, res) => {
    const body = validateBody(req, documentDecisionSchema)
    const providerId = String(req.params.providerId)
    const documentId = String(req.params.documentId)
    const provider = await db.providerProfile.findUnique({ where: { id: providerId } })
    if (!provider) throw new ApiError('Provider profile not found', 404)
    if (provider.status !== 'UNDER_REVIEW') {
      throw new ApiError('Documents can only be reviewed while the profile is under review', 409)
    }
    const document = await db.providerDocument.findFirst({
      where: { id: documentId, providerId },
    })
    if (!document) throw new ApiError('Provider document not found', 404)
    const admin = getAuthUser(req)

    const updated = await db.$transaction(async (tx) => {
      const claim = await tx.providerDocument.updateMany({
        where: {
          id: document.id,
          providerId,
          updatedAt: document.updatedAt,
        },
        data: {
          status: body.status,
          rejectionReason: body.status === 'REJECTED' ? body.reason : null,
          reviewedById: admin.id,
          reviewedAt: new Date(),
        },
      })
      if (claim.count !== 1) {
        throw new ApiError('Document changed; refresh and retry', 409)
      }
      await tx.marketplaceAuditEvent.create({
        data: {
          actorUserId: admin.id,
          providerId,
          entityType: 'PROVIDER_DOCUMENT',
          entityId: document.id,
          action: body.status,
          fromState: document.status,
          toState: body.status,
          metadata: body.status === 'REJECTED'
            ? JSON.stringify({ reason: body.reason })
            : null,
        },
      })
      return tx.providerDocument.findUnique({
        where: { id: document.id },
        select: {
          id: true,
          type: true,
          status: true,
          rejectionReason: true,
          reviewedAt: true,
          reviewedById: true,
          updatedAt: true,
        },
      })
    })

    res.json({ data: updated })
  }),
)

router.post(
  '/providers/:id/decision',
  asyncHandler(async (req, res) => {
    const body = validateBody(req, providerDecisionSchema)
    const provider = await getProviderForReview(String(req.params.id))
    const admin = getAuthUser(req)
    assertMarketplaceTransition('provider', provider.status, body.status)

    if (body.status === 'VERIFIED') {
      const issues = getProviderApprovalIssues(provider)
      if (issues.length > 0) {
        throw new ApiError('Provider cannot be verified until all requirements are approved', 409, {
          code: 'PROVIDER_VERIFICATION_INCOMPLETE',
          issues,
        })
      }
    }

    const updated = await db.$transaction(async (tx) => {
      const claim = await tx.providerProfile.updateMany({
        where: { id: provider.id, status: provider.status },
        data: {
          status: body.status,
          isActive: true,
          reviewedById: admin.id,
          reviewedAt: new Date(),
          rejectionReason: body.status === 'REJECTED' ? body.reason : null,
        },
      })
      if (claim.count !== 1) {
        throw new ApiError('Provider status changed; refresh and retry', 409)
      }
      await tx.marketplaceAuditEvent.create({
        data: {
          actorUserId: admin.id,
          providerId: provider.id,
          entityType: 'PROVIDER_PROFILE',
          entityId: provider.id,
          action: body.status,
          fromState: provider.status,
          toState: body.status,
          metadata: body.status === 'REJECTED'
            ? JSON.stringify({ reason: body.reason })
            : null,
        },
      })
      return tx.providerProfile.findUnique({ where: { id: provider.id } })
    })

    res.json({ data: updated })
  }),
)

router.post(
  '/providers/:id/suspend',
  asyncHandler(async (req, res) => {
    const { reason } = validateBody(req, suspensionSchema)
    const provider = await getProviderForReview(String(req.params.id))
    const admin = getAuthUser(req)
    assertMarketplaceTransition('provider', provider.status, 'SUSPENDED')

    const updated = await db.$transaction(async (tx) => {
      const claim = await tx.providerProfile.updateMany({
        where: { id: provider.id, status: provider.status },
        data: {
          status: 'SUSPENDED',
          isActive: false,
          reviewedById: admin.id,
          reviewedAt: new Date(),
          rejectionReason: reason,
        },
      })
      if (claim.count !== 1) {
        throw new ApiError('Provider status changed; refresh and retry', 409)
      }
      await tx.marketplaceAuditEvent.create({
        data: {
          actorUserId: admin.id,
          providerId: provider.id,
          entityType: 'PROVIDER_PROFILE',
          entityId: provider.id,
          action: 'SUSPENDED',
          fromState: provider.status,
          toState: 'SUSPENDED',
          metadata: JSON.stringify({ reason }),
        },
      })
      return tx.providerProfile.findUnique({ where: { id: provider.id } })
    })

    res.json({ data: updated })
  }),
)

router.post(
  '/providers/:id/recover',
  asyncHandler(async (req, res) => {
    const body = validateBody(req, recoverySchema)
    const provider = await getProviderForReview(String(req.params.id))
    const admin = getAuthUser(req)
    assertMarketplaceTransition('provider', provider.status, body.status)

    if (body.status === 'VERIFIED') {
      const issues = getProviderApprovalIssues(provider)
      if (issues.length > 0) {
        throw new ApiError('Provider cannot be reinstated until all requirements are approved', 409, {
          code: 'PROVIDER_VERIFICATION_INCOMPLETE',
          issues,
        })
      }
    }

    const updated = await db.$transaction(async (tx) => {
      const claim = await tx.providerProfile.updateMany({
        where: { id: provider.id, status: provider.status },
        data: {
          status: body.status,
          isActive: body.status === 'VERIFIED',
          reviewedById: admin.id,
          reviewedAt: body.status === 'VERIFIED' ? new Date() : null,
          rejectionReason: null,
        },
      })
      if (claim.count !== 1) {
        throw new ApiError('Provider status changed; refresh and retry', 409)
      }
      await tx.marketplaceAuditEvent.create({
        data: {
          actorUserId: admin.id,
          providerId: provider.id,
          entityType: 'PROVIDER_PROFILE',
          entityId: provider.id,
          action: body.status === 'VERIFIED' ? 'REINSTATED' : 'REVIEW_REOPENED',
          fromState: provider.status,
          toState: body.status,
          metadata: body.note ? JSON.stringify({ note: body.note }) : null,
        },
      })
      return tx.providerProfile.findUnique({ where: { id: provider.id } })
    })

    res.json({ data: updated })
  }),
)

export default router
