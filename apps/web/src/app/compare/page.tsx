'use client'

import { useEffect, useState, useMemo } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/api'
import { Button } from '@/components/ui/button'
import {
  X,
  ShoppingCart,
  Star,
  Home,
  ChevronRight,
  GitCompare,
  AlertCircle,
  Package,
  Check,
  Minus,
  Loader2,
} from 'lucide-react'
import Link from 'next/link'
import { useCartStore } from '@/store'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import Header from '@/components/epf/Header'
import Footer from '@/components/epf/Footer'
import CartDrawer from '@/components/epf/CartDrawer'
import CheckoutDialog from '@/components/epf/CheckoutDialog'
import ChatWidget from '@/components/epf/ChatWidget'
import BackToTopButton from '@/components/epf/BackToTopButton'

interface Product {
  id: string
  name: string
  description?: string
  shortDesc?: string
  price: number
  salePrice?: number | null
  stock: number
  sku?: string
  rating?: number
  averageRating?: number
  _count?: { reviews: number }
  reviews?: number
  category?: { name: string } | null
  brand?: { name: string } | null
  images: string[]
  specifications?: Record<string, string | number | boolean | null> | null
  isFeatured?: boolean
  isBestDeal?: boolean
}

export default function ComparePage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const ids = searchParams.get('ids')?.split(',').filter(Boolean) || []
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (ids.length < 2) {
      setLoading(false)
      return
    }
    setError(null)
    apiFetch<{ data: Product[] }>(`/api/products/compare?ids=${ids.join(',')}`)
      .then((res) => setProducts(res.data || []))
      .catch(() => setError('Failed to load comparison items.'))
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids.join(',')])

  const removeProduct = (id: string) => {
    const newIds = ids.filter((i) => i !== id)
    if (newIds.length < 2) {
      // If only one product remains, clear the comparison
      router.push('/compare')
    } else {
      router.push(`/compare?ids=${newIds.join(',')}`)
    }
  }

  const handleAddToCart = (p: Product) => {
    const { addItem } = useCartStore.getState()
    addItem({
      productId: p.id,
      productName: p.name,
      price: p.salePrice || p.price,
      productImage: p.images?.[0] || '',
      quantity: 1,
    })
    toast.success('Added to cart', { description: p.name })
  }

  /* ---- Collect specification keys across all products ---- */
  const specKeys = useMemo(() => {
    const keys = new Set<string>()
    products.forEach((p) => {
      if (p.specifications && typeof p.specifications === 'object') {
        Object.keys(p.specifications).forEach((k) => keys.add(k))
      }
    })
    return Array.from(keys)
  }, [products])

  /* ---- Loading state ---- */
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Header />
        <CartDrawer />
        <CheckoutDialog />
        <main className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 text-epf-500 animate-spin" />
            <p className="text-[14px] text-slate-500">Loading comparison…</p>
          </div>
        </main>
        <Footer />
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
              onClick={() => window.location.reload()}
              className="h-11 px-6 bg-epf-500 hover:bg-epf-600 text-white rounded-lg font-semibold"
            >
              Try Again
            </Button>
          </div>
        </main>
        <Footer />
        <ChatWidget />
        <BackToTopButton />
      </div>
    )
  }

  /* ---- Empty state (less than 2 products) ---- */
  if (ids.length < 2) {
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
                <span className="text-slate-900 font-medium">Compare</span>
              </nav>
            </div>
          </div>

          <div className="mx-auto max-w-[1400px] px-4 sm:px-8 lg:px-12 py-16">
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm">
              <div className="flex flex-col items-center justify-center py-20 px-4">
                <div className="h-20 w-20 rounded-full bg-epf-50 flex items-center justify-center mb-5">
                  <GitCompare className="h-10 w-10 text-epf-500" />
                </div>
                <h3 className="text-[18px] font-bold text-slate-900 mb-2">
                  No products to compare
                </h3>
                <p className="text-[14px] text-slate-500 mb-6 text-center max-w-md">
                  Add at least 2 products to compare their features side by side.
                  Use the compare button on product pages to add items here.
                </p>
                <Link href="/shop">
                  <Button className="h-11 px-6 bg-epf-500 hover:bg-epf-600 text-white text-[14px] font-semibold rounded-lg shadow-sm">
                    <ShoppingCart className="h-4 w-4 mr-1.5" />
                    Add Products to Compare
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </main>
        <div className="mt-auto"><Footer /></div>
        <ChatWidget />
        <BackToTopButton />
      </div>
    )
  }

  /* ---- Helper render functions ---- */
  const renderImage = (p: Product) => {
    const src = p.images?.[0]
    return (
      <div className="flex items-center justify-center">
        <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-xl bg-slate-50 flex items-center justify-center overflow-hidden">
          {src ? (
            <img
              src={src}
              alt={p.name}
              className="w-full h-full object-contain p-3"
              onError={(e) => {
                ;(e.target as HTMLImageElement).style.display = 'none'
              }}
            />
          ) : (
            <Package className="w-12 h-12 text-slate-300" />
          )}
        </div>
      </div>
    )
  }

  const renderRating = (p: Product) => {
    const rating = p.averageRating ?? p.rating ?? 0
    const reviewCount = p._count?.reviews ?? p.reviews ?? 0
    const fullStars = Math.round(rating)
    return (
      <div className="flex flex-col items-center gap-1">
        <div className="flex items-center gap-0.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={cn(
                'h-4 w-4',
                i < fullStars ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
              )}
            />
          ))}
        </div>
        <span className="text-[12px] text-slate-500">
          {rating.toFixed(1)} ({reviewCount} reviews)
        </span>
      </div>
    )
  }

  const renderPrice = (p: Product) => {
    const displayPrice = p.salePrice ?? p.price
    const hasDiscount = p.salePrice && p.salePrice < p.price
    return (
      <div className="flex flex-col items-center gap-1">
        <span className="text-[18px] font-bold text-epf-600">
          ৳{Number(displayPrice).toLocaleString()}
        </span>
        {hasDiscount && (
          <span className="text-[13px] text-slate-400 line-through">
            ৳{Number(p.price).toLocaleString()}
          </span>
        )}
      </div>
    )
  }

  const renderStock = (p: Product) => {
    if (p.stock > 0) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-50 text-green-700 text-[12px] font-semibold">
          <Check className="h-3 w-3" />
          In Stock ({p.stock})
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-50 text-red-600 text-[12px] font-semibold">
        <X className="h-3 w-3" />
        Out of Stock
      </span>
    )
  }

  const renderSpecValue = (value: unknown) => {
    if (value === null || value === undefined || value === '') {
      return <Minus className="h-4 w-4 text-slate-300 mx-auto" />
    }
    if (typeof value === 'boolean') {
      return value ? (
        <Check className="h-4 w-4 text-green-500 mx-auto" />
      ) : (
        <Minus className="h-4 w-4 text-slate-300 mx-auto" />
      )
    }
    return <span className="text-[13px] text-slate-700">{String(value)}</span>
  }

  /* ---- Attribute rows config ---- */
  const rows = [
    { label: 'Price', render: renderPrice },
    { label: 'Brand', render: (p: Product) => p.brand?.name || '-' },
    { label: 'Category', render: (p: Product) => p.category?.name || '-' },
    { label: 'Rating', render: renderRating },
    { label: 'Availability', render: renderStock },
    { label: 'SKU', render: (p: Product) => p.sku || '-' },
  ]

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
              <span className="text-slate-900 font-medium">Compare Products</span>
            </nav>
          </div>
        </div>

        <div className="mx-auto max-w-[1400px] px-4 sm:px-8 lg:px-12 py-8">
          {/* Header */}
          <div className="flex items-center gap-3 mb-8">
            <div className="h-12 w-12 rounded-xl bg-epf-50 flex items-center justify-center">
              <GitCompare className="h-6 w-6 text-epf-500" />
            </div>
            <div>
              <h1 className="text-[24px] font-bold text-slate-900 tracking-tight">
                Compare Products
              </h1>
              <p className="text-[13px] text-slate-500 mt-0.5">
                Comparing {products.length} {products.length === 1 ? 'product' : 'products'} side by side
              </p>
            </div>
          </div>

          {/* Comparison Table */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    {/* Sticky first column header */}
                    <th className="sticky left-0 z-20 bg-slate-50 p-4 text-left w-40 sm:w-48 border-r border-slate-200">
                      <span className="text-[12px] font-bold uppercase tracking-wider text-slate-500">
                        Products
                      </span>
                    </th>
                    {products.map((p) => (
                      <th
                        key={p.id}
                        className="p-4 align-top min-w-[220px] border-r border-slate-200 last:border-r-0"
                      >
                        <div className="flex flex-col items-center gap-3">
                          {/* Remove button */}
                          <button
                            onClick={() => removeProduct(p.id)}
                            className="self-end h-7 w-7 flex items-center justify-center rounded-full text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                            title="Remove from comparison"
                            aria-label="Remove from comparison"
                          >
                            <X className="h-4 w-4" />
                          </button>
                          {/* Image */}
                          {renderImage(p)}
                          {/* Name */}
                          <Link
                            href={`/product/${p.id}`}
                            className="text-[14px] font-semibold text-slate-900 hover:text-epf-600 transition-colors line-clamp-2 text-center min-h-[2.5rem]"
                          >
                            {p.name}
                          </Link>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => (
                    <tr
                      key={row.label}
                      className={cn(
                        'border-b border-slate-200 last:border-b-0',
                        i % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'
                      )}
                    >
                      {/* Sticky first column */}
                      <td className="sticky left-0 z-10 bg-inherit p-4 font-semibold text-[13px] text-slate-500 uppercase tracking-wider border-r border-slate-200">
                        {row.label}
                      </td>
                      {products.map((p) => (
                        <td
                          key={p.id}
                          className="p-4 text-center border-r border-slate-200 last:border-r-0"
                        >
                          <div className="flex items-center justify-center">
                            {row.render(p)}
                          </div>
                        </td>
                      ))}
                    </tr>
                  ))}

                  {/* Specification rows */}
                  {specKeys.length > 0 && (
                    <>
                      <tr className="bg-slate-100/70 border-b border-slate-200">
                        <td
                          colSpan={products.length + 1}
                          className="p-3 sticky left-0"
                        >
                          <span className="text-[12px] font-bold uppercase tracking-wider text-slate-700">
                            Specifications
                          </span>
                        </td>
                      </tr>
                      {specKeys.map((key, idx) => (
                        <tr
                          key={key}
                          className={cn(
                            'border-b border-slate-200 last:border-b-0',
                            idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'
                          )}
                        >
                          <td className="sticky left-0 z-10 bg-inherit p-4 font-medium text-[13px] text-slate-700 border-r border-slate-200">
                            {key}
                          </td>
                          {products.map((p) => (
                            <td
                              key={p.id}
                              className="p-4 text-center border-r border-slate-200 last:border-r-0"
                            >
                              <div className="flex items-center justify-center">
                                {renderSpecValue(p.specifications?.[key])}
                              </div>
                            </td>
                          ))}
                        </tr>
                      ))}
                    </>
                  )}

                  {/* Action row */}
                  <tr className="bg-white border-t-2 border-slate-200">
                    <td className="sticky left-0 z-10 bg-white p-4 border-r border-slate-200" />
                    {products.map((p) => (
                      <td
                        key={p.id}
                        className="p-4 text-center border-r border-slate-200 last:border-r-0"
                      >
                        <Button
                          onClick={() => handleAddToCart(p)}
                          disabled={p.stock <= 0}
                          className="h-10 px-4 bg-epf-500 hover:bg-epf-600 text-white text-[13px] font-semibold rounded-lg shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ShoppingCart className="h-4 w-4 mr-1.5" />
                          Add to Cart
                        </Button>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Helper text */}
          <p className="text-[12px] text-slate-500 mt-4 text-center">
            Tip: Add up to 4 products to compare their features side by side.
          </p>
        </div>
      </main>

      <div className="mt-auto"><Footer /></div>
      <ChatWidget />
      <BackToTopButton />
    </div>
  )
}
