"use client";

import Link from "next/link";
import { ArrowRight, Zap, Lightbulb, Power, Cable, ToggleRight, Sun, Fan, ShieldCheck } from "lucide-react";
import ProductCard, { type ProductCardData } from "./ProductCard";

const products: ProductCardData[] = [
  { id: "p1", name: "Schneider MCB 32A", brand: "Schneider", price: 850, compareAtPrice: 1200, rating: 4.5, reviewCount: 23, inStock: true, badge: "হট", icon: Zap, tile: "from-sky-50 to-blue-100" },
  { id: "p2", name: "Philips LED 20W", brand: "Philips", price: 320, compareAtPrice: 550, rating: 4.8, reviewCount: 45, inStock: true, icon: Lightbulb, tile: "from-amber-50 to-yellow-100" },
  { id: "p3", name: "Siemens Contactor", brand: "Siemens", price: 2400, compareAtPrice: 3200, rating: 4.7, reviewCount: 18, inStock: true, icon: Power, tile: "from-emerald-50 to-teal-100" },
  { id: "p4", name: "Cable 2.5mm (100m)", brand: "BRB", price: 4500, compareAtPrice: 5800, rating: 4.3, reviewCount: 31, inStock: true, icon: Cable, tile: "from-rose-50 to-pink-100" },
  { id: "p5", name: "Havells Switch Board", brand: "Havells", price: 650, compareAtPrice: 900, rating: 4.6, reviewCount: 12, inStock: true, icon: ToggleRight, tile: "from-violet-50 to-purple-100" },
  { id: "p6", name: "Solar Panel 100W", brand: "ePowerFix", price: 8500, compareAtPrice: 11000, rating: 4.9, reviewCount: 9, inStock: true, badge: "নতুন", icon: Sun, tile: "from-orange-50 to-amber-100" },
  { id: "p7", name: "Ceiling Fan 56 inch", brand: "Walton", price: 3200, compareAtPrice: 4200, rating: 4.4, reviewCount: 27, inStock: true, icon: Fan, tile: "from-cyan-50 to-sky-100" },
  { id: "p8", name: "Safety Gloves (Pair)", brand: "3M", price: 450, compareAtPrice: 700, rating: 4.2, reviewCount: 15, inStock: true, icon: ShieldCheck, tile: "from-slate-100 to-slate-200" },
];

export default function ShopSection() {
  return (
    <section className="py-16">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-12">
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="text-sky-600 font-semibold text-sm mb-1">জনপ্রিয় সংগ্রহ</p>
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900">ফিচার্ড প্রোডাক্ট</h2>
            <p className="text-slate-400 text-sm mt-1">সেরা দামে মানসম্পন্ন ইলেকট্রিক্যাল প্রোডাক্ট</p>
          </div>
          <Link href="/shop" className="flex items-center gap-1 text-sky-600 hover:text-sky-700 text-sm font-semibold transition whitespace-nowrap">
            সব দেখুন <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </div>
    </section>
  );
}
