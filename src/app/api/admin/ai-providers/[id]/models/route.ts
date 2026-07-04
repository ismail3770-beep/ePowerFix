import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import {
  requireAdmin,
  jsonResponse,
  errorResponse,
} from '@/lib/admin-api'

/**
 * Returns a default model list for a given provider type. Used as a stub
 * when the provider's API isn't actually queried.
 */
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

/**
 * GET /api/admin/ai-providers/[id]/models
 * Returns the available models for the provider. Stub implementation that
 * returns a default list based on the provider type.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response!

  try {
    const { id } = await params
    const provider = await db.aiProvider.findUnique({ where: { id } })
    if (!provider) return errorResponse('AI provider not found', 404)

    const models = defaultModelsForType(provider.type)

    return jsonResponse({
      data: {
        models,
        defaultModel: provider.defaultModel,
        providerType: provider.type,
      },
    })
  } catch (err: any) {
    console.error('admin/ai-providers/[id]/models GET error:', err)
    return errorResponse(err?.message || 'Internal server error', 500)
  }
}
