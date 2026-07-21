import React, { useEffect, useRef, useState } from 'react';
import { cartApi } from '@epowerfix/api-client';
import {
  getCartItemsSignature,
  mergeCartItems,
  reconcileCartItems,
  toOrderItemPayload,
  useCartStore,
  type CartItem,
} from '@epowerfix/store';
import { useAuthStore } from '../store/auth';

const SYNC_DELAY_MS = 450;

async function replacePersistedCart(items: CartItem[]): Promise<CartItem[]> {
  const response = await cartApi.replace(items.map(toOrderItemPayload));
  return response.data.items;
}

/**
 * Merges the device cart into the authenticated cart once per session and then
 * persists later mutations. Local cart behavior remains available offline.
 */
export function CartSyncProvider() {
  const authHydrated = useAuthStore((state) => state.hydrated);
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const cartHydrated = useCartStore((state) => state.hydrated);
  const items = useCartStore((state) => state.items);
  const setItems = useCartStore((state) => state.setItems);
  const [syncReadyUser, setSyncReadyUser] = useState<string | null>(null);
  const [retryAttempt, setRetryAttempt] = useState(0);
  const initializingUserRef = useRef<string | null>(null);
  const lastPersistedSignatureRef = useRef('');
  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!authHydrated || !cartHydrated) return;
    if (!userId) {
      initializingUserRef.current = null;
      lastPersistedSignatureRef.current = '';
      setSyncReadyUser(null);
      return;
    }
    if (initializingUserRef.current === userId) return;

    let cancelled = false;
    initializingUserRef.current = userId;
    setSyncReadyUser(null);

    void (async () => {
      try {
        const localSnapshot = useCartStore.getState().items;
        const remote = await cartApi.get();
        if (cancelled) return;

        const merged = mergeCartItems(localSnapshot, remote.data.items);
        const persisted = await replacePersistedCart(merged);
        if (cancelled) return;

        const current = useCartStore.getState().items;
        const reconciled = reconcileCartItems(localSnapshot, current, persisted);
        lastPersistedSignatureRef.current = getCartItemsSignature(persisted);
        setItems(reconciled);
        setSyncReadyUser(userId);
      } catch {
        if (!cancelled) {
          initializingUserRef.current = null;
          if (retryAttempt < 2) {
            setTimeout(() => setRetryAttempt((attempt) => attempt + 1), 1500);
          }
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [authHydrated, cartHydrated, retryAttempt, setItems, userId]);

  useEffect(() => {
    if (!userId || syncReadyUser !== userId) return;
    const signature = getCartItemsSignature(items);
    if (signature === lastPersistedSignatureRef.current) return;

    if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    const snapshot = items;
    syncTimerRef.current = setTimeout(() => {
      void (async () => {
        try {
          const persisted = await replacePersistedCart(snapshot);
          const sentSignature = getCartItemsSignature(snapshot);
          const current = useCartStore.getState().items;
          lastPersistedSignatureRef.current = getCartItemsSignature(persisted);
          if (getCartItemsSignature(current) === sentSignature) setItems(persisted);
        } catch {
          // A later cart mutation retries synchronization.
        }
      })();
    }, SYNC_DELAY_MS);

    return () => {
      if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    };
  }, [items, setItems, syncReadyUser, userId]);

  return null;
}
