import type { Prisma } from '@prisma/client'
import { Router } from 'express'

import { ApiError, asyncHandler } from '../lib/api-handler.js'
import { requireAuth } from '../lib/auth.js'
import { db } from '../lib/db.js'
import { getPagination, listResponse } from '../lib/helpers.js'
import { getMarketplaceProvider, requireProvider } from '../lib/marketplace-auth.js'
import { getProviderSubmissionIssues } from '../lib/marketplace-provider.js'

const router = Router()

const publicProviderSelect = {
  id: true,
  displayName: true,
  displayNameBn: true,
  bio: true,
  yearsExperience: true,
  rating: true,
  reviewCount: true,
  jobsCompleted: true,
  emergencyAvailable: true,
  reviewedAt: true,
  createdAt: true,
  user: { select: { avatar: true } },
  skills: {
    where: { isVerified: true },
    select: {
      id: true,
      yearsExperience: true,
      proficiency: true,
      verifiedAt: true,
      skill: { select: { id: true, name: true, nameBn: true, slug: true } },
    },
    orderBy: { yearsExperience: 'desc' },
  },
  serviceZones: {
    where: { isActive: true },
    select: {
      id: true,
      travelRadiusKm: true,
      emergencyAvailable: true,
      isActive: true,
      serviceZone: {
        select: {
          id: true,
          name: true,
          nameBn: true,
          slug: true,
          district: { select: { name: true, nameBn: true } },
        },
      },
    },
  },
  availability: {
    where: { isActive: true },
    select: { id: true, dayOfWeek: true, startTime: true, endTime: true },
    orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
  },
} satisfies Prisma.ProviderProfileSelect

function customerLabel(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return 'Verified customer'
  if (parts.length === 1) return parts[0] || 'Verified customer'
  return `${parts[0]} ${parts.at(-1)?.charAt(0).toUpperCase()}.`
}

router.get(
  '/provider/dashboard',
  requireAuth,
  requireProvider,
  asyncHandler(async (req, res) => {
    const provider = getMarketplaceProvider(req)
    const [profile, jobCounts, recentJobs, payments, payouts] = await Promise.all([
      db.providerProfile.findUnique({
        where: { id: provider.id },
        include: {
          documents: {
            select: { id: true, type: true, status: true, rejectionReason: true, expiresAt: true, createdAt: true, updatedAt: true },
            orderBy: { type: 'asc' },
          },
          skills: { include: { skill: true }, orderBy: { createdAt: 'asc' } },
          serviceZones: {
            include: { serviceZone: { include: { district: { include: { division: true } }, upazila: true } } },
            orderBy: { createdAt: 'asc' },
          },
          availability: { orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }] },
        },
      }),
      db.marketplaceJob.groupBy({
        by: ['status'],
        where: { providerId: provider.id },
        _count: { _all: true },
      }),
      db.marketplaceJob.findMany({
        where: { providerId: provider.id },
        select: {
          id: true,
          status: true,
          assignedAt: true,
          acceptedAt: true,
          completedAt: true,
          createdAt: true,
          request: {
            select: {
              problemSummary: true,
              scheduledFor: true,
              isEmergency: true,
              serviceZone: { select: { name: true, nameBn: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 8,
      }),
      db.marketplacePayment.findMany({
        where: { providerId: provider.id, status: 'PAID' },
        select: { providerNetAmount: true, payoutId: true },
      }),
      db.providerPayout.findMany({
        where: { providerId: provider.id },
        select: { id: true, status: true, currency: true, netAmount: true, paidAt: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 8,
      }),
    ])
    if (!profile) throw new ApiError('Provider profile not found', 404)

    const netEarnings = payments.reduce((sum, item) => sum + Number(item.providerNetAmount), 0)
    const availableForPayout = payments
      .filter((item) => !item.payoutId)
      .reduce((sum, item) => sum + Number(item.providerNetAmount), 0)

    res.json({
      data: {
        profile,
        readinessIssues: getProviderSubmissionIssues(profile),
        jobs: {
          total: jobCounts.reduce((sum, item) => sum + item._count._all, 0),
          byStatus: Object.fromEntries(jobCounts.map((item) => [item.status, item._count._all])),
          recent: recentJobs,
        },
        finance: {
          currency: 'BDT',
          netEarnings: netEarnings.toFixed(2),
          availableForPayout: availableForPayout.toFixed(2),
          payouts,
        },
      },
    })
  }),
)

router.get(
  '/providers/:id/reviews',
  asyncHandler(async (req, res) => {
    const providerId = String(req.params.id)
    const visible = await db.providerProfile.count({
      where: { id: providerId, status: 'VERIFIED', isActive: true },
    })
    if (!visible) throw new ApiError('Verified electrician profile not found', 404)
    const { page, limit, skip } = getPagination(req.query as Record<string, string | undefined>)
    const where = { providerId, status: 'PUBLISHED' }
    const [reviews, total] = await Promise.all([
      db.marketplaceReview.findMany({
        where,
        select: {
          id: true,
          rating: true,
          comment: true,
          createdAt: true,
          customer: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: Math.min(limit, 20),
      }),
      db.marketplaceReview.count({ where }),
    ])
    const safeReviews = reviews.map(({ customer, ...review }) => ({
      ...review,
      customerLabel: customerLabel(customer.name),
    }))
    res.json(listResponse(safeReviews, total, page, Math.min(limit, 20)))
  }),
)

router.get(
  '/providers/:id',
  asyncHandler(async (req, res) => {
    const provider = await db.providerProfile.findFirst({
      where: { id: String(req.params.id), status: 'VERIFIED', isActive: true },
      select: publicProviderSelect,
    })
    if (!provider) throw new ApiError('Verified electrician profile not found', 404)
    const reviews = await db.marketplaceReview.findMany({
      where: { providerId: provider.id, status: 'PUBLISHED' },
      select: { id: true, rating: true, comment: true, createdAt: true, customer: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
      take: 6,
    })
    const { user, ...safeProvider } = provider
    res.json({
      data: {
        ...safeProvider,
        avatar: user.avatar,
        reviews: reviews.map(({ customer, ...review }) => ({
          ...review,
          customerLabel: customerLabel(customer.name),
        })),
      },
    })
  }),
)

export default router
