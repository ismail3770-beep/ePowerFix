export type StorageAdapter = {
  getItem: (key: string) => Promise<string | null> | string | null;
  setItem: (key: string, value: string) => Promise<void> | void;
  removeItem: (key: string) => Promise<void> | void;
};

let storage: StorageAdapter | null = null;

// Web auto-detection (only runs in a browser). Mobile installs its adapter from
// the Expo root layout with AsyncStorage.
if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
  storage = window.localStorage as unknown as StorageAdapter;
}

export function setStorage(adapter: StorageAdapter): void {
  storage = adapter;
}

export function getStorage(): StorageAdapter | null {
  return storage;
}
