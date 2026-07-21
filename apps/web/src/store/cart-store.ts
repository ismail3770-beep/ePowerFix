import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

export type CartItemType = 'PRODUCT' | 'SERVICE' | 'PROJECT' | 'PROJECT_KIT'

/**
 * Each purchasable domain has a dedicated identity field. productId remains
 * optional only to migrate carts persisted before Phase 0A.
 */
export interface CartItem {
  id: string
  itemType?: CartItemType
  productId?: string
  serviceId?: string
  projectId?: string
  projectKitId?: string
  variantId?: string
  variantLabel?: string
  productName: string
  productImage: string
  price: number
  quantity: number
}

export type CartItemInput = Omit<CartItem, 'id'>

export type OrderItemPayload =
  | { itemType: 'PRODUCT'; productId: string; variantId?: string; quantity: number }
  | { itemType: 'SERVICE'; serviceId: string; quantity: number }
  | { itemType: 'PROJECT'; projectId: string; quantity: number }
  | { itemType: 'PROJECT_KIT'; projectKitId: string; quantity: number }

type CartItemIdentity = Pick<
  CartItem,
  'itemType' | 'productId' | 'serviceId' | 'projectId' | 'projectKitId'
>

export function getCartItemEntityId(item: CartItemIdentity): string | undefined {
  switch (item.itemType ?? 'PRODUCT') {
    case 'SERVICE':
      return item.serviceId ?? item.productId
    case 'PROJECT':
      return item.projectId ?? item.productId
    case 'PROJECT_KIT':
      return item.projectKitId ?? item.productId
    default:
      return item.productId
  }
}

/** Migrate the previous PROJECT + productId ProjectKit convention on load. */
function normalizeCartItemInput(item: CartItemInput): CartItemInput {
  // Older persisted carts may have null or no image. Normalize those values
  // instead of discarding an otherwise valid cart line during hydration.
  const normalizedItem = {
    ...item,
    productImage: typeof item.productImage === 'string' ? item.productImage : '',
  }
  const itemType = normalizedItem.itemType ?? 'PRODUCT'

  if (itemType === 'SERVICE') {
    return {
      ...normalizedItem,
      itemType,
      productId: undefined,
      serviceId: normalizedItem.serviceId ?? normalizedItem.productId,
    }
  }

  if (itemType === 'PROJECT_KIT') {
    return {
      ...normalizedItem,
      itemType,
      productId: undefined,
      projectKitId: normalizedItem.projectKitId ?? normalizedItem.productId,
    }
  }

  if (itemType === 'PROJECT') {
    if (normalizedItem.projectId) {
      return { ...normalizedItem, itemType, productId: undefined }
    }
    return {
      ...normalizedItem,
      itemType: 'PROJECT_KIT',
      productId: undefined,
      projectKitId: normalizedItem.projectKitId ?? normalizedItem.productId,
    }
  }

  return { ...normalizedItem, itemType: 'PRODUCT' }
}

export function normalizeCartItem(item: CartItem): CartItem {
  return { ...normalizeCartItemInput(item), id: item.id }
}

export function toOrderItemPayload(item: CartItem): OrderItemPayload {
  const normalized = normalizeCartItem(item)

  if (normalized.itemType === 'SERVICE') {
    if (!normalized.serviceId) throw new Error('Cart service item is missing serviceId')
    return { itemType: 'SERVICE', serviceId: normalized.serviceId, quantity: normalized.quantity }
  }
  if (normalized.itemType === 'PROJECT') {
    if (!normalized.projectId) throw new Error('Cart project item is missing projectId')
    return { itemType: 'PROJECT', projectId: normalized.projectId, quantity: normalized.quantity }
  }
  if (normalized.itemType === 'PROJECT_KIT') {
    if (!normalized.projectKitId) throw new Error('Cart project kit item is missing projectKitId')
    return {
      itemType: 'PROJECT_KIT',
      projectKitId: normalized.projectKitId,
      quantity: normalized.quantity,
    }
  }
  if (!normalized.productId) throw new Error('Cart product item is missing productId')
  return {
    itemType: 'PRODUCT',
    productId: normalized.productId,
    ...(normalized.variantId ? { variantId: normalized.variantId } : {}),
    quantity: normalized.quantity,
  }
}

export function getCartItemKey(item: CartItem): string {
  const normalized = normalizeCartItem(item)
  const entityId = getCartItemEntityId(normalized)
  if (!entityId) throw new Error('Cart item is missing its entity identifier')
  return `${normalized.itemType ?? 'PRODUCT'}:${entityId}:${normalized.variantId ?? ''}`
}

/** Server metadata wins; max quantity makes login merge repeatable. */
export function mergeCartItems(localItems: CartItem[], serverItems: CartItem[]): CartItem[] {
  const merged = new Map<string, CartItem>()
  for (const item of normalizeCartItems(serverItems)) {
    merged.set(getCartItemKey(item), { ...item, quantity: Math.min(99, Math.max(1, item.quantity)) })
  }
  for (const item of normalizeCartItems(localItems)) {
    const key = getCartItemKey(item)
    const existing = merged.get(key)
    merged.set(key, existing
      ? { ...existing, quantity: Math.min(99, Math.max(existing.quantity, item.quantity)) }
      : { ...item, quantity: Math.min(99, Math.max(1, item.quantity)) })
  }
  return [...merged.values()]
}

export function reconcileCartItems(
  localSnapshot: CartItem[],
  currentItems: CartItem[],
  persistedItems: CartItem[],
): CartItem[] {
  const snapshot = new Map(normalizeCartItems(localSnapshot).map((item) => [getCartItemKey(item), item]))
  const current = new Map(normalizeCartItems(currentItems).map((item) => [getCartItemKey(item), item]))
  const reconciled = new Map(normalizeCartItems(persistedItems).map((item) => [getCartItemKey(item), item]))

  for (const [key, previous] of snapshot) {
    const next = current.get(key)
    if (!next) {
      reconciled.delete(key)
    } else if (next.quantity !== previous.quantity) {
      const persisted = reconciled.get(key)
      reconciled.set(key, { ...(persisted ?? next), quantity: next.quantity })
    }
  }

  for (const [key, next] of current) {
    if (snapshot.has(key)) continue
    const persisted = reconciled.get(key)
    reconciled.set(key, persisted
      ? { ...persisted, quantity: Math.max(persisted.quantity, next.quantity) }
      : next)
  }

  return [...reconciled.values()]
}

export function getCartItemsSignature(items: CartItem[]): string {
  return normalizeCartItems(items)
    .map((item) => `${getCartItemKey(item)}:${Math.min(99, Math.max(1, item.quantity))}`)
    .sort()
    .join('|')
}

interface CartState {
  items: CartItem[]
  setItems: (items: CartItem[]) => void
  addItem: (item: CartItemInput) => void
  removeItem: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
  clearCart: () => void
  getTotal: () => number
  getItemCount: () => number
}

function normalizeCartItems(items: unknown): CartItem[] {
  if (!Array.isArray(items)) return []

  return items
    .filter((item): item is CartItem => {
      if (!item || typeof item !== 'object') return false
      const candidate = item as Partial<CartItem>
      return Boolean(
        typeof candidate.id === 'string' &&
          typeof candidate.productName === 'string' &&
          (candidate.productImage === undefined ||
            candidate.productImage === null ||
            typeof candidate.productImage === 'string') &&
          typeof candidate.price === 'number' &&
          typeof candidate.quantity === 'number' &&
          getCartItemEntityId(candidate as CartItemIdentity),
      )
    })
    .map(normalizeCartItem)
    .filter((item) => Boolean(getCartItemEntityId(item)))
}

/**
 * The shared cart package previously wrote a raw item array to this key,
 * while Zustand uses a { state, version } envelope. Convert the raw shape to
 * a version-0 envelope so the normal migration path can preserve its items.
 */
function normalizeLegacyCartStorageValue(serialized: string): string {
  try {
    const parsed: unknown = JSON.parse(serialized)

    if (Array.isArray(parsed)) {
      return JSON.stringify({ state: { items: parsed }, version: 0 })
    }
    if (
      parsed &&
      typeof parsed === 'object' &&
      !Array.isArray(parsed) &&
      !('state' in parsed)
    ) {
      return JSON.stringify({ state: parsed, version: 0 })
    }
  } catch {
    // Preserve malformed values so Zustand's rehydration error handling can
    // safely discard them without treating an invalid record as a cart.
  }

  return serialized
}

const cartStorage = createJSONStorage<Pick<CartState, 'items'>>(() => ({
  getItem: (name) => {
    const serialized = window.localStorage.getItem(name)
    return serialized === null ? null : normalizeLegacyCartStorageValue(serialized)
  },
  setItem: (name, value) => window.localStorage.setItem(name, value),
  removeItem: (name) => window.localStorage.removeItem(name),
}))

function migratePersistedCartState(persistedState: unknown): Pick<CartState, 'items'> {
  const items = Array.isArray(persistedState)
    ? persistedState
    : persistedState && typeof persistedState === 'object'
      ? (persistedState as { items?: unknown }).items
      : undefined

  return { items: normalizeCartItems(items) }
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      setItems: (items) => set({ items: normalizeCartItems(items) }),
      addItem: (item) => {
        const normalizedItem = normalizeCartItemInput(item)
        const entityId = getCartItemEntityId(normalizedItem)
        if (!entityId) throw new Error('Cart item is missing its entity identifier')

        const { items } = get()
        const itemType = normalizedItem.itemType ?? 'PRODUCT'
        const existing = items.find(
          (current) =>
            (current.itemType ?? 'PRODUCT') === itemType &&
            getCartItemEntityId(current) === entityId &&
            current.variantId === normalizedItem.variantId,
        )

        if (existing) {
          set({
            items: items.map((current) =>
              current.id === existing.id
                ? { ...current, quantity: current.quantity + Math.max(1, normalizedItem.quantity) }
                : current,
            ),
          })
          return
        }

        set({
          items: [
            ...items,
            {
              ...normalizedItem,
              id:
                typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
                  ? crypto.randomUUID()
                  : Math.random().toString(36).slice(2) + Date.now().toString(36),
              quantity: Math.max(1, normalizedItem.quantity),
            },
          ],
        })
      },
      removeItem: (id) => {
        set({ items: get().items.filter((item) => item.id !== id) })
      },
      updateQuantity: (id, quantity) => {
        if (quantity <= 0) {
          get().removeItem(id)
          return
        }
        set({
          items: get().items.map((item) =>
            item.id === id ? { ...item, quantity } : item,
          ),
        })
      },
      clearCart: () => set({ items: [] }),
      getTotal: () => get().items.reduce((sum, item) => sum + item.price * item.quantity, 0),
      getItemCount: () => get().items.reduce((sum, item) => sum + item.quantity, 0),
    }),
    {
      name: 'epowerfix-cart',
      storage: cartStorage,
      partialize: (state) => ({ items: state.items }),
      version: 1,
      // Zustand calls this before merge whenever storage is from a previous
      // version. Return only persisted data; merge retains current actions.
      migrate: migratePersistedCartState,
      merge: (persistedState, currentState) => {
        const persisted = persistedState as Partial<CartState>
        return {
          ...currentState,
          ...persisted,
          items: normalizeCartItems(persisted.items),
        }
      },
    },
  ),
)
