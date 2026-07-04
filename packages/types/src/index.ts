// ============================================================
// @epowerfix/types — Framework-agnostic shared TypeScript types
// ============================================================

// ======================== ENUMS =============================

export enum UserRole {
  CUSTOMER = 'CUSTOMER',
  ADMIN = 'ADMIN',
}

export enum OrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  PROCESSING = 'PROCESSING',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
  RETURNED = 'RETURNED',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
  PARTIAL_REFUND = 'PARTIAL_REFUND',
}

export enum ServiceBookingStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum PaymentMethod {
  COD = 'COD',
  BKASH = 'BKASH',
  NAGAD = 'NAGAD',
  SSLCOMMERZ = 'SSLCOMMERZ',
  BANK_TRANSFER = 'BANK_TRANSFER',
}

export enum CouponType {
  PERCENTAGE = 'PERCENTAGE',
  FIXED = 'FIXED',
}

export enum QuoteRequestStatus {
  PENDING = 'PENDING',
  REPLIED = 'REPLIED',
  CLOSED = 'CLOSED',
}

export enum ContactMessageType {
  GENERAL = 'GENERAL',
  B2B = 'B2B',
  COMPLAINT = 'COMPLAINT',
  FEEDBACK = 'FEEDBACK',
}

export enum ProjectCategory {
  ELECTRICAL = 'ELECTRICAL',
  SOLAR = 'SOLAR',
  AUTOMATION = 'AUTOMATION',
  IOT = 'IOT',
}

export enum PriceUnit {
  FIXED = 'FIXED',
  PER_SQFT = 'PER_SQFT',
  PER_POINT = 'PER_POINT',
  PER_WATT = 'PER_WATT',
}

// ===================== MODEL INTERFACES =====================

// --------------- User & Auth ---------------

export interface IUser {
  id: string
  name: string
  email: string
  phone: string
  password: string
  role: UserRole
  avatar: string
  address: string
  area: string
  city: string
  isActive: boolean
  emailVerified: boolean
  createdAt: Date
  updatedAt: Date
}

export interface AuthUser {
  id: string
  name: string
  email: string
  phone: string
  role: UserRole
  avatar: string
  address: string
  area: string
  city: string
  isActive: boolean
  emailVerified: boolean
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  name: string
  email: string
  phone: string
  password: string
}

// --------------- Brand ---------------

export interface IBrand {
  id: string
  name: string
  slug: string
  logo: string
  description: string
  country: string
  sortOrder: number
  active: boolean
  createdAt: Date
  updatedAt: Date
}

// --------------- Product Category ---------------

export interface IProductCategory {
  id: string
  name: string
  nameBn: string
  slug: string
  image: string
  sortOrder: number
  active: boolean
  createdAt: Date
  updatedAt: Date
}

// --------------- Product ---------------

export interface IProduct {
  id: string
  name: string
  nameBn: string
  slug: string
  description: string
  descriptionBn: string
  categoryId: string
  brandId: string | null
  price: number
  comparePrice: number | null
  sku: string
  image: string
  images: string[]
  stock: number
  sold: number
  rating: number
  reviewCount: number
  specifications: Record<string, string>
  featured: boolean
  active: boolean
  deletedAt: Date | null
  createdAt: Date
  updatedAt: Date
}

// --------------- Service Category ---------------

export interface IServiceCategory {
  id: string
  name: string
  nameBn: string
  icon: string
  sortOrder: number
  active: boolean
  createdAt: Date
  updatedAt: Date
}

// --------------- Service ---------------

export interface IService {
  id: string
  name: string
  nameBn: string
  slug: string
  description: string
  descriptionBn: string
  categoryId: string
  basePrice: number
  priceUnit: string
  priceLabel: string
  duration: string
  image: string
  features: string[]
  popular: boolean
  active: boolean
  deletedAt: Date | null
  createdAt: Date
  updatedAt: Date
}

// --------------- Service Booking ---------------

export interface IServiceBooking {
  id: string
  serviceId: string
  userId: string | null
  customerName: string
  customerPhone: string
  customerEmail: string | null
  address: string
  area: string
  preferredDate: string | null
  preferredTime: string | null
  description: string
  status: ServiceBookingStatus
  totalPrice: number
  createdAt: Date
  updatedAt: Date
}

// --------------- Cart ---------------

export interface ICartItem {
  id: string
  userId: string | null
  sessionId: string
  productId: string
  quantity: number
  createdAt: Date
  updatedAt: Date
}

// --------------- Order ---------------

export interface IOrder {
  id: string
  orderNumber: string
  userId: string | null
  couponId: string | null
  customerName: string
  customerPhone: string
  customerEmail: string | null
  address: string
  area: string
  notes: string
  subtotal: number
  deliveryFee: number
  discount: number
  totalAmount: number
  status: OrderStatus
  paymentMethod: string
  paymentStatus: PaymentStatus
  paymentRef: string | null
  createdAt: Date
  updatedAt: Date
}

export interface IOrderItem {
  id: string
  orderId: string
  productId: string
  productName: string
  price: number
  quantity: number
  createdAt: Date
}

// --------------- Wishlist ---------------

export interface IWishlist {
  id: string
  userId: string
  productId: string
  createdAt: Date
}

// --------------- Review ---------------

export interface IReview {
  id: string
  userId: string
  productId: string
  rating: number
  title: string
  comment: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

// --------------- Coupon ---------------

export interface ICoupon {
  id: string
  code: string
  type: CouponType
  value: number
  minOrder: number
  maxDiscount: number | null
  usageLimit: number | null
  usedCount: number
  startDate: Date
  endDate: Date
  active: boolean
  createdAt: Date
  updatedAt: Date
}

// --------------- Blog ---------------

export interface IBlogPost {
  id: string
  title: string
  titleBn: string
  slug: string
  excerpt: string
  content: string
  coverImage: string
  author: string
  authorId: string | null
  tags: string[]
  published: boolean
  views: number
  deletedAt: Date | null
  createdAt: Date
  updatedAt: Date
}

// --------------- Project ---------------

export interface IProject {
  id: string
  title: string
  titleBn: string
  slug: string
  description: string
  descriptionBn: string
  category: string
  techStack: string[]
  image: string
  images: string[]
  price: number | null
  githubUrl: string | null
  liveUrl: string | null
  features: string[]
  featured: boolean
  active: boolean
  deletedAt: Date | null
  createdAt: Date
  updatedAt: Date
}

// --------------- Contact ---------------

export interface IContactMessage {
  id: string
  name: string
  email: string
  phone: string
  subject: string
  message: string
  type: string
  isRead: boolean
  createdAt: Date
}

// --------------- Quote Request ---------------

export interface IQuoteRequest {
  id: string
  userId: string | null
  name: string
  email: string
  phone: string
  company: string
  subject: string
  description: string
  fileUrl: string
  status: string
  reply: string
  createdAt: Date
  updatedAt: Date
}

// --------------- Newsletter ---------------

export interface INewsletter {
  id: string
  email: string
  isActive: boolean
  createdAt: Date
}

// --------------- Audit Log ---------------

export interface IAuditLog {
  id: string
  userId: string
  action: string
  resource: string
  resourceId: string
  details: string
  ipAddress: string
  createdAt: Date
}

// ===================== API UTILITY TYPES =====================

export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
  error?: string
}

export interface PaginatedResponse<T> {
  success: boolean
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  message?: string
}

export interface PaginationParams {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

// ===================== PAYMENT TYPES ========================

export interface PaymentConfig {
  storeId: string
  storePassword: string
  isSandbox: boolean
}

export interface PaymentRequest {
  orderId: string
  amount: number
  customerName: string
  customerEmail: string
  customerPhone: string
  address: string
  method: PaymentMethod
}

export interface PaymentResponse {
  success: boolean
  paymentUrl?: string
  transactionId?: string
  error?: string
}