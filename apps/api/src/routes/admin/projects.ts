// Admin project routes: list, create, get, update, delete.
// Migrated from apps/web/src/app/api/admin/projects/route.ts and [id]/route.ts.
//
// Mounted at /api/admin/projects

import { Router } from 'express'
import { z } from 'zod'

import { db } from '../../lib/db.js'
import { asyncHandler, ApiError, validateBody } from '../../lib/api-handler.js'
import {
  parseJsonField,
  stringifyJsonField,
  getPagination,
  listResponse,
} from '../../lib/helpers.js'

const router = Router()

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

const createProjectSchema = z
  .object({
    title: z.string().min(1),
    titleBn: z.string().optional(),
    slug: z.string().optional(),
    description: z.string().min(1),
    coverImage: z.string().optional(),
    images: z.array(z.any()).optional(),
    client: z.string().optional(),
    location: z.string().optional(),
    status: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
  })
  .passthrough()

const updateProjectSchema = z
  .object({
    title: z.string().optional(),
    titleBn: z.string().optional(),
    slug: z.string().optional(),
    description: z.string().optional(),
    coverImage: z.string().optional(),
    images: z.array(z.any()).optional(),
    client: z.string().optional(),
    location: z.string().optional(),
    status: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
  })
  .passthrough()

// ─── GET /api/admin/projects ─────────────────────────────────────────────────

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const query = req.query as Record<string, any>
    const { page, limit, skip, search } = getPagination(query)
    const rawStatus = query.status
    const status =
      rawStatus && rawStatus !== 'all' ? String(rawStatus).toUpperCase() : undefined

    const where: any = { isDeleted: false }
    if (status) where.status = status
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { client: { contains: search } },
        { location: { contains: search } },
      ]
    }

    const [projects, total] = await Promise.all([
      db.project.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      db.project.count({ where }),
    ])

    const data = projects.map((p: any) => ({
      ...p,
      images: parseJsonField<string>(p.images),
    }))

    res.json(listResponse(data, total, page, limit))
  })
)

// ─── POST /api/admin/projects ────────────────────────────────────────────────

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const body = validateBody(req, createProjectSchema)
    const { title, description } = body
    if (!title) {
      throw new ApiError('title is required', 400)
    }
    if (!description) {
      throw new ApiError('description is required', 400)
    }

    let slug = body.slug || slugify(title)
    const slugExists = await db.project.findUnique({ where: { slug } })
    if (slugExists) {
      slug = `${slug}-${Date.now().toString(36)}`
    }

    const project = await db.project.create({
      data: {
        title,
        titleBn: body.titleBn || null,
        slug,
        description,
        coverImage: body.coverImage || null,
        images: stringifyJsonField(body.images),
        client: body.client || null,
        location: body.location || null,
        status: body.status || 'COMPLETED',
        startDate: body.startDate ? new Date(body.startDate) : null,
        endDate: body.endDate ? new Date(body.endDate) : null,
      },
    })

    res.status(201).json({
      data: { ...project, images: parseJsonField<string>(project.images) },
    })
  })
)

// ─── GET /api/admin/projects/:id ─────────────────────────────────────────────

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params

    const project = await db.project.findUnique({ where: { id } })
    if (!project || project.isDeleted) {
      throw new ApiError('Project not found', 404)
    }
    res.json({
      data: { ...project, images: parseJsonField<string>(project.images) },
    })
  })
)

// ─── PUT /api/admin/projects/:id ─────────────────────────────────────────────

router.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params
    const body = validateBody(req, updateProjectSchema)

    const existing = await db.project.findUnique({ where: { id } })
    if (!existing || existing.isDeleted) {
      throw new ApiError('Project not found', 404)
    }

    if (body.slug !== undefined && body.slug !== existing.slug) {
      const finalSlug = body.slug || (body.title ? slugify(body.title) : existing.slug)
      const owner = await db.project.findUnique({ where: { slug: finalSlug } })
      if (owner && owner.id !== id) {
        throw new ApiError('Slug already in use', 400)
      }
    }

    const data: any = {}
    if (body.title !== undefined) data.title = body.title
    if (body.titleBn !== undefined) data.titleBn = body.titleBn || null
    if (body.slug !== undefined) {
      data.slug = body.slug || (body.title ? slugify(body.title) : existing.slug)
    }
    if (body.description !== undefined) data.description = body.description
    if (body.coverImage !== undefined) data.coverImage = body.coverImage || null
    if (body.images !== undefined) data.images = stringifyJsonField(body.images)
    if (body.client !== undefined) data.client = body.client || null
    if (body.location !== undefined) data.location = body.location || null
    if (body.status !== undefined) data.status = body.status
    if (body.startDate !== undefined) data.startDate = body.startDate ? new Date(body.startDate) : null
    if (body.endDate !== undefined) data.endDate = body.endDate ? new Date(body.endDate) : null

    const project = await db.project.update({ where: { id }, data })

    res.json({
      data: { ...project, images: parseJsonField<string>(project.images) },
    })
  })
)

// ─── DELETE /api/admin/projects/:id ──────────────────────────────────────────

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params

    const existing = await db.project.findUnique({ where: { id } })
    if (!existing || existing.isDeleted) {
      throw new ApiError('Project not found', 404)
    }

    await db.project.update({
      where: { id },
      data: { isDeleted: true },
    })

    res.json({ message: 'Project deleted' })
  })
)

export default router
