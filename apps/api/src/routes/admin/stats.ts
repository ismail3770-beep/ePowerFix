import { Router } from 'express'
import { db } from '@epowerfix/db'
import { requireAdmin } from '../../middleware/auth'
import { success, error } from '../../utils/response'

export const statsRouter = Router()

statsRouter.get('/', requireAdmin, async (_req, res) => {
  try {
    const thisMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)

    const [
      totalProducts, activeProducts,
      totalOrders, pendingOrders,
      totalUsers, totalBookings,
      totalRevenue, monthlyRevenue,
      pendingBookings, unreadContacts, totalReviews,
      totalServices, totalProjects, totalContacts,
      pendingReturns, totalReturns,
    ] = await Promise.all([
      db.product.count(),
      db.product.count({ where: { isActive: true } }),
      db.order.count(),
      db.order.count({ where: { status: 'PENDING' } }),
      db.user.count(),
      db.serviceBooking.count(),
      db.order.aggregate({ where: { paymentStatus: 'PAID' }, _sum: { total: true } }),
      db.order.aggregate({ where: { paymentStatus: 'PAID', createdAt: { gte: thisMonth } }, _sum: { total: true } }),
      db.serviceBooking.count({ where: { status: 'PENDING' } }),
      db.contact.count({ where: { status: 'NEW' } }),
      db.review.count({ where: { status: 'APPROVED' } }),
      db.service.count({ where: { isActive: true } }),
      db.project.count(),
      db.contact.count(),
      db.returnRequest.count({ where: { status: 'PENDING' } }),
      db.returnRequest.count(),
    ])

    const recentOrders = await db.order.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: { id: true, orderNumber: true, total: true, status: true, createdAt: true },
    })

    res.json(success({
      totalProducts, activeProducts, totalOrders, pendingOrders,
      totalUsers, totalBookings,
      totalRevenue: totalRevenue._sum.total || 0,
      monthlyRevenue: monthlyRevenue._sum.total || 0,
      pendingBookings, unreadContacts, totalReviews,
      totalServices, totalProjects, totalContacts,
      pendingReturns, totalReturns,
      recentOrders,
    }))
  } catch (err: any) {
    res.status(500).json(error(err.message))
  }
})
