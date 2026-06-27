import { Router } from 'express'
import { z } from 'zod'
import { db } from '@epowerfix/db'
import { requireAdmin } from '../../middleware/auth'
import { validate } from '../../middleware/validate'
import { success, error } from '../../utils/response'

export const productQuestionRoutes = Router()

productQuestionRoutes.get('/', requireAdmin, async (req, res) => {
  try {
    const { answered, productId } = req.query
    const where: any = { isDeleted: false }
    if (answered === 'true') where.answer = { not: null }
    if (answered === 'false') where.answer = null
    if (productId) where.productId = productId

    const questions = await db.productQuestion.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true } },
        product: { select: { id: true, name: true, images: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
    res.json(success(questions))
  } catch (err: any) {
    res.status(500).json(error(err.message))
  }
})

const answerQuestionSchema = z.object({
  answer: z.string().min(1).max(2000),
})

productQuestionRoutes.put('/:id/answer', requireAdmin, validate(answerQuestionSchema), async (req, res) => {
  try {
    const q = await db.productQuestion.update({
      where: { id: req.params.id },
      data: { answer: req.body.answer.trim(), answeredAt: new Date() },
    })
    res.json(success(q))
  } catch (err: any) {
    res.status(500).json(error(err.message))
  }
})

productQuestionRoutes.delete('/:id', requireAdmin, async (req, res) => {
  try {
    await db.productQuestion.update({
      where: { id: req.params.id },
      data: { isDeleted: true },
    })
    res.json(success(null, 'Question deleted'))
  } catch (err: any) {
    res.status(500).json(error(err.message))
  }
})
