'use client'

import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Trash2, ShoppingCart, Heart } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { useCartStore } from '@/store'

interface WishlistItem {
  id: string
  productId: string
  product: {
    id: string
    name: string
    price: number
    salePrice?: number
    stock: number
    images: string[]
    category?: { name: string }
  }
}

export default function WishlistPage() {
  const [items, setItems] = useState<WishlistItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    setError(null)
    try {
      const res = await apiFetch<{ data: WishlistItem[] }>('/api/wishlist')
      setItems(res.data || [])
    } catch (err) {
      console.error(err)
      setError('Failed to load wishlist.')
    }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const handleRemove = async (productId: string) => {
    try {
      await apiFetch(`/api/wishlist/${productId}`, { method: 'DELETE' })
      setItems((prev) => prev.filter((item) => item.productId !== productId))
    } catch (err) {
      console.error(err)
      toast.error('Failed to remove item from wishlist')
    }
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>

  if (error) return (
    <div className="text-center py-16">
      <p className="text-red-500 text-lg mb-4">{error}</p>
      <button onClick={load} className="text-blue-500 hover:underline">Try Again</button>
    </div>
  )

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <div className="flex items-center gap-3 mb-6">
        <Heart className="w-8 h-8 text-red-500" />
        <h1 className="text-3xl font-bold">My Wishlist</h1>
        <Badge variant="secondary">{items.length} items</Badge>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-16">
          <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-medium mb-2">Your wishlist is empty</h2>
          <p className="text-gray-500 mb-4">Save items you love for later</p>
          <Link href="/"><Button>Browse Products</Button></Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => (
            <Card key={item.id} className="overflow-hidden">
              <div className="aspect-square bg-gray-100 dark:bg-gray-800 relative">
                <img src={item.product.images?.[0] || '/placeholder.png'} alt={item.product.name} className="w-full h-full object-contain p-4" />
                <Button size="sm" variant="destructive" className="absolute top-2 right-2" onClick={() => handleRemove(item.productId)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
              <CardContent className="p-4">
                <Link href={`/product/${item.product.id}`} className="font-medium hover:text-primary line-clamp-2">{item.product.name}</Link>
                <p className="text-sm text-gray-500">{item.product.category?.name}</p>
                <div className="flex items-center justify-between mt-3">
                  <div>
                    <span className="text-lg font-bold">৳{item.product.salePrice || item.product.price}</span>
                    {item.product.salePrice && item.product.salePrice < item.product.price && (
                      <span className="ml-2 text-sm text-gray-400 line-through">৳{item.product.price}</span>
                    )}
                  </div>
                  <Button size="sm" onClick={() => {
                    const { addItem } = useCartStore.getState()
                    addItem({ productId: item.product.id, name: item.product.name, price: item.product.salePrice || item.product.price, image: item.product.images?.[0] || '/placeholder.png', quantity: 1 })
                    toast.success('Added to cart')
                  }}><ShoppingCart className="w-4 h-4 mr-1" />Cart</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
