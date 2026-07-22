import create from 'zustand';
import { getApiToken, wishlistApi } from '@epowerfix/api-client';

export interface WishlistItem {
  id: string;
  productId: string;
  product?: any;
  createdAt?: string;
}

interface WishlistState {
  items: WishlistItem[];
  loading: boolean;
  loaded: boolean;
  error: string | null;
  load: () => Promise<void>;
  toggle: (productId: string) => Promise<boolean>;
  remove: (wishlistId: string) => Promise<void>;
  clear: () => void;
}

function messageFrom(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

export const useWishlistStore = create<WishlistState>((set, get) => ({
  items: [],
  loading: false,
  loaded: false,
  error: null,

  load: async () => {
    if (!getApiToken()) {
      set({ items: [], loaded: true, loading: false, error: null });
      return;
    }

    set({ loading: true, error: null });
    try {
      const response = await wishlistApi.list();
      set({ items: Array.isArray(response.data) ? response.data : [], loaded: true });
    } catch (error) {
      set({ error: messageFrom(error, 'Unable to load wishlist'), loaded: true });
    } finally {
      set({ loading: false });
    }
  },

  toggle: async (productId) => {
    const existing = get().items.find((item) => item.productId === productId);
    set({ loading: true, error: null });
    try {
      if (existing) {
        await wishlistApi.remove(existing.id);
        set((state) => ({ items: state.items.filter((item) => item.id !== existing.id) }));
        return false;
      }

      const response = await wishlistApi.add(productId);
      if (response.data) {
        set((state) => ({
          items: state.items.some((item) => item.id === response.data.id)
            ? state.items
            : [response.data, ...state.items],
        }));
      }
      return true;
    } catch (error) {
      const message = messageFrom(error, 'Unable to update wishlist');
      set({ error: message });
      throw new Error(message);
    } finally {
      set({ loading: false });
    }
  },

  remove: async (wishlistId) => {
    set({ loading: true, error: null });
    try {
      await wishlistApi.remove(wishlistId);
      set((state) => ({ items: state.items.filter((item) => item.id !== wishlistId) }));
    } catch (error) {
      const message = messageFrom(error, 'Unable to remove wishlist item');
      set({ error: message });
      throw new Error(message);
    } finally {
      set({ loading: false });
    }
  },

  clear: () => set({ items: [], loaded: true, error: null }),
}));
