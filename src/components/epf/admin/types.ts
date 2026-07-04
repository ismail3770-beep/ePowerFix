// ============================================================
// Shared types for the Admin panel.
// Extracted from AdminPanel.tsx — used by the main component,
// all section components, and the shared helpers module.
// ============================================================

export interface AdminStats {
  totalServices: number;
  totalProducts: number;
  totalProjects: number;
  totalBookings: number;
  pendingBookings: number;
  totalOrders: number;
  pendingOrders: number;
  totalMessages: number;
  unreadMessages: number;
  totalUsers: number;
  totalReviews: number;
  totalRevenue: number;
  pendingReturns: number;
  totalReturns: number;
}

export interface BookingItem {
  id: string;
  service: { name: string; nameBn: string; category: { name: string } };
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  address: string;
  area: string;
  preferredDate: string;
  preferredTime: string;
  description: string;
  status: string;
  totalPrice: number;
  createdAt: string;
}

export interface OrderItem {
  id: string;
  productName: string;
  quantity: number;
  price: number;
}

export interface ShipmentHistoryItem {
  status: string;
  note: string | null;
  location: string | null;
  createdAt: string;
}

export interface Shipment {
  id: string;
  orderId: string;
  trackingNumber: string | null;
  carrier: string | null;
  status: string;
  estimatedDelivery: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  notes: string | null;
  histories: ShipmentHistoryItem[];
}

export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  address: string;
  area: string;
  notes: string;
  subtotal: number;
  deliveryFee: number;
  discount: number;
  totalAmount: number;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  items: OrderItem[];
  createdAt: string;
  shipment?: Shipment | null;
}

export interface Message {
  id: string;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

export interface ServiceItem {
  id: string;
  name: string;
  nameBn: string;
  slug: string;
  description: string;
  descriptionBn: string;
  categoryId: string;
  category: { id: string; name: string } | null;
  basePrice: number;
  priceUnit: string;
  priceLabel: string;
  duration: string;
  image: string;
  features: string;
  popular: boolean;
  active: boolean;
  createdAt: string;
}

export interface ProductItem {
  id: string;
  name: string;
  nameBn: string;
  slug: string;
  description: string;
  descriptionBn: string;
  categoryId: string;
  category: { id: string; name: string } | null;
  brandId: string | null;
  brand: { id: string; name: string } | null;
  price: number;
  comparePrice: number | null;
  sku: string;
  image: string;
  images: string;
  stock: number;
  sold: number;
  rating: number;
  reviewCount: number;
  specifications: string;
  featured: boolean;
  active: boolean;
  createdAt: string;
}

export interface CategoryItem {
  id: string;
  name: string;
  nameBn: string;
  slug: string;
  image: string;
  sortOrder: number;
  active: boolean;
  _count?: { products: number };
  createdAt: string;
}

export interface UserItem {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

export interface BrandItem {
  id: string;
  name: string;
  slug: string;
  logo: string;
  country: string;
  description: string;
  sortOrder: number;
  active: boolean;
  createdAt: string;
}

export interface ReviewItem {
  id: string;
  rating: number;
  title: string;
  comment: string;
  isActive: boolean;
  createdAt: string;
  user: { id: string; name: string; email: string };
  product: { id: string; name: string; image: string };
}

export interface CouponItem {
  id: string;
  code: string;
  type: string;
  value: number;
  minOrder: number;
  maxDiscount: number | null;
  usageLimit: number | null;
  usedCount: number;
  startDate: string;
  endDate: string;
  active: boolean;
  createdAt: string;
}

export interface BlogPostItem {
  id: string;
  title: string;
  titleBn: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: string;
  author: string;
  tags: string;
  published: boolean;
  views: number;
  createdAt: string;
}

export interface QuoteRequestItem {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  subject: string;
  description: string;
  fileUrl: string;
  status: string;
  reply: string;
  createdAt: string;
  user: { id: string; name: string; email: string } | null;
}

export interface NewsletterItem {
  id: string;
  email: string;
  isActive: boolean;
  createdAt: string;
}

export interface ServiceCategoryItem {
  id: string;
  name: string;
  nameBn: string;
  icon: string;
  sortOrder: number;
  active: boolean;
  createdAt: string;
}

export interface ReturnRequestItem {
  id: string;
  orderId: string;
  userId: string;
  reason: string;
  status: string; // PENDING, APPROVED, REJECTED, COMPLETED
  refundAmount: number | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  order: {
    id: string;
    orderNumber: string;
    status: string;
    total: number;
    paymentStatus: string;
  };
  user: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
}

// ==================== Mutation prop types ====================
// TanStack's UseMutationResult is invariant in TVariables, so the section
// components must declare the *exact* variables shape that each mutation
// is called with — otherwise passing a concrete mutation (e.g. one keyed
// on { id, status }) into a prop typed as UseMutationResult<unknown,...>
// fails to type-check. These aliases mirror the mutationFn signatures in
// AdminPanel.tsx so call-site and prop types line up exactly.
import type { UseMutationResult } from "@tanstack/react-query";

/** Generic mutation keyed on a single string id (delete/toggle-by-id). */
export type StringMutation = UseMutationResult<any, Error, string, unknown>;
/** Booking status update: { id, status }. */
export type BookingStatusMutation = UseMutationResult<any, Error, { id: string; status: string }, unknown>;
/** Order update: { id, status?, paymentStatus? }. */
export type OrderUpdateMutation = UseMutationResult<any, Error, { id: string; status?: string; paymentStatus?: string }, unknown>;
/** User active toggle: { id, isActive }. */
export type UserToggleMutation = UseMutationResult<any, Error, { id: string; isActive: boolean }, unknown>;
/** Return request status update: { id, status, refundAmount?, notes? }. */
export type ReturnUpdateMutation = UseMutationResult<any, Error, { id: string; status: string; refundAmount?: number; notes?: string }, unknown>;

// ==================== Tab config ====================
export type TabKey =
  | "dashboard"
  | "products"
  | "categories"
  | "services"
  | "orders"
  | "bookings"
  | "returns"
  | "users"
  | "brands"
  | "reviews"
  | "coupons"
  | "blog"
  | "messages"
  | "quote-requests"
  | "newsletter";
