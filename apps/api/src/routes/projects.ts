// Project routes: list, detail
// Public portfolio projects (NOT sellable kits — those live at /api/project-kits).
import { Router } from 'express'

import { db } from '../lib/db.js'
import { asyncHandler, ApiError } from '../lib/api-handler.js'
import { parseJsonField } from '../lib/helpers.js'

const router = Router()

// ─── GET /api/projects ────────────────────────────────────────────────────────

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const query = req.query as Record<string, any>
    const search = query.search || query.q || ''

    const where: any = {}
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { titleBn: { contains: search } },
        { description: { contains: search } },
        { client: { contains: search } },
        { location: { contains: search } },
      ]
    }

    const projects = await db.project.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    const parsed = projects.map((p: any) => ({
      ...p,
      images: parseJsonField(p.images),
    }))

    res.json({ data: parsed })
  })
)

// ─── GET /api/projects/:slug ──────────────────────────────────────────────────

router.get(
  '/:slug',
  asyncHandler(async (req, res) => {
    const { slug } = req.params

    const project = await db.project.findFirst({
      where: { slug },
    })

    if (!project) {
      throw new ApiError('Project not found', 404)
    }

    const parsed = {
      ...project,
      images: parseJsonField(project.images),
    }
    // Frontend expects `data` to be the project object directly.
    res.json({ data: parsed })
  })
)

export default router
