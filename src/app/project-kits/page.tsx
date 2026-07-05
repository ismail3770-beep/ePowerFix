"use client";

import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  Home,
  ChevronRight,
  X,
  Grid3X3,
  List,
  SlidersHorizontal,
  ChevronDown,
  ChevronLeft,
  Check,
  Boxes,
} from "lucide-react";
import { toast } from "sonner";
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
import {
  EPFStar,
  EPFCart,
} from "@/components/epf/icons/EPFIcons";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Kit {
  id: string;
  title: string;
  titleBn?: string | null;
  slug: string;
  description: string;
  price: number;
  salePrice: number | null;
  coverImage: string | null;
  images: string[];
  category: string | null;
  difficulty: string | null;
  stock: number;
  itemCount?: number;
  createdAt?: string;
}

type SortOption = "featured" | "price-asc" | "price-desc" | "newest";
type ViewMode = "grid" | "list";

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const KITS_PER_PAGE = 12;

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "featured", label: "Featured" },
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
];

const PRICE_RANGES: { label: string; min: number; max: number }[] = [
  { label: "Under ৳1,000", min: 0, max: 1000 },
  { label: "৳1,000 – ৳3,000", min: 1000, max: 3000 },
  { label: "৳3,000 – ৳10,000", min: 3000, max: 10000 },
  { label: "৳10,000 – ৳50,000", min: 10000, max: 50000 },
  { label: "Above ৳50,000", min: 50000, max: Number.MAX_SAFE_INTEGER },
];

const RATING_OPTIONS = [4, 3, 2, 1];

const GRID =
  "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4";

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function parseImages(val: unknown): string[] {
  if (Array.isArray(val)) return val as string[];
  if (typeof val === "string") {
    try {
      const p = JSON.parse(val);
      if (Array.isArray(p)) return p;
    } catch {
      /* ignore */
    }
  }
  return [];
}

/* ------------------------------------------------------------------ */
/*  Skeletons                                                          */
/* ------------------------------------------------------------------ */

function KitCardSkeleton() {
  return (
    <div className="bg-white border border-[#E2E8F0] rounded-lg overflow-hidden">
      <div className="aspect-square bg-[#F1F5F9] animate-pulse" />
      <div className="p-3 space-y-2">
        <div className="h-2 w-16 bg-[#F1F5F9] rounded animate-pulse" />
        <div className="h-3 w-full bg-[#F1F5F9] rounded animate-pulse" />
        <div className="h-3 w-2/3 bg-[#F1F5F9] rounded animate-pulse" />
        <div className="h-4 w-20 bg-[#F1F5F9] rounded animate-pulse" />
      </div>
    </div>
  );
}

function KitListCardSkeleton() {
  return (
    <div className="bg-white border border-[#E2E8F0] rounded-lg p-3 flex gap-4">
      <div className="w-32 h-32 bg-[#F1F5F9] rounded animate-pulse shrink-0" />
      <div className="flex-1 space-y-2 py-2">
        <div className="h-2 w-16 bg-[#F1F5F9] rounded animate-pulse" />
        <div className="h-4 w-3/4 bg-[#F1F5F9] rounded animate-pulse" />
        <div className="h-3 w-full bg-[#F1F5F9] rounded animate-pulse" />
        <div className="h-4 w-24 bg-[#F1F5F9] rounded animate-pulse" />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Kit Card — Grid View                                               */
/* ------------------------------------------------------------------ */

function KitCardGrid({ kit }: { kit: Kit }) {
  const { setSelectedProjectId, setProjectDetailOpen } = useUIStore();
  const addItem = useCartStore((s) => s.addItem);
  const buyable = kit.price != null;
  const price = Number(kit.salePrice || kit.price || 0);
  const hasDiscount =
    kit.salePrice != null && kit.price != null && kit.salePrice < kit.price;
  const images = parseImages(kit.images);
  const cover = kit.coverImage || images[0] || "";

  const openDetail = () => {
    setSelectedProjectId(kit.id);
    setProjectDetailOpen(true);
  };

  const addToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!buyable) return;
    addItem({
      itemType: "PROJECT",
      productId: kit.id,
      productName: kit.title,
      productImage: cover,
      price,
      quantity: 1,
    });
    toast.success("Kit added to cart", { description: kit.title });
  };

  // Discount percent for the badge (priority over the KIT label)
  const discountPct = hasDiscount
    ? Math.round(((Number(kit.price) - price) / Number(kit.price)) * 100)
    : 0;
  const kitBadge = discountPct > 0 ? `-${discountPct}%` : "KIT";

  return (
    <div
      onClick={openDetail}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openDetail(); } }}
      className="group flex flex-col text-left bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-200 cursor-pointer"
    >
      {/* ─── Image Area ─── */}
      <div className="relative aspect-square bg-slate-50 overflow-hidden">
        {cover ? (
          <img
            src={cover}
            alt={kit.title}
            className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500 ease-out"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Boxes className="w-9 h-9 text-slate-300" />
          </div>
        )}
        <span className="absolute top-2 left-2 z-10 bg-epf-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded leading-none tracking-wide">
          {kitBadge}
        </span>
      </div>

      {/* ─── Add to Cart — directly under image ─── */}
      {buyable ? (
        <button
          onClick={addToCart}
          className="w-full h-9 flex items-center justify-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-[12px] font-semibold transition-colors duration-150"
        >
          <ShoppingCart /> Add to Cart
        </button>
      ) : (
        <button
          onClick={(e) => { e.stopPropagation(); openDetail(); }}
          className="w-full h-9 flex items-center justify-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-[12px] font-semibold transition-colors duration-150"
        >
          View Details
        </button>
      )}

      {/* ─── Content ─── */}
      <div className="flex flex-col flex-1 px-3 pt-2.5 pb-3 gap-1">
        <h4 className="text-[13px] font-medium text-slate-800 line-clamp-2 leading-snug min-h-[2.4rem] group-hover:text-epf-600 transition-colors">
          {kit.title}
        </h4>
        <div className="mt-auto pt-1 flex flex-col">
          {buyable ? (
            <>
              {hasDiscount && (
                <span className="text-[11px] text-slate-400 line-through leading-none mb-0.5">
                  ৳{Number(kit.price).toLocaleString()}
                </span>
              )}
              <span className="text-[16px] font-bold text-epf-600 leading-tight">
                ৳{price.toLocaleString()}
              </span>
            </>
          ) : (
            <span className="text-[12px] font-medium text-epf-500">
              Tap to view
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// Inline shopping-cart icon (kept tiny to avoid extra imports)
function ShoppingCart({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`w-3.5 h-3.5 ${className}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
      />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Kit Card — List View                                               */
/* ------------------------------------------------------------------ */

function KitCardList({ kit }: { kit: Kit }) {
  const { setSelectedProjectId, setProjectDetailOpen } = useUIStore();
  const addItem = useCartStore((s) => s.addItem);
  const buyable = kit.price != null;
  const price = Number(kit.salePrice || kit.price || 0);
  const hasDiscount =
    kit.salePrice != null && kit.price != null && kit.salePrice < kit.price;
  const images = parseImages(kit.images);
  const cover = kit.coverImage || images[0] || "";

  const openDetail = () => {
    setSelectedProjectId(kit.id);
    setProjectDetailOpen(true);
  };

  const addToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!buyable) return;
    addItem({
      itemType: "PROJECT",
      productId: kit.id,
      productName: kit.title,
      productImage: cover,
      price,
      quantity: 1,
    });
    toast.success("Kit added to cart", { description: kit.title });
  };

  // Discount percent for the badge (priority over the KIT label)
  const discountPct = hasDiscount
    ? Math.round(((Number(kit.price) - price) / Number(kit.price)) * 100)
    : 0;
  const kitBadge = discountPct > 0 ? `-${discountPct}%` : "KIT";

  return (
    <div
      onClick={openDetail}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openDetail(); } }}
      className="group w-full text-left bg-white border border-slate-200 rounded-lg p-3 flex gap-4 shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-200 cursor-pointer"
    >
      <div className="w-32 h-32 bg-slate-50 rounded-md overflow-hidden shrink-0 relative">
        {cover ? (
          <img
            src={cover}
            alt={kit.title}
            className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Boxes className="w-8 h-8 text-slate-300" />
          </div>
        )}
        <span className="absolute top-1.5 left-1.5 bg-epf-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded leading-none tracking-wide">
          {kitBadge}
        </span>
      </div>
      <div className="flex-1 min-w-0 py-1 flex flex-col">
        <p className="text-[10px] text-slate-400 uppercase tracking-wider font-medium mb-1">
          Project Kit
        </p>
        <h4 className="text-[15px] font-medium text-slate-800 line-clamp-2 leading-snug group-hover:text-epf-600 transition-colors">
          {kit.title}
        </h4>
        <p className="text-[12px] text-slate-500 line-clamp-2 mt-1">
          {kit.description}
        </p>
        <div className="mt-auto pt-2 flex items-center justify-between">
          {buyable ? (
            <div className="flex flex-col">
              {hasDiscount && (
                <span className="text-[11px] text-slate-400 line-through leading-none mb-0.5">
                  ৳{Number(kit.price).toLocaleString()}
                </span>
              )}
              <span className="text-[17px] font-bold text-epf-600 leading-tight">
                ৳{price.toLocaleString()}
              </span>
            </div>
          ) : (
            <span className="text-[13px] font-medium text-epf-500">
              View details
            </span>
          )}
          {buyable && (
            <button
              onClick={addToCart}
              className="bg-slate-900 hover:bg-slate-800 text-white text-[12px] font-semibold px-3.5 py-2 rounded-md flex items-center gap-1.5 transition-colors"
            >
              <EPFCart size={13} /> Add to Cart
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Filter Sidebar                                                     */
/* ------------------------------------------------------------------ */

function FilterSidebar({
  selectedPriceRange,
  onSelectPriceRange,
  selectedRating,
  onSelectRating,
  onClearAll,
}: {
  selectedPriceRange: number | null;
  onSelectPriceRange: (v: number | null) => void;
  selectedRating: number | null;
  onSelectRating: (v: number | null) => void;
  onClearAll: () => void;
}) {
  return (
    <div className="bg-white border border-[#E2E8F0] rounded-lg p-5 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-[14px] font-semibold text-[#111827] flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4" /> Filters
        </h3>
        <button
          onClick={onClearAll}
          className="text-[12px] text-epf-500 hover:underline font-medium"
        >
          Clear All
        </button>
      </div>

      {/* Price */}
      <div>
        <h4 className="text-[13px] font-semibold text-[#374151] mb-3">
          Price Range
        </h4>
        <div className="space-y-2">
          {PRICE_RANGES.map((r, i) => (
            <button
              key={i}
              onClick={() =>
                onSelectPriceRange(selectedPriceRange === i ? null : i)
              }
              className={`flex items-center gap-2 w-full text-left text-[13px] py-1.5 transition-colors ${
                selectedPriceRange === i
                  ? "text-epf-500 font-medium"
                  : "text-[#6B7280] hover:text-[#111827]"
              }`}
            >
              <span
                className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                  selectedPriceRange === i
                    ? "bg-epf-500 border-epf-500"
                    : "border-[#D1D5DB]"
                }`}
              >
                {selectedPriceRange === i && (
                  <Check className="w-3 h-3 text-white" />
                )}
              </span>
              {r.label}
            </button>
          ))}
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
  onPageChange: (p: number) => void;
}) {
  if (totalPages <= 1) return null;
  const pages: (number | "…")[] = [];
  const push = (p: number | "…") => pages.push(p);
  push(1);
  if (currentPage - 2 > 2) push("…");
  for (
    let i = Math.max(2, currentPage - 1);
    i <= Math.min(totalPages - 1, currentPage + 1);
    i++
  )
    push(i);
  if (currentPage + 2 < totalPages - 1) push("…");
  if (totalPages > 1) push(totalPages);

  return (
    <div className="flex items-center justify-center gap-1.5 mt-8">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="h-9 w-9 flex items-center justify-center rounded-lg border border-[#E2E8F0] text-[#374151] hover:bg-[#F8FAFC] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      {pages.map((p, i) =>
        p === "…" ? (
          <span key={`e${i}`} className="px-2 text-[#9CA3AF]">
            …
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`h-9 min-w-9 px-3 flex items-center justify-center rounded-lg text-[13px] font-medium transition-colors ${
              p === currentPage
                ? "bg-epf-500 text-white"
                : "border border-[#E2E8F0] text-[#374151] hover:bg-[#F8FAFC]"
            }`}
          >
            {p}
          </button>
        ),
      )}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="h-9 w-9 flex items-center justify-center rounded-lg border border-[#E2E8F0] text-[#374151] hover:bg-[#F8FAFC] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Empty State                                                        */
/* ------------------------------------------------------------------ */

function EmptyState({ onClear }: { onClear: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="h-16 w-16 rounded-full bg-[#F1F5F9] flex items-center justify-center mb-4">
        <Boxes className="h-8 w-8 text-[#9CA3AF]" />
      </div>
      <h3 className="text-[16px] font-semibold text-[#111827] mb-1">
        No project kits found
      </h3>
      <p className="text-[13px] text-[#6B7280] mb-4">
        Try adjusting your filters or search terms.
      </p>
      <button
        onClick={onClear}
        className="h-9 px-4 bg-epf-500 text-white text-[13px] font-medium rounded-lg hover:bg-epf-600 transition-colors"
      >
        Clear Filters
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Page                                                          */
/* ------------------------------------------------------------------ */

export default function ProjectKitsPage() {
  /* ---- State ---- */
  const searchParams = useSearchParams();
  const [appliedSearch, setAppliedSearch] = useState(
    () => searchParams?.get("search") || "",
  );
  const [sort, setSort] = useState<SortOption>("featured");
  const [page, setPage] = useState(1);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  /* Filter state (client-side) */
  const [selectedPriceRange, setSelectedPriceRange] = useState<number | null>(
    null,
  );
  const [selectedRating, setSelectedRating] = useState<number | null>(null);

  /* ---- Stores ---- */
  const { setSearchQuery } = useUIStore();

  useEffect(() => {
    setSearchQuery(appliedSearch);
  }, [appliedSearch, setSearchQuery]);

  /* ---- Fetch project kits ---- */
  const { data, isLoading, isError } = useQuery<{ data: Kit[] }>({
    queryKey: ["project-kits-page", appliedSearch],
    queryFn: () => {
      let url = "/api/project-kits";
      if (appliedSearch)
        url += `?search=${encodeURIComponent(appliedSearch)}`;
      return apiFetch(url);
    },
  });

  const baseKits: Kit[] = data?.data ?? [];

  /* ---- Derived data with client-side sort + filter ---- */
  const processedKits = useMemo(() => {
    let arr = [...baseKits];

    // Price range filter
    if (selectedPriceRange !== null) {
      const range = PRICE_RANGES[selectedPriceRange];
      arr = arr.filter((k) => {
        const price = Number(k.salePrice || k.price || 0);
        return price >= range.min && price < range.max;
      });
    }

    // Sort
    switch (sort) {
      case "price-asc":
        arr.sort(
          (a, b) =>
            Number(a.salePrice || a.price || 0) -
            Number(b.salePrice || b.price || 0),
        );
        break;
      case "price-desc":
        arr.sort(
          (a, b) =>
            Number(b.salePrice || b.price || 0) -
            Number(a.salePrice || a.price || 0),
        );
        break;
      case "newest":
        arr.sort(
          (a, b) =>
            new Date(b.createdAt || 0).getTime() -
            new Date(a.createdAt || 0).getTime(),
        );
        break;
      default:
        // Featured: sellable first, then by createdAt
        arr.sort(
          (a, b) =>
            new Date(b.createdAt || 0).getTime() -
            new Date(a.createdAt || 0).getTime(),
        );
        break;
    }

    return arr;
  }, [baseKits, selectedPriceRange, sort]);

  /* ---- Pagination (client-side) ---- */
  const totalKits = processedKits.length;
  const totalPages = Math.ceil(totalKits / KITS_PER_PAGE);
  const showingFrom = (page - 1) * KITS_PER_PAGE + 1;
  const showingTo = Math.min(page * KITS_PER_PAGE, totalKits);
  const pagedKits = processedKits.slice(
    (page - 1) * KITS_PER_PAGE,
    page * KITS_PER_PAGE,
  );

  /* ---- Reset page on filter change ---- */
  useEffect(() => {
    setPage(1);
  }, [selectedPriceRange, appliedSearch, sort]);

  /* ---- Handlers ---- */
  const handleSortChange = (v: SortOption) => setSort(v);
  const handleClearFilters = () => {
    setSelectedPriceRange(null);
    setSelectedRating(null);
    setAppliedSearch("");
    setPage(1);
  };

  const activePriceLabel =
    selectedPriceRange !== null
      ? PRICE_RANGES[selectedPriceRange]?.label ?? null
      : null;

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      <Header />

      <main className="flex-1">
        {/* Breadcrumb */}
        <div className="bg-white border-b border-[#E2E8F0]">
          <div className="mx-auto max-w-[1400px] px-4 sm:px-12">
            <nav className="flex items-center gap-1.5 h-11 text-[13px]">
              <a
                href="/"
                className="flex items-center gap-1 text-[#6B7280] hover:text-[#111827] transition-colors"
              >
                <Home className="h-3.5 w-3.5" />
                <span>Home</span>
              </a>
              <ChevronRight className="h-3 w-3 text-[#CBD5E1]" />
              <span className="text-[#111827] font-medium">Project Kits</span>
            </nav>
          </div>
        </div>

        {/* Top Toolbar */}
        <div className="bg-white border-b border-[#E2E8F0]">
          <div className="mx-auto max-w-[1400px] px-4 sm:px-12">
            <div className="flex items-center justify-between h-12 gap-4">
              {/* Left: Results count */}
              <div className="text-[13px] text-[#6B7280]">
                {isLoading ? (
                  <span className="inline-block w-40 h-4 bg-[#F1F5F9] rounded animate-pulse" />
                ) : totalKits > 0 ? (
                  <>
                    Showing{" "}
                    <span className="text-[#111827] font-medium">
                      {showingFrom}
                    </span>
                    {" – "}
                    <span className="text-[#111827] font-medium">
                      {showingTo}
                    </span>
                    {" of "}
                    <span className="text-[#111827] font-medium">
                      {totalKits}
                    </span>
                    {" project kits"}
                  </>
                ) : (
                  <>
                    Showing <span className="text-[#111827] font-medium">0</span>{" "}
                    project kits
                  </>
                )}
              </div>

              {/* Right: Sort + View toggle + Mobile filter */}
              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => setMobileFilterOpen(true)}
                  className="lg:hidden flex items-center gap-1.5 h-8.5 px-3 border border-[#E2E8F0] rounded-lg text-[13px] text-[#374151] hover:bg-[#F8FAFC] transition-colors"
                >
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                  <span>Filter</span>
                </button>

                {/* Sort dropdown */}
                <div className="relative">
                  <select
                    value={sort}
                    onChange={(e) =>
                      handleSortChange(e.target.value as SortOption)
                    }
                    className="appearance-none h-8.5 pl-3 pr-8 border border-[#E2E8F0] rounded-lg bg-white text-[13px] text-[#374151] cursor-pointer hover:border-[#9CA3AF] focus:outline-none focus:border-epf-500 focus:ring-1 focus:ring-epf-500/20 transition-colors"
                  >
                    {SORT_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#6B7280] pointer-events-none" />
                </div>

                {/* View toggle */}
                <div className="hidden sm:flex items-center border border-[#E2E8F0] rounded-lg overflow-hidden">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`h-8.5 w-9 flex items-center justify-center transition-colors ${
                      viewMode === "grid"
                        ? "bg-[#111827] text-white"
                        : "text-[#6B7280] hover:bg-[#F8FAFC]"
                    }`}
                    title="Grid view"
                    aria-label="Grid view"
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={`h-8.5 w-9 flex items-center justify-center transition-colors ${
                      viewMode === "list"
                        ? "bg-[#111827] text-white"
                        : "text-[#6B7280] hover:bg-[#F8FAFC]"
                    }`}
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
        {(appliedSearch ||
          selectedPriceRange !== null ||
          selectedRating !== null) && (
          <div className="bg-white border-b border-[#E2E8F0]">
            <div className="mx-auto max-w-[1400px] px-4 sm:px-12 py-2.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[12px] text-[#6B7280] font-medium">
                  Active:
                </span>
                {appliedSearch && (
                  <span className="inline-flex items-center gap-1.5 h-7 px-2.5 bg-[#F1F5F9] border border-[#E2E8F0] rounded-full text-[12px] text-[#374151] font-medium">
                    Search: “{appliedSearch}”
                    <button
                      onClick={() => setAppliedSearch("")}
                      className="text-[#9CA3AF] hover:text-[#111827]"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
                {activePriceLabel && (
                  <span className="inline-flex items-center gap-1.5 h-7 px-2.5 bg-[#F1F5F9] border border-[#E2E8F0] rounded-full text-[12px] text-[#374151] font-medium">
                    {activePriceLabel}
                    <button
                      onClick={() => setSelectedPriceRange(null)}
                      className="text-[#9CA3AF] hover:text-[#111827]"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
                {selectedRating !== null && (
                  <span className="inline-flex items-center gap-1.5 h-7 px-2.5 bg-[#F1F5F9] border border-[#E2E8F0] rounded-full text-[12px] text-[#374151] font-medium">
                    {selectedRating}★ & up
                    <button
                      onClick={() => setSelectedRating(null)}
                      className="text-[#9CA3AF] hover:text-[#111827]"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
                <button
                  onClick={handleClearFilters}
                  className="text-[12px] text-epf-500 hover:underline font-medium ml-1"
                >
                  Clear All
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Content: Sidebar + Grid */}
        <div className="mx-auto max-w-[1400px] px-4 sm:px-12 py-6">
          <div className="flex gap-6">
            {/* ---- Desktop Sidebar ---- */}
            <aside className="hidden lg:block w-[280px] shrink-0">
              <div className="sticky top-[80px]">
                <FilterSidebar
                  selectedPriceRange={selectedPriceRange}
                  onSelectPriceRange={setSelectedPriceRange}
                  selectedRating={selectedRating}
                  onSelectRating={setSelectedRating}
                  onClearAll={handleClearFilters}
                />
              </div>
            </aside>

            {/* ---- Content Area ---- */}
            <div className="flex-1 min-w-0">
              {isError ? (
                <div className="flex flex-col items-center justify-center py-20 px-4">
                  <div className="h-16 w-16 rounded-full bg-red-50 flex items-center justify-center mb-4">
                    <X className="h-8 w-8 text-red-400" />
                  </div>
                  <p className="text-[14px] text-[#6B7280]">
                    Failed to load project kits. Please try again later.
                  </p>
                </div>
              ) : isLoading ? (
                viewMode === "grid" ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <KitCardSkeleton key={i} />
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <KitListCardSkeleton key={i} />
                    ))}
                  </div>
                )
              ) : pagedKits.length === 0 ? (
                <div className="bg-white border border-[#E2E8F0] rounded-lg">
                  <EmptyState onClear={handleClearFilters} />
                </div>
              ) : (
                <>
                  {viewMode === "grid" ? (
                    <div className={GRID}>
                      {pagedKits.map((kit) => (
                        <KitCardGrid key={kit.id} kit={kit} />
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4">
                      {pagedKits.map((kit) => (
                        <KitCardList key={kit.id} kit={kit} />
                      ))}
                    </div>
                  )}

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

      {/* Mobile Filter Drawer */}
      {mobileFilterOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileFilterOpen(false)}
          />
          <div className="relative ml-auto w-[300px] bg-white h-full overflow-y-auto p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[15px] font-semibold">Filters</h3>
              <button
                onClick={() => setMobileFilterOpen(false)}
                className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-[#F8FAFC]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <FilterSidebar
              selectedPriceRange={selectedPriceRange}
              onSelectPriceRange={setSelectedPriceRange}
              selectedRating={selectedRating}
              onSelectRating={setSelectedRating}
              onClearAll={handleClearFilters}
            />
            <button
              onClick={() => setMobileFilterOpen(false)}
              className="w-full mt-4 h-10 bg-epf-500 text-white text-[14px] font-medium rounded-lg hover:bg-epf-600"
            >
              Show {totalKits} kits
            </button>
          </div>
        </div>
      )}

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
