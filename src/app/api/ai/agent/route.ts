import { NextRequest } from 'next/server'
import { jsonResponse, errorResponse, parseBody } from '@/lib/auth'
import { checkRateLimit } from '@/lib/rate-limit'
import { headers } from 'next/headers'

const SYSTEM_PROMPT = `You are the ePowerFix support assistant — a friendly, knowledgeable helper for an online electrical products & services marketplace in Bangladesh (Dhaka).

You help customers with:
- Finding electrical products (cables, breakers, LED lights, solar panels, tools, etc.)
- Booking electrical services (wiring, solar installation, industrial automation, safety audits)
- Order status, delivery, payment methods (bKash, Nagad, SSLCommerz, Cash on Delivery)
- Project kits (Arduino / IoT / PLC build kits)

Keep replies short, friendly and practical. If a customer wants to place an order or book a service, guide them to the relevant page (Shop, Services, Get a Quote, Contact). You can answer in Bangla or English depending on what the customer uses.

Contact info: info@epowerfix.com, phone +880 1XXX-XXXXXX.`

const MAX_MESSAGE_LENGTH = 500

/**
 * POST /api/ai/agent
 * Public storefront chatbot backed by the ZAI SDK LLM.
 * Body: { message }
 * Rate limited: 20 messages per 10 minutes per IP.
 */
export async function POST(request: NextRequest) {
  // Rate limit: 20 messages per 10 minutes per IP.
  const ip = (await headers()).get('x-forwarded-for') || 'unknown'
  const rl = checkRateLimit(`ai-agent:${ip}`, 20, 10 * 60 * 1000)
  if (!rl.allowed) {
    return errorResponse('Too many messages. Please slow down and try again later.', 429)
  }

  try {
    const body = await parseBody<{ message?: string }>(request)
    if (!body?.message) return errorResponse('message is required', 400)

    // Truncate overly long messages to prevent abuse.
    const message = body.message.slice(0, MAX_MESSAGE_LENGTH)
    if (!message.trim()) return errorResponse('message cannot be empty', 400)

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
      return errorResponse('No response from AI', 502)
    }

    return jsonResponse({ data: { response } })
  } catch (err: any) {
    console.error('public/ai/agent POST error:', err)
    return jsonResponse({
      data: {
        response:
          "I'm here to help! You can browse our products on the Shop page, book a service, or contact us at info@epowerfix.com.",
      },
    })
  }
}
