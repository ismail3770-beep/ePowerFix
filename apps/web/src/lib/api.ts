// All API calls use same-origin relative URLs.
// Requests to /api/* are proxied to the Express backend by src/proxy.ts
// (and next.config.ts rewrites as a fallback). The backend target is chosen
// server-side via NEXT_PUBLIC_API_BASE_URL — nothing is baked into the
// client bundle. This avoids CORS issues and keeps httpOnly cookies working.

export async function apiFetch<T>(endpoint: string, options?: globalThis.RequestInit): Promise<T> {
  // `endpoint` is normally a same-origin path like "/api/auth/login".
  // Absolute URLs are still supported if a caller passes one explicitly.
  const res = await fetch(endpoint, {
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
