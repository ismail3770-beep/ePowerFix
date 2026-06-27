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
      db.product.count({ where: { isDeleted: false } }),
      db.product.count({ where: { isActive: true, isDeleted: false } }),
      db.order.count({ where: { isDeleted: false } }),
      db.order.count({ where: { status: 'PENDING', isDeleted: false } }),
      db.user.count({ where: { isDeleted: false } }),
      db.serviceBooking.count({ where: { isDeleted: false } }),
      db.order.aggregate({ where: { paymentStatus: 'PAID', isDeleted: false, status: { notIn: ['CANCELLED', 'RETURNED'] } }, _sum: { total: true } }),
      db.order.aggregate({ where: { paymentStatus: 'PAID', isDeleted: false, status: { notIn: ['CANCELLED', 'RETURNED'] }, createdAt: { gte: thisMonth } }, _sum: { total: true } }),
      db.serviceBooking.count({ where: { status: 'PENDING', isDeleted: false } }),
      db.contact.count({ where: { status: 'NEW', isDeleted: false } }),
      db.review.count({ where: { status: 'APPROVED', isDeleted: false } }),
      db.service.count({ where: { isActive: true, isDeleted: false } }),
      db.project.count({ where: { isDeleted: false } }),
      db.contact.count({ where: { isDeleted: false } }),
      db.returnRequest.count({ where: { status: 'PENDING', isDeleted: false } }),
      db.returnRequest.count({ where: { isDeleted: false } }),
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
