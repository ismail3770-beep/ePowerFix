const API_BASE = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/api\/?$/, '')

export async function apiFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = API_BASE ? `${API_BASE}${endpoint}` : endpoint
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

/** Unwraps apiFetch's { success, data, message } envelope — returns data directly */
export async function apiFetchData<T = any>(url: string, options?: RequestInit): Promise<T | null> {
  const res = await apiFetch(url, options)
  return (res as any)?.data ?? null
}
