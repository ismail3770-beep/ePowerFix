// @epowerfix/api-client — Shared API client for web and mobile
// This package wraps fetch calls to the backend API.
// The base URL is configurable via NEXT_PUBLIC_API_BASE_URL (web) or EXPO_PUBLIC_API_BASE_URL (mobile).

import type {
  CreateMarketplaceRequestPayload,
  MarketplaceAdminProviderDetail,
  MarketplaceAdminProviderListItem,
  MarketplaceAdminProviderSummary,
  MarketplaceArrivalOtp,
  MarketplaceCustomerJob,
  MarketplaceCustomerRequest,
  MarketplaceNotification,
  MarketplaceNotificationListResponse,
  MarketplacePaymentInitiation,
  MarketplaceProviderDashboard,
  MarketplaceProviderDocument,
  MarketplaceProviderProfile,
  MarketplacePublicProvider,
  MarketplaceServiceZone,
  MarketplaceSkill,
  ProviderDocumentType,
  ProviderStatus,
} from "@epowerfix/types";

const WEB_API_BASE_URL =
  (typeof process !== "undefined" && process.env.NEXT_PUBLIC_API_BASE_URL) || "";
const MOBILE_API_BASE_URL =
  (typeof process !== "undefined" && process.env.EXPO_PUBLIC_API_BASE_URL) || "";

function resolveApiUrl(endpoint: string): string {
  // Browser traffic stays same-origin and is forwarded by the Next.js rewrite.
  // Expo needs an absolute origin, while SSR can use the configured web origin.
  const baseUrl = MOBILE_API_BASE_URL || (typeof window === "undefined" ? WEB_API_BASE_URL : "");
  return `${baseUrl}${endpoint}`;
}

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
  const url = resolveApiUrl(endpoint);
  let res: Response;
  try {
    res = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(apiToken ? { Authorization: `Bearer ${apiToken}` } : {}),
        ...options?.headers,
      },
      credentials: "include",
    });
  } catch {
    throw new Error("Could not reach ePowerFix. Check your connection and try again.");
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }

  return res.json();
}

export async function apiFetchBinary<T>(
  endpoint: string,
  data: Blob,
): Promise<T> {
  let res: Response;
  try {
    res = await fetch(resolveApiUrl(endpoint), {
      method: "PUT",
      body: data,
      headers: {
        "Content-Type": "application/octet-stream",
        "X-File-Type": data.type || "application/octet-stream",
        ...(apiToken ? { Authorization: `Bearer ${apiToken}` } : {}),
      },
      credentials: "include",
    });
  } catch {
    throw new Error("Could not upload the document. Check your connection and try again.");
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Document upload failed" }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export async function apiFetchRedirectUrl(endpoint: string): Promise<string> {
  const res = await fetch(resolveApiUrl(endpoint), {
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

export type OrderItemPayload =
  | { itemType: 'PRODUCT'; productId: string; variantId?: string; quantity: number }
  | { itemType: 'SERVICE'; serviceId: string; quantity: number }
  | { itemType: 'PROJECT'; projectId: string; quantity: number }
  | { itemType: 'PROJECT_KIT'; projectKitId: string; quantity: number }

export interface PersistedCartItem {
  id: string
  itemType: 'PRODUCT' | 'SERVICE' | 'PROJECT' | 'PROJECT_KIT'
  productId?: string
  serviceId?: string
  projectId?: string
  projectKitId?: string
  variantId?: string
  variantLabel?: string
  productName: string
  productImage: string
  price: number
  quantity: number
}

export interface PersistedCartResponse {
  success: boolean
  data: { items: PersistedCartItem[] }
}

export interface CreateOrderPayload {
  customerName: string
  customerPhone: string
  customerEmail?: string
  address: string
  area?: string
  notes?: string
  couponCode?: string
  paymentMethod: string
  idempotencyKey?: string
  items: OrderItemPayload[]
}

export interface CreateServiceBookingPayload {
  serviceId: string
  customerName?: string
  customerEmail?: string
  bookingDate: string
  bookingTime: string
  address: string
  phone: string
  notes?: string
}

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

  getActivePaymentReservation: () =>
    api.get<{
      data: {
        id: string;
        orderNumber: string;
        paymentMethod: "BKASH" | "NAGAD" | "SSLCOMMERZ";
        reservationExpiresAt: string | null;
      } | null;
    }>("/api/orders/active-payment-reservation"),

  create: (data: CreateOrderPayload) =>
    api.post<{ success?: boolean; data: any; paymentUrl?: string }>("/api/orders", data),

  track: (orderNumber: string, phone: string) =>
    api.get<{ data: any }>(
      `/api/orders/track?orderNumber=${encodeURIComponent(orderNumber)}&phone=${encodeURIComponent(phone)}`
    ),

  getPaymentStatus: (orderId: string) =>
    api.get<{
      data: {
        id: string;
        orderNumber: string;
        status: string;
        paymentStatus: string;
        paymentMethod: string;
        reservationStatus: string;
      };
    }>(`/api/orders/${encodeURIComponent(orderId)}/payment-status`),
};

export const cartApi = {
  get: () => api.get<PersistedCartResponse>("/api/cart"),
  replace: (items: OrderItemPayload[]) =>
    api.put<PersistedCartResponse>("/api/cart", { items }),
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
    // The order is the source of truth. These optional fields preserve
    // compatibility with older callers but are not needed for a safe retry.
    amount?: number;
    customerName?: string;
    customerPhone?: string;
    customerEmail?: string;
    address?: string;
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
  book: (data: CreateServiceBookingPayload) =>
    api.post<{ data: any; message: string }>("/api/services/book", data),
};

export const marketplaceCatalogApi = {
  skills: () =>
    api.get<{ data: MarketplaceSkill[] }>("/api/marketplace/skills"),
  serviceZones: () =>
    api.get<{ data: MarketplaceServiceZone[] }>("/api/marketplace/service-zones"),
};

export const marketplaceRequestsApi = {
  list: () =>
    api.get<{ data: MarketplaceCustomerRequest[] }>("/api/marketplace/requests"),
  get: (id: string) =>
    api.get<{ data: MarketplaceCustomerRequest }>(
      `/api/marketplace/requests/${encodeURIComponent(id)}`
    ),
  create: (data: CreateMarketplaceRequestPayload) =>
    api.post<{ data: MarketplaceCustomerRequest; idempotent?: boolean }>(
      "/api/marketplace/requests",
      data
    ),
  update: (id: string, data: Omit<CreateMarketplaceRequestPayload, "idempotencyKey">) =>
    api.put<{ data: MarketplaceCustomerRequest }>(
      `/api/marketplace/requests/${encodeURIComponent(id)}`,
      data
    ),
  submit: (id: string) =>
    api.post<{ data: MarketplaceCustomerRequest }>(
      `/api/marketplace/requests/${encodeURIComponent(id)}/submit`
    ),
  cancel: (id: string, reason: string) =>
    api.post<{ data: MarketplaceCustomerRequest }>(
      `/api/marketplace/requests/${encodeURIComponent(id)}/cancel`,
      { reason }
    ),
};

export const marketplaceJobsApi = {
  list: () =>
    api.get<{ data: MarketplaceCustomerJob[] }>("/api/marketplace/jobs"),
  get: (id: string) =>
    api.get<{ data: MarketplaceCustomerJob }>(
      `/api/marketplace/jobs/${encodeURIComponent(id)}`
    ),
  createArrivalOtp: (id: string) =>
    api.post<{ data: MarketplaceArrivalOtp }>(
      `/api/marketplace/jobs/${encodeURIComponent(id)}/arrival-otp`
    ),
  decideQuote: (id: string, decision: "APPROVE" | "REJECT", note?: string) =>
    api.post<{ data: MarketplaceCustomerJob }>(
      `/api/marketplace/jobs/${encodeURIComponent(id)}/quote-decision`,
      { decision, note: note || null }
    ),
  confirmCompletion: (id: string) =>
    api.post<{ data: MarketplaceCustomerJob }>(
      `/api/marketplace/jobs/${encodeURIComponent(id)}/confirm-completion`
    ),
};

export const marketplacePaymentsApi = {
  initiate: (
    jobId: string,
    paymentMethod: "sslcommerz" | "bkash" | "nagad",
    idempotencyKey: string
  ) =>
    api.post<{ data: MarketplacePaymentInitiation }>(
      "/api/marketplace/payments/initiate",
      { jobId, paymentMethod, idempotencyKey }
    ),
};

export const marketplaceNotificationsApi = {
  list: (params?: { page?: number; limit?: number; unreadOnly?: boolean }) => {
    const query = new URLSearchParams();
    if (params?.page) query.set("page", String(params.page));
    if (params?.limit) query.set("limit", String(params.limit));
    if (params?.unreadOnly !== undefined) query.set("unreadOnly", String(params.unreadOnly));
    const qs = query.toString();
    return api.get<MarketplaceNotificationListResponse>(
      `/api/marketplace/notifications${qs ? `?${qs}` : ""}`
    );
  },
  markRead: (id: string) =>
    api.put<{ data: MarketplaceNotification }>(
      `/api/marketplace/notifications/${encodeURIComponent(id)}/read`
    ),
  markAllRead: () =>
    api.put<{ data: { updatedCount: number } }>(
      "/api/marketplace/notifications/read-all"
    ),
};

export const marketplaceProviderProfileApi = {
  dashboard: () =>
    api.get<{ data: MarketplaceProviderDashboard }>("/api/marketplace/provider/dashboard"),
  profile: () =>
    api.get<{ data: MarketplaceProviderProfile }>("/api/marketplace/provider/profile"),
  create: (data: { displayName: string; displayNameBn?: string; bio?: string; yearsExperience: number; emergencyAvailable: boolean }) =>
    api.post<{ data: MarketplaceProviderProfile }>("/api/marketplace/provider/profile", data),
  update: (data: { displayName: string; displayNameBn?: string; bio?: string; yearsExperience: number; emergencyAvailable: boolean }) =>
    api.put<{ data: MarketplaceProviderProfile }>("/api/marketplace/provider/profile", data),
  replaceSkills: (skills: Array<{ skillId: string; yearsExperience: number; proficiency?: string }>) =>
    api.put<{ data: MarketplaceProviderProfile["skills"] }>("/api/marketplace/provider/skills", { skills }),
  replaceZones: (zones: Array<{ serviceZoneId: string; travelRadiusKm: number; emergencyAvailable: boolean }>) =>
    api.put<{ data: MarketplaceProviderProfile["serviceZones"] }>("/api/marketplace/provider/service-zones", { zones }),
  replaceAvailability: (availability: Array<{ dayOfWeek: number; startTime: string; endTime: string }>) =>
    api.put<{ data: MarketplaceProviderProfile["availability"] }>("/api/marketplace/provider/availability", { availability }),
  uploadDocument: (type: ProviderDocumentType, file: Blob) =>
    apiFetchBinary<{ data: MarketplaceProviderDocument }>(
      `/api/marketplace/provider/documents/${encodeURIComponent(type)}/file`,
      file,
    ),
  submit: () =>
    api.post<{ data: MarketplaceProviderProfile }>("/api/marketplace/provider/submit"),
  documentUrl: (documentId: string) =>
    resolveApiUrl(`/api/marketplace/provider/documents/${encodeURIComponent(documentId)}/file`),
};

export const marketplacePublicProvidersApi = {
  get: (id: string) =>
    api.get<{ data: MarketplacePublicProvider }>(`/api/marketplace/providers/${encodeURIComponent(id)}`),
};

export const marketplaceAdminProvidersApi = {
  summary: () =>
    api.get<{ data: MarketplaceAdminProviderSummary }>("/api/admin/marketplace/providers/summary"),
  list: (params?: { page?: number; limit?: number; status?: ProviderStatus; search?: string }) => {
    const query = new URLSearchParams();
    if (params?.page) query.set("page", String(params.page));
    if (params?.limit) query.set("limit", String(params.limit));
    if (params?.status) query.set("status", params.status);
    if (params?.search) query.set("search", params.search);
    const qs = query.toString();
    return api.get<{ data: { data: MarketplaceAdminProviderListItem[]; total: number; page: number; limit: number; totalPages: number } }>(
      `/api/admin/marketplace/providers${qs ? `?${qs}` : ""}`,
    );
  },
  get: (id: string) => api.get<{ data: MarketplaceAdminProviderDetail }>(
    `/api/admin/marketplace/providers/${encodeURIComponent(id)}`,
  ),
  startReview: (id: string) => api.post<{ data: MarketplaceAdminProviderDetail }>(
    `/api/admin/marketplace/providers/${encodeURIComponent(id)}/start-review`,
  ),
  reviewDocument: (providerId: string, documentId: string, status: "APPROVED" | "REJECTED", reason?: string) =>
    api.put<{ data: MarketplaceProviderDocument }>(
      `/api/admin/marketplace/providers/${encodeURIComponent(providerId)}/documents/${encodeURIComponent(documentId)}/review`,
      { status, reason },
    ),
  reviewSkill: (providerId: string, providerSkillId: string, isVerified: boolean) =>
    api.put<{ data: MarketplaceProviderProfile["skills"][number] }>(
      `/api/admin/marketplace/providers/${encodeURIComponent(providerId)}/skills/${encodeURIComponent(providerSkillId)}/review`,
      { isVerified },
    ),
  decide: (id: string, status: "VERIFIED" | "REJECTED", reason?: string) =>
    api.post<{ data: MarketplaceAdminProviderDetail }>(
      `/api/admin/marketplace/providers/${encodeURIComponent(id)}/decision`,
      { status, reason },
    ),
  suspend: (id: string, reason: string) => api.post<{ data: MarketplaceAdminProviderDetail }>(
    `/api/admin/marketplace/providers/${encodeURIComponent(id)}/suspend`, { reason },
  ),
  recover: (id: string, status: "UNDER_REVIEW" | "VERIFIED", note?: string) =>
    api.post<{ data: MarketplaceAdminProviderDetail }>(
      `/api/admin/marketplace/providers/${encodeURIComponent(id)}/recover`, { status, note },
    ),
  documentUrl: (providerId: string, documentId: string) =>
    resolveApiUrl(`/api/admin/marketplace/providers/${encodeURIComponent(providerId)}/documents/${encodeURIComponent(documentId)}/file`),
};

