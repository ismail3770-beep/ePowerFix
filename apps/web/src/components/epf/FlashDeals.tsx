"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Zap, ArrowRight, Flame, Cable, Lightbulb, Power } from "lucide-react";
import ProductCard, { type ProductCardData } from "./ProductCard";

const deals: ProductCardData[] = [
  { id: "d1", name: "Schneider MCB 32A", brand: "Schneider", price: 850, compareAtPrice: 1200, rating: 4.5, reviewCount: 23, inStock: true, badge: "🔥 হট", icon: Zap, tile: "from-sky-50 to-blue-100" },
  { id: "d2", name: "Philips LED 20W", brand: "Philips", price: 320, compareAtPrice: 550, rating: 4.8, reviewCount: 45, inStock: true, icon: Lightbulb, tile: "from-amber-50 to-yellow-100" },
  { id: "d3", name: "Siemens Contactor", brand: "Siemens", price: 2400, compareAtPrice: 3200, rating: 4.7, reviewCount: 18, inStock: true, icon: Power, tile: "from-emerald-50 to-teal-100" },
  { id: "d4", name: "Cable 2.5mm (100m)", brand: "BRB", price: 4500, compareAtPrice: 5800, rating: 4.3, reviewCount: 31, inStock: true, icon: Cable, tile: "from-rose-50 to-pink-100" },
];

function useCountdown(hours = 8) {
  const [t, setT] = useState({ h: hours, m: 0, s: 0 });
  useEffect(() => {
    const id = setInterval(() => {
      setT((p) => {
        let { h, m, s } = p;
        s--;
        if (s < 0) { s = 59; m--; }
        if (m < 0) { m = 59; h--; }
        if (h < 0) { h = hours; m = 0; s = 0; }
        return { h, m, s };
      });
    }, 1000);
    return () => clearInterval(id);
  }, [hours]);
  return t;
}

const pad = (n: number) => String(n).padStart(2, "0");

export default function FlashDeals() {
  const { h, m, s } = useCountdown();

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-[#0C2742] to-[#0C4A6E] py-16">
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl" />
      <div className="absolute -bottom-24 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
      <div className="max-w-[1400px] mx-auto px-4 sm:px-12 relative">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 mb-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-amber-500/20 ring-1 ring-amber-400/30 rounded-xl flex items-center justify-center">
              <Flame className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold text-white">ফ্ল্যাশ ডিল</h2>
                <span className="flex items-center gap-1 text-[11px] font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" /> লাইভ
                </span>
              </div>
              <p className="text-white/60 text-sm">সীমিত সময়ের বিশাল ছাড়!</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-white/60 text-sm mr-1">শেষ হবে</span>
            {[pad(h), pad(m), pad(s)].map((u, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="bg-white/10 ring-1 ring-white/10 text-white font-bold text-lg px-3 py-1.5 rounded-lg min-w-[48px] text-center tabular-nums">
                  {u}
                </span>
                {i < 2 && <span className="text-amber-400 font-bold text-lg">:</span>}
              </div>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5">
          {deals.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
        <div className="text-center mt-10">
          <Link
            href="/deals"
            className="inline-flex items-center gap-2 bg-white hover:bg-slate-100 text-slate-900 px-8 py-3 rounded-xl font-bold transition"
          >
            সব ডিল দেখুন <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
