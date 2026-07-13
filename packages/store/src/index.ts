// @epowerfix/store — Shared Zustand stores
// This package holds shared state management (cart, auth, UI state).
// Storage adapter pattern allows web (localStorage) and mobile (AsyncStorage) to share the same stores.

// Storage adapter — pluggable for web (localStorage) and mobile (AsyncStorage)
type Storage = {
  getItem: (key: string) => Promise<string | null> | string | null;
  setItem: (key: string, value: string) => Promise<void> | void;
  removeItem: (key: string) => Promise<void> | void;
};

let storage: Storage | null = null;

// Web auto-detection (only runs in browser)
if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
  storage = window.localStorage as unknown as Storage;
}

// Mobile: call this from app/_layout.tsx with AsyncStorage
export function setStorage(s: Storage) {
  storage = s;
}

export function getStorage(): Storage | null {
  return storage;
}

export { useCartStore } from './cart';
