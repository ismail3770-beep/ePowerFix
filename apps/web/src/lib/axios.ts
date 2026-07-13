// Axios-compatible wrapper around the project's native fetch API.
// The security admin page was written against an axios-style interface,
// so this adapter bridges the gap without pulling in the axios library.

import { apiFetch } from './api'

interface AxiosResponse<T = unknown> {
  data: T
  status: number
}

interface AxiosRequestConfig {
  params?: Record<string, unknown>
  headers?: Record<string, string>
}

 
const api = {
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    let finalUrl = url
    if (config?.params) {
      const searchParams = new URLSearchParams()
      Object.entries(config.params).forEach(([k, v]) => {
        if (v !== undefined && v !== null) {searchParams.set(k, String(v))}
      })
      const qs = searchParams.toString()
      if (qs) {finalUrl += `?${qs}`}
    }
    const data = await apiFetch<T>(finalUrl, { headers: config?.headers })
    return { data, status: 200 }
  },

  async post<T = any>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    const data = await apiFetch<T>(url, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
      headers: config?.headers,
    })
    return { data, status: 200 }
  },

  async put<T = any>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    const data = await apiFetch<T>(url, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
      headers: config?.headers,
    })
    return { data, status: 200 }
  },

  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    const data = await apiFetch<T>(url, {
      method: 'DELETE',
      headers: config?.headers,
    })
    return { data, status: 200 }
  },
}

export default api