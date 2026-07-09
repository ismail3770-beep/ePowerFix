"use client";
import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import { PremiumCard } from "@/components/epf/PremiumCard";
import { FadeInStagger, FadeInItem } from "@/components/epf/FadeIn";

interface Product {
  id: string;
  name: string;
  price: number;
  comparePrice: number | null;
  images: string[];
}

const fallbackDeals: Product[] = [];

export default function BestDeals() {
  const [deals, setDeals] = useState<Product[]>(fallbackDeals);

  useEffect(() => {
    (async () => {
      try {
        const res: any = await apiFetch("/api/products?limit=10&bestDeals=true");
        const products = res.data?.data;
        if (Array.isArray(products) && products.length > 0) {
          setDeals(products.slice(0, 10));
        }
      } catch {
        /* keep fallback (empty) */
      }
    })();
  }, []);

  return (
    <section id="deals" className="bg-white py-10 sm:py-14">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-12">
        {/* ── Section Header ── */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Best Deals
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Don&apos;t miss the chance — limited stock!
            </p>
          </div>

          <a
            href="/deals"
            className="hidden sm:inline-flex items-center gap-1.5 text-sm font-medium text-epf-500 hover:text-epf-600 transition-colors border border-epf-500 hover:border-epf-600 rounded-md px-4 py-2"
          >
            View All
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </a>
        </div>

        {/* ── Product Grid ── */}
        {deals.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-lg py-16 text-center">
            <p className="text-sm text-slate-500">No deals available yet. Please check back soon.</p>
          </div>
        ) : (
          <FadeInStagger className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
            {deals.slice(0, 10).map((product) => (
              <FadeInItem key={product.id}>
              <PremiumCard
                data={{
                  id: product.id,
                  name: product.name,
                  price: product.price,
                  comparePrice: product.comparePrice,
                  images: product.images,
                  isBestDeal: true,
                }}
                onCardClick={(id) => { window.location.href = `/product/${id}`; }}
              />
              </FadeInItem>
            ))}
          </FadeInStagger>
        )}

        {/* ── Mobile "View All" ── */}
        <div className="sm:hidden mt-6 text-center">
          <a
            href="/deals"
            className="inline-flex items-center justify-center gap-1.5 w-full text-sm font-medium text-white bg-epf-500 hover:bg-epf-600 rounded-md px-4 py-3 transition-colors"
          >
            View All Products
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
}
