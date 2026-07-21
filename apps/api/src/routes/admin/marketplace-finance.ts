import { Router } from 'express'
import { z } from 'zod'

import { ApiError, asyncHandler, validateBody } from '../../lib/api-handler.js'
import { getAuthUser } from '../../lib/auth.js'
import { db } from '../../lib/db.js'
import { requireMarketplacePaymentsEnabled } from '../../lib/marketplace-auth.js'
import {
  canMarketplacePayoutTransition,
  marketplacePayoutLedgerKey,
  sumMarketplaceAmounts,
} from '../../lib/marketplace-finance.js'

const router = Router()

const payoutCreateSchema = z.object({
  providerId: z.string().uuid(),
  paymentIds: z.array(z.string().uuid()).min(1).max(500).optional(),
  method: z.enum(['BKASH', 'NAGAD', 'BANK_TRANSFER', 'MANUAL']),
  destinationMasked: z.string().trim().min(4).max(100),
  idempotencyKey: z.string().trim().min(16).max(100).regex(/^[A-Za-z0-9_-]+$/),
  periodStart: z.string().datetime().optional(),
  periodEnd: z.string().datetime().optional(),
}).strict().refine(
  (value) => !value.periodStart || !value.periodEnd || value.periodStart <= value.periodEnd,
  { message: 'periodEnd must not be before periodStart', path: ['periodEnd'] },
)

const paidSchema = z.object({
  externalReference: z.string().trim().min(5).max(200),
}).strict()

const failedSchema = z.object({
  reason: z.string().trim().min(5).max(1000),
}).strict()

function serializePayout(payout: any) {
  return {
    ...payout,
    grossAmount: String(payout.grossAmount),
    commissionAmount: String(payout.commissionAmount),
    adjustmentAmount: String(payout.adjustmentAmount),
    netAmount: String(payout.netAmount),
  }
}

async function getPayout(id: string) {
  const payout = await db.providerPayout.findUnique({
    where: { id },
    include: {
      provider: { select: { id: true, displayName: true, userId: true } },
      items: {
        include: {
          payment: {
            select: { id: true, jobId: true, paidAt: true },
          },
        },
        orderBy: { createdAt: 'asc' },
      },
      createdBy: { select: { id: true, name: true, email: true } },
      approvedBy: { select: { id: true, name: true, email: true } },
    },
  })
  if (!payout) throw new ApiError('Payout not found', 404)
  return payout
}

router.use(requireMarketplacePaymentsEnabled)

router.get('/payouts', asyncHandler(async (req, res) => {
  const status = typeof req.query.status === 'string' ? req.query.status.toUpperCase() : undefined
  const allowed = new Set(['DRAFT', 'APPROVED', 'PAID', 'FAILED'])
  if (status && !allowed.has(status)) throw new ApiError('Invalid payout status', 400)
  const payouts = await db.providerPayout.findMany({
    where: status ? { status } : {},
    include: {
      provider: { select: { id: true, displayName: true } },
      _count: { select: { items: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 200,
  })
  res.json({ data: payouts.map(serializePayout) })
}))

router.get('/payouts/:id', asyncHandler(async (req, res) => {
  res.json({ data: serializePayout(await getPayout(String(req.params.id))) })
}))

router.get('/providers/:providerId/available-payments', asyncHandler(async (req, res) => {
  const payments = await db.marketplacePayment.findMany({
    where: {
      providerId: String(req.params.providerId),
      status: 'PAID',
      payoutId: null,
    },
    select: {
      id: true,
      jobId: true,
      amount: true,
      commissionAmount: true,
      providerNetAmount: true,
      paidAt: true,
    },
    orderBy: { paidAt: 'asc' },
    take: 500,
  })
  res.json({
    data: {
      payments,
      totals: {
        grossAmount: sumMarketplaceAmounts(payments.map((item) => String(item.amount))),
        commissionAmount: sumMarketplaceAmounts(
          payments.map((item) => String(item.commissionAmount)),
        ),
        netAmount: sumMarketplaceAmounts(
          payments.map((item) => String(item.providerNetAmount)),
        ),
      },
    },
  })
}))

router.post('/payouts', asyncHandler(async (req, res) => {
  const body = validateBody(req, payoutCreateSchema)
  const admin = getAuthUser(req)
  const idempotencyKey = `marketplace-payout:${admin.id}:${body.idempotencyKey}`
  const existing = await db.providerPayout.findUnique({ where: { idempotencyKey } })
  if (existing) {
    if (existing.providerId !== body.providerId || existing.method !== body.method) {
      throw new ApiError('Idempotency key was already used for a different payout', 409)
    }
    return res.json({ data: serializePayout(existing), reused: true })
  }

  const periodStart = body.periodStart ? new Date(body.periodStart) : undefined
  const periodEnd = body.periodEnd ? new Date(body.periodEnd) : undefined
  const created = await db.$transaction(async (tx) => {
    const payments = await tx.marketplacePayment.findMany({
      where: {
        providerId: body.providerId,
        status: 'PAID',
        payoutId: null,
        ...(body.paymentIds ? { id: { in: body.paymentIds } } : {}),
        ...((periodStart || periodEnd)
          ? {
              paidAt: {
                ...(periodStart ? { gte: periodStart } : {}),
                ...(periodEnd ? { lte: periodEnd } : {}),
              },
            }
          : {}),
      },
      select: {
        id: true,
        amount: true,
        commissionAmount: true,
        providerNetAmount: true,
      },
      orderBy: { paidAt: 'asc' },
      take: 500,
    })
    if (payments.length === 0) throw new ApiError('No payable earnings found', 409)
    if (body.paymentIds && payments.length !== new Set(body.paymentIds).size) {
      throw new ApiError('One or more selected payments are unavailable for payout', 409)
    }

    const payout = await tx.providerPayout.create({
      data: {
        providerId: body.providerId,
        createdById: admin.id,
        idempotencyKey,
        grossAmount: sumMarketplaceAmounts(payments.map((item) => String(item.amount))),
        commissionAmount: sumMarketplaceAmounts(
          payments.map((item) => String(item.commissionAmount)),
        ),
        netAmount: sumMarketplaceAmounts(
          payments.map((item) => String(item.providerNetAmount)),
        ),
        method: body.method,
        destinationMasked: body.destinationMasked,
        periodStart: periodStart || null,
        periodEnd: periodEnd || null,
      },
    })
    const claim = await tx.marketplacePayment.updateMany({
      where: {
        id: { in: payments.map((item) => item.id) },
        providerId: body.providerId,
        status: 'PAID',
        payoutId: null,
      },
      data: { payoutId: payout.id },
    })
    if (claim.count !== payments.length) {
      throw new ApiError('Earnings changed while creating the payout; retry', 409)
    }
    await tx.providerPayoutItem.createMany({
      data: payments.map((item) => ({
        payoutId: payout.id,
        paymentId: item.id,
        grossAmount: item.amount,
        commissionAmount: item.commissionAmount,
        netAmount: item.providerNetAmount,
      })),
    })
    await tx.marketplaceAuditEvent.create({
      data: {
        actorUserId: admin.id,
        providerId: body.providerId,
        entityType: 'PROVIDER_PAYOUT',
        entityId: payout.id,
        action: 'PAYOUT_CREATED',
        toState: 'DRAFT',
        metadata: JSON.stringify({ paymentCount: payments.length }),
      },
    })
    return payout
  })
  res.status(201).json({ data: serializePayout(created), reused: false })
}))

router.post('/payouts/:id/approve', asyncHandler(async (req, res) => {
  const admin = getAuthUser(req)
  const payout = await getPayout(String(req.params.id))
  if (!canMarketplacePayoutTransition(payout.status, 'APPROVED')) {
    throw new ApiError(`Payout cannot be approved while ${payout.status.toLowerCase()}`, 409)
  }
  await db.$transaction(async (tx) => {
    const claim = await tx.providerPayout.updateMany({
      where: { id: payout.id, status: payout.status },
      data: { status: 'APPROVED', approvedById: admin.id, approvedAt: new Date() },
    })
    if (claim.count !== 1) throw new ApiError('Payout status changed; refresh and retry', 409)
    await tx.marketplaceAuditEvent.create({
      data: {
        actorUserId: admin.id,
        providerId: payout.providerId,
        entityType: 'PROVIDER_PAYOUT',
        entityId: payout.id,
        action: 'PAYOUT_APPROVED',
        fromState: payout.status,
        toState: 'APPROVED',
      },
    })
  })
  res.json({ data: serializePayout(await getPayout(payout.id)) })
}))

router.post('/payouts/:id/paid', asyncHandler(async (req, res) => {
  const body = validateBody(req, paidSchema)
  const admin = getAuthUser(req)
  const payout = await getPayout(String(req.params.id))
  if (!canMarketplacePayoutTransition(payout.status, 'PAID')) {
    throw new ApiError(`Payout cannot be paid while ${payout.status.toLowerCase()}`, 409)
  }
  await db.$transaction(async (tx) => {
    const claim = await tx.providerPayout.updateMany({
      where: { id: payout.id, status: payout.status },
      data: {
        status: 'PAID',
        paidAt: new Date(),
        externalReference: body.externalReference,
      },
    })
    if (claim.count !== 1) throw new ApiError('Payout status changed; refresh and retry', 409)
    await tx.financialLedgerEntry.create({
      data: {
        providerId: payout.providerId,
        payoutId: payout.id,
        idempotencyKey: marketplacePayoutLedgerKey(payout.id),
        type: 'PROVIDER_PAYOUT',
        direction: 'DEBIT',
        currency: payout.currency,
        amount: payout.netAmount,
        referenceType: 'PROVIDER_PAYOUT',
        referenceId: payout.id,
        description: 'Provider payout completed',
      },
    })
    await tx.marketplaceAuditEvent.create({
      data: {
        actorUserId: admin.id,
        providerId: payout.providerId,
        entityType: 'PROVIDER_PAYOUT',
        entityId: payout.id,
        action: 'PAYOUT_PAID',
        fromState: payout.status,
        toState: 'PAID',
        metadata: JSON.stringify({ externalReference: body.externalReference }),
      },
    })
  })
  res.json({ data: serializePayout(await getPayout(payout.id)) })
}))

router.post('/payouts/:id/failed', asyncHandler(async (req, res) => {
  const body = validateBody(req, failedSchema)
  const admin = getAuthUser(req)
  const payout = await getPayout(String(req.params.id))
  if (!canMarketplacePayoutTransition(payout.status, 'FAILED')) {
    throw new ApiError(`Payout cannot fail while ${payout.status.toLowerCase()}`, 409)
  }
  await db.$transaction(async (tx) => {
    const claim = await tx.providerPayout.updateMany({
      where: { id: payout.id, status: payout.status },
      data: { status: 'FAILED', failedAt: new Date() },
    })
    if (claim.count !== 1) throw new ApiError('Payout status changed; refresh and retry', 409)
    await tx.marketplacePayment.updateMany({
      where: { payoutId: payout.id, status: 'PAID' },
      data: { payoutId: null },
    })
    await tx.marketplaceAuditEvent.create({
      data: {
        actorUserId: admin.id,
        providerId: payout.providerId,
        entityType: 'PROVIDER_PAYOUT',
        entityId: payout.id,
        action: 'PAYOUT_FAILED',
        fromState: payout.status,
        toState: 'FAILED',
        metadata: JSON.stringify({ reason: body.reason }),
      },
    })
  })
  res.json({ data: serializePayout(await getPayout(payout.id)) })
}))

export default router
