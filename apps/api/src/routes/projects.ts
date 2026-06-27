import { Router } from 'express'
import { db } from '@epowerfix/db'
import { success, error } from '../utils/response'

export const projectsRouter = Router()

// GET /api/projects — list all projects
projectsRouter.get('/', async (req, res) => {
  try {
    const status = req.query.status as string | undefined
    const where: any = { isActive: true, isDeleted: false }
    if (status) where.status = status

    const projects = await db.project.findMany({ where, orderBy: { createdAt: 'desc' } })
    res.json(success(projects))
  } catch (err: any) {
    res.status(500).json(error(err.message))
  }
})

// GET /api/projects/:slug — single project
projectsRouter.get('/:slug', async (req, res) => {
  try {
    const project = await db.project.findFirst({ where: { slug: req.params.slug, isActive: true, isDeleted: false } })
    if (!project) return res.status(404).json(error('Project not found'))
    res.json(success(project))
  } catch (err: any) {
    res.status(500).json(error(err.message))
  }
})
