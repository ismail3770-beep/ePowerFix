"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ChevronRight,
  Home,
  Star,
  ShoppingCart,
  Eye,
  Heart,
  Package,
  FileText,
  Search,
  SlidersHorizontal,
  ChevronDown,
  ChevronLeft,
  X,
  Grid3X3,
  PackageSearch,
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
  comparePrice: number | null;
  rating: number;
  review_count?: number;
  reviews?: number;
  stock: number;
  sold?: number;
  image: string | null;
  images?: string[];
  sku?: string;
  specifications?: Record<string, unknown>;
  category?: { id: string; name: string; slug: string } | null;
  type?: string;
  createdAt?: string;
}

interface ProductsResponse {
  success: boolean;
  data: {
    data: Product[];
    pagination: { total: number; page: number; limit: number };
  };
  message?: string;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */
const PRODUCTS_PER_PAGE = 20;

type SortOption = "featured" | "price-asc" | "price-desc" | "newest";

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "featured", label: "Featured" },
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
];

/* ------------------------------------------------------------------ */
/*  Loading skeleton                                                   */
/* ------------------------------------------------------------------ */
function ProductCardSkeleton() {
  return (
    <div className="border-r border-b border-[#E2E8F0] animate-pulse">
      <div className="aspect-square bg-[#F8FAFC]" />
      <div className="p-3 space-y-2">
        <div className="h-3 bg-[#F1F5F9] rounded w-20" />
        <div className="h-4 bg-[#F1F5F9] rounded w-16" />
        <div className="h-3 bg-[#F1F5F9] rounded w-full" />
      </div>
    </div>
  );
}

function CategorySkeleton() {
  return (
    <div className="flex items-center gap-3 px-3 py-2.5 animate-pulse">
      <div className="h-4 w-4 bg-[#F1F5F9] rounded" />
      <div className="h-3.5 bg-[#F1F5F9] rounded w-28 flex-1" />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Product Card (identical to ShopSection)                            */
/* ------------------------------------------------------------------ */
function ProductCard({ product }: { product: Product }) {
  const { setSelectedProductId, setProductDetailOpen } = useUIStore();
  const addItem = useCartStore((s) => s.addItem);

  const discount = product.comparePrice
    ? Math.round((1 - product.price / product.comparePrice) * 100)
    : 0;
  const isDigital =
    product.name?.toLowerCase().includes("guide") ||
    product.name?.toLowerCase().includes("pdf");
  const fullStars = Math.round(product.rating || 0);
  const reviewCount = product.review_count ?? product.reviews ?? 0;

  return (
    <div className="product-card relative border-r border-b border-[#E2E8F0]">
      <div className="product-thumb relative overflow-hidden aspect-square bg-[#F8FAFC] flex items-center justify-center">
        {isDigital ? (
          <FileText className="h-10 w-10 text-[#CBD5E1]" />
        ) : (
          <Package className="h-10 w-10 text-[#CBD5E1]" />
        )}
        {discount > 0 && <span className="discount-badge">-{discount}%</span>}
        <div className="product-actions">
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
            className="h-[32px] w-[32px] rounded-full bg-[#111827] flex items-center justify-center text-white hover:bg-[#0EA5E9] transition-colors"
            title="Add to cart"
          >
            <ShoppingCart className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedProductId(product.id);
              setProductDetailOpen(true);
            }}
            className="h-[32px] w-[32px] rounded-full border border-[#E2E8F0] flex items-center justify-center text-[#374151] hover:bg-[#0EA5E9] hover:border-[#0EA5E9] hover:text-white transition-colors"
            title="Quick view"
          >
            <Eye className="h-3.5 w-3.5" />
          </button>
          <button
            className="h-[32px] w-[32px] rounded-full border border-[#E2E8F0] flex items-center justify-center text-[#374151] hover:bg-[#0EA5E9] hover:border-[#0EA5E9] hover:text-white transition-colors"
            title="Wishlist"
          >
            <Heart className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      <div className="p-3">
        <div className="flex items-center gap-1 mb-1">
          <div className="flex items-center">
            {Array.from({ length: 5 }).map((_, s) => (
              <Star
                key={s}
                className={
                  s < fullStars
                    ? "fill-[#0EA5E9] text-[#0EA5E9] h-3 w-3"
                    : "h-3 w-3 text-[#CBD5E1]"
                }
              />
            ))}
          </div>
          <span className="text-[13px] text-[#6B7280]">({reviewCount})</span>
        </div>
        <button
          onClick={() => {
            setSelectedProductId(product.id);
            setProductDetailOpen(true);
          }}
          className="block text-[14px] text-[#111827] line-clamp-2 leading-snug mb-1.5 hover:text-[#0EA5E9] transition-colors text-left w-full"
        >
          {product.name}
        </button>
        <div className="flex items-baseline gap-1.5 mb-1">
          <span className="text-[16px] font-semibold text-[#111827]">
            ৳{(product.price ?? 0).toLocaleString()}
          </span>
          {product.comparePrice && (
            <span className="text-[14px] text-[#6B7280] line-through">
              ৳{(product.comparePrice ?? 0).toLocaleString()}
            </span>
          )}
        </div>
        {product.stock < 50 && (
          <p className="text-[13px] text-[#0EA5E9] font-medium mt-1">
            Only {product.stock} left
          </p>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Pagination Component                                               */
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
    <div className="flex items-center justify-center gap-1 py-6">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        className="h-9 w-9 flex items-center justify-center border border-[#E2E8F0] rounded-[4px] text-[#374151] hover:bg-[#F1F5F9] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        aria-label="Previous page"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      {pages.map((p, i) =>
        p === "..." ? (
          <span
            key={`ellipsis-${i}`}
            className="h-9 w-9 flex items-center justify-center text-[#6B7280] text-[14px]"
          >
            ...
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`h-9 w-9 flex items-center justify-center border rounded-[4px] text-[14px] font-medium transition-colors ${
              p === currentPage
                ? "bg-[#0EA5E9] border-[#0EA5E9] text-white"
                : "border-[#E2E8F0] text-[#374151] hover:bg-[#F1F5F9]"
            }`}
          >
            {p}
          </button>
        )
      )}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        className="h-9 w-9 flex items-center justify-center border border-[#E2E8F0] rounded-[4px] text-[#374151] hover:bg-[#F1F5F9] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
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
      <PackageSearch className="h-16 w-16 text-[#CBD5E1] mb-4" />
      <h3 className="text-[20px] font-semibold text-[#111827] mb-2">
        No products found
      </h3>
      <p className="text-[14px] text-[#6B7280] mb-6 text-center max-w-md">
        We couldn&apos;t find any products matching your search. Try adjusting
        your filters or search terms.
      </p>
      <button
        onClick={onClear}
        className="h-10 px-6 bg-[#0EA5E9] text-white text-[14px] font-semibold rounded-[4px] hover:bg-[#0284C7] transition-colors"
      >
        Clear All Filters
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Page                                                          */
/* ------------------------------------------------------------------ */
export default function ShopPage() {
  /* ---- State ---- */
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [localSearch, setLocalSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [sort, setSort] = useState<SortOption>("featured");
  const [page, setPage] = useState(1);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  /* ---- Stores ---- */
  const { setSearchQuery } = useUIStore();

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
      if (selectedCategoryId) url += `&category=${encodeURIComponent(selectedCategoryId)}`;
      if (appliedSearch) url += `&search=${encodeURIComponent(appliedSearch)}`;
      return apiFetch(url);
    },
  });

  /* ---- Derived data ---- */
  const { data: categoriesData } = useQuery({
    queryKey: ['product-categories'],
    queryFn: () => apiFetch('/api/product-categories'),
    staleTime: 5 * 60 * 1000,
  });
  const categories: Category[] = categoriesData?.data ?? [];
  const totalProducts = data?.data?.pagination?.total ?? 0;
  const totalPages = Math.ceil(totalProducts / PRODUCTS_PER_PAGE);

  const sortedProducts = useMemo(() => {
    const products = data?.data?.data ?? [];
    const arr = [...products];
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
      default:
        break; // "featured" — keep API order
    }
    return arr;
  }, [data?.data?.data, sort]);

  /* ---- Handlers ---- */
  const handleSearch = useCallback(() => {
    const q = localSearch.trim();
    setAppliedSearch(q);
    setPage(1);
  }, [localSearch]);

  const handleClearFilters = useCallback(() => {
    setSelectedCategoryId(null);
    setLocalSearch("");
    setAppliedSearch("");
    setSort("featured");
    setPage(1);
  }, []);

  const handleCategorySelect = useCallback((catId: string | null) => {
    setSelectedCategoryId(catId);
    setSidebarOpen(false);
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

  /* ---- Active category label ---- */
  const activeCategoryName = useMemo(() => {
    if (!selectedCategoryId) return null;
    return categories.find((c) => c.id === selectedCategoryId)?.name ?? null;
  }, [selectedCategoryId, categories]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 bg-[#F8FAFC]">
        {/* Breadcrumb */}
        <div className="bg-white border-b border-[#E2E8F0]">
          <div className="mx-auto max-w-[1920px] px-4 sm:px-12">
            <nav className="flex items-center gap-1.5 h-[44px] text-[14px]">
              <a
                href="/"
                className="flex items-center gap-1 text-[#6B7280] hover:text-[#111827] transition-colors"
              >
                <Home className="h-3.5 w-3.5" />
                <span>Home</span>
              </a>
              <ChevronRight className="h-3 w-3 text-[#94A3B8]" />
              <span className="text-[#111827] font-medium">Shop</span>
            </nav>
          </div>
        </div>

        {/* Page Title Bar */}
        <div className="bg-[#F1F5F9] border-b border-[#E2E8F0]">
          <div className="mx-auto max-w-[1920px] px-4 sm:px-12">
            <div className="flex items-center justify-between h-[52px]">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 text-[#6B7280] lg:hidden" />
                <h1 className="text-[20px] font-semibold text-[#111827]">
                  {activeCategoryName
                    ? activeCategoryName
                    : appliedSearch
                      ? `Search: "${appliedSearch}"`
                      : "All Products"}
                </h1>
                {!isLoading && (
                  <span className="text-[14px] text-[#6B7280] ml-2 hidden sm:inline">
                    ({totalProducts} products)
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                {/* Mobile filter toggle */}
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="lg:hidden flex items-center gap-1.5 h-9 px-3 border border-[#E2E8F0] rounded-[4px] text-[14px] text-[#374151] hover:bg-white transition-colors"
                >
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                  <span>Filter</span>
                </button>

                {/* Sort dropdown */}
                <div className="relative">
                  <select
                    value={sort}
                    onChange={(e) => handleSortChange(e.target.value as SortOption)}
                    className="appearance-none h-9 pl-3 pr-8 border border-[#E2E8F0] rounded-[4px] bg-white text-[14px] text-[#374151] cursor-pointer hover:border-[#94A3B8] focus:outline-none focus:border-[#0EA5E9] transition-colors"
                  >
                    {SORT_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#6B7280] pointer-events-none" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-[#F8FAFC]">
          <div className="mx-auto max-w-[1920px] px-4 sm:px-12 py-4">
            <div className="flex max-w-full h-[42px] rounded-[4px] overflow-hidden border border-[#E2E8F0] bg-white">
              <div className="flex items-center pl-3 text-[#6B7280]">
                <Search className="h-[18px] w-[18px]" />
              </div>
              <input
                type="text"
                placeholder="Search products by name..."
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="flex-1 h-full px-3 text-[14px] bg-transparent focus:outline-none text-[#111827] placeholder:text-[#6B7280]"
              />
              {localSearch && (
                <button
                  onClick={() => {
                    setLocalSearch("");
                    setAppliedSearch("");
                  }}
                  className="flex items-center px-2 text-[#6B7280] hover:text-[#374151] transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
              <button
                onClick={handleSearch}
                className="bg-[#0EA5E9] text-white h-full px-5 flex items-center hover:bg-[#0284C7] transition-colors shrink-0"
              >
                <span className="text-[14px] font-semibold hidden sm:inline">Search</span>
                <Search className="h-4 w-4 sm:hidden" />
              </button>
            </div>
          </div>
        </div>

        {/* Active Filters Tags */}
        {(selectedCategoryId || appliedSearch) && (
          <div className="mx-auto max-w-[1920px] px-4 sm:px-12 pb-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[13px] text-[#6B7280]">Active filters:</span>
              {activeCategoryName && (
                <span className="inline-flex items-center gap-1 h-7 px-2.5 bg-[#0EA5E9]/15 border border-[#0EA5E9]/30 rounded-[4px] text-[13px] text-[#111827] font-medium">
                  {activeCategoryName}
                  <button
                    onClick={() => setSelectedCategoryId(null)}
                    className="ml-0.5 text-[#6B7280] hover:text-[#111827] transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {appliedSearch && (
                <span className="inline-flex items-center gap-1 h-7 px-2.5 bg-[#0EA5E9]/15 border border-[#0EA5E9]/30 rounded-[4px] text-[13px] text-[#111827] font-medium">
                  &quot;{appliedSearch}&quot;
                  <button
                    onClick={() => {
                      setLocalSearch("");
                      setAppliedSearch("");
                    }}
                    className="ml-0.5 text-[#6B7280] hover:text-[#111827] transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              <button
                onClick={handleClearFilters}
                className="text-[13px] text-[#6B7280] hover:text-[#0EA5E9] underline transition-colors"
              >
                Clear all
              </button>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="mx-auto max-w-[1920px] px-4 sm:px-12 pb-8">
          <div className="flex gap-6">
            {/* ---- Sidebar ---- */}
            {/* Mobile overlay sidebar */}
            {sidebarOpen && (
              <div className="fixed inset-0 z-40 lg:hidden">
                <div
                  className="absolute inset-0 bg-black/30"
                  onClick={() => setSidebarOpen(false)}
                />
                <div className="absolute top-0 left-0 bottom-0 w-[280px] bg-white shadow-xl overflow-y-auto z-50">
                  <div className="flex items-center justify-between px-4 h-[52px] border-b border-[#E2E8F0] bg-[#F1F5F9]">
                    <span className="text-[15px] font-semibold text-[#111827]">
                      Filters
                    </span>
                    <button
                      onClick={() => setSidebarOpen(false)}
                      className="text-[#6B7280] hover:text-[#111827] transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <CategorySidebar
                    categories={categories}
                    selectedCategoryId={selectedCategoryId}
                    onSelect={handleCategorySelect}
                    isLoading={isLoading}
                  />
                </div>
              </div>
            )}

            {/* Desktop sidebar */}
            <aside className="hidden lg:block w-[240px] shrink-0">
              <div className="bg-white border border-[#E2E8F0] rounded-[4px] sticky top-[130px]">
                <div className="px-4 py-3 border-b border-[#E2E8F0] bg-[#F1F5F9] rounded-t-[4px]">
                  <h2 className="text-[15px] font-semibold text-[#111827]">
                    Categories
                  </h2>
                </div>
                <CategorySidebar
                  categories={categories}
                  selectedCategoryId={selectedCategoryId}
                  onSelect={handleCategorySelect}
                  isLoading={isLoading}
                />
              </div>
            </aside>

            {/* ---- Product Grid ---- */}
            <div className="flex-1 min-w-0">
              {isError ? (
                <div className="flex flex-col items-center justify-center py-20 px-4">
                  <p className="text-[14px] text-[#0EA5E9]">
                    Failed to load products. Please try again later.
                  </p>
                </div>
              ) : isLoading ? (
                <div className="bg-white border border-[#E2E8F0]">
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-0">
                    {Array.from({ length: PRODUCTS_PER_PAGE }).map((_, i) => (
                      <ProductCardSkeleton key={i} />
                    ))}
                  </div>
                </div>
              ) : sortedProducts.length === 0 ? (
                <div className="bg-white border border-[#E2E8F0]">
                  <EmptyState onClear={handleClearFilters} />
                </div>
              ) : (
                <>
                  <div className="bg-white border border-[#E2E8F0]">
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-0">
                      {sortedProducts.map((product) => (
                        <ProductCard key={product.id} product={product} />
                      ))}
                    </div>
                  </div>

                  {/* Results info */}
                  <div className="flex items-center justify-between py-4">
                    <p className="text-[14px] text-[#6B7280]">
                      Showing{" "}
                      <span className="text-[#111827] font-medium">
                        {(page - 1) * PRODUCTS_PER_PAGE + 1}
                      </span>
                      –
                      <span className="text-[#111827] font-medium">
                        {Math.min(page * PRODUCTS_PER_PAGE, totalProducts)}
                      </span>{" "}
                      of{" "}
                      <span className="text-[#111827] font-medium">
                        {totalProducts}
                      </span>{" "}
                      results
                    </p>
                  </div>

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

/* ------------------------------------------------------------------ */
/*  Category Sidebar                                                   */
/* ------------------------------------------------------------------ */
function CategorySidebar({
  categories,
  selectedCategoryId,
  onSelect,
  isLoading,
}: {
  categories: Category[];
  selectedCategoryId: string | null;
  onSelect: (id: string | null) => void;
  isLoading: boolean;
}) {
  return (
    <div className="py-1">
      {/* All categories option */}
      <button
        onClick={() => onSelect(null)}
        className={`w-full flex items-center gap-3 px-4 py-2.5 text-[14px] transition-all border-l-[3px] ${
          selectedCategoryId === null
            ? "bg-[#0EA5E9]/8 text-[#0EA5E9] font-semibold border-[#0EA5E9]"
            : "text-[#374151] hover:bg-[#F8FAFC] border-transparent hover:text-[#111827]"
        }`}
      >
        <Grid3X3 className="h-4 w-4 shrink-0" />
        <span className="flex-1 text-left">All Products</span>
        <ChevronRight className="h-3 w-3 text-[#94A3B8]" />
      </button>

      {isLoading
        ? Array.from({ length: 6 }).map((_, i) => <CategorySkeleton key={i} />)
        : categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => onSelect(cat.id)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-[14px] transition-all border-l-[3px] ${
                selectedCategoryId === cat.id
                  ? "bg-[#0EA5E9]/8 text-[#0EA5E9] font-semibold border-[#0EA5E9]"
                  : "text-[#374151] hover:bg-[#F8FAFC] border-transparent hover:text-[#111827]"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                  selectedCategoryId === cat.id
                    ? "bg-[#0EA5E9]"
                    : "bg-[#CBD5E1]"
                }`}
              />
              <span className="flex-1 text-left truncate">{cat.name}</span>
              <ChevronRight className="h-3 w-3 text-[#94A3B8]" />
            </button>
          ))}
    </div>
  );
}