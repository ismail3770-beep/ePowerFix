'use client'

import { useEffect, useState, useCallback } from 'react'
import { apiFetch } from '@/lib/api'
import { Trash2, Heart, ShoppingCart, ChevronRight, X, AlertCircle, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { useCartStore } from '@/store'
import Header from '@/components/epf/Header'
import Footer from '@/components/epf/Footer'
import CartDrawer from '@/components/epf/CartDrawer'
import CheckoutDialog from '@/components/epf/CheckoutDialog'
import ChatWidget from '@/components/epf/ChatWidget'
import BackToTopButton from '@/components/epf/BackToTopButton'
import {
  PremiumCard,
  PremiumCardSkeleton,
  type PremiumCardData,
} from '@/components/epf/PremiumCard'

interface WishlistItem {
  id: string
  productId: string
  product: {
    id: string
    name: string
    price: number
    salePrice?: number | null
    stock: number
    images: string[]
    category?: { name: string } | null
  }
}

export default function WishlistPage() {
  const [items, setItems] = useState<WishlistItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [clearing, setClearing] = useState(false)

  const load = useCallback(async () => {
    setError(null)
    try {
      const res = await apiFetch<{ data: WishlistItem[] }>('/api/wishlist')
      setItems(res.data || [])
    } catch (err) {
      console.error(err)
      setError('Failed to load wishlist.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const handleRemove = useCallback(async (id: string) => {
    try {
      await apiFetch(`/api/wishlist/${id}`, { method: 'DELETE' })
      setItems((prev) => prev.filter((item) => item.id !== id))
      toast.success('Removed from wishlist')
    } catch (err) {
      console.error(err)
      toast.error('Failed to remove item from wishlist')
    }
  }, [])

  const handleClearAll = useCallback(async () => {
    if (items.length === 0) { return }
    setClearing(true)
    try {
      await Promise.all(
        items.map((item) =>
          apiFetch(`/api/wishlist/${item.id}`, { method: 'DELETE' })
        )
      )
      setItems([])
      toast.success('Wishlist cleared')
    } catch (err) {
      console.error(err)
      toast.error('Failed to clear wishlist')
    } finally {
      setClearing(false)
    }
  }, [items])

  const handleMoveToCart = useCallback(
    async (item: WishlistItem) => {
      try {
        const { addItem } = useCartStore.getState()
        await addItem({
          productId: item.product.id,
          productName: item.product.name,
          price: item.product.salePrice || item.product.price,
          productImage: item.product.images?.[0] || '',
          quantity: 1,
        })
        await apiFetch(`/api/wishlist/${item.id}`, { method: 'DELETE' })
        setItems((prev) => prev.filter((i) => i.id !== item.id))
        toast.success('Moved to cart', { description: item.product.name })
      } catch (err) {
        console.error(err)
        toast.error('Failed to move item to cart')
      }
    },
    []
  )

  /* ---- Loading skeleton ---- */
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header />
        <CartDrawer />
        <CheckoutDialog />
        <main className="flex-1">
          <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-2" />
            <div className="h-4 w-32 bg-gray-200 rounded animate-pulse mb-8" />
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <PremiumCardSkeleton key={i} />
              ))}
            </div>
          </div>
        </main>
        <div className="mt-auto"><Footer /></div>
        <ChatWidget />
        <BackToTopButton />
      </div>
    )
  }

  /* ---- Error state ---- */
  if (error) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header />
        <CartDrawer />
        <CheckoutDialog />
        <main className="flex-1 flex items-center justify-center px-4 py-16">
          <div className="text-center max-w-md">
            <div className="h-16 w-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="h-8 w-8 text-red-400" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-2">Something went wrong</h2>
            <p className="text-sm text-gray-500 mb-6">{error}</p>
            <button onClick={load} className="h-11 px-6 bg-[#0EA5E9] hover:bg-sky-600 text-white rounded font-bold text-sm uppercase tracking-wider">
              Try Again
            </button>
          </div>
        </main>
        <div className="mt-auto"><Footer /></div>
        <ChatWidget />
        <BackToTopButton />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <CartDrawer />
      <CheckoutDialog />

      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-6">
            <Link href="/" className="hover:text-[#0EA5E9]">Home</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-gray-700 font-semibold">Wishlist</span>
          </div>

          {/* Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <h1 className="font-black text-3xl uppercase tracking-tight text-gray-900">
              My Wishlist{' '}
              <span className="text-gray-400 text-xl font-normal">({items.length})</span>
            </h1>
            {items.length > 0 && (
              <button
                onClick={handleClearAll}
                disabled={clearing}
                className="inline-flex items-center gap-1.5 border border-gray-300 rounded px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-red-50 hover:border-red-300 hover:text-red-600 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
                {clearing ? 'Clearing…' : 'Clear All'}
              </button>
            )}
          </div>

          {items.length === 0 ? (
            /* Empty State */
            <div className="text-center py-20">
              <Heart className="mx-auto h-16 w-16 text-gray-300 mb-5" />
              <h2 className="font-black text-3xl uppercase tracking-tight text-gray-900 mb-3">Your Wishlist is Empty</h2>
              <p className="text-gray-500 text-sm mb-8">Save items you love by clicking the heart icon on any product.</p>
              <Link href="/shop" className="inline-flex items-center gap-2 bg-[#0EA5E9] text-white font-bold px-8 py-3 rounded hover:bg-sky-600 transition-colors uppercase tracking-wider">
                Discover Products <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ) : (
            /* Wishlist Grid */
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {items.map((item) => {
                const cardData: PremiumCardData = {
                  id: item.product.id,
                  name: item.product.name,
                  price: item.product.price,
                  salePrice: item.product.salePrice ?? null,
                  images: item.product.images || [],
                  image: item.product.images?.[0] || undefined,
                  stock: item.product.stock,
                  category: item.product.category?.name || null,
                }

                return (
                  <div key={item.id} className="relative group/wish">
                    <PremiumCard
                      data={cardData}
                      onAddToCart={() => handleMoveToCart(item)}
                      onCardClick={() => {}}
                    />
                    <button
                      onClick={() => handleRemove(item.id)}
                      className="absolute top-2 right-2 z-20 h-8 w-8 flex items-center justify-center rounded-full bg-white border border-gray-200 text-gray-500 hover:bg-red-500 hover:text-white hover:border-red-500 shadow-sm transition-colors"
                      title="Remove from wishlist"
                      aria-label="Remove from wishlist"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>

      <div className="mt-auto"><Footer /></div>
      <ChatWidget />
      <BackToTopButton />
    </div>
  )
}
