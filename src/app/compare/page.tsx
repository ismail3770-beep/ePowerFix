'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { X, ShoppingCart, Star, Home, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { useCartStore } from '@/store'
import { toast } from 'sonner'
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
  price: number
  salePrice?: number
  stock: number
  averageRating: number
  _count: { reviews: number }
  category?: { name: string }
  brand?: { name: string }
  images: string[]
}

export default function ComparePage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const ids = searchParams.get('ids')?.split(',').filter(Boolean) || []
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (ids.length < 2) { setLoading(false); return }
    setError(null)
    apiFetch<{ data: Product[] }>(`/api/products/compare?ids=${ids.join(',')}`)
      .then((res) => setProducts(res.data || []))
      .catch(() => setError('Failed to load comparison items.'))
      .finally(() => setLoading(false))
  }, [ids.join(',')])

  const removeProduct = (id: string) => {
    const newIds = ids.filter((i) => i !== id)
    router.push(`/compare?ids=${newIds.join(',')}`)
  }

  if (loading) return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      <CartDrawer />
      <CheckoutDialog />
      <main className="flex-1 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </main>
      <Footer />
      <ChatWidget />
      <BackToTopButton />
    </div>
  )

  if (error) return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      <CartDrawer />
      <CheckoutDialog />
      <main className="flex-1 flex items-center justify-center text-center py-16">
        <div>
          <p className="text-red-500 text-lg mb-4">{error}</p>
          <button onClick={() => window.location.reload()} className="text-blue-500 hover:underline">Try Again</button>
        </div>
      </main>
      <Footer />
      <ChatWidget />
      <BackToTopButton />
    </div>
  )

  if (ids.length < 2) return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      <CartDrawer />
      <CheckoutDialog />
      <main className="flex-1 mx-auto max-w-[1400px] w-full px-4 sm:px-12 py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">Product Comparison</h1>
        <p className="text-slate-500">Select at least 2 products to compare. Use the "Add to Compare" button on product pages.</p>
        <Link href="/"><Button className="mt-4">Browse Products</Button></Link>
      </main>
      <div className="mt-auto"><Footer /></div>
      <ChatWidget />
      <BackToTopButton />
    </div>
  )

  const rows = [
    { label: 'Image', render: (p: Product) => <img src={p.images?.[0] || ''} alt={p.name} className="h-32 w-32 object-contain mx-auto" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} /> },
    { label: 'Name', render: (p: Product) => <Link href={`/product/${p.id}`} className="font-medium hover:text-primary">{p.name}</Link> },
    { label: 'Price', render: (p: Product) => <div><span className="text-xl font-bold">৳{p.salePrice || p.price}</span>{p.salePrice && p.salePrice < p.price && <span className="ml-2 text-slate-400 line-through">৳{p.price}</span>}</div> },
    { label: 'Rating', render: (p: Product) => <div className="flex items-center gap-1 justify-center"><Star className="w-4 h-4 fill-yellow-400 text-yellow-400" /><span>{p.averageRating || 0}</span><span className="text-slate-400">({p._count?.reviews || 0})</span></div> },
    { label: 'Stock', render: (p: Product) => <Badge variant={p.stock > 0 ? 'default' : 'destructive'}>{p.stock > 0 ? `In Stock (${p.stock})` : 'Out of Stock'}</Badge> },
    { label: 'Category', render: (p: Product) => p.category?.name || '-' },
    { label: 'Brand', render: (p: Product) => p.brand?.name || '-' },
    { label: '', render: (p: Product) => (
      <div className="flex gap-2 justify-center">
        <Button size="sm" onClick={() => removeProduct(p.id)} variant="outline"><X className="w-4 h-4" /> Remove</Button>
        <Button size="sm" onClick={() => {
              const { addItem } = useCartStore.getState()
              addItem({ productId: p.id, productName: p.name, price: p.salePrice || p.price, productImage: p.images?.[0] || '', quantity: 1 })
              toast.success('Added to cart')
            }}><ShoppingCart className="w-4 h-4 mr-1" /> Cart</Button>
      </div>
    )},
  ]

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />
      <CartDrawer />
      <CheckoutDialog />
      <main className="flex-1 mx-auto w-full max-w-[1400px] px-4 sm:px-12 py-8">
        <nav className="flex items-center gap-1.5 mb-6 text-[13px]">
          <a href="/" className="flex items-center gap-1 text-slate-500 hover:text-slate-900"><Home className="h-3.5 w-3.5" />Home</a>
          <ChevronRight className="h-3 w-3 text-slate-300" />
          <span className="text-slate-900 font-medium">Compare Products</span>
        </nav>
        <h1 className="text-3xl font-bold mb-6 text-slate-900">Product Comparison</h1>
        <Card>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="p-4 text-left w-40 bg-slate-50" />
                  {products.map((p) => (
                    <th key={p.id} className="p-4 text-center bg-slate-50 min-w-[200px]">
                      <Button size="sm" variant="ghost" className="float-right" onClick={() => removeProduct(p.id)}><X className="w-4 h-4" /></Button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={i} className="border-t">
                    <td className="p-4 font-medium text-slate-500 bg-slate-50">{row.label}</td>
                    {products.map((p) => (
                      <td key={p.id} className="p-4 text-center">{row.render(p)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </main>
      <div className="mt-auto"><Footer /></div>
      <ChatWidget />
      <BackToTopButton />
    </div>
  )
}
