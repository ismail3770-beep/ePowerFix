import { Router } from 'express'
import { getAIAgent } from '../services/ai-agent'
import { requireAdmin } from '../middleware/auth'
import { success, error } from '../utils/response'

export const aiAgentRouter = Router()

// POST /api/ai/agent — Send a message to the AI agent
aiAgentRouter.post('/', requireAdmin, async (req, res) => {
  try {
    const { message, sessionId } = req.body

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json(error('Message is required'))
    }

    const sid = sessionId || req.user!.id
    const agent = await getAIAgent()
    const result = await agent.chat(sid, message.trim())

    res.json(success({
      response: result.response,
      toolCallsExecuted: result.toolCallsExecuted,
      sessionId: result.sessionId,
    }))
  } catch (err: any) {
    console.error('[AI Agent Error]', err)
    res.status(500).json(error(err.message || 'AI agent error'))
  }
})

// DELETE /api/ai/agent — Clear conversation history
aiAgentRouter.delete('/', requireAdmin, async (req, res) => {
  try {
    const { sessionId } = req.body
    const sid = sessionId || req.user!.id
    const agent = await getAIAgent()
    agent.clearSession(sid)
    res.json(success({ message: 'Conversation cleared' }))
  } catch (err: any) {
    res.status(500).json(error(err.message))
  }
})