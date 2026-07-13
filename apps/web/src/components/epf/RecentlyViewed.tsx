"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import { X } from "lucide-react";
import { PremiumCard, type PremiumCardData } from "@/components/epf/PremiumCard";
import { FadeInStagger, FadeInItem } from "@/components/epf/FadeIn";

// ═══════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════

const STORAGE_KEY = "epf-recently-viewed";
const MAX_STORED = 12;
const MAX_DISPLAY = 10;

export interface RecentlyViewedProduct {
  id: string;
  name: string;
  price: number;
  salePrice?: number | null;
  comparePrice?: number | null;
  images: string[];
}

// ═══════════════════════════════════════════════════════════════════════════
// Utility: addRecentlyViewed — importable by other components
// ═══════════════════════════════════════════════════════════════════════════

export function addRecentlyViewed(
  productId: string,
  productData: {
    id: string;
    name: string;
    price: number;
    salePrice?: number | null;
    comparePrice?: number | null;
    images: string[];
  }
) {
  if (typeof window === "undefined") {return;}

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const items: RecentlyViewedProduct[] = raw ? JSON.parse(raw) : [];

    // Remove existing entry so we can move it to the front
    const filtered = items.filter((p) => p.id !== productId);

    // Prepend the new item
    const updated = [productData, ...filtered].slice(0, MAX_STORED);

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    // Dispatch a custom event so any mounted RecentlyViewed component re-reads
    window.dispatchEvent(new StorageEvent("storage", { key: STORAGE_KEY }));
  } catch {
    /* ignore write errors */
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Component
// ═══════════════════════════════════════════════════════════════════════════

export default function RecentlyViewed() {
  const [products, setProducts] = useState<RecentlyViewedProduct[]>([]);
  const [, startTransition] = useTransition();

  // Read from localStorage on mount + listen for changes
  const hydrate = useCallback(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const items: RecentlyViewedProduct[] = JSON.parse(raw);
        startTransition(() => setProducts(items.slice(0, MAX_DISPLAY)));
      }
    } catch {
      /* ignore parse errors */
    }
  }, [startTransition]);

  useEffect(() => {
    hydrate();
    window.addEventListener("storage", hydrate);
    return () => window.removeEventListener("storage", hydrate);
  }, [hydrate]);

  const handleClearAll = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    setProducts([]);
  };

  if (products.length === 0) {return null;}

  return (
    <section className="py-12 sm:py-16 bg-slate-50">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
        {/* ── Section Header ── */}
        <div className="flex items-end justify-between mb-8 sm:mb-10">
          <div>
            <h2 className="text-[20px] sm:text-[24px] font-bold text-slate-900 tracking-tight">
              Recently Viewed
            </h2>
            <p className="text-[14px] text-slate-500 mt-1">
              Pick up where you left off
            </p>
          </div>

          <button
            onClick={handleClearAll}
            className="inline-flex items-center gap-1.5 text-[13px] font-medium text-slate-500 hover:text-slate-700 transition-colors cursor-pointer"
          >
            <X className="h-3.5 w-3.5" />
            Clear All
          </button>
        </div>

        {/* ── Product Row ── */}
        <FadeInStagger className="flex gap-4 overflow-x-auto pb-2 md:grid md:grid-cols-5 lg:grid-cols-6 md:overflow-visible scrollbar-hide [-webkit-overflow-scrolling:touch]">
          {products.map((product) => {
            const cardData: PremiumCardData = {
              id: product.id,
              name: product.name,
              price: product.price,
              salePrice: product.salePrice,
              comparePrice: product.comparePrice,
              images: product.images,
            };

            return (
              <FadeInItem key={product.id} className="min-w-[170px] md:min-w-0 flex-shrink-0">
                <PremiumCard
                  data={cardData}
                  onCardClick={(id) => {
                    window.location.href = `/product/${id}`;
                  }}
                />
              </FadeInItem>
            );
          })}
        </FadeInStagger>
      </div>
    </section>
  );
}
