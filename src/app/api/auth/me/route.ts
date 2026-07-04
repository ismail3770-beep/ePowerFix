import { getSession, jsonResponse, errorResponse } from '@/lib/auth'

export async function GET() {
  const user = await getSession()
  if (!user) {
    return errorResponse('Not authenticated', 401)
  }
  return jsonResponse({ data: user })
}
