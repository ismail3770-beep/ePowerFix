"use client";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  EPFArrowRight,
  EPFCircuitBreaker,
  EPFChevronRight,
} from "@/components/epf/icons/EPFIcons";
import { useCartStore, useUIStore } from "@/store";
import { apiFetch } from "@/lib/api";

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
  const [days, setDays] = useState(915);
  const [hours, setHours] = useState(10);
  const [minutes, setMinutes] = useState(28);
  const [seconds, setSeconds] = useState(39);

  useEffect(() => {
    const id = setInterval(() => {
      setSeconds((s) => {
        if (s > 0) return s - 1;
        setMinutes((m) => {
          if (m > 0) return m - 1;
          setHours((h) => {
            if (h > 0) return h - 1;
            setDays((d) => (d > 0 ? d - 1 : 0));
            return 23;
          });
          return 59;
        });
        return 59;
      });
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const pad = (n: number) => String(n).padStart(2, "0");

  const cells = [
    { value: pad(days) },
    { value: pad(hours) },
    { value: pad(minutes) },
    { value: pad(seconds) },
  ];

  return (
    <div className="flex items-center gap-1.5">
      {cells.map((cell, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <span
            className="text-white text-sm font-bold px-2 py-1.5 min-w-[32px] text-center tabular-nums leading-none bg-purple-700 rounded-[4px]"
          >
            {cell.value}
          </span>
          {i < cells.length - 1 && (
            <span className="font-bold text-sm text-slate-900">:</span>
          )}
        </div>
      ))}
    </div>
  );
}

const fallbackFlashDeals: Product[] = [];

const fallbackTodaysDeals: Product[] = [];

function ProductCard({ product }: { product: Product }) {
  return (
    <div
      className="hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group flex flex-col overflow-hidden bg-slate-100 rounded-lg"
      onClick={() => {
        window.location.href = `/shop/${product.id}`;
      }}
    >
      {/* Image — square, centered */}
      <div className="aspect-square flex items-center justify-center p-3 bg-white">
        {product.images?.[0] ? (
          <img
            src={product.images[0]}
            alt={product.name}
            className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        ) : (
          <EPFCircuitBreaker size={48} className="text-slate-300" />
        )}
      </div>

      {/* Price only */}
      <div className="px-3 pb-3 flex items-baseline gap-1.5 flex-wrap">
        <span className="text-sm font-bold text-slate-900">
          ৳{product.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
        {product.comparePrice && product.comparePrice > product.price && (
          <span className="text-xs text-slate-400 line-through">
            ৳{product.comparePrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        )}
      </div>
    </div>
  );
}

export default function FlashDeals() {
  const { data: apiData } = useQuery<{ data: { data: Product[] } }>({
    queryKey: ["flash-deals"],
    queryFn: () => apiFetch("/api/products?limit=50"),
  });
  const addItem = useCartStore((s) => s.addItem);
  const setCartOpen = useUIStore((s) => s.setCartOpen);

  // Flash Deals — first 4 products from API
  const flashDeals = (() => {
    const apiProducts = apiData?.data?.data ?? [];
    return apiProducts.slice(0, 4);
  })();

  // Today's Deals — next 6 products from API
  const todaysDeals = (() => {
    const apiProducts = apiData?.data?.data ?? [];
    return apiProducts.slice(0, 6);
  })();

  const handleAddToCart = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    addItem({
      productId: product.id,
      productName: product.name,
      productImage: product.images?.[0] || "",
      price: product.price,
      quantity: 1,
    });
    setCartOpen(true);
  };

  return (
    <section id="deals" className="bg-white border-b border-slate-200">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 py-6">
        {/* Two-column layout — Flash Deals (wider) | Today's Deals */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
          {/* ─── LEFT: Flash Deals Block (5 cols) ─── */}
          <div className="lg:col-span-5 bg-white flex gap-4">
            {/* Vertical Promotional Banner — leftmost, full height */}
            <div
              className="hidden sm:flex flex-col items-center justify-center shrink-0 self-stretch w-[160px] rounded-lg px-3 text-center"
              style={{ background: "linear-gradient(135deg, #4c1d95 0%, #1e1b4b 100%)" }}
            >
              <EPFCircuitBreaker size={36} className="text-amber-300 mb-2" />
              <p className="text-white text-sm font-bold leading-tight">Flash Deals</p>
              <p className="text-amber-300/80 text-[11px] mt-1">Up to 50% off</p>
            </div>

            {/* Right of banner: heading → counter → 4 cards */}
            <div className="flex-1 min-w-0 flex flex-col items-stretch">
              {/* Header area — fixed height to align with right side */}
              <div style={{ minHeight: '56px' }}>
                {/* Heading row */}
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                    Flash deals
                  </h3>
                  <div className="flex items-center gap-2">
                    <a
                      href="/deals"
                      className="text-xs font-medium text-slate-900 px-3 py-1.5 transition-colors bg-white rounded"
                    >
                      View All Products
                    </a>
                    <a
                      href="/deals"
                      className="inline-flex items-center gap-1 text-white text-xs font-semibold px-4 py-1.5 transition-colors rounded-full bg-slate-900"
                    >
                      All Deals
                      <EPFArrowRight size={12} />
                    </a>
                  </div>
                </div>

                {/* Counter */}
                <div className="mt-2">
                  <CountdownTimer />
                </div>
              </div>

              {/* 4 product cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                {flashDeals.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </div>
          </div>

          {/* ─── RIGHT: Today's Deals Block (7 cols) ─── */}
          <div className="lg:col-span-7 bg-white flex flex-col">
            {/* Header area — fixed height to align with left side */}
            <div style={{ minHeight: '56px' }} className="flex items-start justify-between gap-2 flex-wrap">
              <div>
                <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                  Today&apos;s Deals
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Deals Available only for today, Hurry Up!
                </p>
              </div>
              <a
                href="/deals"
                className="inline-flex items-center gap-1 text-white text-xs font-semibold px-3.5 py-1.5 transition-colors self-start rounded bg-slate-700"
              >
                View All
                <EPFChevronRight size={12} />
              </a>
            </div>

            {/* 6 product cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-4">
              {todaysDeals.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
