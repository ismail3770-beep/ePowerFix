'use client'

import { useEffect, useState, useCallback } from 'react'
import { apiFetch } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Trash2, Heart, ShoppingCart, ChevronRight, Home, X, AlertCircle } from 'lucide-react'
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
    if (items.length === 0) return
    setClearing(true)
    try {
      // Remove all wishlist items in parallel
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

        // Now remove from wishlist
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
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Header />
        <CartDrawer />
        <CheckoutDialog />
        <main className="flex-1">
          <div className="mx-auto max-w-[1400px] px-4 sm:px-8 lg:px-12 py-8">
            <div className="h-8 w-48 bg-slate-200 rounded animate-pulse mb-2" />
            <div className="h-4 w-32 bg-slate-200 rounded animate-pulse mb-8" />
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
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Header />
        <CartDrawer />
        <CheckoutDialog />
        <main className="flex-1 flex items-center justify-center px-4 py-16">
          <div className="text-center max-w-md">
            <div className="h-16 w-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="h-8 w-8 text-red-400" />
            </div>
            <h2 className="text-[18px] font-bold text-slate-900 mb-2">
              Something went wrong
            </h2>
            <p className="text-[14px] text-slate-500 mb-6">{error}</p>
            <Button
              onClick={load}
              className="h-11 px-6 bg-epf-500 hover:bg-epf-600 text-white rounded-lg font-semibold"
            >
              Try Again
            </Button>
          </div>
        </main>
        <div className="mt-auto"><Footer /></div>
        <ChatWidget />
        <BackToTopButton />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />
      <CartDrawer />
      <CheckoutDialog />

      <main className="flex-1">
        {/* Breadcrumb */}
        <div className="bg-white border-b border-slate-200">
          <div className="mx-auto max-w-[1400px] px-4 sm:px-8 lg:px-12">
            <nav className="flex items-center gap-1.5 h-11 text-[13px]">
              <a
                href="/"
                className="flex items-center gap-1 text-slate-500 hover:text-epf-600 transition-colors"
              >
                <Home className="h-3.5 w-3.5" />
                <span>Home</span>
              </a>
              <ChevronRight className="h-3 w-3 text-slate-300" />
              <span className="text-slate-900 font-medium">Wishlist</span>
            </nav>
          </div>
        </div>

        <div className="mx-auto max-w-[1400px] px-4 sm:px-8 lg:px-12 py-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-red-50 flex items-center justify-center">
                <Heart className="h-6 w-6 text-red-500 fill-red-500" />
              </div>
              <div>
                <h1 className="text-[24px] font-bold text-slate-900 tracking-tight">
                  My Wishlist
                </h1>
                <p className="text-[13px] text-slate-500 mt-0.5">
                  {items.length} {items.length === 1 ? 'item' : 'items'} saved for later
                </p>
              </div>
            </div>
            {items.length > 0 && (
              <Button
                onClick={handleClearAll}
                disabled={clearing}
                variant="outline"
                className="h-10 px-4 border-slate-200 text-slate-700 hover:bg-red-50 hover:border-red-200 hover:text-red-600 rounded-lg font-semibold"
              >
                <Trash2 className="h-4 w-4 mr-1.5" />
                {clearing ? 'Clearing…' : 'Clear All'}
              </Button>
            )}
          </div>

          {items.length === 0 ? (
            /* Empty State */
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm">
              <div className="flex flex-col items-center justify-center py-20 px-4">
                <div className="h-20 w-20 rounded-full bg-red-50 flex items-center justify-center mb-5">
                  <Heart className="h-10 w-10 text-red-300" />
                </div>
                <h3 className="text-[18px] font-bold text-slate-900 mb-2">
                  Your wishlist is empty
                </h3>
                <p className="text-[14px] text-slate-500 mb-6 text-center max-w-md">
                  Save items you love by clicking the heart icon on any product.
                  They&apos;ll appear here so you can easily find them later.
                </p>
                <Link href="/shop">
                  <Button className="h-11 px-6 bg-epf-500 hover:bg-epf-600 text-white text-[14px] font-semibold rounded-lg shadow-sm">
                    <ShoppingCart className="h-4 w-4 mr-1.5" />
                    Browse Products
                  </Button>
                </Link>
              </div>
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
                      onCardClick={() => {
                        // Open product page (let anchor handle default)
                      }}
                    />
                    {/* Remove button overlay (covers WishlistButton at top-right) */}
                    <button
                      onClick={() => handleRemove(item.id)}
                      className="absolute top-2 right-2 z-20 h-8 w-8 flex items-center justify-center rounded-full bg-white border border-slate-200 text-slate-500 hover:bg-red-500 hover:text-white hover:border-red-500 shadow-sm transition-colors"
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
