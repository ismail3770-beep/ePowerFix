"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuthStore } from "@/store/auth-store";
import { apiFetch } from "@/lib/api";

export function useWishlist() {
  const { user } = useAuthStore();
  const [wishlistedIds, setWishlistedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  // Fetch wishlist on login
  useEffect(() => {
    if (!user) { setWishlistedIds(new Set()); return; }
    setLoading(true);
    apiFetch<{ success: boolean; data: { productId: string }[] }>("/api/wishlist")
      .then((res) => {
        if (res?.data) {
          setWishlistedIds(new Set(res.data.map((item: any) => item.productId || item.id)));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  const toggle = useCallback(async (productId: string): Promise<boolean> => {
    if (!user) {
      alert("Please login first to save favorites");
      return false;
    }

    const isFav = wishlistedIds.has(productId);
    try {
      if (isFav) {
        // Need wishlist item ID — fetch list to find it
        const res = await apiFetch<{ success: boolean; data: { id: string; productId: string }[] }>("/api/wishlist");
        const item = res?.data?.find((w) => w.productId === productId);
        if (item) {
          await apiFetch(`/api/wishlist/${item.id}`, { method: "DELETE" });
          setWishlistedIds((prev) => { const next = new Set(prev); next.delete(productId); return next; });
        }
      } else {
        await apiFetch("/api/wishlist", { method: "POST", body: JSON.stringify({ productId }) });
        setWishlistedIds((prev) => new Set(prev).add(productId));
      }
      return !isFav;
    } catch {
      return isFav;
    }
  }, [user, wishlistedIds]);

  return { wishlistedIds, toggle, loading };
}
