"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ChevronRight,
  Home,
  Flame,
  ShoppingCart,
  Package,
  FlameKindling,
} from "lucide-react";
import { useUIStore, useCartStore } from "@/store";
import { apiFetch } from "@/lib/api";
import Header from "@/components/epf/Header";
import Footer from "@/components/epf/Footer";
import CartDrawer from "@/components/epf/CartDrawer";
import CheckoutDialog from "@/components/epf/CheckoutDialog";
import ProductDetailDialog from "@/components/epf/ProductDetailDialog";
import ServiceBookingDialog from "@/components/epf/ServiceBookingDialog";
import ProjectDetailDialog from "@/components/epf/ProjectDetailDialog";
import ChatWidget from "@/components/epf/ChatWidget";
import BackToTopButton from "@/components/epf/BackToTopButton";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
interface Product {
  id: string;
  name: string;
  nameBn?: string;
  price: number;
  comparePrice: number | null;
  rating: number;
  review_count?: number;
  reviews?: number;
  stock: number;
  sold?: number;
  image: string | null;
  images?: string[];
  sku?: string;
  category?: { id: string; name: string; slug: string } | null;
  type?: string;
  createdAt?: string;
}

interface ProductsResponse {
  products: Product[];
  total: number;
  page: number;
  limit: number;
}

/* ------------------------------------------------------------------ */
/*  Countdown Timer (same as FlashDeals — starts at 5h 42m 18s, loops) */
/* ------------------------------------------------------------------ */
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
          setHours((h) => {
            if (h > 0) return h - 1;
            return 5;
          });
          return 59;
        });
        return 59;
      });
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[14px] text-[#6B7280]">Ends in:</span>
      <div className="flex gap-1">
        <span className="bg-[#111827] text-white text-[14px] font-semibold px-2 py-1 rounded min-w-[30px] text-center tabular-nums">
          {pad(hours)}
        </span>
        <span className="text-[#6B7280] font-semibold text-[14px]">:</span>
        <span className="bg-[#111827] text-white text-[14px] font-semibold px-2 py-1 rounded min-w-[30px] text-center tabular-nums">
          {pad(minutes)}
        </span>
        <span className="text-[#6B7280] font-semibold text-[14px]">:</span>
        <span className="bg-[#111827] text-white text-[14px] font-semibold px-2 py-1 rounded min-w-[30px] text-center tabular-nums">
          {pad(seconds)}
        </span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Loading Skeleton                                                   */
/* ------------------------------------------------------------------ */
function DealCardSkeleton() {
  return (
    <div className="border border-[#E2E8F0] rounded animate-pulse">
      <div className="aspect-square bg-[#F8FAFC] rounded-t" />
      <div className="p-3 space-y-2.5">
        <div className="h-3 bg-[#F1F5F9] rounded w-16" />
        <div className="h-3.5 bg-[#F1F5F9] rounded w-full" />
        <div className="h-3.5 bg-[#F1F5F9] rounded w-3/4" />
        <div className="flex items-center gap-2">
          <div className="h-5 bg-[#F1F5F9] rounded w-20" />
          <div className="h-4 bg-[#F1F5F9] rounded w-16" />
        </div>
        <div className="h-8 bg-[#F1F5F9] rounded w-full mt-1" />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Deal Card                                                          */
/* ------------------------------------------------------------------ */
function DealCard({ product }: { product: Product }) {
  const { setSelectedProductId, setProductDetailOpen } = useUIStore();
  const addItem = useCartStore((s) => s.addItem);

  const discount = product.comparePrice
    ? Math.round((1 - product.price / product.comparePrice) * 100)
    : 0;



  const isDigital =
    product.name?.toLowerCase().includes("guide") ||
    product.name?.toLowerCase().includes("pdf");

  return (
    <div className="border border-[#E2E8F0] rounded hover:shadow-sm transition-shadow group">
      {/* Image */}
      <div
        className="relative aspect-square bg-[#F8FAFC] flex items-center justify-center overflow-hidden rounded-t cursor-pointer"
        onClick={() => {
          setSelectedProductId(product.id);
          setProductDetailOpen(true);
        }}
      >
        {isDigital ? (
          <Package className="h-10 w-10 text-[#CBD5E1]" />
        ) : (
          <Package className="h-10 w-10 text-[#CBD5E1]" />
        )}
        {/* Discount Badge */}
        {discount > 0 && (
          <span className="absolute top-2 left-2 bg-[#D63E02] text-white text-[12px] font-semibold px-2 py-0.5 rounded">
            -{discount}%
          </span>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        {/* Category label */}
        {product.category?.name && (
          <p className="text-[12px] text-[#6B7280] mb-1 uppercase tracking-wide">
            {product.category.name}
          </p>
        )}

        {/* Name */}
        <button
          onClick={() => {
            setSelectedProductId(product.id);
            setProductDetailOpen(true);
          }}
          className="block text-[14px] text-[#374151] line-clamp-2 leading-snug mb-2 hover:text-[#111827] transition-colors text-left w-full"
        >
          {product.name}
        </button>

        {/* Prices */}
        <div className="flex items-baseline gap-2 mb-2.5">
          <span className="text-[16px] font-semibold text-[#0EA5E9]">
            ৳{(product.price ?? 0).toLocaleString()}
          </span>
          {product.comparePrice && (
            <span className="text-[14px] text-[#6B7280] line-through">
              ৳{(product.comparePrice ?? 0).toLocaleString()}
            </span>
          )}
        </div>

        {/* Add to Cart */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            addItem({
              productId: product.id,
              productName: product.name,
              productImage: product.image || "",
              price: product.price,
              quantity: 1,
            });
          }}
          className="w-full h-8 flex items-center justify-center gap-1.5 bg-[#111827] text-white text-[13px] font-medium rounded hover:bg-[#0EA5E9] transition-colors"
        >
          <ShoppingCart className="h-3.5 w-3.5" />
          Add to Cart
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Page                                                          */
/* ------------------------------------------------------------------ */
export default function DealsPage() {
  const { data: productsEnvelope, isLoading, isError } = useQuery<{ data: { data: Product[]; pagination: any } }>({
    queryKey: ["all-deal-products"],
    queryFn: () => apiFetch("/api/products?limit=50"),
  });

  const deals = (() => {
    const products = productsEnvelope?.data?.data ?? [];
    return products.filter(
      (p) => p.comparePrice && p.comparePrice > p.price
    );
  })();

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      <Header />

      <main className="flex-1">
        {/* Banner Header */}
        <section className="bg-white border-b border-[#E2E8F0]">
          <div className="mx-auto max-w-[1920px] px-4 sm:px-12 py-5">
            {/* Breadcrumb */}
            <nav
              aria-label="Breadcrumb"
              className="flex items-center gap-1.5 text-[13px] text-[#6B7280] mb-5"
            >
              <a
                href="/"
                className="flex items-center gap-1 hover:text-[#111827] transition-colors"
              >
                <Home className="h-3.5 w-3.5" />
                Home
              </a>
              <ChevronRight className="h-3 w-3" />
              <span className="text-[#111827] font-medium">Best Deals</span>
            </nav>

            {/* Title + Countdown */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-[#0EA5E9] text-white px-4 py-2.5 rounded">
                  <Flame className="h-5 w-5" />
                  <span className="text-[20px] font-semibold">Best Deals</span>
                </div>
                <CountdownTimer />
              </div>
              <p className="text-[14px] text-[#374151]">
                {isLoading ? (
                  <span className="inline-block h-4 w-24 bg-[#F1F5F9] rounded animate-pulse" />
                ) : (
                  <>{deals.length} deal{deals.length !== 1 ? "s" : ""} available</>
                )}
              </p>
            </div>
          </div>
        </section>

        {/* Deals Grid */}
        <section className="mx-auto max-w-[1920px] px-4 sm:px-12 py-6">
          {isLoading && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 12 }).map((_, i) => (
                <DealCardSkeleton key={i} />
              ))}
            </div>
          )}

          {isError && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <FlameKindling className="h-12 w-12 text-[#CBD5E1] mb-4" />
              <p className="text-[16px] text-[#374151] font-medium mb-1">
                Something went wrong
              </p>
              <p className="text-[14px] text-[#6B7280]">
                Please refresh the page to try again
              </p>
            </div>
          )}

          {!isLoading && !isError && deals.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <FlameKindling className="h-12 w-12 text-[#CBD5E1] mb-4" />
              <p className="text-[20px] text-[#111827] font-semibold mb-1">
                No deals available right now
              </p>
              <p className="text-[14px] text-[#6B7280] mb-5">
                Check back soon for new flash deals and discounts
              </p>
              <a
                href="/"
                className="inline-flex items-center gap-1.5 h-10 px-6 bg-[#0EA5E9] text-white text-[14px] font-medium rounded hover:bg-[#0284C7] transition-colors"
              >
                <Home className="h-4 w-4" />
                Back to Home
              </a>
            </div>
          )}

          {!isLoading && !isError && deals.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {deals.map((product) => (
                <DealCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </section>
      </main>

      <Footer />

      {/* Overlays & Dialogs */}
      <CartDrawer />
      <CheckoutDialog />
      <ServiceBookingDialog />
      <ProductDetailDialog />
      <ProjectDetailDialog />
      <ChatWidget />
      <BackToTopButton />
    </div>
  );
}
