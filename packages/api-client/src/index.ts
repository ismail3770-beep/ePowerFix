// @epowerfix/api-client — Shared API client for web and mobile
// This package wraps fetch calls to the backend API.
// The base URL is configurable via NEXT_PUBLIC_API_BASE_URL (web) or EXPO_PUBLIC_API_BASE_URL (mobile).

const API_BASE_URL =
  (typeof process !== "undefined" &&
    (process.env.NEXT_PUBLIC_API_BASE_URL ||
      process.env.EXPO_PUBLIC_API_BASE_URL)) ||
  "";

export async function apiFetch<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    credentials: "include",
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }

  return res.json();
}

export const api = {
  get: <T>(url: string) => apiFetch<T>(url),
  post: <T>(url: string, body?: unknown) =>
    apiFetch<T>(url, {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    }),
  put: <T>(url: string, body?: unknown) =>
    apiFetch<T>(url, {
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
    }),
  delete: <T>(url: string) => apiFetch<T>(url, { method: "DELETE" }),
};

// ─── Domain-specific API endpoints ────────────────────────────────────────────

export const productsApi = {
  list: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    brandId?: string;
  }) => {
    const query = new URLSearchParams();
    if (params?.page) query.set("page", String(params.page));
    if (params?.limit) query.set("limit", String(params.limit));
    if (params?.search) query.set("search", params.search);
    if (params?.category) query.set("category", params.category);
    if (params?.brandId) query.set("brandId", params.brandId);
    const qs = query.toString();
    return api.get<{
      data: { data: any[]; total: number; page: number; limit: number };
    }>(`/api/products${qs ? `?${qs}` : ""}`);
  },

  getById: (id: string) =>
    api.get<{ data: { product: any; related: any[] } }>(`/api/products/${id}`),

  compare: (ids: string[]) =>
    api.get<{ data: any[] }>(`/api/products/compare?ids=${ids.join(",")}`),
};

export const authApi = {
  login: (email: string, password: string) =>
    api.post<{ data: { user: any; token?: string }; message: string }>(
      "/api/auth/login",
      { email, password }
    ),

  register: (data: {
    name: string;
    email: string;
    phone: string;
    password: string;
    nameBn?: string;
  }) =>
    api.post<{ data: any; message: string }>("/api/auth/register", data),

  me: () => api.get<{ data: any }>("/api/auth/me"),

  logout: () => api.post<{ message: string }>("/api/auth/logout"),

  updateProfile: (data: any) =>
    api.put<{ data: any; message: string }>("/api/auth/profile", data),

  changePassword: (currentPassword: string, newPassword: string) =>
    api.put<{ message: string }>("/api/auth/change-password", {
      currentPassword,
      newPassword,
    }),
};

export const ordersApi = {
  create: (data: any) =>
    api.post<{ data: any; paymentUrl?: string }>("/api/orders", data),

  track: (trackingId: string) =>
    api.get<{ data: any }>(`/api/orders/track?id=${trackingId}`),
};

export const servicesApi = {
  list: () => api.get<{ data: any }>("/api/services"),
  getBySlug: (slug: string) =>
    api.get<{ data: any }>(`/api/services/${slug}`),
  book: (data: any) =>
    api.post<{ data: any; message: string }>("/api/services/book", data),
};

