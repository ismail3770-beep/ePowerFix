"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Home,
  SlidersHorizontal,
  X,
  Grid3X3,
  List,
  PackageSearch,
  Star,
  Check,
  Eye,
  ShoppingCart,
  Package,
  FileText,
  Heart,
} from "lucide-react";
import { toast } from "sonner";
import { useUIStore, useCartStore } from "@/store";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import Header from "@/components/epf/Header";
import Footer from "@/components/epf/Footer";
import CartDrawer from "@/components/epf/CartDrawer";
import CheckoutDialog from "@/components/epf/CheckoutDialog";
import ProductDetailDialog from "@/components/epf/ProductDetailDialog";
import ServiceBookingDialog from "@/components/epf/ServiceBookingDialog";
import ProjectDetailDialog from "@/components/epf/ProjectDetailDialog";
import ChatWidget from "@/components/epf/ChatWidget";
import BackToTopButton from "@/components/epf/BackToTopButton";
import {
  PremiumCard,
  PremiumCardSkeleton,
  type PremiumCardData,
} from "@/components/epf/PremiumCard";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
interface Category {
  id: string;
  name: string;
  nameBn?: string;
  slug: string;
  image?: string | null;
  sortOrder?: number;
}

interface Brand {
  id: string;
  name: string;
  slug: string;
}

interface Product {
  id: string;
  name: string;
  nameBn?: string;
  price: number;
  salePrice?: number | null;
  comparePrice?: number | null;
  rating: number;
  review_count?: number;
  reviews?: number;
  stock: number;
  sold?: number;
  image: string | null;
  images?: string[];
  sku?: string;
  specifications?: Record<string, unknown>;
  shortDesc?: string;
  category?: { id: string; name: string; slug: string } | null;
  brand?: { id: string; name: string; slug: string } | null;
  type?: string;
  createdAt?: string;
  isFeatured?: boolean;
  isBestDeal?: boolean;
}

interface ProductsResponse {
  success?: boolean;
  data: {
    data: Product[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  message?: string;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */
const PRODUCTS_PER_PAGE = 20;

type SortOption = "featured" | "newest" | "price-asc" | "price-desc" | "popular";
type ViewMode = "grid" | "list";

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "featured", label: "Featured" },
  { value: "newest", label: "Newest" },
  { value: "popular", label: "Popular" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
];

const PRICE_RANGES = [
  { label: "Under ৳500", min: 0, max: 500 },
  { label: "৳500 – ৳2,000", min: 500, max: 2000 },
  { label: "৳2,000 – ৳5,000", min: 2000, max: 5000 },
  { label: "Above ৳5,000", min: 5000, max: Infinity },
];

const RATING_OPTIONS = [5, 4, 3, 2, 1];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */
function productToCardData(p: Product): PremiumCardData {
  return {
    id: p.id,
    name: p.name,
    price: p.price,
    salePrice: p.salePrice ?? null,
    comparePrice: p.comparePrice ?? null,
    images: p.images || [],
    image: p.image || p.images?.[0] || undefined,
    isFeatured: p.isFeatured,
    isBestDeal: p.isBestDeal,
    stock: p.stock,
    sku: p.sku,
    category: p.category?.name || null,
  };
}

/* ------------------------------------------------------------------ */
/*  Star Rating Display                                                */
/* ------------------------------------------------------------------ */
function StarRating({ rating, size = "sm" }: { rating: number; size?: "sm" | "md" }) {
  const fullStars = Math.round(rating || 0);
  const cls = size === "sm" ? "h-3 w-3" : "h-4 w-4";
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            cls,
            i < fullStars ? "fill-amber-400 text-amber-400" : "text-slate-300"
          )}
        />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  List-View Product Card                                             */
/* ------------------------------------------------------------------ */
function ProductCardList({ product }: { product: Product }) {
  const { setSelectedProductId, setProductDetailOpen } = useUIStore();
  const addItem = useCartStore((s) => s.addItem);

  const discount =
    product.comparePrice && product.comparePrice > product.price
      ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
      : 0;
  const isDigital =
    product.name?.toLowerCase().includes("guide") ||
    product.name?.toLowerCase().includes("pdf");
  const reviewCount = product.review_count ?? product.reviews ?? 0;
  const displayPrice = product.salePrice ?? product.price;
  const originalPrice = product.comparePrice ?? null;

  return (
    <div className="group flex flex-col sm:flex-row bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 overflow-hidden">
      {/* Image */}
      <div className="relative overflow-hidden sm:w-48 md:w-56 shrink-0 aspect-square sm:aspect-auto bg-slate-50">
        <a href={`/product/${product.id}`} className="block w-full h-full">
          {product.image ? (
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-contain p-3 group-hover:scale-105 transition-transform duration-500"
            />
          ) : isDigital ? (
            <div className="w-full h-full flex items-center justify-center">
              <FileText className="h-12 w-12 text-slate-300" />
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="h-12 w-12 text-slate-300" />
            </div>
          )}
        </a>
        {discount > 0 && (
          <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full text-[11px] font-bold text-white bg-epf-500 leading-tight shadow-sm">
            -{discount}%
          </span>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 p-4 sm:p-5 flex flex-col justify-between min-w-0">
        <div>
          {product.category && (
            <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400 mb-1">
              {product.category.name}
            </p>
          )}
          <a href={`/product/${product.id}`} className="block">
            <h3 className="text-[15px] font-semibold text-slate-900 line-clamp-2 leading-snug mb-2 group-hover:text-epf-600 transition-colors">
              {product.name}
            </h3>
          </a>
          <div className="flex items-center gap-1.5 mb-2.5">
            <StarRating rating={product.rating} size="md" />
            <span className="text-[13px] text-slate-400">
              ({reviewCount} reviews)
            </span>
          </div>
          {product.shortDesc && (
            <p className="text-[13px] text-slate-500 line-clamp-2 mb-2">
              {product.shortDesc}
            </p>
          )}
          {product.stock < 50 && (
            <p className="text-[12px] text-amber-600 font-medium mb-2">
              Only {product.stock} left in stock
            </p>
          )}
        </div>
        <div className="flex items-center justify-between gap-4 mt-3">
          <div className="flex items-baseline gap-2">
            <span className="text-[18px] font-bold text-epf-600">
              ৳{Number(displayPrice ?? 0).toLocaleString()}
            </span>
            {originalPrice && originalPrice > displayPrice && (
              <span className="text-[14px] text-slate-400 line-through">
                ৳{Number(originalPrice).toLocaleString()}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                addItem({
                  productId: product.id,
                  productName: product.name,
                  productImage: product.image || "",
                  price: Number(displayPrice ?? product.price),
                  quantity: 1,
                });
                toast.success("Added to cart", { description: product.name });
              }}
              className="flex items-center gap-1.5 h-9 px-4 bg-epf-500 hover:bg-epf-600 text-white text-[13px] font-semibold rounded-lg transition-colors"
            >
              <ShoppingCart className="h-4 w-4" />
              <span className="hidden sm:inline">Add to Cart</span>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedProductId(product.id);
                setProductDetailOpen(true);
              }}
              className="flex items-center justify-center h-9 w-9 border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50 hover:text-epf-500 transition-colors"
              title="Quick View"
            >
              <Eye className="h-4 w-4" />
            </button>
            <button
              onClick={(e) => e.stopPropagation()}
              className="flex items-center justify-center h-9 w-9 border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50 hover:text-red-500 transition-colors"
              title="Wishlist"
            >
              <Heart className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Filter Sidebar                                                     */
/* ------------------------------------------------------------------ */
interface FilterSidebarProps {
  categories: Category[];
  brands: Brand[];
  selectedCategoryId: string | null;
  onSelectCategory: (id: string | null) => void;
  selectedBrandId: string | null;
  onSelectBrand: (id: string | null) => void;
  selectedPriceRange: number | null;
  onSelectPriceRange: (idx: number | null) => void;
  selectedRating: number | null;
  onSelectRating: (rating: number | null) => void;
  inStockOnly: boolean;
  onToggleInStock: (val: boolean) => void;
  isLoading: boolean;
  onClearAll: () => void;
}

function FilterSidebar({
  categories,
  brands,
  selectedCategoryId,
  onSelectCategory,
  selectedBrandId,
  onSelectBrand,
  selectedPriceRange,
  onSelectPriceRange,
  selectedRating,
  onSelectRating,
  inStockOnly,
  onToggleInStock,
  isLoading,
  onClearAll,
}: FilterSidebarProps) {
  const [catOpen, setCatOpen] = useState(true);
  const [brandOpen, setBrandOpen] = useState(true);
  const [priceOpen, setPriceOpen] = useState(true);
  const [ratingOpen, setRatingOpen] = useState(true);

  const hasActiveFilters =
    selectedCategoryId ||
    selectedBrandId ||
    selectedPriceRange !== null ||
    selectedRating !== null ||
    inStockOnly;

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
      {/* Clear All header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-slate-50">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-slate-700" />
          <h2 className="text-[15px] font-semibold text-slate-900">Filters</h2>
        </div>
        {hasActiveFilters && (
          <button
            onClick={onClearAll}
            className="text-[12px] text-epf-600 font-semibold hover:text-epf-700 transition-colors"
          >
            Clear All
          </button>
        )}
      </div>

      <div className="p-5 space-y-5">
        {/* In-Stock Toggle */}
        <label className="flex items-center justify-between cursor-pointer group">
          <span className="text-[13px] font-semibold text-slate-700 group-hover:text-slate-900 transition-colors">
            In Stock Only
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={inStockOnly}
            onClick={() => onToggleInStock(!inStockOnly)}
            className={cn(
              "relative h-6 w-11 rounded-full transition-colors",
              inStockOnly ? "bg-epf-500" : "bg-slate-200"
            )}
          >
            <span
              className={cn(
                "absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform",
                inStockOnly && "translate-x-5"
              )}
            />
          </button>
        </label>

        <div className="h-px bg-slate-100" />

        {/* Categories */}
        <div>
          <button
            onClick={() => setCatOpen(!catOpen)}
            className="flex items-center justify-between w-full mb-3"
          >
            <h3 className="text-[13px] font-bold uppercase tracking-wider text-slate-700">
              Categories
            </h3>
            <ChevronDown
              className={cn(
                "h-4 w-4 text-slate-500 transition-transform duration-200",
                catOpen && "rotate-180"
              )}
            />
          </button>
          {catOpen && (
            <div className="space-y-1 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
              <button
                onClick={() => onSelectCategory(null)}
                className={cn(
                  "flex items-center gap-2.5 w-full py-1.5 px-1.5 rounded-lg text-left transition-colors",
                  selectedCategoryId === null
                    ? "bg-epf-50 text-epf-700"
                    : "text-slate-700 hover:bg-slate-50"
                )}
              >
                <div
                  className={cn(
                    "h-4 w-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors",
                    selectedCategoryId === null
                      ? "bg-epf-500 border-epf-500"
                      : "border-slate-300"
                  )}
                >
                  {selectedCategoryId === null && (
                    <Check className="h-3 w-3 text-white" strokeWidth={3} />
                  )}
                </div>
                <span className="text-[13px] font-medium">All Products</span>
              </button>
              {isLoading
                ? Array.from({ length: 6 }).map((_, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2.5 py-1.5 animate-pulse"
                    >
                      <div className="h-4 w-4 bg-slate-100 rounded" />
                      <div className="h-3.5 bg-slate-100 rounded w-24 flex-1" />
                    </div>
                  ))
                : categories.map((cat) => {
                    const active = selectedCategoryId === cat.id;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => onSelectCategory(active ? null : cat.id)}
                        className={cn(
                          "flex items-center gap-2.5 w-full py-1.5 px-1.5 rounded-lg text-left transition-colors",
                          active ? "bg-epf-50 text-epf-700" : "text-slate-700 hover:bg-slate-50"
                        )}
                      >
                        <div
                          className={cn(
                            "h-4 w-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors",
                            active ? "bg-epf-500 border-epf-500" : "border-slate-300"
                          )}
                        >
                          {active && (
                            <Check className="h-3 w-3 text-white" strokeWidth={3} />
                          )}
                        </div>
                        <span
                          className={cn(
                            "text-[13px] flex-1 truncate",
                            active ? "font-semibold" : "font-medium"
                          )}
                        >
                          {cat.name}
                        </span>
                      </button>
                    );
                  })}
            </div>
          )}
        </div>

        <div className="h-px bg-slate-100" />

        {/* Brands */}
        {brands.length > 0 && (
          <>
            <div>
              <button
                onClick={() => setBrandOpen(!brandOpen)}
                className="flex items-center justify-between w-full mb-3"
              >
                <h3 className="text-[13px] font-bold uppercase tracking-wider text-slate-700">
                  Brands
                </h3>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 text-slate-500 transition-transform duration-200",
                    brandOpen && "rotate-180"
                  )}
                />
              </button>
              {brandOpen && (
                <div className="space-y-1 max-h-52 overflow-y-auto pr-1 custom-scrollbar">
                  <button
                    onClick={() => onSelectBrand(null)}
                    className={cn(
                      "flex items-center gap-2.5 w-full py-1.5 px-1.5 rounded-lg text-left transition-colors",
                      selectedBrandId === null
                        ? "bg-epf-50 text-epf-700"
                        : "text-slate-700 hover:bg-slate-50"
                    )}
                  >
                    <div
                      className={cn(
                        "h-4 w-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors",
                        selectedBrandId === null
                          ? "bg-epf-500 border-epf-500"
                          : "border-slate-300"
                      )}
                    >
                      {selectedBrandId === null && (
                        <Check className="h-3 w-3 text-white" strokeWidth={3} />
                      )}
                    </div>
                    <span className="text-[13px] font-medium">All Brands</span>
                  </button>
                  {brands.map((b) => {
                    const active = selectedBrandId === b.id;
                    return (
                      <button
                        key={b.id}
                        onClick={() => onSelectBrand(active ? null : b.id)}
                        className={cn(
                          "flex items-center gap-2.5 w-full py-1.5 px-1.5 rounded-lg text-left transition-colors",
                          active ? "bg-epf-50 text-epf-700" : "text-slate-700 hover:bg-slate-50"
                        )}
                      >
                        <div
                          className={cn(
                            "h-4 w-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors",
                            active ? "bg-epf-500 border-epf-500" : "border-slate-300"
                          )}
                        >
                          {active && (
                            <Check className="h-3 w-3 text-white" strokeWidth={3} />
                          )}
                        </div>
                        <span
                          className={cn(
                            "text-[13px] flex-1 truncate",
                            active ? "font-semibold" : "font-medium"
                          )}
                        >
                          {b.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="h-px bg-slate-100" />
          </>
        )}

        {/* Price Range */}
        <div>
          <button
            onClick={() => setPriceOpen(!priceOpen)}
            className="flex items-center justify-between w-full mb-3"
          >
            <h3 className="text-[13px] font-bold uppercase tracking-wider text-slate-700">
              Price Range
            </h3>
            <ChevronDown
              className={cn(
                "h-4 w-4 text-slate-500 transition-transform duration-200",
                priceOpen && "rotate-180"
              )}
            />
          </button>
          {priceOpen && (
            <div className="grid grid-cols-1 gap-1.5">
              {PRICE_RANGES.map((range, idx) => {
                const active = selectedPriceRange === idx;
                return (
                  <button
                    key={idx}
                    onClick={() =>
                      onSelectPriceRange(active ? null : idx)
                    }
                    className={cn(
                      "flex items-center gap-2 text-[13px] font-medium px-2.5 h-9 rounded-lg border text-left transition-all duration-200",
                      active
                        ? "bg-epf-50 text-epf-700 border-epf-500"
                        : "border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                    )}
                  >
                    <div
                      className={cn(
                        "h-4 w-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
                        active ? "border-epf-500" : "border-slate-300"
                      )}
                    >
                      {active && (
                        <div className="h-2 w-2 rounded-full bg-epf-500" />
                      )}
                    </div>
                    {range.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="h-px bg-slate-100" />

        {/* Rating */}
        <div>
          <button
            onClick={() => setRatingOpen(!ratingOpen)}
            className="flex items-center justify-between w-full mb-3"
          >
            <h3 className="text-[13px] font-bold uppercase tracking-wider text-slate-700">
              Rating
            </h3>
            <ChevronDown
              className={cn(
                "h-4 w-4 text-slate-500 transition-transform duration-200",
                ratingOpen && "rotate-180"
              )}
            />
          </button>
          {ratingOpen && (
            <div className="space-y-1">
              {RATING_OPTIONS.map((r) => {
                const active = selectedRating === r;
                return (
                  <button
                    key={r}
                    onClick={() => onSelectRating(active ? null : r)}
                    className={cn(
                      "flex items-center gap-2 w-full px-2 py-1.5 rounded-lg text-left transition-colors",
                      active ? "bg-epf-50" : "hover:bg-slate-50"
                    )}
                  >
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={cn(
                            "h-3.5 w-3.5",
                            i < r ? "fill-amber-400 text-amber-400" : "text-slate-300"
                          )}
                        />
                      ))}
                    </div>
                    <span
                      className={cn(
                        "text-[12px]",
                        active ? "text-epf-700 font-semibold" : "text-slate-500"
                      )}
                    >
                      & up
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Pagination                                                         */
/* ------------------------------------------------------------------ */
function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  const pages: (number | "...")[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (currentPage > 3) pages.push("...");
    for (
      let i = Math.max(2, currentPage - 1);
      i <= Math.min(totalPages - 1, currentPage + 1);
      i++
    ) {
      pages.push(i);
    }
    if (currentPage < totalPages - 2) pages.push("...");
    pages.push(totalPages);
  }

  return (
    <div className="flex items-center justify-center gap-1.5 py-8">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        className="h-9 w-9 flex items-center justify-center border border-slate-200 rounded-lg text-slate-700 bg-white hover:bg-slate-50 hover:border-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        aria-label="Previous page"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      {pages.map((p, i) =>
        p === "..." ? (
          <span
            key={`ellipsis-${i}`}
            className="h-9 w-9 flex items-center justify-center text-slate-500 text-[14px]"
          >
            ...
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={cn(
              "h-9 min-w-9 px-2 flex items-center justify-center rounded-lg text-[14px] font-semibold transition-colors",
              p === currentPage
                ? "bg-epf-500 text-white shadow-sm hover:bg-epf-600"
                : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300"
            )}
          >
            {p}
          </button>
        )
      )}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        className="h-9 w-9 flex items-center justify-center border border-slate-200 rounded-lg text-slate-700 bg-white hover:bg-slate-50 hover:border-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        aria-label="Next page"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Empty State                                                        */
/* ------------------------------------------------------------------ */
function EmptyState({ onClear }: { onClear: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="h-20 w-20 rounded-full bg-slate-100 flex items-center justify-center mb-5">
        <PackageSearch className="h-10 w-10 text-slate-300" />
      </div>
      <h3 className="text-[18px] font-bold text-slate-900 mb-2">
        No products found
      </h3>
      <p className="text-[14px] text-slate-500 mb-6 text-center max-w-md">
        We couldn&apos;t find any products matching your filters. Try adjusting
        your selection or search terms.
      </p>
      <button
        onClick={onClear}
        className="h-11 px-6 bg-epf-500 hover:bg-epf-600 text-white text-[14px] font-semibold rounded-lg transition-colors shadow-sm"
      >
        Clear All Filters
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Sidebar Skeleton                                                   */
/* ------------------------------------------------------------------ */
function SidebarSkeleton() {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-6 animate-pulse shadow-sm">
      <div>
        <div className="h-5 bg-slate-100 rounded w-28 mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="h-4 w-4 bg-slate-100 rounded" />
              <div className="h-3.5 bg-slate-100 rounded w-28 flex-1" />
            </div>
          ))}
        </div>
      </div>
      <div>
        <div className="h-5 bg-slate-100 rounded w-24 mb-4" />
        <div className="grid grid-cols-1 gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-9 bg-slate-100 rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Page                                                          */
/* ------------------------------------------------------------------ */
export default function ShopPage() {
  /* ---- State ---- */
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedBrandId, setSelectedBrandId] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const [appliedSearch, setAppliedSearch] = useState(() => searchParams?.get("search") || "");
  const [sort, setSort] = useState<SortOption>("featured");
  const [page, setPage] = useState(1);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  /* Client-side filters */
  const [selectedPriceRange, setSelectedPriceRange] = useState<number | null>(null);
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [inStockOnly, setInStockOnly] = useState(false);

  /* ---- Stores ---- */
  const { setSearchQuery, setSelectedProductId, setProductDetailOpen } = useUIStore();

  /* ---- Sync search to global store ---- */
  useEffect(() => {
    setSearchQuery(appliedSearch);
  }, [appliedSearch, setSearchQuery]);

  /* ---- Fetch products ---- */
  const { data, isLoading, isError } = useQuery<ProductsResponse>({
    queryKey: [
      "shop-products",
      selectedCategoryId,
      selectedBrandId,
      appliedSearch,
      page,
      PRODUCTS_PER_PAGE,
    ],
    queryFn: () => {
      let url = `/api/products?limit=${PRODUCTS_PER_PAGE}&page=${page}`;
      if (selectedCategoryId)
        url += `&category=${encodeURIComponent(selectedCategoryId)}`;
      if (selectedBrandId) url += `&brandId=${encodeURIComponent(selectedBrandId)}`;
      if (appliedSearch) url += `&search=${encodeURIComponent(appliedSearch)}`;
      return apiFetch(url);
    },
  });

  /* ---- Fetch categories ---- */
  const { data: categoriesData, isLoading: categoriesLoading } = useQuery({
    queryKey: ["product-categories"],
    queryFn: () => apiFetch<{ data: Category[] }>("/api/product-categories"),
    staleTime: 5 * 60 * 1000,
  });
  const categories: Category[] = categoriesData?.data ?? [];

  /* ---- Fetch brands ---- */
  const { data: brandsData } = useQuery({
    queryKey: ["brands"],
    queryFn: () => apiFetch<{ data: Brand[] }>("/api/brands"),
    staleTime: 5 * 60 * 1000,
  });
  const brands: Brand[] = brandsData?.data ?? [];

  const totalProducts = data?.data?.total ?? 0;
  const totalPages = data?.data?.totalPages ?? Math.ceil(totalProducts / PRODUCTS_PER_PAGE);

  /* ---- Derived data with client-side sort + filter ---- */
  const processedProducts = useMemo(() => {
    const products = data?.data?.data ?? [];
    let arr = [...products];

    // Client-side price range filter
    if (selectedPriceRange !== null) {
      const range = PRICE_RANGES[selectedPriceRange];
      arr = arr.filter((p) => p.price >= range.min && p.price < range.max);
    }

    // Client-side rating filter
    if (selectedRating !== null) {
      arr = arr.filter((p) => Math.round(p.rating || 0) >= selectedRating);
    }

    // Client-side in-stock filter
    if (inStockOnly) {
      arr = arr.filter((p) => (p.stock ?? 0) > 0);
    }

    // Sort
    switch (sort) {
      case "price-asc":
        arr.sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
        break;
      case "price-desc":
        arr.sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
        break;
      case "newest":
        arr.sort(
          (a, b) =>
            new Date(b.createdAt || 0).getTime() -
            new Date(a.createdAt || 0).getTime()
        );
        break;
      case "popular":
        arr.sort(
          (a, b) =>
            (b.rating || 0) - (a.rating || 0) ||
            (b.sold || 0) - (a.sold || 0)
        );
        break;
      default:
        break;
    }
    return arr;
  }, [data?.data?.data, sort, selectedPriceRange, selectedRating, inStockOnly]);

  /* ---- Handlers ---- */
  useEffect(() => {
    const urlSearch = searchParams?.get("search") || "";
    setAppliedSearch(urlSearch);
  }, [searchParams]);

  const handleClearFilters = useCallback(() => {
    setSelectedCategoryId(null);
    setSelectedBrandId(null);
    setAppliedSearch("");
    setSort("featured");
    setPage(1);
    setSelectedPriceRange(null);
    setSelectedRating(null);
    setInStockOnly(false);
  }, []);

  const handleCategorySelect = useCallback((catId: string | null) => {
    setSelectedCategoryId(catId);
    setPage(1);
  }, []);

  const handleBrandSelect = useCallback((brandId: string | null) => {
    setSelectedBrandId(brandId);
    setPage(1);
  }, []);

  const handleSortChange = useCallback((newSort: SortOption) => {
    setSort(newSort);
    setPage(1);
  }, []);

  /* ---- Scroll to top on page change ---- */
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [page]);

  /* ---- Active labels ---- */
  const activeCategoryName = useMemo(() => {
    if (!selectedCategoryId) return null;
    return categories.find((c) => c.id === selectedCategoryId)?.name ?? null;
  }, [selectedCategoryId, categories]);

  const activeBrandName = useMemo(() => {
    if (!selectedBrandId) return null;
    return brands.find((b) => b.id === selectedBrandId)?.name ?? null;
  }, [selectedBrandId, brands]);

  const activePriceLabel = useMemo(() => {
    if (selectedPriceRange === null) return null;
    return PRICE_RANGES[selectedPriceRange]?.label ?? null;
  }, [selectedPriceRange]);

  const showingFrom = (page - 1) * PRODUCTS_PER_PAGE + 1;
  const showingTo = Math.min(page * PRODUCTS_PER_PAGE, totalProducts);

  const handleCardClick = useCallback(
    (id: string) => {
      setSelectedProductId(id);
      setProductDetailOpen(true);
    },
    [setSelectedProductId, setProductDetailOpen]
  );

  const sidebarProps = {
    categories,
    brands,
    selectedCategoryId,
    onSelectCategory: handleCategorySelect,
    selectedBrandId,
    onSelectBrand: handleBrandSelect,
    selectedPriceRange,
    onSelectPriceRange: setSelectedPriceRange,
    selectedRating,
    onSelectRating: setSelectedRating,
    inStockOnly,
    onToggleInStock: setInStockOnly,
    isLoading: categoriesLoading,
    onClearAll: handleClearFilters,
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />

      <main className="flex-1">
        {/* Breadcrumb */}
        <div className="bg-white border-b border-slate-200">
          <div className="mx-auto max-w-[1400px] px-4 sm:px-8 lg:px-12">
            <nav className="flex items-center gap-1.5 h-11 text-[13px]">
              <a
                href="/"
                className="flex items-center gap-1 text-slate-500 hover:text-epf-600 transition-colors"
              >
                <Home className="h-3.5 w-3.5" />
                <span>Home</span>
              </a>
              <ChevronRight className="h-3 w-3 text-slate-300" />
              <span className="text-slate-900 font-medium">Shop</span>
            </nav>
          </div>
        </div>

        {/* Page Heading + Toolbar */}
        <div className="bg-white border-b border-slate-200">
          <div className="mx-auto max-w-[1400px] px-4 sm:px-8 lg:px-12 py-5">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              {/* Left: Title + count */}
              <div>
                <h1 className="text-[24px] font-bold text-slate-900 tracking-tight">
                  Shop
                </h1>
                <p className="text-[13px] text-slate-500 mt-1">
                  {isLoading ? (
                    <span className="inline-block w-40 h-4 bg-slate-100 rounded animate-pulse align-middle" />
                  ) : processedProducts.length > 0 ? (
                    <>
                      Showing{" "}
                      <span className="text-slate-900 font-semibold">{showingFrom}</span>
                      {" – "}
                      <span className="text-slate-900 font-semibold">{showingTo}</span>
                      {" of "}
                      <span className="text-slate-900 font-semibold">{totalProducts}</span>
                      {" products"}
                    </>
                  ) : (
                    <>
                      Showing <span className="text-slate-900 font-semibold">0</span> products
                    </>
                  )}
                </p>
              </div>

              {/* Right: Sort + View toggle + Mobile filter */}
              <div className="flex items-center gap-2.5">
                {/* Mobile filter button */}
                <button
                  onClick={() => setMobileFilterOpen(true)}
                  className="lg:hidden flex items-center gap-1.5 h-10 px-3.5 border border-slate-200 rounded-lg text-[13px] font-medium text-slate-700 bg-white hover:bg-slate-50 hover:border-slate-300 transition-colors"
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  <span>Filters</span>
                </button>

                {/* Sort dropdown */}
                <div className="relative">
                  <select
                    value={sort}
                    onChange={(e) => handleSortChange(e.target.value as SortOption)}
                    className="appearance-none h-10 pl-3.5 pr-9 border border-slate-200 rounded-lg bg-white text-[13px] font-medium text-slate-700 cursor-pointer hover:border-slate-300 focus:outline-none focus:border-epf-500 focus:ring-2 focus:ring-epf-500/20 transition-colors"
                  >
                    {SORT_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
                </div>

                {/* View toggle */}
                <div className="hidden sm:flex items-center border border-slate-200 rounded-lg overflow-hidden bg-white">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={cn(
                      "h-10 w-10 flex items-center justify-center transition-colors",
                      viewMode === "grid"
                        ? "bg-epf-500 text-white"
                        : "text-slate-500 hover:bg-slate-50"
                    )}
                    title="Grid view"
                    aria-label="Grid view"
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={cn(
                      "h-10 w-10 flex items-center justify-center transition-colors",
                      viewMode === "list"
                        ? "bg-epf-500 text-white"
                        : "text-slate-500 hover:bg-slate-50"
                    )}
                    title="List view"
                    aria-label="List view"
                  >
                    <List className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Active Filter Tags */}
        {(selectedCategoryId || selectedBrandId || appliedSearch || selectedPriceRange !== null || selectedRating !== null || inStockOnly) && (
          <div className="bg-white border-b border-slate-200">
            <div className="mx-auto max-w-[1400px] px-4 sm:px-8 lg:px-12 py-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[12px] text-slate-500 font-semibold uppercase tracking-wider">
                  Active:
                </span>
                {activeCategoryName && (
                  <span className="inline-flex items-center gap-1.5 h-7 px-3 bg-epf-50 border border-epf-200 rounded-full text-[12px] text-epf-700 font-medium">
                    {activeCategoryName}
                    <button
                      onClick={() => setSelectedCategoryId(null)}
                      className="text-epf-400 hover:text-epf-700 transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
                {activeBrandName && (
                  <span className="inline-flex items-center gap-1.5 h-7 px-3 bg-epf-50 border border-epf-200 rounded-full text-[12px] text-epf-700 font-medium">
                    {activeBrandName}
                    <button
                      onClick={() => setSelectedBrandId(null)}
                      className="text-epf-400 hover:text-epf-700 transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
                {activePriceLabel && (
                  <span className="inline-flex items-center gap-1.5 h-7 px-3 bg-epf-50 border border-epf-200 rounded-full text-[12px] text-epf-700 font-medium">
                    {activePriceLabel}
                    <button
                      onClick={() => setSelectedPriceRange(null)}
                      className="text-epf-400 hover:text-epf-700 transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
                {selectedRating !== null && (
                  <span className="inline-flex items-center gap-1.5 h-7 px-3 bg-epf-50 border border-epf-200 rounded-full text-[12px] text-epf-700 font-medium">
                    {selectedRating}★ & up
                    <button
                      onClick={() => setSelectedRating(null)}
                      className="text-epf-400 hover:text-epf-700 transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
                {inStockOnly && (
                  <span className="inline-flex items-center gap-1.5 h-7 px-3 bg-epf-50 border border-epf-200 rounded-full text-[12px] text-epf-700 font-medium">
                    In Stock
                    <button
                      onClick={() => setInStockOnly(false)}
                      className="text-epf-400 hover:text-epf-700 transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
                {appliedSearch && (
                  <span className="inline-flex items-center gap-1.5 h-7 px-3 bg-epf-50 border border-epf-200 rounded-full text-[12px] text-epf-700 font-medium">
                    &quot;{appliedSearch}&quot;
                    <button
                      onClick={() => setAppliedSearch("")}
                      className="text-epf-400 hover:text-epf-700 transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
                <button
                  onClick={handleClearFilters}
                  className="text-[12px] text-epf-600 font-semibold hover:text-epf-700 transition-colors ml-1"
                >
                  Clear all
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Content: Sidebar + Grid */}
        <div className="mx-auto max-w-[1400px] px-4 sm:px-8 lg:px-12 py-6">
          <div className="flex gap-6">
            {/* ---- Desktop Sidebar ---- */}
            <aside className="hidden lg:block w-[280px] shrink-0">
              <div className="sticky top-[80px]">
                {categoriesLoading ? (
                  <SidebarSkeleton />
                ) : (
                  <FilterSidebar {...sidebarProps} />
                )}
              </div>
            </aside>

            {/* ---- Content Area ---- */}
            <div className="flex-1 min-w-0">
              {isError ? (
                <div className="flex flex-col items-center justify-center py-20 px-4 bg-white rounded-xl border border-slate-200">
                  <div className="h-16 w-16 rounded-full bg-red-50 flex items-center justify-center mb-4">
                    <X className="h-8 w-8 text-red-400" />
                  </div>
                  <p className="text-[14px] text-slate-500 mb-4">
                    Failed to load products. Please try again later.
                  </p>
                  <button
                    onClick={() => window.location.reload()}
                    className="h-10 px-5 bg-epf-500 hover:bg-epf-600 text-white text-[13px] font-semibold rounded-lg transition-colors"
                  >
                    Retry
                  </button>
                </div>
              ) : isLoading ? (
                viewMode === "grid" ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <PremiumCardSkeleton key={i} />
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div
                        key={i}
                        className="flex gap-4 p-4 bg-white border border-slate-200 rounded-xl animate-pulse"
                      >
                        <div className="w-44 h-44 shrink-0 bg-slate-100 rounded-lg" />
                        <div className="flex-1 space-y-3 py-1">
                          <div className="h-3 bg-slate-100 rounded w-16" />
                          <div className="h-5 bg-slate-100 rounded w-full max-w-sm" />
                          <div className="h-5 bg-slate-100 rounded w-2/3" />
                          <div className="h-6 bg-slate-100 rounded w-24" />
                          <div className="h-9 bg-slate-100 rounded-lg w-32" />
                        </div>
                      </div>
                    ))}
                  </div>
                )
              ) : processedProducts.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm">
                  <EmptyState onClear={handleClearFilters} />
                </div>
              ) : (
                <>
                  {viewMode === "grid" ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                      {processedProducts.map((product) => (
                        <PremiumCard
                          key={product.id}
                          data={productToCardData(product)}
                          onCardClick={handleCardClick}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4">
                      {processedProducts.map((product) => (
                        <ProductCardList key={product.id} product={product} />
                      ))}
                    </div>
                  )}

                  {/* Pagination */}
                  <Pagination
                    currentPage={page}
                    totalPages={totalPages}
                    onPageChange={setPage}
                  />
                </>
              )}
            </div>
          </div>
        </div>
      </main>

      <div className="mt-auto">
        <Footer />
      </div>

      {/* Mobile Filter Sheet */}
      <Sheet open={mobileFilterOpen} onOpenChange={setMobileFilterOpen}>
        <SheetContent side="left" className="w-[320px] max-w-[85vw] p-0 overflow-y-auto">
          <SheetHeader className="px-5 py-4 border-b border-slate-200">
            <SheetTitle className="text-[16px] font-semibold">Filters</SheetTitle>
          </SheetHeader>
          <div className="p-4 pb-24">
            <FilterSidebar {...sidebarProps} />
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-200">
            <button
              onClick={() => setMobileFilterOpen(false)}
              className="w-full h-11 bg-epf-500 hover:bg-epf-600 text-white text-[14px] font-semibold rounded-lg transition-colors"
            >
              Show Results
            </button>
          </div>
        </SheetContent>
      </Sheet>

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
