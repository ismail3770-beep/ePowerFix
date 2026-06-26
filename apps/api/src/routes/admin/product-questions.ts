import { Router } from 'express'
import { db } from '@epowerfix/db'
import { requireAdmin } from '../../middleware/auth'
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

productQuestionRoutes.put('/:id/answer', requireAdmin, async (req, res) => {
  try {
    const { answer } = req.body
    if (!answer?.trim()) return res.status(400).json(error('Answer is required'))
    const q = await db.productQuestion.update({
      where: { id: req.params.id },
      data: { answer: answer.trim(), answeredAt: new Date() },
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
