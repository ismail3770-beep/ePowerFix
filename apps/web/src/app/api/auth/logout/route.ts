import { clearSession, jsonResponse } from '@/lib/auth'

export async function POST() {
  await clearSession()
  return jsonResponse({ message: 'Logout successful' })
}
