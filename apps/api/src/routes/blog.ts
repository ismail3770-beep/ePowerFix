import { Router } from 'express'
import { db } from '@epowerfix/db'
import { success, error } from '../utils/response'
import { getPagination } from '@epowerfix/utils'

export const blogRouter = Router()

// GET /api/blog — list published posts (paginated)
blogRouter.get('/', async (req, res) => {
  try {
    const { page = '1', limit = '10', search } = req.query as any
    const { skip, take } = getPagination({ page: Number(page), limit: Number(limit) })
    const where: any = { isDeleted: false, isPublished: true, ...(search ? {
      OR: [{ title: { contains: String(search), mode: 'insensitive' } }, { titleBn: { contains: String(search), mode: 'insensitive' } }],
    } : {}) }

    const [data, total] = await Promise.all([
      db.blogPost.findMany({
        where, skip, take,
        orderBy: { createdAt: 'desc' },
        select: { id: true, title: true, titleBn: true, slug: true, excerpt: true, coverImage: true, author: true, tags: true, createdAt: true },
      }),
      db.blogPost.count({ where }),
    ])

    res.json(success({ data, pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) } }))
  } catch (err: any) {
    res.status(500).json(error(err.message))
  }
})

// GET /api/blog/:slug — single post
blogRouter.get('/:slug', async (req, res) => {
  try {
    const post = await db.blogPost.findFirst({
      where: { slug: req.params.slug, isDeleted: false, isPublished: true },
    })
    if (!post) return res.status(404).json(error('Post not found'))
    res.json(success(post))
  } catch (err: any) {
    res.status(500).json(error(err.message))
  }
})
