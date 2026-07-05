import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import {
  requireAdmin,
  jsonResponse,
  errorResponse,
} from '@/lib/admin-api'
import { withErrorHandling, validateBody, z } from '@/lib/api-handler'

function mapQuestion(q: any) {
  if (!q) return q
  return { ...q, isAnswered: !!q.answer }
}

// ─── Zod Schema ───────────────────────────────────────────────────────────────

const answerQuestionSchema = z.object({
  answer: z.string().min(1),
}).passthrough()

// ─── PUT /api/admin/product-questions/[id]/answer ─────────────────────────────

export const PUT = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response!

  const { id } = await params
  const body = await validateBody(request, answerQuestionSchema)

  const answer = (body.answer || '').toString().trim()
  if (!answer) return errorResponse('answer is required', 400)

  const existing = await db.productQuestion.findUnique({ where: { id } })
  if (!existing) return errorResponse('Question not found', 404)

  const question = await db.productQuestion.update({
    where: { id },
    data: {
      answer,
      answeredAt: new Date(),
    },
    include: {
      user: { select: { id: true, name: true, email: true } },
      product: { select: { id: true, name: true, slug: true } },
    },
  })

  return jsonResponse({ data: mapQuestion(question) })
})
