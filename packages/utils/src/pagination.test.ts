import { describe, it, expect } from 'vitest'
import { getPagination } from './pagination'

describe('getPagination()', () => {
  it('defaults to page 1, limit 20', () => {
    const result = getPagination({})
    expect(result).toEqual({ page: 1, limit: 20, skip: 0, take: 20 })
  })

  it('calculates skip correctly for page 3', () => {
    const result = getPagination({ page: 3, limit: 10 })
    expect(result).toEqual({ page: 3, limit: 10, skip: 20, take: 10 })
  })

  it('caps limit at 100', () => {
    const result = getPagination({ limit: 999 })
    expect(result.limit).toBe(100)
  })

  it('enforces minimum page 1', () => {
    const result = getPagination({ page: -5 })
    expect(result.page).toBe(1)
  })

  it('enforces minimum limit 1', () => {
    const result = getPagination({ limit: 0 })
    expect(result.limit).toBe(1)
  })
})