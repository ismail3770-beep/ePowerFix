import { Router } from 'express'

import { asyncHandler } from '../lib/api-handler.js'
import { requireAuth } from '../lib/auth.js'
import { db } from '../lib/db.js'
import {
  getMarketplaceProvider,
  requireMarketplacePaymentsEnabled,
  requireVerifiedProvider,
} from '../lib/marketplace-auth.js'
import { sumMarketplaceAmounts } from '../lib/marketplace-finance.js'

const router = Router()

function amount(value: unknown): string {
  return value == null ? '0.00' : String(value)
}

router.use(requireAuth, requireVerifiedProvider, requireMarketplacePaymentsEnabled)

router.get('/summary', asyncHandler(async (req, res) => {
  const provider = getMarketplaceProvider(req)
  const [paidPayments, availablePayments, pendingCount, paidPayouts] = await Promise.all([
    db.marketplacePayment.findMany({
      where: { providerId: provider.id, status: 'PAID' },
      select: { amount: true, commissionAmount: true, providerNetAmount: true },
    }),
    db.marketplacePayment.findMany({
      where: { providerId: provider.id, status: 'PAID', payoutId: null },
      select: { providerNetAmount: true },
    }),
    db.marketplacePayment.count({
      where: {
        providerId: provider.id,
        status: { in: ['CREATED', 'INITIATING', 'PENDING', 'MANUAL_REVIEW'] },
      },
    }),
    db.providerPayout.findMany({
      where: { providerId: provider.id, status: 'PAID' },
      select: { netAmount: true },
    }),
  ])

  res.json({
    data: {
      currency: 'BDT',
      grossEarnings: sumMarketplaceAmounts(paidPayments.map((item) => amount(item.amount))),
      commission: sumMarketplaceAmounts(
        paidPayments.map((item) => amount(item.commissionAmount)),
      ),
      netEarnings: sumMarketplaceAmounts(
        paidPayments.map((item) => amount(item.providerNetAmount)),
      ),
      availableForPayout: sumMarketplaceAmounts(
        availablePayments.map((item) => amount(item.providerNetAmount)),
      ),
      paidOut: sumMarketplaceAmounts(paidPayouts.map((item) => amount(item.netAmount))),
      pendingPaymentCount: pendingCount,
    },
  })
}))

router.get('/payments', asyncHandler(async (req, res) => {
  const provider = getMarketplaceProvider(req)
  const payments = await db.marketplacePayment.findMany({
    where: { providerId: provider.id },
    select: {
      id: true,
      jobId: true,
      quoteId: true,
      payoutId: true,
      type: true,
      method: true,
      status: true,
      currency: true,
      amount: true,
      commissionRate: true,
      commissionAmount: true,
      providerNetAmount: true,
      paidAt: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })
  res.json({ data: payments })
}))

router.get('/ledger', asyncHandler(async (req, res) => {
  const provider = getMarketplaceProvider(req)
  const entries = await db.financialLedgerEntry.findMany({
    where: { providerId: provider.id },
    orderBy: { createdAt: 'desc' },
    take: 200,
  })
  res.json({ data: entries })
}))

router.get('/payouts', asyncHandler(async (req, res) => {
  const provider = getMarketplaceProvider(req)
  const payouts = await db.providerPayout.findMany({
    where: { providerId: provider.id },
    include: { _count: { select: { items: true } } },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })
  res.json({ data: payouts })
}))

export default router
