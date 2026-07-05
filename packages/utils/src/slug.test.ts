import { describe, it, expect } from 'vitest'
import { generateSlug } from './slug'

describe('generateSlug()', () => {
  it('converts to lowercase', () => {
    expect(generateSlug('Hello World')).toBe('hello-world')
  })

  it('removes special characters', () => {
    expect(generateSlug('Hello! @World #2024')).toBe('hello-world-2024')
  })

  it('handles Bengali text', () => {
    const slug = generateSlug('ইলেকট্রিক্যাল সার্ভিস')
    expect(slug).toBeTruthy()
    expect(slug).not.toContain(' ')
  })

  it('collapses multiple hyphens', () => {
    expect(generateSlug('a---b---c')).toBe('a-b-c')
  })

  it('trims leading/trailing hyphens', () => {
    expect(generateSlug('--hello--')).toBe('hello')
  })
})