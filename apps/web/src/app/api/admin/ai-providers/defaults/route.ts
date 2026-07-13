import type { NextRequest } from 'next/server'
import {
  requireAdmin,
  jsonResponse,
  errorResponse,
} from '@/lib/admin-api'

/**
 * GET /api/admin/ai-providers/defaults
 * Returns sensible default config (baseUrl, models, default model) for a
 * given provider type. Query param: ?type=openai|claude|gemini|ollama|...
 */
export async function GET(request: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) {return auth.response!}

  try {
    const url = new URL(request.url)
    const rawType = (url.searchParams.get('type') || '').toString().toUpperCase()
    if (!rawType) {
      return errorResponse(
        'type query param is required (openai|anthropic|gemini|ollama|openrouter|opencode|custom)',
        400
      )
    }

    const defaults: Record<
      string,
      { baseUrl: string; defaultModel: string; models: string[] }
    > = {
      OPENAI: {
        baseUrl: 'https://api.openai.com/v1',
        defaultModel: 'gpt-4o-mini',
        models: [
          'gpt-4o',
          'gpt-4o-mini',
          'gpt-4-turbo',
          'gpt-4',
          'gpt-3.5-turbo',
          'o1-preview',
          'o1-mini',
        ],
      },
      ANTHROPIC: {
        baseUrl: 'https://api.anthropic.com',
        defaultModel: 'claude-3-5-sonnet-20241022',
        models: [
          'claude-3-5-sonnet-20241022',
          'claude-3-5-haiku-20241022',
          'claude-3-opus-20240229',
        ],
      },
      GEMINI: {
        baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
        defaultModel: 'gemini-1.5-flash',
        models: [
          'gemini-1.5-pro',
          'gemini-1.5-flash',
          'gemini-1.5-flash-8b',
          'gemini-2.0-flash-exp',
        ],
      },
      OLLAMA: {
        baseUrl: 'http://localhost:11434',
        defaultModel: 'llama3',
        models: ['llama3', 'llama3.1', 'mistral', 'phi3', 'qwen2.5', 'gemma2'],
      },
      OPENROUTER: {
        baseUrl: 'https://openrouter.ai/api/v1',
        defaultModel: 'openai/gpt-4o-mini',
        models: [
          'openai/gpt-4o',
          'openai/gpt-4o-mini',
          'anthropic/claude-3.5-sonnet',
          'google/gemini-flash-1.5',
          'meta-llama/llama-3.1-70b-instruct',
        ],
      },
      OPENCODE: {
        baseUrl: 'https://api.open-code.dev/v1',
        defaultModel: 'opencode-base',
        models: ['opencode-base', 'opencode-pro'],
      },
      CUSTOM: {
        baseUrl: '',
        defaultModel: '',
        models: [],
      },
    }

    // Allow `?type=claude` as an alias for ANTHROPIC.
    const typeAlias: Record<string, string> = {
      CLAUDE: 'ANTHROPIC',
    }
    const type = typeAlias[rawType] || rawType

    const config = defaults[type]
    if (!config) {
      return errorResponse(
        `Unknown provider type: ${rawType}. Supported: openai, anthropic/claude, gemini, ollama, openrouter, opencode, custom`,
        400
      )
    }

    return jsonResponse({
      data: {
        type,
        baseUrl: config.baseUrl,
        defaultModel: config.defaultModel,
        models: config.models,
      },
    })
  } catch (err: any) {
    console.error('admin/ai-providers/defaults GET error:', err)
    return errorResponse(err?.message || 'Internal server error', 500)
  }
}
