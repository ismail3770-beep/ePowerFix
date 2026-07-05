"use client";

import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ChevronRight,
  Home,
  Flame,
  ShoppingCart,
  Package,
  FlameKindling,
  Star,
  Eye,
  Heart,
  Zap,
  TrendingDown,
  Clock,
  ArrowRight,
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
import { EPFCart, EPFCircuitBreaker, EPFFileText } from "@/components/epf/icons/EPFIcons";
import { toast } from "sonner";

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

/* ------------------------------------------------------------------ */
/*  Countdown Timer (starts at 5h 42m 18s, loops)                      */
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

  const boxes = [
    { value: pad(0), label: "Days" },
    { value: pad(hours), label: "Hours" },
    { value: pad(minutes), label: "Minutes" },
    { value: pad(seconds), label: "Seconds" },
  ];

  return (
    <div className="flex items-center gap-1.5">
      {boxes.map((box, i) => (
        <div key={box.label} className="flex items-center gap-1.5">
          <div className="flex flex-col items-center">
            <span className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white font-bold text-[28px] leading-none w-14 h-14 flex items-center justify-center tabular-nums">
              {box.value}
            </span>
            <span className="text-white/60 text-[10px] mt-1.5 uppercase tracking-wider">
              {box.label}
            </span>
          </div>
          {i < boxes.length - 1 && (
            <span className="text-white/60 font-bold text-[24px] mb-4">:</span>
          )}
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Loading Skeleton                                                   */
/* ------------------------------------------------------------------ */
function DealCardSkeleton() {
  return (
    <div className="bg-white border border-[#E2E8F0] rounded-lg animate-pulse">
      <div className="aspect-square bg-[#F1F5F9] rounded-t-lg" />
      <div className="p-3.5 space-y-2.5">
        <div className="h-3.5 bg-[#F1F5F9] rounded w-full" />
        <div className="h-3.5 bg-[#F1F5F9] rounded w-3/4" />
        <div className="flex items-center gap-2">
          <div className="h-5 bg-[#F1F5F9] rounded w-20" />
          <div className="h-4 bg-[#F1F5F9] rounded w-16" />
        </div>
        <div className="h-2 bg-[#E5E7EB] rounded-full" />
        <div className="h-3 bg-[#F1F5F9] rounded w-24" />
        <div className="h-10 bg-[#F1F5F9] rounded-lg w-full" />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Sort & Filter Options                                              */
/* ------------------------------------------------------------------ */
type SortOption = "discount" | "price-asc" | "price-desc" | "popular";
type DiscountFilter = "all" | "up-to-10" | "10-25" | "25-plus";

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "discount", label: "Discount %" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "popular", label: "Most Popular" },
];

const DISCOUNT_FILTERS: { value: DiscountFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "up-to-10", label: "Up to 10%" },
  { value: "10-25", label: "10-25%" },
  { value: "25-plus", label: "25%+" },
];

/* ------------------------------------------------------------------ */
/*  Deal Card                                                          */
/* ------------------------------------------------------------------ */
function DealCard({ product }: { product: Product }) {
  const { setSelectedProductId, setProductDetailOpen } = useUIStore();
  const addItem = useCartStore((s) => s.addItem);
  const [added, setAdded] = useState(false);

  const discount = product.comparePrice
    ? Math.round((1 - product.price / product.comparePrice) * 100)
    : 0;

  const savings = product.comparePrice
    ? Math.round(product.comparePrice - product.price)
    : 0;

  const sold = product.sold ?? 0;
  const stock = product.stock ?? 0;
  const claimedPercent = stock > 0 ? Math.min(Math.round((sold / (sold + stock)) * 100), 100) : 0;
  const isLowStock = stock < 10;

  const isDigital =
    product.name?.toLowerCase().includes("guide") ||
    product.name?.toLowerCase().includes("pdf");

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    addItem({
      productId: product.id,
      productName: product.name,
      productImage: product.image || "",
      price: product.price,
      quantity: 1,
    });
    toast.success("Added to cart!");
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  const handleViewDetails = () => {
    setSelectedProductId(product.id);
    setProductDetailOpen(true);
  };

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-lg shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 group flex flex-col">
      {/* Image Area */}
      <div
        className="relative aspect-square bg-[#F8FAFC] flex items-center justify-center overflow-hidden rounded-t-lg cursor-pointer"
        onClick={handleViewDetails}
      >
        {isDigital ? (
          <EPFFileText className="h-10 w-10 text-[#CBD5E1]" />
        ) : product.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <Package className="h-10 w-10 text-[#CBD5E1]" />
        )}

        {/* Discount Badge */}
        {discount > 0 && (
          <span className="absolute top-2.5 left-2.5 bg-red-500 text-white text-[14px] font-bold px-2.5 py-1 rounded-lg shadow-sm">
            Save {discount}%
          </span>
        )}

        {/* Flash Deal Ribbon */}
        <span className="absolute top-2.5 right-2.5 bg-orange-500 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm">
          Flash Deal
        </span>

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-4 rounded-t-lg">
          <button
            onClick={handleViewDetails}
            className="flex items-center gap-1.5 bg-white text-[#111827] text-[13px] font-medium px-4 py-2 rounded-lg hover:bg-white/90 transition-colors"
          >
            <Eye className="h-4 w-4" />
            View Details
          </button>
        </div>
      </div>

      {/* Info Area */}
      <div className="p-3.5 flex flex-col flex-1">
        {/* Category label */}
        {product.category?.name && (
          <p className="text-[11px] text-[#6B7280] mb-1 uppercase tracking-wide">
            {product.category.name}
          </p>
        )}

        {/* Product Name */}
        <button
          onClick={handleViewDetails}
          className="block text-[14px] text-[#374151] font-medium line-clamp-2 leading-snug mb-2 hover:text-epf-500 transition-colors text-left w-full"
        >
          {product.name}
        </button>

        {/* Price Section */}
        <div className="flex items-baseline gap-2 mb-1.5">
          <span className="text-[18px] font-bold text-epf-500">
            ৳{(product.price ?? 0).toLocaleString()}
          </span>
          {product.comparePrice && (
            <span className="text-[14px] text-[#9CA3AF] line-through">
              ৳{(product.comparePrice ?? 0).toLocaleString()}
            </span>
          )}
        </div>

        {/* You Save */}
        {savings > 0 && (
          <p className="text-[12px] text-red-500 font-medium mb-2.5">
            Save ৳{savings.toLocaleString()}
          </p>
        )}

        {/* Rating */}
        {product.rating > 0 && (
          <div className="flex items-center gap-1 mb-2.5">
            <div className="flex items-center gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`h-3 w-3 ${
                    i < Math.round(product.rating)
                      ? "fill-amber-400 text-amber-400"
                      : "text-[#E5E7EB]"
                  }`}
                />
              ))}
            </div>
            <span className="text-[12px] text-[#6B7280]">
              ({product.review_count ?? product.reviews ?? 0})
            </span>
          </div>
        )}

        {/* Stock Progress Bar */}
        <div className="mb-3">
          {stock > 0 && sold > 0 && (
            <p className="text-[11px] text-[#9CA3AF] mb-1">
              {sold.toLocaleString()} sold out of {(sold + stock).toLocaleString()}
            </p>
          )}
          <div className="h-2 bg-[#E5E7EB] rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-red-500 to-orange-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${claimedPercent}%` }}
            />
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-[11px] text-red-500 font-medium">
              {claimedPercent}% claimed
            </span>
            {isLowStock && (
              <span className="text-[11px] text-red-500 font-semibold animate-pulse">
                🔥 Only {stock} left!
              </span>
            )}
          </div>
        </div>

        {/* Add to Cart Button */}
        <button
          onClick={handleAddToCart}
          className={`w-full h-10 flex items-center justify-center gap-1.5 text-[14px] font-medium rounded-lg transition-all duration-300 mt-auto ${
            added
              ? "bg-green-500 text-white"
              : "bg-epf-500 hover:bg-epf-600 text-white"
          }`}
        >
          {added ? (
            <>
              <span className="text-[16px]">✓</span>
              Added!
            </>
          ) : (
            <>
              <ShoppingCart className="h-4 w-4" />
              Add to Cart
            </>
          )}
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Page                                                          */
/* ------------------------------------------------------------------ */
export default function DealsPage() {
  const [sortBy, setSortBy] = useState<SortOption>("discount");
  const [discountFilter, setDiscountFilter] = useState<DiscountFilter>("all");

  const { data: productsEnvelope, isLoading, isError, refetch } = useQuery<{
    data: { data: Product[]; pagination: any };
  }>({
    queryKey: ["all-deal-products"],
    queryFn: () => apiFetch("/api/products?limit=50&bestDeals=true"),
  });

  const allDeals = (() => {
    const products = productsEnvelope?.data?.data ?? [];
    // The API already filters by isBestDeal=true, so just return all.
    return products;
  })();

  const getDiscount = useCallback((p: Product) => {
    return p.comparePrice
      ? Math.round((1 - p.price / p.comparePrice) * 100)
      : 0;
  }, []);

  // Apply discount filter
  const filteredDeals = (() => {
    let deals = allDeals;
    switch (discountFilter) {
      case "up-to-10":
        deals = deals.filter((p) => getDiscount(p) <= 10);
        break;
      case "10-25":
        deals = deals.filter((p) => {
          const d = getDiscount(p);
          return d > 10 && d <= 25;
        });
        break;
      case "25-plus":
        deals = deals.filter((p) => getDiscount(p) > 25);
        break;
    }
    return deals;
  })();

  // Apply sorting
  const sortedDeals = (() => {
    const sorted = [...filteredDeals];
    switch (sortBy) {
      case "discount":
        sorted.sort((a, b) => getDiscount(b) - getDiscount(a));
        break;
      case "price-asc":
        sorted.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        sorted.sort((a, b) => b.price - a.price);
        break;
      case "popular":
        sorted.sort((a, b) => (b.sold ?? 0) - (a.sold ?? 0));
        break;
    }
    return sorted;
  })();

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      <Header />

      <main className="flex-1">
        {/* ------------------------------------------------------------------ */}
        {/*  Top Banner with Gradient                                           */}
        {/* ------------------------------------------------------------------ */}
        <section className="relative bg-gradient-to-r from-[#111827] to-[#1E3A8A] overflow-hidden">
          {/* Dot pattern overlay */}
          <div
            className="absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage:
                "radial-gradient(circle, white 1px, transparent 1px)",
              backgroundSize: "24px 24px",
            }}
          />

          <div className="relative mx-auto max-w-[1400px] px-4 sm:px-12 py-10 sm:py-14">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
              {/* Left Side */}
              <div className="space-y-4">
                {/* Breadcrumb */}
                <nav
                  aria-label="Breadcrumb"
                  className="flex items-center gap-1.5 text-[13px] text-white/60 mb-2"
                >
                  <a
                    href="/"
                    className="flex items-center gap-1 hover:text-white transition-colors"
                  >
                    <Home className="h-3.5 w-3.5" />
                    Home
                  </a>
                  <ChevronRight className="h-3 w-3" />
                  <span className="text-white font-medium">Best Deals</span>
                </nav>

                <div className="flex items-center gap-3">
                  <Flame className="h-7 w-7 text-orange-400" />
                  <h1 className="text-white text-[28px] sm:text-[32px] font-bold">
                    Flash Deals
                  </h1>
                </div>
                <p className="text-white/70 text-[15px] max-w-lg">
                  Massive discounts on top electrical products. Limited time
                  only!
                </p>

                {/* Countdown */}
                <div>
                  <p className="text-white/60 text-[13px] mb-3">
                    Offer ends in:
                  </p>
                  <CountdownTimer />
                </div>
              </div>

              {/* Right Side — desktop only */}
              <div className="hidden lg:flex flex-col items-center justify-center space-y-2">
                <Zap className="h-16 w-16 text-orange-400 animate-pulse" />
                <span className="text-[42px] font-extrabold text-orange-400 leading-none">
                  Up to 50%
                </span>
                <span className="text-white/80 text-[18px] font-semibold -mt-1">
                  OFF
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------------ */}
        {/*  Filter / Sort Bar                                                  */}
        {/* ------------------------------------------------------------------ */}
        {!isLoading && !isError && allDeals.length > 0 && (
          <section className="bg-white border-b border-[#E2E8F0] sticky top-0 z-20">
            <div className="mx-auto max-w-[1400px] px-4 sm:px-12 py-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                {/* Results count */}
                <p className="text-[14px] text-[#374151] font-medium">
                  {sortedDeals.length} deal{sortedDeals.length !== 1 ? "s" : ""}{" "}
                  available
                </p>

                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  {/* Sort Dropdown */}
                  <div className="relative">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as SortOption)}
                      className="appearance-none bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-[13px] text-[#374151] font-medium pl-3 pr-8 py-2 focus:outline-none focus:ring-2 focus:ring-epf-500/20 focus:border-epf-500 cursor-pointer"
                    >
                      {SORT_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          Sort by: {opt.label}
                        </option>
                      ))}
                    </select>
                    <ChevronRight className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#6B7280] rotate-90 pointer-events-none" />
                  </div>

                  {/* Discount Filter Pills */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {DISCOUNT_FILTERS.map((f) => (
                      <button
                        key={f.value}
                        onClick={() => setDiscountFilter(f.value)}
                        className={`text-[12px] font-medium px-3 py-1.5 rounded-full border transition-all duration-200 ${
                          discountFilter === f.value
                            ? "bg-epf-500 text-white border-epf-500"
                            : "bg-white text-[#6B7280] border-[#E2E8F0] hover:border-epf-500 hover:text-epf-500"
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ------------------------------------------------------------------ */}
        {/*  Deals Grid                                                        */}
        {/* ------------------------------------------------------------------ */}
        <section className="mx-auto max-w-[1400px] px-4 sm:px-12 py-6 sm:py-8">
          {/* Loading State */}
          {isLoading && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
              {Array.from({ length: 12 }).map((_, i) => (
                <DealCardSkeleton key={i} />
              ))}
            </div>
          )}

          {/* Error State */}
          {isError && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="h-16 w-16 rounded-full bg-red-50 flex items-center justify-center mb-4">
                <FlameKindling className="h-8 w-8 text-red-400" />
              </div>
              <p className="text-[18px] text-[#111827] font-semibold mb-1">
                Something went wrong
              </p>
              <p className="text-[14px] text-[#6B7280] mb-5">
                We couldn&apos;t load the deals. Please try again.
              </p>
              <button
                onClick={() => refetch()}
                className="inline-flex items-center gap-1.5 h-10 px-6 bg-epf-500 hover:bg-epf-600 text-white text-[14px] font-medium rounded-lg transition-colors"
              >
                <Clock className="h-4 w-4" />
                Try Again
              </button>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !isError && allDeals.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="h-20 w-20 rounded-full bg-orange-50 flex items-center justify-center mb-5">
                <Flame className="h-10 w-10 text-orange-300" />
              </div>
              <p className="text-[20px] text-[#111827] font-semibold mb-1">
                No deals available right now
              </p>
              <p className="text-[14px] text-[#6B7280] mb-6">
                Check back soon for new flash deals and discounts
              </p>
              <a
                href="/"
                className="inline-flex items-center gap-1.5 h-10 px-6 bg-epf-500 hover:bg-epf-600 text-white text-[14px] font-medium rounded-lg transition-colors"
              >
                <Home className="h-4 w-4" />
                Back to Home
              </a>
            </div>
          )}

          {/* No Results After Filter */}
          {!isLoading &&
            !isError &&
            allDeals.length > 0 &&
            sortedDeals.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <TrendingDown className="h-12 w-12 text-[#CBD5E1] mb-4" />
                <p className="text-[16px] text-[#111827] font-medium mb-1">
                  No deals match this filter
                </p>
                <p className="text-[14px] text-[#6B7280] mb-4">
                  Try adjusting your discount range
                </p>
                <button
                  onClick={() => setDiscountFilter("all")}
                  className="text-epf-500 hover:text-epf-600 text-[14px] font-medium inline-flex items-center gap-1 transition-colors"
                >
                  Clear filters
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

          {/* Deals Grid */}
          {!isLoading &&
            !isError &&
            sortedDeals.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
                {sortedDeals.map((product) => (
                  <DealCard key={product.id} product={product} />
                ))}
              </div>
            )}
        </section>

        {/* ------------------------------------------------------------------ */}
        {/*  Bottom CTA Section                                                */}
        {/* ------------------------------------------------------------------ */}
        {!isLoading && !isError && allDeals.length > 0 && (
          <section className="bg-white border-t border-[#E2E8F0]">
            <div className="mx-auto max-w-[1400px] px-4 sm:px-12 py-12 sm:py-16">
              <div className="max-w-2xl mx-auto text-center space-y-4">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Flame className="h-6 w-6 text-orange-500" />
                  <h2 className="text-[22px] sm:text-[26px] font-bold text-[#111827]">
                    Don&apos;t miss out!
                  </h2>
                </div>
                <p className="text-[15px] text-[#6B7280]">
                  Subscribe to our newsletter for exclusive deals and
                  early access to flash sales.
                </p>
                <div className="flex flex-col sm:flex-row items-center gap-3 max-w-md mx-auto pt-2">
                  <input
                    type="email"
                    placeholder="Enter your email"
                    className="flex-1 w-full h-11 px-4 border border-[#E2E8F0] rounded-lg text-[14px] text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-epf-500/20 focus:border-epf-500"
                  />
                  <button className="w-full sm:w-auto h-11 px-6 bg-epf-500 hover:bg-epf-600 text-white text-[14px] font-medium rounded-lg transition-colors inline-flex items-center justify-center gap-1.5 whitespace-nowrap">
                    Subscribe
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
                <a
                  href="/"
                  className="inline-flex items-center gap-1.5 text-epf-500 hover:text-epf-600 text-[14px] font-medium mt-3 transition-colors"
                >
                  or Shop All Products
                  <ChevronRight className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          </section>
        )}
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
