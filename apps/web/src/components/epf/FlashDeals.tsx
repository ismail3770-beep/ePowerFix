"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Zap, ArrowRight, Timer } from "lucide-react";
import ProductCard from "./ProductCard";

const sampleDeals = [
  { id: "1", name: "Schneider MCB 32A", price: 850, compareAtPrice: 1200, rating: 4.5, reviewCount: 23, inStock: true, badge: "🔥 হট" },
  { id: "2", name: "Philips LED 20W", price: 320, compareAtPrice: 550, rating: 4.8, reviewCount: 45, inStock: true },
  { id: "3", name: "Siemens Contactor", price: 2400, compareAtPrice: 3200, rating: 4.7, reviewCount: 18, inStock: true },
  { id: "4", name: "Cable 2.5mm (100m)", price: 4500, compareAtPrice: 5800, rating: 4.3, reviewCount: 31, inStock: true },
];

function useCountdown(targetHours: number = 8) {
  const [time, setTime] = useState({ h: targetHours, m: 0, s: 0 });
  useEffect(() => {
    const timer = setInterval(() => {
      setTime((prev) => {
        let { h, m, s } = prev;
        s--;
        if (s < 0) { s = 59; m--; }
        if (m < 0) { m = 59; h--; }
        if (h < 0) { h = targetHours; m = 0; s = 0; }
        return { h, m, s };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [targetHours]);
  return time;
}

export default function FlashDeals() {
  const { h, m, s } = useCountdown();
  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <section className="bg-gradient-to-r from-[#DC2626] to-[#F97316] py-12">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-12">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Zap className="w-7 h-7 text-[#F59E0B]" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">⚡ ফ্ল্যাশ ডিল</h2>
              <p className="text-white/70 text-sm">সীমিত সময়ের বিশাল ছাড়!</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Timer className="w-5 h-5 text-white/70" />
            {[pad(h), pad(m), pad(s)].map((unit, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="bg-white text-[#DC2626] font-bold text-lg px-3 py-1.5 rounded-lg min-w-[48px] text-center">{unit}</span>
                {i < 2 && <span className="text-white font-bold text-lg">:</span>}
              </div>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {sampleDeals.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
        <div className="text-center mt-8">
          <Link href="/deals" className="inline-flex items-center gap-2 bg-white text-[#DC2626] hover:bg-gray-100 px-8 py-3 rounded-xl font-bold transition">
            সব ডিল দেখুন <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
