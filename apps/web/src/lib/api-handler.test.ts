import { describe, it, expect, vi } from 'vitest'
import { z } from 'zod'
import { validateBody, schemas } from '@/lib/api-handler'

describe('API Handler Schemas', () => {
  describe('login schema', () => {
    it('accepts valid email + password', () => {
      const result = schemas.login.safeParse({
        email: 'user@example.com',
        password: 'secret123',
      })
      expect(result.success).toBe(true)
    })

    it('rejects invalid email', () => {
      const result = schemas.login.safeParse({
        email: 'not-an-email',
        password: 'secret123',
      })
      expect(result.success).toBe(false)
    })

    it('rejects empty password', () => {
      const result = schemas.login.safeParse({
        email: 'user@example.com',
        password: '',
      })
      expect(result.success).toBe(false)
    })
  })

  describe('register schema', () => {
    it('accepts valid registration data', () => {
      const result = schemas.register.safeParse({
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+8801712345678',
        password: 'password123',
      })
      expect(result.success).toBe(true)
    })

    it('rejects name shorter than 2 chars', () => {
      const result = schemas.register.safeParse({
        name: 'J',
        email: 'john@example.com',
        phone: '+8801712345678',
        password: 'password123',
      })
      expect(result.success).toBe(false)
    })

    it('rejects password shorter than 6 chars', () => {
      const result = schemas.register.safeParse({
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+8801712345678',
        password: '12345',
      })
      expect(result.success).toBe(false)
    })
  })

  describe('contact schema', () => {
    it('accepts valid contact form', () => {
      const result = schemas.contact.safeParse({
        name: 'Jane Doe',
        email: 'jane@example.com',
        subject: 'Product inquiry',
        message: 'I need help with a product.',
      })
      expect(result.success).toBe(true)
    })

    it('rejects message exceeding 5000 chars', () => {
      const result = schemas.contact.safeParse({
        name: 'Jane Doe',
        email: 'jane@example.com',
        subject: 'Product inquiry',
        message: 'x'.repeat(5001),
      })
      expect(result.success).toBe(false)
    })
  })

  describe('newsletter schema', () => {
    it('accepts valid email', () => {
      const result = schemas.newsletter.safeParse({
        email: 'test@example.com',
      })
      expect(result.success).toBe(true)
    })

    it('rejects invalid email', () => {
      const result = schemas.newsletter.safeParse({
        email: 'not-an-email',
      })
      expect(result.success).toBe(false)
    })
  })

  describe('quoteRequest schema', () => {
    it('accepts valid quote request', () => {
      const result = schemas.quoteRequest.safeParse({
        name: 'John Doe',
        phone: '+8801712345678',
        email: 'john@example.com',
        serviceType: 'Electrical Wiring',
        description: 'Need wiring for new house',
        address: 'Dhaka, Bangladesh',
        budget: '50000-100000',
      })
      expect(result.success).toBe(true)
    })

    it('allows optional email', () => {
      const result = schemas.quoteRequest.safeParse({
        name: 'John Doe',
        phone: '+8801712345678',
        serviceType: 'Electrical Wiring',
        description: 'Need wiring for new house',
      })
      expect(result.success).toBe(true)
    })
  })

  describe('serviceBooking schema', () => {
    it('accepts valid service booking', () => {
      const result = schemas.serviceBooking.safeParse({
        serviceId: 'svc-123',
        bookingDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        bookingTime: '10:00',
        address: '123 Main St, Dhaka',
        phone: '+8801712345678',
      })
      expect(result.success).toBe(true)
    })

    it('rejects past date', () => {
      const pastDate = new Date(Date.now() - 86400000).toISOString().split('T')[0]
      const result = schemas.serviceBooking.safeParse({
        serviceId: 'svc-123',
        bookingDate: pastDate,
        bookingTime: '10:00',
        address: '123 Main St, Dhaka',
        phone: '+8801712345678',
      })
      expect(result.success).toBe(false)
    })
  })

  describe('review schema', () => {
    it('accepts valid 5-star review', () => {
      const result = schemas.review.safeParse({
        productId: 'prod-1',
        rating: 5,
        title: 'Excellent!',
        comment: 'Best product ever.',
      })
      expect(result.success).toBe(true)
    })

    it('rejects rating of 0', () => {
      const result = schemas.review.safeParse({
        productId: 'prod-1',
        rating: 0,
        title: 'Bad',
        comment: 'Terrible.',
      })
      expect(result.success).toBe(false)
    })

    it('rejects rating of 6', () => {
      const result = schemas.review.safeParse({
        productId: 'prod-1',
        rating: 6,
        title: 'Too good',
        comment: 'Unreal.',
      })
      expect(result.success).toBe(false)
    })
  })

  describe('changePassword schema', () => {
    it('accepts valid password change', () => {
      const result = schemas.changePassword.safeParse({
        currentPassword: 'oldpass123',
        newPassword: 'newpass123456',
      })
      expect(result.success).toBe(true)
    })

    it('rejects new password shorter than 8 chars', () => {
      const result = schemas.changePassword.safeParse({
        currentPassword: 'oldpass123',
        newPassword: 'short',
      })
      expect(result.success).toBe(false)
    })
  })

  describe('pagination schema', () => {
    it('uses defaults when not provided', () => {
      const result = schemas.pagination.safeParse({})
      expect(result.success).toBe(true)
      if (!result.success) throw new Error("Expected valid pagination data")
      expect(result.data.page).toBe(1)
      expect(result.data.limit).toBe(20)
      expect(result.data.search).toBe('')
    })

    it('transforms string numbers to integers', () => {
      const result = schemas.pagination.safeParse({
        page: '2',
        limit: '50',
        search: 'cable',
      })
      expect(result.success).toBe(true)
      if (!result.success) throw new Error("Expected valid pagination data")
      expect(result.data.page).toBe(2)
      expect(result.data.limit).toBe(50)
      expect(result.data.search).toBe('cable')
    })
  })
})

describe('validateBody', () => {
  it('parses and validates JSON body', async () => {
    const schema = z.object({ name: z.string().min(2) })
    const mockRequest = {
      json: vi.fn().mockResolvedValue({ name: 'John' }),
    } as any

    const result = await validateBody(mockRequest, schema)
    expect(result).toEqual({ name: 'John' })
  })

  it('throws ZodError for invalid JSON', async () => {
    const schema = z.object({ name: z.string().min(2) })
    const mockRequest = {
      json: vi.fn().mockRejectedValue(new Error('Invalid JSON')),
    } as any

    await expect(validateBody(mockRequest, schema)).rejects.toThrow()
  })

  it('throws ZodError for invalid body', async () => {
    const schema = z.object({ name: z.string().min(2) })
    const mockRequest = {
      json: vi.fn().mockResolvedValue({ name: 'J' }),
    } as any

    await expect(validateBody(mockRequest, schema)).rejects.toThrow()
  })
})