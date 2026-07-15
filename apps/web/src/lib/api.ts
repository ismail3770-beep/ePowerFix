// All API calls go through the Next.js rewrite proxy (same-origin).
// This avoids CORS issues and ensures httpOnly cookies work correctly.
// The proxy is configured in next.config.ts → rewrites → /api/:path* → Express API.

export async function apiFetch<T>(endpoint: string, options?: globalThis.RequestInit): Promise<T> {
  const url = endpoint // always same-origin, Next.js proxy handles it
  const res = await fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    credentials: 'include', // for httpOnly cookies
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(err.error || `HTTP ${res.status}`)
  }
  return res.json()
}

export const api = {
  get: <T>(url: string) => apiFetch<T>(url),
  post: <T>(url: string, body?: unknown) =>
    apiFetch<T>(url, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  put: <T>(url: string, body?: unknown) =>
    apiFetch<T>(url, { method: 'PUT', body: body ? JSON.stringify(body) : undefined }),
  delete: <T>(url: string) => apiFetch<T>(url, { method: 'DELETE' }),
}