"use client";
import { useState, useEffect } from "react";
import { ArrowRight, PackageOpen } from "lucide-react";
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
    <section id="deals" className="bg-white py-12 sm:py-16">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* ── Section Header ── */}
        <div className="flex items-end justify-between mb-8 sm:mb-10">
          <div>
            <h2 className="text-[20px] sm:text-[24px] font-bold text-slate-900 tracking-tight">
              Best Deals
            </h2>
            <p className="text-[14px] text-slate-500 mt-1">
              Don&apos;t miss the chance — limited stock!
            </p>
          </div>

          <a
            href="/deals"
            className="hidden sm:inline-flex items-center gap-1.5 text-[14px] font-medium text-epf-600 hover:text-epf-700 transition-colors group"
          >
            View All
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
          </a>
        </div>

        {/* ── Product Grid ── */}
        {deals.length === 0 ? (
          <div className="bg-slate-50 border border-slate-200 rounded-xl py-16 px-6 text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-white border border-slate-200 flex items-center justify-center mb-4">
              <PackageOpen className="h-8 w-8 text-slate-300" strokeWidth={1.5} />
            </div>
            <h3 className="text-[18px] font-medium text-slate-700">No deals available yet</h3>
            <p className="text-[14px] text-slate-400 mt-1.5 max-w-sm mx-auto">
              Please check back soon — we&apos;re adding fresh deals every week.
            </p>
          </div>
        ) : (
          <FadeInStagger className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-5">
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
        {deals.length > 0 && (
          <div className="sm:hidden mt-8 text-center">
            <a
              href="/deals"
              className="inline-flex items-center justify-center gap-1.5 text-[14px] font-semibold text-white bg-epf-500 hover:bg-epf-600 h-11 px-6 rounded-lg transition-colors"
            >
              View All Products
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        )}
      </div>
    </section>
  );
}
