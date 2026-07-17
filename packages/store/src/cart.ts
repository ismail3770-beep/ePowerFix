// Shared persisted cart state for the web and Expo clients.
import { create } from 'zustand';
import { getStorage } from './storage';

export type CartItemType = 'PRODUCT' | 'SERVICE' | 'PROJECT';

export interface CartItem {
  id: string;
  itemType?: CartItemType;
  productId: string;
  variantId?: string;
  variantLabel?: string;
  productName: string;
  productImage: string;
  price: number;
  quantity: number;
}

export function toOrderItemPayload(item: CartItem) {
  const itemType = item.itemType ?? 'PRODUCT';
  if (itemType === 'SERVICE') {
    return { itemType, serviceId: item.productId, quantity: item.quantity };
  }
  if (itemType === 'PROJECT') {
    return { itemType, projectId: item.productId, quantity: item.quantity };
  }
  return {
    itemType,
    productId: item.productId,
    ...(item.variantId ? { variantId: item.variantId } : {}),
    quantity: item.quantity,
  };
}

interface CartState {
  items: CartItem[];
  hydrated: boolean;
  hydrate: () => Promise<void>;
  setItems: (items: CartItem[]) => void;
  addItem: (item: Omit<CartItem, 'id'>) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  getTotal: () => number;
  getItemCount: () => number;
}

const STORAGE_KEY = 'epowerfix-cart';

function createCartId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function saveItems(items: CartItem[]): void {
  const storage = getStorage();
  if (!storage) return;
  void Promise.resolve(storage.setItem(STORAGE_KEY, JSON.stringify(items))).catch(() => {
    // Cart state remains usable when local storage is temporarily unavailable.
  });
}

function isCartItem(value: unknown): value is CartItem {
  if (!value || typeof value !== 'object') return false;
  const item = value as Partial<CartItem>;
  return Boolean(
    typeof item.id === 'string' &&
      typeof item.productId === 'string' &&
      typeof item.productName === 'string' &&
      typeof item.price === 'number' &&
      typeof item.quantity === 'number'
  );
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  hydrated: false,

  hydrate: async () => {
    if (get().hydrated) return;
    const storage = getStorage();
    if (!storage) {
      set({ hydrated: true });
      return;
    }

    try {
      const raw = await storage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          set({ items: parsed.filter(isCartItem), hydrated: true });
          return;
        }
      }
    } catch {
      // Ignore malformed or unavailable local cart data and start empty.
    }
    set({ hydrated: true });
  },

  setItems: (items) => {
    set({ items });
    saveItems(items);
  },

  addItem: (item) => {
    const items = get().items;
    const itemType = item.itemType ?? 'PRODUCT';
    const existing = items.find(
      (current) =>
        current.productId === item.productId &&
        (current.itemType ?? 'PRODUCT') === itemType &&
        current.variantId === item.variantId
    );

    const nextItems = existing
      ? items.map((current) =>
          current.id === existing.id
            ? { ...current, quantity: current.quantity + Math.max(1, item.quantity) }
            : current
        )
      : [...items, { ...item, itemType, id: createCartId(), quantity: Math.max(1, item.quantity) }];

    set({ items: nextItems });
    saveItems(nextItems);
  },

  removeItem: (id) => {
    const nextItems = get().items.filter((item) => item.id !== id && item.productId !== id);
    set({ items: nextItems });
    saveItems(nextItems);
  },

  updateQuantity: (id, quantity) => {
    if (quantity <= 0) {
      get().removeItem(id);
      return;
    }
    const nextItems = get().items.map((item) =>
      item.id === id || item.productId === id ? { ...item, quantity } : item
    );
    set({ items: nextItems });
    saveItems(nextItems);
  },

  clearCart: () => {
    set({ items: [] });
    saveItems([]);
  },

  getTotal: () => get().items.reduce((sum, item) => sum + item.price * item.quantity, 0),
  getItemCount: () => get().items.reduce((sum, item) => sum + item.quantity, 0),
}));
