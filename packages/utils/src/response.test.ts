import { describe, it, expect } from 'vitest'
import { success, error, safeError, serverError } from './response'

describe('success()', () => {
  it('returns success response with data', () => {
    const result = success({ id: 1 })
    expect(result).toEqual({ success: true, data: { id: 1 }, message: 'OK' })
  })

  it('includes custom message', () => {
    const result = success(null, 'Created')
    expect(result.message).toBe('Created')
  })
})

describe('error()', () => {
  it('returns error response with default status 400', () => {
    const result = error('Bad request')
    expect(result).toEqual({ success: false, error: 'Bad request', statusCode: 400 })
  })

  it('accepts custom status code', () => {
    const result = error('Not found', 404)
    expect(result.statusCode).toBe(404)
  })

  it('masks 500 errors in production', () => {
    const original = process.env.NODE_ENV
    process.env.NODE_ENV = 'production'
    const result = error('Database connection failed', 500)
    expect(result.error).toBe('Internal server error')
    process.env.NODE_ENV = original
  })

  it('passes through client errors in production', () => {
    const original = process.env.NODE_ENV
    process.env.NODE_ENV = 'production'
    const result = error('Validation failed', 400)
    expect(result.error).toBe('Validation failed')
    process.env.NODE_ENV = original
  })
})

describe('safeError()', () => {
  it('masks 500 errors in production', () => {
    const original = process.env.NODE_ENV
    process.env.NODE_ENV = 'production'
    const result = safeError(new Error('db crash'), 'Failed to load', 500)
    expect(result.error).toBe('Failed to load')
    process.env.NODE_ENV = original
  })

  it('passes through 400 errors', () => {
    const result = safeError(null, 'Invalid input', 400)
    expect(result.error).toBe('Invalid input')
  })
})