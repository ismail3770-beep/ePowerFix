import type { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import {
  requireAdmin,
  errorResponse,
  getPagination,
  listResponse,
} from '@/lib/admin-api'

/**
 * Maps a ProductQuestion DB row to the response shape expected by the admin
 * frontend. Adds the convenient `isAnswered` boolean derived from the
 * presence of an `answer`.
 */
function mapQuestion(q: any) {
  if (!q) {return q}
  return {
    ...q,
    isAnswered: !!q.answer,
  }
}

/**
 * GET /api/admin/product-questions
 * List product questions with pagination, search, and answered/unanswered filter.
 */
export async function GET(request: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) {return auth.response!}

  try {
    const { page, limit, skip, search } = getPagination(request.url)
    const url = new URL(request.url)
    const status = url.searchParams.get('status') || undefined

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
    if (status === 'answered') {where.answer = { not: null }}
    if (status === 'unanswered') {where.answer = null}

    const [questions, total] = await Promise.all([
      db.productQuestion.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, name: true, email: true } },
          product: { select: { id: true, name: true, slug: true } },
        },
      }),
      db.productQuestion.count({ where }),
    ])

    return listResponse(questions.map(mapQuestion), total, page, limit)
  } catch (err: any) {
    console.error('admin/product-questions GET error:', err)
    return errorResponse(err?.message || 'Internal server error', 500)
  }
}
