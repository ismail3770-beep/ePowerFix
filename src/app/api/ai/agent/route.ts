import { NextRequest } from 'next/server'
import { jsonResponse, errorResponse, parseBody } from '@/lib/auth'

const SYSTEM_PROMPT = `You are the ePowerFix support assistant — a friendly, knowledgeable helper for an online electrical products & services marketplace in Bangladesh (Dhaka).

You help customers with:
- Finding electrical products (cables, breakers, LED lights, solar panels, tools, etc.)
- Booking electrical services (wiring, solar installation, industrial automation, safety audits)
- Order status, delivery, payment methods (bKash, Nagad, SSLCommerz, Cash on Delivery)
- Project kits (Arduino / IoT / PLC build kits)

Keep replies short, friendly and practical. If a customer wants to place an order or book a service, guide them to the relevant page (Shop, Services, Get a Quote, Contact). You can answer in Bangla or English depending on what the customer uses.

Contact info: info@epowerfix.com, phone +880 1XXX-XXXXXX.`

/**
 * POST /api/ai/agent
 * Public storefront chatbot backed by the ZAI SDK LLM.
 * Body: { message }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await parseBody<{ message?: string }>(request)
    if (!body?.message) return errorResponse('message is required', 400)

    // Lazy import keeps the SDK out of the client bundle and avoids loading it
    // on every cold start of unrelated routes.
    const ZAI = (await import('z-ai-web-dev-sdk')).default
    const zai = await ZAI.create()

    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'assistant', content: SYSTEM_PROMPT },
        { role: 'user', content: body.message },
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
    // Fall back to a graceful message so the chat widget keeps working.
    return jsonResponse({
      data: {
        response:
          "I'm here to help! You can browse our products on the Shop page, book a service, or contact us at info@epowerfix.com.",
      },
    })
  }
}
