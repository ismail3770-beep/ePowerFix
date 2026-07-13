import type { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import {
  requireAdmin,
  jsonResponse,
  errorResponse,
} from '@/lib/admin-api'

/**
 * GET /api/admin/stats
 * Returns dashboard statistics:
 *   totalOrders, totalRevenue, totalProducts, totalUsers,
 *   pendingOrders, recentOrders, lowStockProducts,
 *   salesByStatus, revenueByMonth
 */
export async function GET(request: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) {return auth.response!}

  try {
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

    return jsonResponse({
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
  } catch (err: any) {
    console.error('admin/stats GET error:', err)
    return errorResponse(err?.message || 'Internal server error', 500)
  }
}
