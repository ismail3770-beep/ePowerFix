import { Router } from 'express'
import { z } from 'zod'
import { db } from '@epowerfix/db'
import { requireAdmin } from '../../middleware/auth'
import { validate } from '../../middleware/validate'
import { success, error } from '../../utils/response'
import { generateSlug } from '@epowerfix/utils'

export const blogRouter = Router()

const createBlogSchema = z.object({
  title: z.string().min(2),
  titleBn: z.string().optional().default(''),
  content: z.string().default(''),
  excerpt: z.string().optional().default(''),
  coverImage: z.string().optional().default(''),
  tags: z.array(z.string()).default([]),
  author: z.string().optional().default('ePowerFix Team'),
  isPublished: z.boolean().default(false),
})

// GET /api/admin/blog
blogRouter.get('/', requireAdmin, async (req, res) => {
  try {
    const { search, published } = req.query as any
    const where: any = { isDeleted: false }
    if (published === 'true') where.isPublished = true
    else if (published === 'false') where.isPublished = false
    if (search) where.OR = [{ title: { contains: String(search), mode: 'insensitive' } }]

    const posts = await db.blogPost.findMany({ where, orderBy: { createdAt: 'desc' } })
    res.json(success(posts))
  } catch (err: any) {
    res.status(500).json(error(err.message))
  }
})

// POST /api/admin/blog
blogRouter.post('/', requireAdmin, validate(createBlogSchema), async (req, res) => {
  try {
    const slug = generateSlug(req.body.title) + '-' + Date.now().toString(36)
    const post = await db.blogPost.create({ data: { ...req.body, slug } })
    res.status(201).json(success(post, 'Blog post created'))
  } catch (err: any) {
    if (err.code === 'P2002') return res.status(409).json(error('Slug already exists'))
    res.status(500).json(error(err.message))
  }
})

// PUT /api/admin/blog/:id
blogRouter.put('/:id', requireAdmin, validate(createBlogSchema.partial()), async (req, res) => {
  try {
    const post = await db.blogPost.update({ where: { id: req.params.id }, data: req.body })
    res.json(success(post, 'Blog post updated'))
  } catch (err: any) {
    res.status(500).json(error(err.message))
  }
})

// GET /api/admin/blog/trashed — soft-deleted posts
blogRouter.get('/trashed', requireAdmin, async (_req, res) => {
  try {
    const posts = await db.blogPost.findMany({ where: { isDeleted: true }, orderBy: { createdAt: 'desc' } })
    res.json(success(posts))
  } catch (err: any) {
    res.status(500).json(error(err.message))
  }
})

// PUT /api/admin/blog/:id/restore
blogRouter.put('/:id/restore', requireAdmin, async (req, res) => {
  try {
    const post = await db.blogPost.update({ where: { id: req.params.id }, data: { isDeleted: false } })
    res.json(success(post, 'Blog post restored'))
  } catch (err: any) {
    res.status(500).json(error(err.message))
  }
})

// DELETE /api/admin/blog/:id (soft delete)
blogRouter.delete('/:id', requireAdmin, async (req, res) => {
  try {
    await db.blogPost.update({ where: { id: req.params.id }, data: { isDeleted: true } })
    res.json(success(null, 'Blog post moved to trash'))
  } catch (err: any) {
    res.status(500).json(error(err.message))
  }
})
