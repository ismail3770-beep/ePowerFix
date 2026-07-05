import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import {
  requireAdmin,
  jsonResponse,
  errorResponse,
  parseBody,
} from '@/lib/admin-api'

function mapQuestion(q: any) {
  if (!q) return q
  return { ...q, isAnswered: !!q.answer }
}

/**
 * PUT /api/admin/product-questions/[id]/answer
 * Answer a question. Body: { answer }. Sets answer, answeredAt=now.
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response!

  try {
    const { id } = await params
    const body = await parseBody<any>(request)
    if (!body) return errorResponse('Invalid request body', 400)

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
  } catch (err: any) {
    console.error('admin/product-questions/[id]/answer PUT error:', err)
    return errorResponse(err?.message || 'Internal server error', 500)
  }
}
