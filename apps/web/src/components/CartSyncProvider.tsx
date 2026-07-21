"use client";

import { useEffect, useRef, useState } from "react";
import { apiFetch } from "@/lib/api";
import { useAuthStore } from "@/store/auth-store";
import {
  getCartItemsSignature,
  mergeCartItems,
  reconcileCartItems,
  toOrderItemPayload,
  useCartStore,
  type CartItem,
} from "@/store/cart-store";

type CartResponse = {
  success: boolean;
  data: { items: CartItem[] };
};

const SYNC_DELAY_MS = 450;

async function replacePersistedCart(items: CartItem[]): Promise<CartItem[]> {
  const response = await apiFetch<CartResponse>("/api/cart", {
    method: "PUT",
    body: JSON.stringify({ items: items.map(toOrderItemPayload) }),
  });
  return response.data.items;
}

/**
 * Merges the anonymous browser cart after login and then keeps the authenticated
 * cart synchronized. Network failures never block local cart operations.
 */
export function CartSyncProvider() {
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const isRestoring = useAuthStore((state) => state.isRestoring);
  const items = useCartStore((state) => state.items);
  const setItems = useCartStore((state) => state.setItems);
  const [cartHydrated, setCartHydrated] = useState(() => useCartStore.persist.hasHydrated());
  const [syncReadyUser, setSyncReadyUser] = useState<string | null>(null);
  const [retryAttempt, setRetryAttempt] = useState(0);
  const initializingUserRef = useRef<string | null>(null);
  const lastPersistedSignatureRef = useRef("");
  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (useCartStore.persist.hasHydrated()) {
      setCartHydrated(true);
      return;
    }
    return useCartStore.persist.onFinishHydration(() => setCartHydrated(true));
  }, []);

  useEffect(() => {
    if (isRestoring || !cartHydrated) return;
    if (!userId) {
      initializingUserRef.current = null;
      lastPersistedSignatureRef.current = "";
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
        const remote = await apiFetch<CartResponse>("/api/cart");
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
        // Keep the local cart usable and retry transient failures twice.
        if (!cancelled) {
          initializingUserRef.current = null;
          if (retryAttempt < 2) {
            window.setTimeout(() => setRetryAttempt((attempt) => attempt + 1), 1500);
          }
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [cartHydrated, isRestoring, retryAttempt, setItems, userId]);

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
          // A later mutation or session restore retries synchronization.
        }
      })();
    }, SYNC_DELAY_MS);

    return () => {
      if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    };
  }, [items, setItems, syncReadyUser, userId]);

  return null;
}
