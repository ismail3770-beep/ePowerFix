"use client";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Flame, ArrowRight, Package } from "lucide-react";
import { useUIStore } from "@/store";

interface Product {
  id: string;
  name: string;
  price: number;
  comparePrice: number | null;
  sold: number;
  stock: number;
  images: string[];
}

function CountdownTimer() {
  const [hours, setHours] = useState(5);
  const [minutes, setMinutes] = useState(42);
  const [seconds, setSeconds] = useState(18);

  useEffect(() => {
    const id = setInterval(() => {
      setSeconds((s) => {
        if (s > 0) return s - 1;
        setMinutes((m) => {
          if (m > 0) return m - 1;
          setHours((h) => { if (h > 0) return h - 1; return 5; });
          return 59;
        });
        return 59;
      });
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <div className="flex items-center gap-1.5 bg-white px-3 py-2 rounded border border-[#E2E8F0]">
      <span className="text-[13px] text-[#6B7280]">Ends in:</span>
      <div className="flex gap-1">
        <span className="bg-[#111827] text-white text-[14px] font-semibold px-2 py-1 rounded min-w-[30px] text-center tabular-nums">{pad(hours)}</span>
        <span className="text-[#6B7280] font-semibold text-[14px]">:</span>
        <span className="bg-[#111827] text-white text-[14px] font-semibold px-2 py-1 rounded min-w-[30px] text-center tabular-nums">{pad(minutes)}</span>
        <span className="text-[#6B7280] font-semibold text-[14px]">:</span>
        <span className="bg-[#111827] text-white text-[14px] font-semibold px-2 py-1 rounded min-w-[30px] text-center tabular-nums">{pad(seconds)}</span>
      </div>
    </div>
  );
}

const fallbackDeals = [
  { id: "fd1", name: "3-Core PVC Cable 100m", price: 1895, comparePrice: 2500, sold: 78, stock: 22, images: [] },
  { id: "fd2", name: "32A Single Pole MCB", price: 420, comparePrice: 650, sold: 142, stock: 58, images: [] },
  { id: "fd3", name: "18W LED Panel Light", price: 95, comparePrice: 180, sold: 256, stock: 44, images: [] },
  { id: "fd4", name: "1000V Insulated Gloves", price: 349, comparePrice: 500, sold: 89, stock: 61, images: [] },
  { id: "fd5", name: "Digital Multimeter DT830D", price: 699, comparePrice: 1200, sold: 198, stock: 52, images: [] },
  { id: "fd6", name: "Solar Charge Controller 20A", price: 2100, comparePrice: 3500, sold: 67, stock: 133, images: [] },
];

export default function FlashDeals() {
  const { data: apiData } = useQuery<{ data: { data: Product[] } }>({
    queryKey: ["flash-deals"],
    queryFn: () => fetch("/api/products?limit=50").then((r) => r.json()),
  });

  const discountedProducts = (() => {
    const apiProducts = apiData?.data?.data ?? [];
    const withDiscount = apiProducts.filter((p: Product) => p.comparePrice && p.comparePrice > p.price);
    if (withDiscount.length >= 6) return withDiscount.slice(0, 6);
    if (withDiscount.length > 0) return withDiscount;
    return fallbackDeals;
  })();

  return (
    <section id="deals" className="bg-white border-b border-[#E2E8F0]">
      <div className="mx-auto max-w-[1920px] px-4 sm:px-12 py-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 bg-[#0EA5E9] text-white px-4 py-2 rounded">
              <Flame className="h-4 w-4" />
              <span className="text-[16px] font-semibold">Flash Deals</span>
            </div>
            <CountdownTimer />
          </div>
          <a href="/deals"
            className="hidden sm:flex items-center gap-1 text-[14px] font-medium text-[#0EA5E9] hover:underline">
            View All Deals <ArrowRight className="h-3.5 w-3.5" />
          </a>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-0 border border-[#E2E8F0]">
          {discountedProducts.map((product, idx) => {
            const discount = product.comparePrice ? Math.round((1 - product.price / product.comparePrice) * 100) : 0;

            return (
              <div key={product.id || idx}
                className={`border-r border-b border-[#E2E8F0] p-3 hover:bg-[#F8FAFC] transition-colors cursor-pointer group ${idx === 5 ? "border-r-0 sm:border-r" : ""}`}
                onClick={() => { if (product.id) { const { setSelectedProductId, setProductDetailOpen } = useUIStore.getState(); setSelectedProductId(product.id); setProductDetailOpen(true); } }}>
                <div className="aspect-square bg-[#F8FAFC] flex items-center justify-center relative mb-3 rounded overflow-hidden">
                  {product.images?.[0] ? (
                    <img src={product.images[0]} alt={product.name} className="w-full h-full object-contain p-2" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  ) : (
                    <Package className="h-10 w-10 text-[#CBD5E1]" />
                  )}
                  <span className="discount-badge rounded-br">-{discount}%</span>
                </div>
                <p className="text-[14px] text-[#374151] line-clamp-2 leading-snug mb-2 group-hover:text-[#111827]">{product.name}</p>
                <div className="flex items-baseline gap-2 mb-2.5">
                  <span className="text-[16px] font-semibold text-[#0EA5E9]">৳{(product.price ?? 0).toLocaleString()}</span>
                  {product.comparePrice && <span className="text-[14px] text-[#6B7280] line-through">৳{(product.comparePrice ?? 0).toLocaleString()}</span>}
                </div>

              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}