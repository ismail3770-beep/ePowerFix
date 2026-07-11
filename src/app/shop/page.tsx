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
  ShopCard,
  ShopCardSkeleton,
  type ShopCardData,
} from "@/components/epf/ShopCard";
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

interface Product {
  id: string;
  name: string;
  nameBn?: string;
  price: number;
  salePrice?: number | null;
  comparePrice?: number | null;
  rating: number;
  reviewCount?: number;
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
  { value: "newest", label: "Latest" },
  { value: "featured", label: "Featured" },
  { value: "popular", label: "Popular" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */
function productToCardData(p: Product): ShopCardData {
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
    rating: p.rating,
    reviewCount: p.reviewCount ?? p.reviews,
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
  const reviewCount = product.reviewCount ?? product.reviews ?? 0;
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
/*  Filter Sidebar  —  Browse Categories + Filters (Price) + Latest   */
/* ------------------------------------------------------------------ */
interface FilterSidebarProps {
  categories: Category[];
  selectedCategoryId: string | null;
  onSelectCategory: (id: string | null) => void;
  minPriceInput: string;
  maxPriceInput: string;
  onMinPriceInputChange: (val: string) => void;
  onMaxPriceInputChange: (val: string) => void;
  onApplyPrice: () => void;
  appliedMinPrice: number | null;
  appliedMaxPrice: number | null;
  isLoading: boolean;
  onClearAll: () => void;
  latestProducts: Product[];
  onCardClick?: (id: string) => void;
}

function FilterSidebar({
  categories,
  selectedCategoryId,
  onSelectCategory,
  minPriceInput,
  maxPriceInput,
  onMinPriceInputChange,
  onMaxPriceInputChange,
  onApplyPrice,
  appliedMinPrice,
  appliedMaxPrice,
  isLoading,
  onClearAll,
  latestProducts,
  onCardClick,
}: FilterSidebarProps) {
  const hasActiveFilters =
    selectedCategoryId ||
    appliedMinPrice != null ||
    appliedMaxPrice != null;

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-white">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-slate-700" />
          <h2 className="text-[14px] font-semibold text-slate-900">Filters</h2>
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

      <div className="px-5 py-2 divide-y divide-slate-100">
        {/* ── 1. Browse Categories ─────────────────────────────── */}
        <section className="py-4">
          <h3 className="text-[14px] font-semibold text-slate-700 mb-2">
            Browse Categories
          </h3>
          <div className="space-y-0.5 max-h-72 overflow-y-auto pr-1 -mr-1 custom-scrollbar">
            {isLoading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2.5 h-10 px-3 animate-pulse"
                  >
                    <div className="h-3.5 bg-slate-100 rounded w-3/4" />
                  </div>
                ))
              : categories.map((cat) => {
                  const active = selectedCategoryId === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => onSelectCategory(active ? null : cat.id)}
                      aria-label={`Filter by ${cat.name}`}
                      className={cn(
                        "flex items-center gap-2 w-full py-1.5 text-left text-[13px] transition-colors",
                        active
                          ? "text-epf-500 font-semibold"
                          : "text-slate-600 hover:text-slate-900"
                      )}
                    >
                      <ChevronRight className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{cat.name}</span>
                    </button>
                  );
                })}
          </div>
        </section>

        {/* ── 2. Price Range ────────────────────────────────────── */}
        <section className="py-4">
          <h3 className="text-[14px] font-semibold text-slate-700 mb-3">
            Price Range
          </h3>
          <div className="flex items-center gap-2">
            <input
              type="number"
              inputMode="numeric"
              min={0}
              placeholder="Min"
              value={minPriceInput}
              onChange={(e) => onMinPriceInputChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {onApplyPrice();}
              }}
              className="w-full h-9 px-3 text-[13px] text-slate-700 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-epf-500/20 focus:border-epf-500 placeholder:text-slate-400 transition-all"
            />
            <span className="text-slate-400 text-[13px] select-none">—</span>
            <input
              type="number"
              inputMode="numeric"
              min={0}
              placeholder="Max"
              value={maxPriceInput}
              onChange={(e) => onMaxPriceInputChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {onApplyPrice();}
              }}
              className="w-full h-9 px-3 text-[13px] text-slate-700 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-epf-500/20 focus:border-epf-500 placeholder:text-slate-400 transition-all"
            />
          </div>
          <button
            onClick={onApplyPrice}
            className="mt-3 w-full h-9 bg-epf-500 hover:bg-epf-600 text-white text-[13px] font-semibold rounded-lg transition-colors"
          >
            Apply
          </button>
        </section>
      </div>

      {/* ── Latest Products ──────────────────────────────────── */}
      <div className="border-t border-slate-200">
        <div className="px-5 py-4 border-b border-slate-100">
          <h3 className="text-[14px] font-semibold text-slate-900">
            Latest Products
          </h3>
        </div>
        <div className="p-3 space-y-1">
          {latestProducts.length === 0 ? (
            <p className="p-3 text-[12px] text-slate-400">No products yet.</p>
          ) : (
            latestProducts.slice(0, 5).map((p) => {
              const img = p.image || p.images?.[0] || null;
              const disp = p.salePrice ?? p.price;
              return (
                <div
                  key={p.id}
                  onClick={() => onCardClick?.(p.id)}
                  className="flex items-center gap-3 cursor-pointer hover:bg-slate-50 rounded-lg p-1.5 transition-colors"
                >
                  <div className="w-10 h-10 bg-slate-100 rounded-md overflow-hidden shrink-0">
                    {img ? (
                      <img
                        src={img}
                        alt={p.name}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-4 h-4 text-slate-300" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] text-slate-600 truncate">{p.name}</p>
                    <p className="text-[12px] font-semibold text-slate-900">
                      ৳{Number(disp).toLocaleString()}
                    </p>
                  </div>
                </div>
              );
            })
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
  if (totalPages <= 1) {return null;}

  const pages: (number | "...")[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) {pages.push(i);}
  } else {
    pages.push(1);
    if (currentPage > 3) {pages.push("...");}
    for (
      let i = Math.max(2, currentPage - 1);
      i <= Math.min(totalPages - 1, currentPage + 1);
      i++
    ) {
      pages.push(i);
    }
    if (currentPage < totalPages - 2) {pages.push("...");}
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
            className="h-9 w-9 flex items-center justify-center text-slate-500 text-[13px]"
          >
            ...
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={cn(
              "h-9 min-w-9 px-2 flex items-center justify-center rounded-lg text-[13px] font-semibold transition-colors",
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
    <div className="flex flex-col items-center justify-center py-20 px-4">
      <PackageSearch className="h-16 w-16 text-slate-200 mb-4" />
      <h3 className="text-[18px] font-medium text-slate-900 mb-1.5">
        No products found
      </h3>
      <p className="text-[14px] text-slate-500 mb-6 text-center max-w-md">
        Try adjusting your filters or search terms to find what you&apos;re
        looking for.
      </p>
      <button
        onClick={onClear}
        className="h-10 px-6 bg-epf-500 hover:bg-epf-600 text-white text-[13px] font-semibold rounded-lg transition-colors shadow-sm"
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
  const searchParams = useSearchParams();
  const [appliedSearch, setAppliedSearch] = useState(() => searchParams?.get("search") || "");
  const [sort, setSort] = useState<SortOption>("newest");
  const [page, setPage] = useState(1);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  /* Client-side filters */
  const [appliedMinPrice, setAppliedMinPrice] = useState<number | null>(null);
  const [appliedMaxPrice, setAppliedMaxPrice] = useState<number | null>(null);
  const [minPriceInput, setMinPriceInput] = useState<string>("");
  const [maxPriceInput, setMaxPriceInput] = useState<string>("");

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
      appliedSearch,
      page,
      PRODUCTS_PER_PAGE,
    ],
    queryFn: () => {
      let url = `/api/products?limit=${PRODUCTS_PER_PAGE}&page=${page}`;
      if (selectedCategoryId)
        {url += `&category=${encodeURIComponent(selectedCategoryId)}`;}
      if (appliedSearch) {url += `&search=${encodeURIComponent(appliedSearch)}`;}
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

  /* ---- Fetch latest products for sidebar ---- */
  const { data: latestData } = useQuery<ProductsResponse>({
    queryKey: ["shop-latest-products"],
    queryFn: () => apiFetch("/api/products?limit=5&sort=newest"),
    staleTime: 5 * 60 * 1000,
  });
  const latestProducts: Product[] = latestData?.data?.data ?? [];

  const totalProducts = data?.data?.total ?? 0;
  const totalPages = data?.data?.totalPages ?? Math.ceil(totalProducts / PRODUCTS_PER_PAGE);

  /* ---- Derived data with client-side sort + filter ---- */
  const processedProducts = useMemo(() => {
    const products = data?.data?.data ?? [];
    let arr = [...products];

    // Client-side price range filter
    if (appliedMinPrice != null) {
      arr = arr.filter((p) => (p.price ?? 0) >= appliedMinPrice);
    }
    if (appliedMaxPrice != null) {
      arr = arr.filter((p) => (p.price ?? 0) <= appliedMaxPrice);
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
  }, [data?.data?.data, sort, appliedMinPrice, appliedMaxPrice]);

  /* ---- Handlers ---- */
  useEffect(() => {
    const urlSearch = searchParams?.get("search") || "";
    setAppliedSearch(urlSearch);
  }, [searchParams]);

  const handleClearFilters = useCallback(() => {
    setSelectedCategoryId(null);
    setAppliedSearch("");
    setSort("newest");
    setPage(1);
    setAppliedMinPrice(null);
    setAppliedMaxPrice(null);
    setMinPriceInput("");
    setMaxPriceInput("");
  }, []);

  const handleCategorySelect = useCallback((catId: string | null) => {
    setSelectedCategoryId(catId);
    setPage(1);
  }, []);

  const handleApplyPrice = useCallback(() => {
    const min = minPriceInput.trim() === "" ? null : Number(minPriceInput);
    const max = maxPriceInput.trim() === "" ? null : Number(maxPriceInput);
    setAppliedMinPrice(min != null && !Number.isNaN(min) ? min : null);
    setAppliedMaxPrice(max != null && !Number.isNaN(max) ? max : null);
    setPage(1);
  }, [minPriceInput, maxPriceInput]);

  const handleSortChange = useCallback((newSort: SortOption) => {
    setSort(newSort);
    setPage(1);
  }, []);

  const hasActiveFilters =
    !!selectedCategoryId ||
    !!appliedSearch ||
    appliedMinPrice != null ||
    appliedMaxPrice != null;

  /* ---- Scroll to top on page change ---- */
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [page]);

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
    selectedCategoryId,
    onSelectCategory: handleCategorySelect,
    minPriceInput,
    maxPriceInput,
    onMinPriceInputChange: setMinPriceInput,
    onMaxPriceInputChange: setMaxPriceInput,
    onApplyPrice: handleApplyPrice,
    appliedMinPrice,
    appliedMaxPrice,
    isLoading: categoriesLoading,
    onClearAll: handleClearFilters,
    latestProducts,
    onCardClick: handleCardClick,
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />

      <main className="flex-1">
        {/* ── Top Bar: Breadcrumb + Title + Toolbar ─────────────── */}
        <div className="border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
            {/* Breadcrumb */}
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

            {/* Title + Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 pt-1">
              {/* Title */}
              <div className="flex items-center gap-3 min-w-0">
                <h1 className="text-[24px] font-bold text-slate-900 tracking-tight">
                  Shop
                </h1>
                {hasActiveFilters && (
                  <button
                    onClick={handleClearFilters}
                    className="hidden sm:inline-flex items-center gap-1 text-[12px] text-slate-500 hover:text-epf-600 font-medium transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                    Clear
                  </button>
                )}
              </div>

              {/* Toolbar */}
              <div className="flex items-center gap-2.5 flex-wrap">
                {/* Result count */}
                <span className="text-[13px] text-slate-500 mr-auto sm:mr-0">
                  {isLoading ? (
                    <span className="inline-block w-28 h-4 bg-slate-100 rounded animate-pulse align-middle" />
                  ) : (
                    <>
                      Showing{" "}
                      <span className="text-slate-900 font-semibold">
                        {processedProducts.length > 0 ? showingTo : 0}
                      </span>{" "}
                      of{" "}
                      <span className="text-slate-900 font-semibold">
                        {totalProducts}
                      </span>{" "}
                      products
                    </>
                  )}
                </span>

                {/* Mobile filter button */}
                <button
                  onClick={() => setMobileFilterOpen(true)}
                  className="lg:hidden flex items-center gap-1.5 h-9 px-3 border border-slate-200 rounded-lg text-[13px] font-medium text-slate-700 bg-white hover:bg-slate-50 hover:border-slate-300 transition-colors"
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  <span>Filters</span>
                </button>

                {/* Sort dropdown */}
                <div className="relative">
                  <select
                    value={sort}
                    onChange={(e) => handleSortChange(e.target.value as SortOption)}
                    className="appearance-none h-9 pl-3 pr-9 border border-slate-200 rounded-lg bg-white text-[13px] font-medium text-slate-700 cursor-pointer hover:border-slate-300 focus:outline-none focus:border-epf-500 focus:ring-2 focus:ring-epf-500/20 transition-colors"
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
                      "h-9 w-9 flex items-center justify-center transition-colors",
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
                      "h-9 w-9 flex items-center justify-center transition-colors",
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

        {/* ── Main Content: Sidebar + Grid ─────────────────────── */}
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex gap-6">
            {/* ---- Desktop Sidebar ---- */}
            <aside className="hidden lg:block w-[260px] shrink-0">
              <div className="sticky top-[88px]">
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
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <ShopCardSkeleton key={i} />
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
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
                      {processedProducts.map((product) => (
                        <ShopCard
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
