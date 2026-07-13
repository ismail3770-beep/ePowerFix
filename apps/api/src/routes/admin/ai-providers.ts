// Admin AI-provider routes: list, create, get, update, delete, toggle,
// models, active list, defaults.
// Migrated from:
//   apps/web/src/app/api/admin/ai-providers/route.ts
//   apps/web/src/app/api/admin/ai-providers/[id]/route.ts
//   apps/web/src/app/api/admin/ai-providers/[id]/toggle/route.ts
//   apps/web/src/app/api/admin/ai-providers/[id]/models/route.ts
//   apps/web/src/app/api/admin/ai-providers/active/route.ts
//   apps/web/src/app/api/admin/ai-providers/defaults/route.ts
//
// Mounted at /api/admin/ai-providers
//
// IMPORTANT: route ordering — `/active`, `/defaults` are static paths and must
// be registered before `/:id` so Express doesn't treat them as an id.

import { Router } from 'express'
import { z } from 'zod'

import { db } from '../../lib/db.js'
import { asyncHandler, ApiError, validateBody } from '../../lib/api-handler.js'
import { stringifyJsonField } from '../../lib/helpers.js'

const router = Router()

function safeParse(s: string | null | undefined): any {
  if (!s) return {}
  try {
    return JSON.parse(s)
  } catch {
    return {}
  }
}

function mapProvider(p: any) {
  if (!p) return p
  return {
    ...p,
    isActive: p.enabled,
    isDefault: p.sortOrder === 0,
    config: p.config ? safeParse(p.config) : {},
  }
}

function mapProviderMasked(p: any) {
  if (!p) return p
  return {
    ...p,
    isActive: p.enabled,
    isDefault: p.sortOrder === 0,
    config: p.config ? safeParse(p.config) : {},
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

const createProviderSchema = z
  .object({
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
  })
  .passthrough()

const updateProviderSchema = z
  .object({
    name: z.string().optional(),
    type: z.string().optional(),
    apiKey: z.string().optional(),
    baseUrl: z.string().optional(),
    defaultModel: z.string().optional(),
    model: z.string().optional(),
    isActive: z.boolean().optional(),
    sortOrder: z.number().int().nullable().optional(),
    config: z.any().optional(),
  })
  .passthrough()

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

function defaultModelsForType(type: string): string[] {
  switch ((type || '').toUpperCase()) {
    case 'OPENAI':
      return [
        'gpt-4o',
        'gpt-4o-mini',
        'gpt-4-turbo',
        'gpt-4',
        'gpt-3.5-turbo',
        'o1-preview',
        'o1-mini',
      ]
    case 'ANTHROPIC':
      return [
        'claude-3-5-sonnet-20241022',
        'claude-3-5-haiku-20241022',
        'claude-3-opus-20240229',
      ]
    case 'GEMINI':
      return [
        'gemini-1.5-pro',
        'gemini-1.5-flash',
        'gemini-1.5-flash-8b',
        'gemini-2.0-flash-exp',
      ]
    case 'OLLAMA':
      return ['llama3', 'llama3.1', 'mistral', 'phi3', 'qwen2.5', 'gemma2']
    case 'OPENROUTER':
      return [
        'openai/gpt-4o',
        'openai/gpt-4o-mini',
        'anthropic/claude-3.5-sonnet',
        'google/gemini-flash-1.5',
        'meta-llama/llama-3.1-70b-instruct',
      ]
    case 'OPENCODE':
      return ['opencode-base', 'opencode-pro']
    default:
      return []
  }
}

// ─── GET /api/admin/ai-providers/defaults ────────────────────────────────────
// (Static path — must be registered before /:id)

router.get(
  '/defaults',
  asyncHandler(async (req, res) => {
    const rawType = (req.query.type as string) || ''
    const upper = rawType.toUpperCase()
    if (!upper) {
      throw new ApiError(
        'type query param is required (openai|anthropic|gemini|ollama|openrouter|opencode|custom)',
        400,
      )
    }

    const defaults: Record<
      string,
      { baseUrl: string; defaultModel: string; models: string[] }
    > = {
      OPENAI: {
        baseUrl: 'https://api.openai.com/v1',
        defaultModel: 'gpt-4o-mini',
        models: defaultModelsForType('OPENAI'),
      },
      ANTHROPIC: {
        baseUrl: 'https://api.anthropic.com',
        defaultModel: 'claude-3-5-sonnet-20241022',
        models: defaultModelsForType('ANTHROPIC'),
      },
      GEMINI: {
        baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
        defaultModel: 'gemini-1.5-flash',
        models: defaultModelsForType('GEMINI'),
      },
      OLLAMA: {
        baseUrl: 'http://localhost:11434',
        defaultModel: 'llama3',
        models: defaultModelsForType('OLLAMA'),
      },
      OPENROUTER: {
        baseUrl: 'https://openrouter.ai/api/v1',
        defaultModel: 'openai/gpt-4o-mini',
        models: defaultModelsForType('OPENROUTER'),
      },
      OPENCODE: {
        baseUrl: 'https://api.open-code.dev/v1',
        defaultModel: 'opencode-base',
        models: defaultModelsForType('OPENCODE'),
      },
      CUSTOM: {
        baseUrl: '',
        defaultModel: '',
        models: [],
      },
    }

    const typeAlias: Record<string, string> = { CLAUDE: 'ANTHROPIC' }
    const type = typeAlias[upper] || upper

    const config = defaults[type]
    if (!config) {
      throw new ApiError(
        `Unknown provider type: ${rawType}. Supported: openai, anthropic/claude, gemini, ollama, openrouter, opencode, custom`,
        400,
      )
    }

    res.json({
      data: {
        type,
        baseUrl: config.baseUrl,
        defaultModel: config.defaultModel,
        models: config.models,
      },
    })
  })
)

// ─── GET /api/admin/ai-providers/active ──────────────────────────────────────
// (Static path — must be registered before /:id)

router.get(
  '/active',
  asyncHandler(async (_req, res) => {
    const providers = await db.aiProvider.findMany({
      where: { enabled: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    })

    const safe = providers.map((p: any) => ({
      ...mapProviderMasked(p),
      apiKey: p.apiKey ? '••••••' : null,
    }))

    res.json({ data: safe })
  })
)

// ─── GET /api/admin/ai-providers ─────────────────────────────────────────────

router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const providers = await db.aiProvider.findMany({
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    })
    res.json({ data: providers.map(mapProvider) })
  })
)

// ─── POST /api/admin/ai-providers ────────────────────────────────────────────

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const body = validateBody(req, createProviderSchema)

    const name = (body.name || '').toString().trim()
    if (!name) {
      throw new ApiError('name is required', 400)
    }

    const type = (body.type || '').toString().toUpperCase()
    if (!VALID_TYPES.has(type)) {
      throw new ApiError(
        'type must be one of OPENAI, ANTHROPIC, GEMINI, OLLAMA, OPENROUTER, OPENCODE, CUSTOM',
        400,
      )
    }

    const baseUrl = (body.baseUrl || defaultBaseUrlFor(type)).toString()
    const defaultModel = (body.defaultModel || body.model || defaultModelFor(type)).toString()
    if (!defaultModel) {
      throw new ApiError('defaultModel is required', 400)
    }

    const isDefault = body.isDefault === true
    const configValue =
      body.config && typeof body.config === 'object'
        ? stringifyJsonField(body.config)
        : body.config
        ? String(body.config)
        : null

    let sortOrder = 0
    if (isDefault) {
      const existing = await db.aiProvider.findMany({
        orderBy: { sortOrder: 'asc' },
      })
      await db.$transaction(
        existing.map((p: any) =>
          db.aiProvider.update({
            where: { id: p.id },
            data: { sortOrder: p.sortOrder + 1 },
          }),
        ),
      )
      sortOrder = 0
    } else {
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

    res.status(201).json({ data: mapProvider(provider) })
  })
)

// ─── GET /api/admin/ai-providers/:id ─────────────────────────────────────────

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params

    const provider = await db.aiProvider.findUnique({ where: { id } })
    if (!provider) {
      throw new ApiError('AI provider not found', 404)
    }
    res.json({ data: mapProvider(provider) })
  })
)

// ─── PUT /api/admin/ai-providers/:id ─────────────────────────────────────────

router.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params
    const body = validateBody(req, updateProviderSchema)

    const existing = await db.aiProvider.findUnique({ where: { id } })
    if (!existing) {
      throw new ApiError('AI provider not found', 404)
    }

    const data: any = {}
    if (body.name !== undefined) data.name = body.name
    if (body.type !== undefined) data.type = (body.type || '').toString().toUpperCase()
    if (body.apiKey !== undefined) data.apiKey = body.apiKey || null
    if (body.baseUrl !== undefined) data.baseUrl = body.baseUrl
    if (body.defaultModel !== undefined) data.defaultModel = body.defaultModel
    if (body.model !== undefined) data.defaultModel = body.model
    if (body.isActive !== undefined) data.enabled = !!body.isActive
    if (body.sortOrder !== undefined && body.sortOrder !== null) {
      data.sortOrder = Number(body.sortOrder)
    }
    if (body.config !== undefined) {
      data.config =
        typeof body.config === 'object'
          ? stringifyJsonField(body.config)
          : String(body.config)
    }

    const provider = await db.aiProvider.update({ where: { id }, data })
    res.json({ data: mapProvider(provider) })
  })
)

// ─── DELETE /api/admin/ai-providers/:id ──────────────────────────────────────

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params

    const existing = await db.aiProvider.findUnique({ where: { id } })
    if (!existing) {
      throw new ApiError('AI provider not found', 404)
    }

    await db.aiProvider.delete({ where: { id } })
    res.json({ message: 'AI provider deleted' })
  })
)

// ─── PATCH /api/admin/ai-providers/:id/toggle ────────────────────────────────

router.patch(
  '/:id/toggle',
  asyncHandler(async (req, res) => {
    const { id } = req.params

    const existing = await db.aiProvider.findUnique({ where: { id } })
    if (!existing) {
      throw new ApiError('AI provider not found', 404)
    }

    const provider = await db.aiProvider.update({
      where: { id },
      data: { enabled: !existing.enabled },
    })

    res.json({ data: mapProvider(provider) })
  })
)

// ─── GET /api/admin/ai-providers/:id/models ──────────────────────────────────

router.get(
  '/:id/models',
  asyncHandler(async (req, res) => {
    const { id } = req.params

    const provider = await db.aiProvider.findUnique({ where: { id } })
    if (!provider) {
      throw new ApiError('AI provider not found', 404)
    }

    const models = defaultModelsForType(provider.type)

    res.json({
      data: {
        models,
        defaultModel: provider.defaultModel,
        providerType: provider.type,
      },
    })
  })
)

export default router
