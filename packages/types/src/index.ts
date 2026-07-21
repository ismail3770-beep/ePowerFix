// @epowerfix/types — Shared TypeScript types
// Types are migrated here incrementally for API, web, and mobile reuse.

export type * from "./marketplace";

export type ID = string;

export type ISODateString = string;

export interface BaseEntity {
  id: ID;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// User types. USER and STAFF remain for backward compatibility with older clients.
export type UserRole = "CUSTOMER" | "USER" | "STAFF" | "ELECTRICIAN" | "ADMIN";

export interface User extends BaseEntity {
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  isActive: boolean;
}

// Product types (will be expanded)
export interface Product extends BaseEntity {
  name: string;
  slug: string;
  description: string;
  price: number;
  sku: string;
  stock: number;
  isActive: boolean;
  isFeatured: boolean;
}

// Order types (will be expanded)
export type OrderStatus = "PENDING" | "CONFIRMED" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED" | "RETURNED";

export interface Order extends BaseEntity {
  orderNumber: string;
  status: OrderStatus;
  total: number;
  userId: ID;
}
