"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
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
  Boxes,
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
  EPFCart,
} from "@/components/epf/icons/EPFIcons";
import {
  ShopCard,
  ShopCardSkeleton,
  type ShopCardData,
} from "@/components/epf/ShopCard";

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

// Difficulty levels — match the admin API zod enum exactly
const DIFFICULTY_OPTIONS: { value: string; label: string }[] = [
  { value: "Beginner", label: "Beginner" },
  { value: "Intermediate", label: "Intermediate" },
  { value: "Advanced", label: "Advanced" },
];

const GRID =
  "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4";

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function parseImages(val: unknown): string[] {
  if (Array.isArray(val)) {return val as string[];}
  if (typeof val === "string") {
    try {
      const p = JSON.parse(val);
      if (Array.isArray(p)) {return p;}
    } catch {
      /* ignore */
    }
  }
  return [];
}

function kitToCardData(kit: Kit): ShopCardData {
  const images = parseImages(kit.images);
  const cover = kit.coverImage || images[0] || "";
  return {
    id: kit.id,
    name: kit.title,
    price: kit.price,
    salePrice: kit.salePrice,
    image: cover,
    images: images,
    stock: kit.stock,
    itemType: "PROJECT",
  };
}

/* ------------------------------------------------------------------ */
/*  Skeletons                                                          */
/* ------------------------------------------------------------------ */

function KitListCardSkeleton() {
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-3 flex gap-4">
      <div className="w-32 h-32 bg-slate-100 rounded animate-pulse shrink-0" />
      <div className="flex-1 space-y-2 py-2">
        <div className="h-2 w-16 bg-slate-100 rounded animate-pulse" />
        <div className="h-4 w-3/4 bg-slate-100 rounded animate-pulse" />
        <div className="h-3 w-full bg-slate-100 rounded animate-pulse" />
        <div className="h-4 w-24 bg-slate-100 rounded animate-pulse" />
      </div>
    </div>
  );
}

function SidebarSkeleton() {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-6 animate-pulse shadow-sm">
      <div>
        <div className="h-5 bg-slate-100 rounded w-28 mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
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
    if (!buyable) {return;}
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
        <span className="absolute top-1.5 left-1.5 bg-epf-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-sm leading-none tracking-wide">
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
/*  Filter Sidebar  —  Difficulty + Price + Latest Kits                */
/* ------------------------------------------------------------------ */
interface FilterSidebarProps {
  selectedDifficulty: string | null;
  onSelectDifficulty: (v: string | null) => void;
  minPriceInput: string;
  maxPriceInput: string;
  onMinPriceInputChange: (val: string) => void;
  onMaxPriceInputChange: (val: string) => void;
  onApplyPrice: () => void;
  appliedMinPrice: number | null;
  appliedMaxPrice: number | null;
  onClearAll: () => void;
  latestKits: Kit[];
}

function FilterSidebar({
  selectedDifficulty,
  onSelectDifficulty,
  minPriceInput,
  maxPriceInput,
  onMinPriceInputChange,
  onMaxPriceInputChange,
  onApplyPrice,
  appliedMinPrice,
  appliedMaxPrice,
  onClearAll,
  latestKits,
}: FilterSidebarProps) {
  const { setSelectedProjectId, setProjectDetailOpen } = useUIStore();

  const hasActiveFilters =
    !!selectedDifficulty ||
    appliedMinPrice != null ||
    appliedMaxPrice != null;

  const openKit = (kit: Kit) => {
    setSelectedProjectId(kit.id);
    setProjectDetailOpen(true);
  };

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
        {/* ── 1. Difficulty ─────────────────────────────── */}
        <section className="py-4">
          <h3 className="text-[14px] font-semibold text-slate-700 mb-2">
            Difficulty
          </h3>
          <div className="space-y-0.5">
            <button
              onClick={() => onSelectDifficulty(null)}
              className={cn(
                "flex items-center justify-between w-full h-10 px-3 rounded-lg text-left transition-colors group",
                selectedDifficulty === null
                  ? "text-epf-600 font-medium bg-epf-50/60"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50",
              )}
            >
              <span className="text-[13px]">All Kits</span>
              <ChevronRight
                className={cn(
                  "h-4 w-4 transition-colors",
                  selectedDifficulty === null
                    ? "text-epf-500"
                    : "text-slate-300 group-hover:text-slate-400",
                )}
              />
            </button>
            {DIFFICULTY_OPTIONS.map((d) => {
              const active = selectedDifficulty === d.value;
              return (
                <button
                  key={d.value}
                  onClick={() => onSelectDifficulty(active ? null : d.value)}
                  className={cn(
                    "flex items-center justify-between w-full h-10 px-3 rounded-lg text-left transition-colors group",
                    active
                      ? "text-epf-600 font-medium bg-epf-50/60"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50",
                  )}
                >
                  <span className="text-[13px]">{d.label}</span>
                  <ChevronRight
                    className={cn(
                      "h-4 w-4 shrink-0 ml-2 transition-colors",
                      active
                        ? "text-epf-500"
                        : "text-slate-300 group-hover:text-slate-400",
                    )}
                  />
                </button>
              );
            })}
          </div>
        </section>

        {/* ── 2. Price ──────────────────────────────────────────────── */}
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

      {/* ── Latest Project Kits ──────────────────────────────────── */}
      {latestKits.length > 0 && (
        <div className="border-t border-slate-200 px-5 py-4">
          <h4 className="text-[14px] font-semibold text-slate-900 mb-3">
            Latest Kits
          </h4>
          <div className="space-y-3">
            {latestKits.map((kit) => (
              <div
                key={kit.id}
                onClick={() => openKit(kit)}
                className="flex items-center gap-3 cursor-pointer hover:bg-slate-50 rounded-lg p-1.5 transition-colors"
              >
                <div className="w-10 h-10 bg-slate-100 rounded-md overflow-hidden shrink-0">
                  {(() => {
                    const images = parseImages(kit.images);
                    const cover = kit.coverImage || images[0];
                    return cover ? (
                      <img
                        src={cover}
                        alt={kit.title}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Boxes className="w-4 h-4 text-slate-300" />
                      </div>
                    );
                  })()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] text-slate-600 truncate">{kit.title}</p>
                  <p className="text-[12px] font-semibold text-slate-900">
                    ৳{Number(kit.salePrice || kit.price).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
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
  if (totalPages <= 1) {return null;}
  const pages: (number | "…")[] = [];
  const push = (p: number | "…") => pages.push(p);
  push(1);
  if (currentPage - 2 > 2) {push("…");}
  for (
    let i = Math.max(2, currentPage - 1);
    i <= Math.min(totalPages - 1, currentPage + 1);
    i++
  )
    {push(i);}
  if (currentPage + 2 < totalPages - 1) {push("…");}
  if (totalPages > 1) {push(totalPages);}

  return (
    <div className="flex items-center justify-center gap-1.5 mt-8">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="h-9 w-9 flex items-center justify-center rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      {pages.map((p, i) =>
        p === "…" ? (
          <span key={`e${i}`} className="px-2 text-slate-400">
            …
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`h-9 min-w-9 px-3 flex items-center justify-center rounded-lg text-[13px] font-medium transition-colors ${
              p === currentPage
                ? "bg-epf-500 text-white"
                : "border border-slate-200 text-slate-700 hover:bg-slate-50"
            }`}
          >
            {p}
          </button>
        ),
      )}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="h-9 w-9 flex items-center justify-center rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
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
      <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
        <Boxes className="h-8 w-8 text-slate-400" />
      </div>
      <h3 className="text-[16px] font-semibold text-slate-900 mb-1">
        No project kits found
      </h3>
      <p className="text-[13px] text-slate-500 mb-4">
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
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(
    null,
  );
  const [appliedMinPrice, setAppliedMinPrice] = useState<number | null>(null);
  const [appliedMaxPrice, setAppliedMaxPrice] = useState<number | null>(null);
  const [minPriceInput, setMinPriceInput] = useState<string>("");
  const [maxPriceInput, setMaxPriceInput] = useState<string>("");


  /* ---- Stores ---- */
  const { setSearchQuery, setSelectedProjectId, setProjectDetailOpen } = useUIStore();

  useEffect(() => {
    setSearchQuery(appliedSearch);
  }, [appliedSearch, setSearchQuery]);

  /* ---- Fetch project kits ---- */
  const { data, isLoading, isError } = useQuery<{ data: Kit[] }>({
    queryKey: ["project-kits-page", appliedSearch],
    queryFn: () => {
      let url = "/api/project-kits";
      if (appliedSearch)
        {url += `?search=${encodeURIComponent(appliedSearch)}`;}
      return apiFetch(url);
    },
  });

  const baseKits: Kit[] = data?.data ?? [];

  /* ---- Latest kits for sidebar (dedicated query) ---- */
  const { data: latestKitsData } = useQuery<{ data: Kit[] }>({
    queryKey: ["latest-kits-sidebar"],
    queryFn: () => apiFetch("/api/project-kits"),
    staleTime: 5 * 60 * 1000,
  });
  const latestKits: Kit[] = latestKitsData?.data ?? [];

  /* ---- Derived data with client-side sort + filter ---- */
  const processedKits = useMemo(() => {
    let arr = [...baseKits];

    // Difficulty filter
    if (selectedDifficulty) {
      arr = arr.filter(
        (k) =>
          k.difficulty != null &&
          k.difficulty.toLowerCase() === selectedDifficulty.toLowerCase(),
      );
    }

    // Price range filter (min/max)
    if (appliedMinPrice != null) {
      arr = arr.filter(
        (k) => Number(k.salePrice || k.price || 0) >= appliedMinPrice,
      );
    }
    if (appliedMaxPrice != null) {
      arr = arr.filter(
        (k) => Number(k.salePrice || k.price || 0) <= appliedMaxPrice,
      );
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
  }, [baseKits, selectedDifficulty, appliedMinPrice, appliedMaxPrice, sort]);

  /* ---- Pagination (client-side) ---- */
  const totalKits = processedKits.length;
  const totalPages = Math.ceil(totalKits / KITS_PER_PAGE);
  const showingFrom = (page - 1) * KITS_PER_PAGE + 1;
  const showingTo = Math.min(page * KITS_PER_PAGE, totalKits);
  const pagedKits = processedKits.slice(
    (page - 1) * KITS_PER_PAGE,
    page * KITS_PER_PAGE,
  );

  /* ---- Scroll to top on page change ---- */
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [page]);

  /* ---- Handlers ---- */
  const handleSortChange = useCallback((v: SortOption) => {
    setSort(v);
    setPage(1);
  }, []);

  const handleApplyPrice = useCallback(() => {
    const min = minPriceInput.trim() === "" ? null : Number(minPriceInput);
    const max = maxPriceInput.trim() === "" ? null : Number(maxPriceInput);
    setAppliedMinPrice(min != null && !Number.isNaN(min) ? min : null);
    setAppliedMaxPrice(max != null && !Number.isNaN(max) ? max : null);
    setPage(1);
  }, [minPriceInput, maxPriceInput]);

  const handleClearFilters = useCallback(() => {
    setSelectedDifficulty(null);
    setAppliedMinPrice(null);
    setAppliedMaxPrice(null);
    setMinPriceInput("");
    setMaxPriceInput("");
    setAppliedSearch("");
    setSort("featured");
    setPage(1);
  }, []);

  const hasActiveFilters =
    !!selectedDifficulty ||
    !!appliedSearch ||
    appliedMinPrice != null ||
    appliedMaxPrice != null;

  const sidebarProps: FilterSidebarProps = {
    selectedDifficulty,
    onSelectDifficulty: (v) => {
      setSelectedDifficulty(v);
      setPage(1);
    },
    minPriceInput,
    maxPriceInput,
    onMinPriceInputChange: setMinPriceInput,
    onMaxPriceInputChange: setMaxPriceInput,
    onApplyPrice: handleApplyPrice,
    appliedMinPrice,
    appliedMaxPrice,
    onClearAll: handleClearFilters,
    latestKits,
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />

      <main className="flex-1">
        {/* Breadcrumb */}
        <div className="bg-white border-b border-slate-200">
          <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
            <nav className="flex items-center gap-1.5 h-11 text-[13px]">
              <a
                href="/"
                className="flex items-center gap-1 text-slate-500 hover:text-epf-600 transition-colors"
              >
                <Home className="h-3.5 w-3.5" />
                <span>Home</span>
              </a>
              <ChevronRight className="h-3 w-3 text-slate-400" />
              <span className="text-slate-900 font-medium">Project Kits</span>
            </nav>
          </div>
        </div>

        {/* Top Toolbar */}
        <div className="bg-white border-b border-slate-200">
          <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-12 gap-4">
              {/* Left: Results count */}
              <div className="text-[13px] text-slate-500">
                {isLoading ? (
                  <span className="inline-block w-40 h-4 bg-slate-100 rounded animate-pulse" />
                ) : totalKits > 0 ? (
                  <>
                    Showing{" "}
                    <span className="text-slate-900 font-medium">
                      {showingFrom}
                    </span>
                    {" – "}
                    <span className="text-slate-900 font-medium">
                      {showingTo}
                    </span>
                    {" of "}
                    <span className="text-slate-900 font-medium">
                      {totalKits}
                    </span>
                    {" project kits"}
                  </>
                ) : (
                  <>
                    Showing <span className="text-slate-900 font-medium">0</span>{" "}
                    project kits
                  </>
                )}
              </div>

              {/* Right: Sort + View toggle + Mobile filter */}
              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => setMobileFilterOpen(true)}
                  className="lg:hidden flex items-center gap-1.5 h-8.5 px-3 border border-slate-200 rounded-lg text-[13px] text-slate-700 hover:bg-slate-50 transition-colors"
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
                    className="appearance-none h-8.5 pl-3 pr-8 border border-slate-200 rounded-lg bg-white text-[13px] text-slate-700 cursor-pointer hover:border-slate-400 focus:outline-none focus:border-epf-500 focus:ring-1 focus:ring-epf-500/20 transition-colors"
                  >
                    {SORT_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500 pointer-events-none" />
                </div>

                {/* View toggle */}
                <div className="hidden sm:flex items-center border border-slate-200 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`h-8.5 w-9 flex items-center justify-center transition-colors ${
                      viewMode === "grid"
                        ? "bg-slate-900 text-white"
                        : "text-slate-500 hover:bg-slate-50"
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
                        ? "bg-slate-900 text-white"
                        : "text-slate-500 hover:bg-slate-50"
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
        {hasActiveFilters && (
          <div className="bg-white border-b border-slate-200">
            <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 py-2.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[12px] text-slate-500 font-medium">
                  Active:
                </span>
                {appliedSearch && (
                  <span className="inline-flex items-center gap-1.5 h-7 px-2.5 bg-slate-100 border border-slate-200 rounded-full text-[12px] text-slate-700 font-medium">
                    Search: “{appliedSearch}”
                    <button
                      onClick={() => {
                        setAppliedSearch("");
                        setPage(1);
                      }}
                      className="text-slate-400 hover:text-slate-900"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
                {selectedDifficulty && (
                  <span className="inline-flex items-center gap-1.5 h-7 px-2.5 bg-slate-100 border border-slate-200 rounded-full text-[12px] text-slate-700 font-medium">
                    {selectedDifficulty}
                    <button
                      onClick={() => setSelectedDifficulty(null)}
                      className="text-slate-400 hover:text-slate-900"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
                {(appliedMinPrice != null || appliedMaxPrice != null) && (
                  <span className="inline-flex items-center gap-1.5 h-7 px-2.5 bg-slate-100 border border-slate-200 rounded-full text-[12px] text-slate-700 font-medium">
                    ৳{appliedMinPrice != null ? appliedMinPrice.toLocaleString() : "0"}
                    {" – "}
                    {appliedMaxPrice != null
                      ? `৳${appliedMaxPrice.toLocaleString()}`
                      : "Max"}
                    <button
                      onClick={() => {
                        setAppliedMinPrice(null);
                        setAppliedMaxPrice(null);
                        setMinPriceInput("");
                        setMaxPriceInput("");
                      }}
                      className="text-slate-400 hover:text-slate-900"
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
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="flex gap-8">
            {/* ---- Desktop Sidebar ---- */}
            <aside className="hidden lg:block w-[280px] shrink-0">
              <div className="sticky top-[88px]">
                {isLoading ? (
                  <SidebarSkeleton />
                ) : (
                  <FilterSidebar {...sidebarProps} />
                )}
              </div>
            </aside>

            {/* ---- Content Area ---- */}
            <div className="flex-1 min-w-0">
              {isError ? (
                <div className="flex flex-col items-center justify-center py-20 px-4">
                  <div className="h-16 w-16 rounded-full bg-red-50 flex items-center justify-center mb-4">
                    <X className="h-8 w-8 text-red-400" />
                  </div>
                  <p className="text-[14px] text-slate-500">
                    Failed to load project kits. Please try again later.
                  </p>
                </div>
              ) : isLoading ? (
                viewMode === "grid" ? (
                  <div className={GRID}>
                    {Array.from({ length: 8 }).map((_, i) => (
                      <ShopCardSkeleton key={i} />
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
                <div className="bg-white border border-slate-200 rounded-lg">
                  <EmptyState onClear={handleClearFilters} />
                </div>
              ) : (
                <>
                  {viewMode === "grid" ? (
                    <div className={GRID}>
                      {pagedKits.map((kit) => (
                        <ShopCard
                          key={kit.id}
                          data={kitToCardData(kit)}
                          onCardClick={(id) => {
                            setSelectedProjectId(id);
                            setProjectDetailOpen(true);
                          }}
                        />
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
          <div className="relative ml-auto w-[320px] max-w-[85vw] bg-white h-full overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 sticky top-0 bg-white z-10">
              <h3 className="text-[16px] font-semibold text-slate-900">
                Filters
              </h3>
              <button
                onClick={() => setMobileFilterOpen(false)}
                className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-slate-50"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-4 pb-24">
              <FilterSidebar {...sidebarProps} />
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-200">
              <button
                onClick={() => setMobileFilterOpen(false)}
                className="w-full h-11 bg-epf-500 hover:bg-epf-600 text-white text-[14px] font-semibold rounded-lg transition-colors"
              >
                Show {totalKits} kits
              </button>
            </div>
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
