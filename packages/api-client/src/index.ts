// @epowerfix/api-client — Shared API client for web and mobile
// This package wraps fetch calls to the backend API.
// The base URL is configurable via NEXT_PUBLIC_API_BASE_URL (web) or EXPO_PUBLIC_API_BASE_URL (mobile).

const API_BASE_URL =
  (typeof process !== "undefined" &&
    (process.env.NEXT_PUBLIC_API_BASE_URL ||
      process.env.EXPO_PUBLIC_API_BASE_URL)) ||
  "";

// Web requests continue to use the session cookie. Mobile can set a bearer
// token here after restoring it from SecureStore.
let apiToken: string | null = null;

export function setApiToken(token: string | null): void {
  apiToken = token;
}

export function getApiToken(): string | null {
  return apiToken;
}

export async function apiFetch<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(apiToken ? { Authorization: `Bearer ${apiToken}` } : {}),
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

export async function apiFetchRedirectUrl(endpoint: string): Promise<string> {
  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      ...(apiToken ? { Authorization: `Bearer ${apiToken}` } : {}),
    },
    credentials: "include",
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }

  return res.url;
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
  list: () => api.get<{ data: any[] }>("/api/orders"),

  create: (data: any) =>
    api.post<{ success?: boolean; data: any; paymentUrl?: string }>("/api/orders", data),

  track: (orderNumber: string, phone: string) =>
    api.get<{ data: any }>(
      `/api/orders/track?orderNumber=${encodeURIComponent(orderNumber)}&phone=${encodeURIComponent(phone)}`
    ),
};

export const wishlistApi = {
  list: () => api.get<{ success: boolean; data: any[] }>("/api/wishlist"),
  add: (productId: string) =>
    api.post<{ success: boolean; data: any }>("/api/wishlist", { productId }),
  remove: (wishlistId: string) =>
    api.delete<{ success: boolean; message: string }>(`/api/wishlist/${wishlistId}`),
};

export const addressesApi = {
  list: () => api.get<{ data: any[] }>("/api/addresses"),
  create: (data: any) => api.post<{ data: any; message: string }>("/api/addresses", data),
  update: (id: string, data: any) =>
    api.put<{ data: any; message: string }>(`/api/addresses/${id}`, data),
  remove: (id: string) => api.delete<{ message: string }>(`/api/addresses/${id}`),
};

export const couponsApi = {
  validate: (code: string, orderTotal: number) =>
    api.get<{ data: any }>(
      `/api/coupons/validate?code=${encodeURIComponent(code)}&orderTotal=${encodeURIComponent(String(orderTotal))}`
    ),
};

export const paymentsApi = {
  initiate: (data: {
    orderId: string;
    paymentMethod: "sslcommerz" | "bkash" | "nagad";
    amount: number;
    customerName: string;
    customerPhone: string;
    customerEmail?: string;
    address: string;
  }) => api.post<{ paymentUrl: string; transactionId?: string }>("/api/payments", data),
};

export const downloadsApi = {
  list: () => api.get<{ data: any[] }>("/api/downloads"),
  open: (orderItemId: string) => apiFetchRedirectUrl(`/api/downloads/${encodeURIComponent(orderItemId)}`),
};

export const servicesApi = {
  list: () => api.get<{ data: any }>("/api/services"),
  getBySlug: (slug: string) =>
    api.get<{ data: any }>(`/api/services/${slug}`),
  book: (data: any) =>
    api.post<{ data: any; message: string }>("/api/services/book", data),
};

