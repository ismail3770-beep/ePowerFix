import { create } from 'zustand';
import { getStorage } from './storage';

export type CartItemType = 'PRODUCT' | 'SERVICE' | 'PROJECT' | 'PROJECT_KIT';

/**
 * A cart line carries a distinct identity field for each purchasable domain.
 * productId remains optional solely to deserialize pre-Phase-0A local carts.
 */
export interface CartItem {
  id: string;
  itemType?: CartItemType;
  productId?: string;
  serviceId?: string;
  projectId?: string;
  projectKitId?: string;
  variantId?: string;
  variantLabel?: string;
  productName: string;
  productImage: string;
  price: number;
  quantity: number;
}

export type CartItemInput = Omit<CartItem, 'id'>;

export type OrderItemPayload =
  | { itemType: 'PRODUCT'; productId: string; variantId?: string; quantity: number }
  | { itemType: 'SERVICE'; serviceId: string; quantity: number }
  | { itemType: 'PROJECT'; projectId: string; quantity: number }
  | { itemType: 'PROJECT_KIT'; projectKitId: string; quantity: number };

type CartItemIdentity = Pick<
  CartItem,
  'itemType' | 'productId' | 'serviceId' | 'projectId' | 'projectKitId'
>;

/** Returns the domain-specific identifier for a cart line. */
export function getCartItemEntityId(item: CartItemIdentity): string | undefined {
  switch (item.itemType ?? 'PRODUCT') {
    case 'SERVICE':
      return item.serviceId ?? item.productId;
    case 'PROJECT':
      return item.projectId ?? item.productId;
    case 'PROJECT_KIT':
      return item.projectKitId ?? item.productId;
    default:
      return item.productId;
  }
}

/**
 * Converts legacy persisted cart entries to explicit identities. The previous
 * storefront used PROJECT + productId exclusively for ProjectKit cards, so
 * those records are migrated to PROJECT_KIT + projectKitId on hydration.
 */
function normalizeCartItemInput(item: CartItemInput): CartItemInput {
  // Older persisted carts may have null or no image. Normalize those values
  // instead of discarding an otherwise valid cart line during hydration.
  const normalizedItem = {
    ...item,
    productImage: typeof item.productImage === 'string' ? item.productImage : '',
  };
  const itemType = normalizedItem.itemType ?? 'PRODUCT';

  if (itemType === 'SERVICE') {
    return {
      ...normalizedItem,
      itemType,
      productId: undefined,
      serviceId: normalizedItem.serviceId ?? normalizedItem.productId,
    };
  }

  if (itemType === 'PROJECT_KIT') {
    return {
      ...normalizedItem,
      itemType,
      productId: undefined,
      projectKitId: normalizedItem.projectKitId ?? normalizedItem.productId,
    };
  }

  if (itemType === 'PROJECT') {
    // An explicit projectId is a real portfolio Project. An old productId in a
    // PROJECT line is the historical ProjectKit convention and is migrated.
    if (normalizedItem.projectId) {
      return { ...normalizedItem, itemType, productId: undefined };
    }
    return {
      ...normalizedItem,
      itemType: 'PROJECT_KIT',
      productId: undefined,
      projectKitId: normalizedItem.projectKitId ?? normalizedItem.productId,
    };
  }

  return { ...normalizedItem, itemType: 'PRODUCT' };
}

export function normalizeCartItem(item: CartItem): CartItem {
  return { ...normalizeCartItemInput(item), id: item.id };
}

export function toOrderItemPayload(item: CartItem): OrderItemPayload {
  const normalized = normalizeCartItem(item);

  if (normalized.itemType === 'SERVICE') {
    if (!normalized.serviceId) throw new Error('Cart service item is missing serviceId');
    return { itemType: 'SERVICE', serviceId: normalized.serviceId, quantity: normalized.quantity };
  }
  if (normalized.itemType === 'PROJECT') {
    if (!normalized.projectId) throw new Error('Cart project item is missing projectId');
    return { itemType: 'PROJECT', projectId: normalized.projectId, quantity: normalized.quantity };
  }
  if (normalized.itemType === 'PROJECT_KIT') {
    if (!normalized.projectKitId) throw new Error('Cart project kit item is missing projectKitId');
    return {
      itemType: 'PROJECT_KIT',
      projectKitId: normalized.projectKitId,
      quantity: normalized.quantity,
    };
  }
  if (!normalized.productId) throw new Error('Cart product item is missing productId');
  return {
    itemType: 'PRODUCT',
    productId: normalized.productId,
    ...(normalized.variantId ? { variantId: normalized.variantId } : {}),
    quantity: normalized.quantity,
  };
}

/** Stable identity used when merging a device cart with the persisted cart. */
export function getCartItemKey(item: CartItem): string {
  const normalized = normalizeCartItem(item);
  const entityId = getCartItemEntityId(normalized);
  if (!entityId) throw new Error('Cart item is missing its entity identifier');
  return `${normalized.itemType ?? 'PRODUCT'}:${entityId}:${normalized.variantId ?? ''}`;
}

/**
 * Merges device and server carts without repeatedly doubling quantities on each
 * login. Server display metadata wins and the larger quantity is retained.
 */
export function mergeCartItems(localItems: CartItem[], serverItems: CartItem[]): CartItem[] {
  const merged = new Map<string, CartItem>();
  for (const item of normalizeCartItems(serverItems)) {
    merged.set(getCartItemKey(item), { ...item, quantity: Math.min(99, Math.max(1, item.quantity)) });
  }
  for (const item of normalizeCartItems(localItems)) {
    const key = getCartItemKey(item);
    const existing = merged.get(key);
    if (existing) {
      merged.set(key, {
        ...existing,
        quantity: Math.min(99, Math.max(existing.quantity, item.quantity)),
      });
    } else {
      merged.set(key, { ...item, quantity: Math.min(99, Math.max(1, item.quantity)) });
    }
  }
  return [...merged.values()];
}

/**
 * Replays cart mutations made while the initial login sync was in flight. This
 * keeps server-only lines while preserving local removals and quantity changes.
 */
export function reconcileCartItems(
  localSnapshot: CartItem[],
  currentItems: CartItem[],
  persistedItems: CartItem[],
): CartItem[] {
  const snapshot = new Map(normalizeCartItems(localSnapshot).map((item) => [getCartItemKey(item), item]));
  const current = new Map(normalizeCartItems(currentItems).map((item) => [getCartItemKey(item), item]));
  const reconciled = new Map(normalizeCartItems(persistedItems).map((item) => [getCartItemKey(item), item]));

  for (const [key, previous] of snapshot) {
    const next = current.get(key);
    if (!next) {
      reconciled.delete(key);
    } else if (next.quantity !== previous.quantity) {
      const persisted = reconciled.get(key);
      reconciled.set(key, { ...(persisted ?? next), quantity: next.quantity });
    }
  }

  for (const [key, next] of current) {
    if (snapshot.has(key)) continue;
    const persisted = reconciled.get(key);
    reconciled.set(key, persisted
      ? { ...persisted, quantity: Math.max(persisted.quantity, next.quantity) }
      : next);
  }

  return [...reconciled.values()];
}

/** Semantic signature that deliberately ignores client/server-generated row IDs. */
export function getCartItemsSignature(items: CartItem[]): string {
  return normalizeCartItems(items)
    .map((item) => `${getCartItemKey(item)}:${Math.min(99, Math.max(1, item.quantity))}`)
    .sort()
    .join('|');
}

interface CartState {
  items: CartItem[];
  hydrated: boolean;
  hydrate: () => Promise<void>;
  setItems: (items: CartItem[]) => void;
  addItem: (item: CartItemInput) => void;
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
      typeof item.productName === 'string' &&
      (item.productImage === undefined ||
        item.productImage === null ||
        typeof item.productImage === 'string') &&
      typeof item.price === 'number' &&
      typeof item.quantity === 'number' &&
      getCartItemEntityId(item as CartItemIdentity),
  );
}

function normalizeCartItems(items: unknown): CartItem[] {
  if (!Array.isArray(items)) return [];
  return items.filter(isCartItem).map(normalizeCartItem).filter((item) => Boolean(getCartItemEntityId(item)));
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
        const items = normalizeCartItems(JSON.parse(raw));
        set({ items, hydrated: true });
        saveItems(items);
        return;
      }
    } catch {
      // Ignore malformed or unavailable local cart data and start empty.
    }
    set({ hydrated: true });
  },

  setItems: (items) => {
    const nextItems = normalizeCartItems(items);
    set({ items: nextItems });
    saveItems(nextItems);
  },

  addItem: (item) => {
    const normalizedItem = normalizeCartItemInput(item);
    const entityId = getCartItemEntityId(normalizedItem);
    if (!entityId) throw new Error('Cart item is missing its entity identifier');

    const items = get().items;
    const itemType = normalizedItem.itemType ?? 'PRODUCT';
    const existing = items.find(
      (current) =>
        (current.itemType ?? 'PRODUCT') === itemType &&
        getCartItemEntityId(current) === entityId &&
        current.variantId === normalizedItem.variantId,
    );

    const nextItems = existing
      ? items.map((current) =>
          current.id === existing.id
            ? { ...current, quantity: current.quantity + Math.max(1, normalizedItem.quantity) }
            : current,
        )
      : [
          ...items,
          {
            ...normalizedItem,
            id: createCartId(),
            quantity: Math.max(1, normalizedItem.quantity),
          },
        ];

    set({ items: nextItems });
    saveItems(nextItems);
  },

  removeItem: (id) => {
    const nextItems = get().items.filter((item) => item.id !== id);
    set({ items: nextItems });
    saveItems(nextItems);
  },

  updateQuantity: (id, quantity) => {
    if (quantity <= 0) {
      get().removeItem(id);
      return;
    }
    const nextItems = get().items.map((item) =>
      item.id === id ? { ...item, quantity } : item,
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
