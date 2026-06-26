import { Router } from 'express'
import { z } from 'zod'
import { db } from '@epowerfix/db'
import { requireAdmin } from '../../middleware/auth'
import { validate } from '../../middleware/validate'
import { success, error } from '../../utils/response'
import { getPagination } from '@epowerfix/utils'

export const usersRouter = Router()

// GET /api/admin/users (paginated)
usersRouter.get('/', requireAdmin, async (req, res) => {
  try {
    const { page = '1', limit = '20', search, role } = req.query as any
    const { skip, take } = getPagination({ page: Number(page), limit: Number(limit) })
    const where: any = {}
    if (search) where.OR = [
      { name: { contains: String(search), mode: 'insensitive' } },
      { email: { contains: String(search), mode: 'insensitive' } },
      { phone: { contains: String(search) } },
    ]
    if (role) where.role = String(role).toUpperCase()

    const [data, total] = await Promise.all([
      db.user.findMany({
        where, skip, take,
        orderBy: { createdAt: 'desc' },
        select: { id: true, name: true, email: true, phone: true, role: true, isActive: true, createdAt: true, _count: { select: { orders: true } } },
      }),
      db.user.count({ where }),
    ])

    res.json(success({ data, pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) } }))
  } catch (err: any) {
    res.status(500).json(error(err.message))
  }
})

// GET /api/admin/users/trashed — soft-deleted users
usersRouter.get('/trashed', requireAdmin, async (_req, res) => {
  try {
    const users = await db.user.findMany({
      where: { isDeleted: true },
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, email: true, phone: true, role: true, isActive: true, createdAt: true },
    })
    res.json(success(users))
  } catch (err: any) {
    res.status(500).json(error(err.message))
  }
})

// PUT /api/admin/users/:id
usersRouter.put('/:id', requireAdmin, validate(z.object({
  isActive: z.boolean().optional(),
  role: z.enum(['CUSTOMER', 'ADMIN']).optional(),
})), async (req, res) => {
  try {
    const existing = await db.user.findUnique({ where: { id: req.params.id } })
    if (!existing) return res.status(404).json(error('User not found'))

    const user = await db.user.update({
      where: { id: req.params.id },
      data: req.body,
      select: { id: true, name: true, email: true, role: true, isActive: true },
    })
    res.json(success(user, 'User updated'))
  } catch (err: any) {
    res.status(500).json(error(err.message))
  }
})

// PUT /api/admin/users/:id/restore
usersRouter.put('/:id/restore', requireAdmin, async (req, res) => {
  try {
    const user = await db.user.update({ where: { id: req.params.id }, data: { isDeleted: false } })
    res.json(success(user, 'User restored'))
  } catch (err: any) {
    res.status(500).json(error(err.message))
  }
})

// DELETE /api/admin/users/:id (soft delete)
usersRouter.delete('/:id', requireAdmin, async (req, res) => {
  try {
    await db.user.update({ where: { id: req.params.id }, data: { isDeleted: true } })
    res.json(success(null, 'User moved to trash'))
  } catch (err: any) {
    res.status(500).json(error(err.message))
  }
})
