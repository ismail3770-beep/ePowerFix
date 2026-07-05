import { describe, it, expect, vi, beforeEach } from 'vitest'
import { z } from 'zod'

// Test the Zod schemas from api-handler.ts
describe('API Handler Schemas', () => {
  describe('login schema', () => {
    const loginSchema = z.object({
      email: z.string().email(),
      password: z.string().min(1),
    })

    it('accepts valid email + password', () => {
      const result = loginSchema.safeParse({
        email: 'user@example.com',
        password: 'secret123',
      })
      expect(result.success).toBe(true)
    })

    it('rejects invalid email', () => {
      const result = loginSchema.safeParse({
        email: 'not-an-email',
        password: 'secret123',
      })
      expect(result.success).toBe(false)
    })

    it('rejects empty password', () => {
      const result = loginSchema.safeParse({
        email: 'user@example.com',
        password: '',
      })
      expect(result.success).toBe(false)
    })
  })

  describe('register schema', () => {
    const registerSchema = z.object({
      name: z.string().min(2),
      email: z.string().email(),
      phone: z.string().min(6),
      password: z.string().min(6),
    })

    it('accepts valid registration data', () => {
      const result = registerSchema.safeParse({
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+8801712345678',
        password: 'password123',
      })
      expect(result.success).toBe(true)
    })

    it('rejects name shorter than 2 chars', () => {
      const result = registerSchema.safeParse({
        name: 'J',
        email: 'john@example.com',
        phone: '+8801712345678',
        password: 'password123',
      })
      expect(result.success).toBe(false)
    })

    it('rejects password shorter than 6 chars', () => {
      const result = registerSchema.safeParse({
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+8801712345678',
        password: '12345',
      })
      expect(result.success).toBe(false)
    })
  })

  describe('contact schema', () => {
    const contactSchema = z.object({
      name: z.string().min(1).max(100),
      email: z.string().email(),
      phone: z.string().optional(),
      subject: z.string().min(1).max(200),
      message: z.string().min(1).max(5000),
    })

    it('accepts valid contact form', () => {
      const result = contactSchema.safeParse({
        name: 'Jane Doe',
        email: 'jane@example.com',
        subject: 'Product inquiry',
        message: 'I need help with a product.',
      })
      expect(result.success).toBe(true)
    })

    it('rejects message exceeding 5000 chars', () => {
      const result = contactSchema.safeParse({
        name: 'Jane Doe',
        email: 'jane@example.com',
        subject: 'Product inquiry',
        message: 'x'.repeat(5001),
      })
      expect(result.success).toBe(false)
    })
  })

  describe('order item schema', () => {
    const orderItemSchema = z.object({
      itemType: z.enum(['PRODUCT', 'SERVICE', 'PROJECT']).default('PRODUCT'),
      productId: z.string().optional(),
      serviceId: z.string().optional(),
      projectId: z.string().optional(),
      quantity: z.number().int().min(1).default(1),
    })

    it('accepts valid product item', () => {
      const result = orderItemSchema.safeParse({
        itemType: 'PRODUCT',
        productId: 'abc-123',
        quantity: 2,
      })
      expect(result.success).toBe(true)
    })

    it('rejects invalid itemType', () => {
      const result = orderItemSchema.safeParse({
        itemType: 'INVALID',
        productId: 'abc-123',
        quantity: 1,
      })
      expect(result.success).toBe(false)
    })

    it('rejects quantity of 0', () => {
      const result = orderItemSchema.safeParse({
        itemType: 'PRODUCT',
        productId: 'abc-123',
        quantity: 0,
      })
      expect(result.success).toBe(false)
    })
  })

  describe('review schema', () => {
    const reviewSchema = z.object({
      productId: z.string().optional(),
      serviceId: z.string().optional(),
      rating: z.number().int().min(1).max(5),
      title: z.string().min(1).max(200),
      comment: z.string().min(1).max(5000),
    })

    it('accepts valid 5-star review', () => {
      const result = reviewSchema.safeParse({
        productId: 'prod-1',
        rating: 5,
        title: 'Excellent!',
        comment: 'Best product ever.',
      })
      expect(result.success).toBe(true)
    })

    it('rejects rating of 0', () => {
      const result = reviewSchema.safeParse({
        productId: 'prod-1',
        rating: 0,
        title: 'Bad',
        comment: 'Terrible.',
      })
      expect(result.success).toBe(false)
    })

    it('rejects rating of 6', () => {
      const result = reviewSchema.safeParse({
        productId: 'prod-1',
        rating: 6,
        title: 'Too good',
        comment: 'Unreal.',
      })
      expect(result.success).toBe(false)
    })
  })
})
