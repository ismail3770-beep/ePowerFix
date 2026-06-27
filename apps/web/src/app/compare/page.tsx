'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { X, ShoppingCart, Star } from 'lucide-react'
import Link from 'next/link'
import { useCartStore } from '@/store'
import { toast } from 'sonner'

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

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>

  if (error) return (
    <div className="text-center py-16">
      <p className="text-red-500 text-lg mb-4">{error}</p>
      <button onClick={() => window.location.reload()} className="text-blue-500 hover:underline">Try Again</button>
    </div>
  )

  if (ids.length < 2) return (
    <div className="max-w-4xl mx-auto py-16 text-center">
      <h1 className="text-2xl font-bold mb-4">Product Comparison</h1>
      <p className="text-gray-500">Select at least 2 products to compare. Use the "Add to Compare" button on product pages.</p>
      <Link href="/"><Button className="mt-4">Browse Products</Button></Link>
    </div>
  )

  const rows = [
    { label: 'Image', render: (p: Product) => <img src={p.images?.[0] || '/placeholder.png'} alt={p.name} className="h-32 w-32 object-contain mx-auto" /> },
    { label: 'Name', render: (p: Product) => <Link href={`/product/${p.id}`} className="font-medium hover:text-primary">{p.name}</Link> },
    { label: 'Price', render: (p: Product) => <div><span className="text-xl font-bold">৳{p.salePrice || p.price}</span>{p.salePrice && p.salePrice < p.price && <span className="ml-2 text-gray-400 line-through">৳{p.price}</span>}</div> },
    { label: 'Rating', render: (p: Product) => <div className="flex items-center gap-1 justify-center"><Star className="w-4 h-4 fill-yellow-400 text-yellow-400" /><span>{p.averageRating || 0}</span><span className="text-gray-400">({p._count?.reviews || 0})</span></div> },
    { label: 'Stock', render: (p: Product) => <Badge variant={p.stock > 0 ? 'default' : 'destructive'}>{p.stock > 0 ? `In Stock (${p.stock})` : 'Out of Stock'}</Badge> },
    { label: 'Category', render: (p: Product) => p.category?.name || '-' },
    { label: 'Brand', render: (p: Product) => p.brand?.name || '-' },
    { label: '', render: (p: Product) => (
      <div className="flex gap-2 justify-center">
        <Button size="sm" onClick={() => removeProduct(p.id)} variant="outline"><X className="w-4 h-4" /> Remove</Button>
        <Button size="sm" onClick={() => {
              const { addItem } = useCartStore.getState()
              products.forEach((p) =>
                addItem({ productId: p.id, name: p.name, price: p.salePrice || p.price, image: p.images?.[0] || '/placeholder.png', quantity: 1 })
              )
              toast.success('Added to cart')
            }}><ShoppingCart className="w-4 h-4 mr-1" /> Cart</Button>
      </div>
    )},
  ]

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Product Comparison</h1>
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="p-4 text-left w-40 bg-gray-50 dark:bg-gray-800" />
                {products.map((p) => (
                  <th key={p.id} className="p-4 text-center bg-gray-50 dark:bg-gray-800 min-w-[200px]">
                    <Button size="sm" variant="ghost" className="float-right" onClick={() => removeProduct(p.id)}><X className="w-4 h-4" /></Button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} className="border-t">
                  <td className="p-4 font-medium text-gray-500 bg-gray-50 dark:bg-gray-800">{row.label}</td>
                  {products.map((p) => (
                    <td key={p.id} className="p-4 text-center">{row.render(p)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}
