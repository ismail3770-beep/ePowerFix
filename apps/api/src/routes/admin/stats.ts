// Admin dashboard stats route.
// Migrated from apps/web/src/app/api/admin/stats/route.ts.
//
// Mounted at /api/admin/stats

import { Router } from 'express'

import { db } from '../../lib/db.js'
import { asyncHandler } from '../../lib/api-handler.js'

const router = Router()

// ─── GET /api/admin/stats ────────────────────────────────────────────────────

router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const [
      totalOrders,
      totalUsers,
      totalProducts,
      pendingOrders,
      revenueAgg,
      recentOrders,
      lowStockProducts,
      statusGroups,
    ] = await Promise.all([
      db.order.count(),
      db.user.count(),
      db.product.count(),
      db.order.count({ where: { status: 'PENDING' } }),
      db.order.aggregate({
        _sum: { total: true },
        where: { paymentStatus: 'PAID' },
      }),
      db.order.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, name: true, email: true } },
          items: true,
        },
      }),
      db.product.findMany({
        where: { stock: { lte: 5 } },
        take: 10,
        orderBy: { stock: 'asc' },
        select: {
          id: true,
          name: true,
          sku: true,
          stock: true,
          minStock: true,
          price: true,
          isActive: true,
        },
      }),
      db.order.groupBy({
        by: ['status'],
        _count: { _all: true },
        _sum: { total: true },
      }),
    ])

    // Build last 6 months revenue breakdown
    const now = new Date()
    const revenueByMonth: Array<{
      month: string
      year: number
      revenue: number
      orders: number
    }> = []

    for (let i = 5; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1)
      const agg = await db.order.aggregate({
        _sum: { total: true },
        _count: { _all: true },
        where: {
          createdAt: { gte: start, lt: end },
          paymentStatus: 'PAID',
        },
      })
      revenueByMonth.push({
        month: start.toLocaleString('default', { month: 'short' }),
        year: start.getFullYear(),
        revenue: agg._sum.total || 0,
        orders: agg._count._all || 0,
      })
    }

    // Convert statusGroups into a friendly object keyed by status
    const salesByStatus: Record<string, { count: number; revenue: number }> = {}
    for (const g of statusGroups) {
      salesByStatus[g.status] = {
        count: g._count._all,
        revenue: g._sum.total || 0,
      }
    }

    res.json({
      data: {
        totalOrders,
        totalRevenue: revenueAgg._sum.total || 0,
        totalProducts,
        totalUsers,
        pendingOrders,
        recentOrders,
        lowStockProducts,
        salesByStatus,
        revenueByMonth,
      },
    })
  })
)

export default router
