import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import {
  requireAdmin,
  jsonResponse,
  errorResponse,
  stringifyJsonField,
} from '@/lib/admin-api'
import { adminGetRoute, adminRoute, z } from '@/lib/api-handler'

/**
 * Maps an AiProvider DB row to the response shape expected by the admin
 * frontend. The frontend uses `isActive` while the schema stores `enabled`.
 * There is no `isDefault` column in the schema, so we derive it from
 * `sortOrder === 0` (the lowest sortOrder provider is the default).
 */
function mapProvider(p: any) {
  if (!p) {return p}
  return {
    ...p,
    isActive: p.enabled,
    isDefault: p.sortOrder === 0,
    config: p.config ? safeParse(p.config) : {},
  }
}

function safeParse(s: string): any {
  try {
    return JSON.parse(s)
  } catch {
    return {}
  }
}

const VALID_TYPES = new Set([
  'OPENAI',
  'ANTHROPIC',
  'GEMINI',
  'OLLAMA',
  'OPENROUTER',
  'OPENCODE',
  'CUSTOM',
])

// ─── Zod Schema ───────────────────────────────────────────────────────────────

const createProviderSchema = z.object({
  name: z.string().min(1),
  type: z.string().min(1),
  baseUrl: z.string().optional(),
  defaultModel: z.string().optional(),
  model: z.string().optional(),
  apiKey: z.string().optional(),
  isActive: z.boolean().optional(),
  isDefault: z.boolean().optional(),
  config: z.any().optional(),
  sortOrder: z.number().int().optional(),
}).passthrough()

// ─── GET /api/admin/ai-providers ──────────────────────────────────────────────

export const GET = adminGetRoute(async (request) => {
  const providers = await db.aiProvider.findMany({
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
  })
  return jsonResponse({ data: providers.map(mapProvider) })
})

// ─── POST /api/admin/ai-providers ─────────────────────────────────────────────

export const POST = adminRoute(createProviderSchema, async (request, body, user) => {
  const name = (body.name || '').toString().trim()
  if (!name) {return errorResponse('name is required', 400)}

  const type = (body.type || '').toString().toUpperCase()
  if (!VALID_TYPES.has(type)) {
    return errorResponse(
      'type must be one of OPENAI, ANTHROPIC, GEMINI, OLLAMA, OPENROUTER, OPENCODE, CUSTOM',
      400
    )
  }

  const baseUrl = (body.baseUrl || defaultBaseUrlFor(type)).toString()
  const defaultModel = (body.defaultModel || body.model || defaultModelFor(type)).toString()
  if (!defaultModel) {
    return errorResponse('defaultModel is required', 400)
  }

  const isDefault = body.isDefault === true
  const configValue =
    body.config && typeof body.config === 'object'
      ? stringifyJsonField(body.config)
      : body.config
      ? String(body.config)
      : null

  // If isDefault, push existing providers down so the new one is the default.
  let sortOrder = 0
  if (isDefault) {
    const existing = await db.aiProvider.findMany({
      orderBy: { sortOrder: 'asc' },
    })
    // Bump all existing providers' sortOrder by 1 (in a transaction).
    await db.$transaction(
      existing.map((p) =>
        db.aiProvider.update({
          where: { id: p.id },
          data: { sortOrder: p.sortOrder + 1 },
        })
      )
    )
    sortOrder = 0
  } else {
    // Place at the end.
    const count = await db.aiProvider.count()
    sortOrder = count
  }

  const provider = await db.aiProvider.create({
    data: {
      name,
      type,
      apiKey: body.apiKey || null,
      baseUrl,
      defaultModel,
      enabled: body.isActive !== undefined ? !!body.isActive : true,
      sortOrder,
      config: configValue,
    },
  })

  return jsonResponse({ data: mapProvider(provider) }, 201)
})

function defaultBaseUrlFor(type: string): string {
  switch (type) {
    case 'OPENAI':
      return 'https://api.openai.com/v1'
    case 'ANTHROPIC':
      return 'https://api.anthropic.com'
    case 'GEMINI':
      return 'https://generativelanguage.googleapis.com/v1beta'
    case 'OLLAMA':
      return 'http://localhost:11434'
    case 'OPENROUTER':
      return 'https://openrouter.ai/api/v1'
    case 'OPENCODE':
      return 'https://api.open-code.dev/v1'
    default:
      return ''
  }
}

function defaultModelFor(type: string): string {
  switch (type) {
    case 'OPENAI':
      return 'gpt-4o-mini'
    case 'ANTHROPIC':
      return 'claude-3-5-sonnet-20241022'
    case 'GEMINI':
      return 'gemini-1.5-flash'
    case 'OLLAMA':
      return 'llama3'
    case 'OPENROUTER':
      return 'openai/gpt-4o-mini'
    default:
      return ''
  }
}
