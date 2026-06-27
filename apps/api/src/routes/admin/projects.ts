import { Router } from 'express'
import { z } from 'zod'
import { db } from '@epowerfix/db'
import { requireAdmin } from '../../middleware/auth'
import { validate } from '../../middleware/validate'
import { success, error } from '../../utils/response'
import { generateSlug, getPagination } from '@epowerfix/utils'

export const projectsRouter = Router()

const createProjectSchema = z.object({
  title: z.string().min(2),
  titleBn: z.string().optional().default(''),
  description: z.string().default(''),
  coverImage: z.string().optional().default(''),
  images: z.array(z.string()).default([]),
  client: z.string().optional().default(''),
  location: z.string().optional().default(''),
  status: z.string().default('COMPLETED'),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
})

// GET /api/admin/projects
projectsRouter.get('/', requireAdmin, async (req, res) => {
  try {
    const { status } = req.query as any
    const page = Number(req.query.page) || 1
    const limit = Number(req.query.limit) || 20
    const { skip, take } = getPagination({ page, limit })
    const where: any = { isDeleted: false }
    if (status) where.status = status

    const [projects, total] = await Promise.all([
      db.project.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take }),
      db.project.count({ where }),
    ])
    res.json(success({ data: projects, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } }))
  } catch (err: any) {
    res.status(500).json(error(err.message))
  }
})

// POST /api/admin/projects
projectsRouter.post('/', requireAdmin, validate(createProjectSchema), async (req, res) => {
  try {
    const slug = generateSlug(req.body.title) + '-' + Date.now().toString(36)
    const project = await db.project.create({
      data: {
        ...req.body, slug,
        startDate: req.body.startDate ? new Date(req.body.startDate) : null,
        endDate: req.body.endDate ? new Date(req.body.endDate) : null,
      },
    })
    res.status(201).json(success(project, 'Project created'))
  } catch (err: any) {
    if (err.code === 'P2002') return res.status(409).json(error('Slug already exists'))
    res.status(500).json(error(err.message))
  }
})

// PUT /api/admin/projects/:id
projectsRouter.put('/:id', requireAdmin, validate(createProjectSchema.partial()), async (req, res) => {
  try {
    const data: any = { ...req.body }
    if (data.startDate !== undefined) data.startDate = data.startDate ? new Date(data.startDate) : null
    if (data.endDate !== undefined) data.endDate = data.endDate ? new Date(data.endDate) : null

    const project = await db.project.update({ where: { id: req.params.id }, data })
    res.json(success(project, 'Project updated'))
  } catch (err: any) {
    res.status(500).json(error(err.message))
  }
})

// GET /api/admin/projects/trashed — soft-deleted projects
projectsRouter.get('/trashed', requireAdmin, async (_req, res) => {
  try {
    const projects = await db.project.findMany({ where: { isDeleted: true }, orderBy: { createdAt: 'desc' } })
    res.json(success(projects))
  } catch (err: any) {
    res.status(500).json(error(err.message))
  }
})

// PUT /api/admin/projects/:id/restore
projectsRouter.put('/:id/restore', requireAdmin, async (req, res) => {
  try {
    const project = await db.project.update({ where: { id: req.params.id }, data: { isDeleted: false } })
    res.json(success(project, 'Project restored'))
  } catch (err: any) {
    res.status(500).json(error(err.message))
  }
})

// DELETE /api/admin/projects/:id (soft delete)
projectsRouter.delete('/:id', requireAdmin, async (req, res) => {
  try {
    await db.project.update({ where: { id: req.params.id }, data: { isDeleted: true } })
    res.json(success(null, 'Project moved to trash'))
  } catch (err: any) {
    res.status(500).json(error(err.message))
  }
})
