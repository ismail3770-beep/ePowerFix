// AI routes: public storefront chatbot backed by the ZAI SDK LLM.
// Mounted at /api/ai in server.ts.
//
// Migrated from apps/web/src/app/api/ai/agent/route.ts.
//
// Routes:
//   POST /agent → chat completion (public, rate-limited per IP)

import { Router } from 'express'
import { z } from 'zod'

import { asyncHandler, ApiError, validateBody } from '../lib/api-handler.js'
import { checkRateLimit } from '../lib/rate-limit.js'

const router = Router()

const SYSTEM_PROMPT = `You are the ePowerFix support assistant — a friendly, knowledgeable helper for an online electrical products & services marketplace in Bangladesh (Dhaka).

You help customers with:
- Finding electrical products (cables, breakers, LED lights, solar panels, tools, etc.)
- Booking electrical services (wiring, solar installation, industrial automation, safety audits)
- Order status, delivery, payment methods (bKash, Nagad, SSLCommerz, Cash on Delivery)
- Project kits (Arduino / IoT / PLC build kits)

Keep replies short, friendly and practical. If a customer wants to place an order or book a service, guide them to the relevant page (Shop, Services, Get a Quote, Contact). You can answer in Bangla or English depending on what the customer uses.

Contact info: info@epowerfix.com, phone +880 1XXX-XXXXXX.`

const MAX_MESSAGE_LENGTH = 500

const aiAgentSchema = z.object({
  message: z.string().min(1, 'message is required'),
})

function getClientIp(req: any): string {
  const xff = (req.headers['x-forwarded-for'] as string | undefined) || ''
  return xff.split(',')[0].trim() || req.ip || 'unknown'
}

/**
 * POST /api/ai/agent
 * Public storefront chatbot backed by the ZAI SDK LLM.
 * Body: { message }
 * Rate limited: 20 messages per 10 minutes per IP.
 */
router.post(
  '/agent',
  asyncHandler(async (req, res) => {
    // Rate limit: 20 messages per 10 minutes per IP.
    const ip = getClientIp(req)
    const rl = await checkRateLimit(`ai-agent:${ip}`, 20, 10 * 60 * 1000)
    if (!rl.allowed) {
      throw new ApiError('Too many messages. Please slow down and try again later.', 429)
    }

    const parsed = validateBody(req, aiAgentSchema)

    // Truncate overly long messages to prevent abuse.
    const message = parsed.message.slice(0, MAX_MESSAGE_LENGTH)
    if (!message.trim()) {
      throw new ApiError('message cannot be empty', 400)
    }

    try {
      const ZAI = (await import('z-ai-web-dev-sdk')).default
      const zai = await ZAI.create()

      const completion = await zai.chat.completions.create({
        messages: [
          { role: 'assistant', content: SYSTEM_PROMPT },
          { role: 'user', content: message },
        ],
        thinking: { type: 'disabled' },
      })

      const response = completion.choices[0]?.message?.content?.trim()
      if (!response) {
        throw new ApiError('No response from AI', 502)
      }

      return res.json({ data: { response } })
    } catch (err: any) {
      // L7: Surface a clearly-marked fallback instead of silently swallowing the
      // error, so the UI can decide whether to retry or show a "try again later"
      // message. We still return 200 because the chat widget expects a message
      // shape, but include `fallback: true` so the client can differentiate.
      console.error('public/ai/agent POST error:', err)
      return res.json({
        data: {
          response:
            "I'm having trouble connecting to my brain right now. You can still browse our products on the Shop page, book a service, or contact us at info@epowerfix.com.",
          fallback: true,
        },
      })
    }
  })
)

export default router
