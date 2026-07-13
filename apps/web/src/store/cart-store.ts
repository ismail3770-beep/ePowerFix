import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type CartItemType = 'PRODUCT' | 'SERVICE' | 'PROJECT'

export interface CartItem {
  id: string
  // Discriminates the purchasable entity. Absent on carts persisted before
  // multi-type support — treat missing as 'PRODUCT'.
  itemType?: CartItemType
  // Identity slot: holds the product/service/project id depending on itemType.
  productId: string
  variantId?: string
  productName: string
  productImage: string
  price: number
  quantity: number
}

/**
 * Map a client cart line to the polymorphic order/cart API payload.
 * The `productId` slot holds the entity id; route it by itemType.
 */
export function toOrderItemPayload(item: CartItem) {
  const itemType = item.itemType ?? 'PRODUCT'
  if (itemType === 'SERVICE') {return { itemType, serviceId: item.productId, quantity: item.quantity }}
  if (itemType === 'PROJECT') {return { itemType, projectId: item.productId, quantity: item.quantity }}
  return {
    itemType,
    productId: item.productId,
    ...(item.variantId ? { variantId: item.variantId } : {}),
    quantity: item.quantity,
  }
}

interface CartState {
  items: CartItem[]
  setItems: (items: CartItem[]) => void
  addItem: (item: Omit<CartItem, 'id'>) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  getTotal: () => number
  getItemCount: () => number
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      setItems: (items) => set({ items }),
      addItem: (item) => {
        const { items } = get()
        const existing = items.find((i) => i.productId === item.productId)
        if (existing) {
          set({
            items: items.map((i) =>
              i.productId === item.productId
                ? { ...i, quantity: i.quantity + item.quantity }
                : i
            ),
          })
        } else {
          set({ items: [...items, { ...item, id: (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36)) }] })
        }
      },
      removeItem: (productId) => {
        set({ items: get().items.filter((i) => i.productId !== productId) })
      },
      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId)
          return
        }
        set({
          items: get().items.map((i) =>
            i.productId === productId ? { ...i, quantity } : i
          ),
        })
      },
      clearCart: () => set({ items: [] }),
      getTotal: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
      getItemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
    }),
    { name: 'epowerfix-cart' }
  )
)
