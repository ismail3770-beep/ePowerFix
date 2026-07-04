"use client";
import { useState, useEffect } from "react";
import { EPFCart, EPFCircuitBreaker } from "@/components/epf/icons/EPFIcons";
import { apiFetch } from "@/lib/api";
import { useCartStore } from "@/store";
import { toast } from "sonner";

interface Product {
  id: string;
  name: string;
  price: number;
  comparePrice: number | null;
  sold: number;
  stock: number;
  images: string[];
}

const fallbackDeals: Product[] = [
  { id: "bd1", name: "Gold Wristwatch — Premium", price: 6693.75, comparePrice: 7875.0, sold: 12, stock: 8, images: [] },
  { id: "bd2", name: "Solar Inverter 5kVA", price: 1879.5, comparePrice: 1890.0, sold: 18, stock: 14, images: [] },
  { id: "bd3", name: "USB-C Fast Charger 65W", price: 12.6, comparePrice: null, sold: 34, stock: 22, images: [] },
  { id: "bd4", name: "Industrial Safety Cap", price: 15.75, comparePrice: null, sold: 89, stock: 45, images: [] },
  { id: "bd5", name: "3-core 4mm² PVC Cable", price: 1850.0, comparePrice: 2200.0, sold: 56, stock: 30, images: [] },
  { id: "bd6", name: "MCB 32A Double Pole", price: 450.0, comparePrice: 550.0, sold: 73, stock: 18, images: [] },
  { id: "bd7", name: "LED Panel Light 36W", price: 890.0, comparePrice: 1200.0, sold: 41, stock: 25, images: [] },
  { id: "bd8", name: "Digital Multimeter Fluke", price: 3200.0, comparePrice: 3800.0, sold: 15, stock: 10, images: [] },
  { id: "bd9", name: "Safety Boots — Industrial", price: 1250.0, comparePrice: null, sold: 67, stock: 20, images: [] },
  { id: "bd10", name: "Solar Panel 400W Mono", price: 9500.0, comparePrice: 11000.0, sold: 8, stock: 12, images: [] },
];

function DealCard({ product }: { product: Product }) {
  const addItem = useCartStore((s) => s.addItem);
  const [added, setAdded] = useState(false);

  const discount = product.comparePrice
    ? Math.round((1 - product.price / product.comparePrice) * 100)
    : 0;

  const fmtPrice = (n: number) =>
    "৳" + n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem({
      productId: product.id,
      productName: product.name,
      productImage: product.images?.[0] ?? "",
      price: product.price,
      quantity: 1,
    });
    setAdded(true);
    toast.success(`${product.name} added to cart!`);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <a
      href={`/product/${product.id}`}
      className="block border border-dark-200/80 rounded-lg bg-white shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 group overflow-hidden"
    >
      {/* ── Image ── */}
      <div className="relative aspect-square bg-dark-100/50 overflow-hidden">
        {product.images?.[0] ? (
          <img
            src={product.images[0]}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-dark-50">
            <EPFCircuitBreaker size={40} className="text-dark-300" />
          </div>
        )}

        {/* Discount badge — red, top-left */}
        {discount > 0 && (
          <span className="absolute top-2 left-2 bg-red-500 text-white text-[11px] font-bold px-2 py-0.5 rounded-sm">
            -{discount}%
          </span>
        )}

        {/* Hover cart — slides up, bg-dark-900/90 */}
        <div className="absolute inset-x-0 bottom-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
          <button
            onClick={handleAddToCart}
            className={`w-full text-white text-[13px] font-medium py-2.5 rounded-md flex items-center justify-center gap-2 transition-colors backdrop-blur-sm ${
              added ? "bg-green-600" : "bg-dark-900/90 hover:bg-dark-900"
            }`}
          >
            {added ? (
              <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <EPFCart size={14} />
            )}
            {added ? "Added!" : "Add to Cart"}
          </button>
        </div>
      </div>

      {/* ── Info — pointer-events-none so the <a> link works ── */}
      <div className="p-3 sm:p-3.5 flex flex-col gap-1.5 pointer-events-none">
        <h4 className="text-[13px] sm:text-[14px] font-medium text-dark-900 line-clamp-1 leading-snug">
          {product.name}
        </h4>

        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[15px] sm:text-[16px] font-bold text-dark-900">
            {fmtPrice(product.price)}
          </span>
          {product.comparePrice && (
            <span className="text-[12px] text-dark-400 line-through">
              {fmtPrice(product.comparePrice)}
            </span>
          )}
        </div>

        {/* Mobile cart — always visible, bg-epf-500, pointer-events-auto */}
        <button
          onClick={handleAddToCart}
          className="sm:hidden mt-1.5 h-8 bg-epf-500 hover:bg-epf-600 text-white text-[12px] font-semibold w-full flex items-center justify-center gap-1.5 rounded-md transition-colors pointer-events-auto"
        >
          {added ? (
            <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <EPFCart size={12} />
          )}
          {added ? "Added!" : "Add to Cart"}
        </button>
      </div>
    </a>
  );
}

export default function BestDeals() {
  const [deals, setDeals] = useState<Product[]>(fallbackDeals);

  useEffect(() => {
    (async () => {
      try {
        const res: any = await apiFetch("/api/products?limit=10");
        const products = res.data?.data;
        if (Array.isArray(products) && products.length >= 4) {
          setDeals(products.slice(0, 10));
        }
      } catch {
        /* keep fallback */
      }
    })();
  }, []);

  return (
    <section id="deals" className="bg-white py-10 sm:py-14">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-12">
        {/* ── Section Header ── */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-dark-900 tracking-tight">
              Best Deals
            </h2>
            <p className="text-sm text-dark-500 mt-1">
              Don&apos;t miss the chance — limited stock!
            </p>
          </div>

          <a
            href="/best-deals"
            className="hidden sm:inline-flex items-center gap-1.5 text-sm font-medium text-epf-500 hover:text-epf-600 transition-colors border border-epf-500 hover:border-epf-600 rounded-md px-4 py-2"
          >
            View All
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </a>
        </div>

        {/* ── Product Grid ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
          {deals.slice(0, 10).map((product) => (
            <DealCard key={product.id} product={product} />
          ))}
        </div>

        {/* ── Mobile "View All" ── */}
        <div className="sm:hidden mt-6 text-center">
          <a
            href="/best-deals"
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
