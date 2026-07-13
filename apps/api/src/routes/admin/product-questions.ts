// Admin product-question routes: list, answer, delete.
// Migrated from:
//   apps/web/src/app/api/admin/product-questions/route.ts
//   apps/web/src/app/api/admin/product-questions/[id]/route.ts
//   apps/web/src/app/api/admin/product-questions/[id]/answer/route.ts
//
// Mounted at /api/admin/product-questions

import { Router } from 'express'
import { z } from 'zod'

import { db } from '../../lib/db.js'
import { asyncHandler, ApiError, validateBody } from '../../lib/api-handler.js'
import {
  getPagination,
  listResponse,
} from '../../lib/helpers.js'

const router = Router()

function mapQuestion(q: any) {
  if (!q) return q
  return {
    ...q,
    isAnswered: !!q.answer,
  }
}

const answerQuestionSchema = z
  .object({
    answer: z.string().min(1),
  })
  .passthrough()

const QUESTION_INCLUDE = {
  user: { select: { id: true, name: true, email: true } },
  product: { select: { id: true, name: true, slug: true } },
}

// ─── GET /api/admin/product-questions ────────────────────────────────────────

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const query = req.query as Record<string, any>
    const { page, limit, skip, search } = getPagination(query)
    const status = query.status || undefined

    const where: any = {}
    if (search) {
      where.OR = [
        { question: { contains: search } },
        { answer: { contains: search } },
        { product: { name: { contains: search } } },
        { user: { name: { contains: search } } },
        { user: { email: { contains: search } } },
      ]
    }
    if (status === 'answered') where.answer = { not: null }
    if (status === 'unanswered') where.answer = null

    const [questions, total] = await Promise.all([
      db.productQuestion.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: QUESTION_INCLUDE,
      }),
      db.productQuestion.count({ where }),
    ])

    res.json(listResponse(questions.map(mapQuestion), total, page, limit))
  })
)

// ─── GET /api/admin/product-questions/:id ────────────────────────────────────

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params

    const question = await db.productQuestion.findUnique({
      where: { id },
      include: QUESTION_INCLUDE,
    })
    if (!question) {
      throw new ApiError('Question not found', 404)
    }
    res.json({ data: mapQuestion(question) })
  })
)

// ─── PUT /api/admin/product-questions/:id/answer ─────────────────────────────

router.put(
  '/:id/answer',
  asyncHandler(async (req, res) => {
    const { id } = req.params
    const body = validateBody(req, answerQuestionSchema)

    const answer = (body.answer || '').toString().trim()
    if (!answer) {
      throw new ApiError('answer is required', 400)
    }

    const existing = await db.productQuestion.findUnique({ where: { id } })
    if (!existing) {
      throw new ApiError('Question not found', 404)
    }

    const question = await db.productQuestion.update({
      where: { id },
      data: {
        answer,
        answeredAt: new Date(),
      },
      include: QUESTION_INCLUDE,
    })

    res.json({ data: mapQuestion(question) })
  })
)

// ─── DELETE /api/admin/product-questions/:id — hard delete ───────────────────

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params

    const existing = await db.productQuestion.findUnique({ where: { id } })
    if (!existing) {
      throw new ApiError('Question not found', 404)
    }

    await db.productQuestion.delete({ where: { id } })
    res.json({ message: 'Question deleted' })
  })
)

export default router
