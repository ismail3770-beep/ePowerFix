// Common Zod schemas shared across API routes
// Mirrors apps/web/src/lib/api-handler.ts schemas

import { z } from 'zod'

export const schemas = {
  // Auth
  login: z.object({
    email: z.string().email(),
    password: z.string().min(1),
  }),
  register: z.object({
    name: z.string().min(2),
    nameBn: z.string().optional(),
    email: z.string().email(),
    phone: z.string().min(6),
    password: z.string().min(6),
  }),
  changePassword: z.object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(8),
  }),

  // Contact / Newsletter / Quote
  contact: z.object({
    name: z.string().min(1).max(100),
    email: z.string().email(),
    phone: z.string().optional(),
    subject: z.string().min(1).max(200),
    message: z.string().min(1).max(5000),
  }),
  newsletter: z.object({
    email: z.string().email(),
  }),
  quoteRequest: z.object({
    name: z.string().min(1),
    phone: z.string().min(6),
    email: z.string().email().optional().or(z.literal('')),
    serviceType: z.string().min(1),
    description: z.string().min(1),
    address: z.string().optional(),
    budget: z.string().optional(),
  }),

  // Service booking
  serviceBooking: z.object({
    serviceId: z.string().min(1),
    customerName: z.string().max(200).optional(),
    customerEmail: z.string().email().optional().or(z.literal('')),
    bookingDate: z.string().min(1).refine(
      (d) => !isNaN(Date.parse(d)) && new Date(d) >= new Date(new Date().toDateString()),
      { message: 'Booking date must be a valid present/future date' }
    ),
    bookingTime: z.string().min(1),
    address: z.string().min(1),
    phone: z.string().min(6),
    notes: z.string().optional(),
  }),

  // Review
  review: z.object({
    productId: z.string().optional(),
    serviceId: z.string().optional(),
    rating: z.number().int().min(1).max(5),
    title: z.string().min(1).max(200),
    comment: z.string().min(1).max(5000),
  }),

  // Pagination query params helper
  pagination: z.object({
    page: z.string().optional().default('1').transform(Number),
    limit: z.string().optional().default('20').transform(Number),
    search: z.string().optional().default(''),
  }),

  // ID param
  idParam: z.object({
    id: z.string().min(1),
  }),
}

export { z }
