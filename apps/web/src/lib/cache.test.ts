import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { cache, cacheKeys } from '@/lib/cache'

describe('Cache Layer', () => {
  beforeEach(async () => {
    await cache.flush()
  })

  describe('cacheKeys', () => {
    it('generates settings key', () => {
      expect(cacheKeys.settings()).toBe('settings:default')
    })

    it('generates categories key', () => {
      expect(cacheKeys.categories()).toBe('product-categories:all')
    })

    it('generates brands key', () => {
      expect(cacheKeys.brands()).toBe('brands:all')
    })

    it('generates products key with pagination', () => {
      expect(cacheKeys.products(1, 20, 'cable')).toBe('products:list:p1:l20:cable')
    })

    it('generates products key without search', () => {
      expect(cacheKeys.products(2, 10)).toBe('products:list:p2:l10:none')
    })

    it('generates single product key', () => {
      expect(cacheKeys.product('abc-123')).toBe('products:single:abc-123')
    })

    it('generates banners key with type', () => {
      expect(cacheKeys.banners('hero')).toBe('banners:hero')
    })

    it('generates banners key without type', () => {
      expect(cacheKeys.banners()).toBe('banners:all')
    })
  })

  describe('getOrSet (in-memory fallback)', () => {
    it('stores and retrieves a value', async () => {
      await cache.flush()
      const result = await cache.getOrSet('test:key', 60, async () => {
        return { hello: 'world' }
      })
      expect(result).toEqual({ hello: 'world' })

      // Second call should return cached value (fetcher not called again)
      const cached = await cache.getOrSet('test:key', 60, async () => {
        return { hello: 'different' }
      })
      expect(cached).toEqual({ hello: 'world' })
    })

    it('returns null for non-existent key', async () => {
      await cache.flush()
      const result = await cache.get('non-existent')
      expect(result).toBeNull()
    })
  })

  describe('del', () => {
    it('deletes a key', async () => {
      await cache.set('test:del', { data: 'value' }, 60)
      await cache.del('test:del')
      const result = await cache.get('test:del')
      expect(result).toBeNull()
    })
  })

  describe('invalidatePattern', () => {
    it('invalidates keys matching pattern', async () => {
      await cache.set('products:list:p1', [1], 60)
      await cache.set('products:list:p2', [2], 60)
      await cache.set('products:single:abc', { id: 'abc' }, 60)
      await cache.set('settings:default', { name: 'test' }, 60)

      await cache.invalidatePattern('products:*')

      expect(await cache.get('products:list:p1')).toBeNull()
      expect(await cache.get('products:list:p2')).toBeNull()
      expect(await cache.get('products:single:abc')).toBeNull()
      // Non-matching key should still exist
      expect(await cache.get('settings:default')).toEqual({ name: 'test' })
    })
  })
})