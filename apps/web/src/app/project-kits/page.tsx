"use client";

import { type MouseEvent, Suspense, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Grid2X2,
  Heart,
  List,
  Loader2,
  Package,
  ShoppingCart,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { toast } from "sonner";
import Header from "@/components/epf/Header";
import Footer from "@/components/epf/Footer";
import CartDrawer from "@/components/epf/CartDrawer";
import CheckoutDialog from "@/components/epf/CheckoutDialog";
import ChatWidget from "@/components/epf/ChatWidget";
import BackToTopButton from "@/components/epf/BackToTopButton";
import { useCartStore, useUIStore } from "@/store";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";

interface ProjectKit {
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

const sortOptions = [
  { value: "featured", label: "Featured" },
  { value: "latest", label: "Newest" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
];

function getKitPrice(kit: ProjectKit) {
  return kit.salePrice != null && kit.salePrice < kit.price ? kit.salePrice : kit.price;
}

function getKitImage(kit: ProjectKit) {
  return kit.coverImage || kit.images?.[0] || "";
}

function KitCard({ kit, onOpen }: { kit: ProjectKit; onOpen: (slug: string) => void }) {
  const addItem = useCartStore((state) => state.addItem);
  const setCartOpen = useUIStore((state) => state.setCartOpen);
  const [imageError, setImageError] = useState(false);
  const displayPrice = getKitPrice(kit);
  const originalPrice = displayPrice < kit.price ? kit.price : null;
  const discount = originalPrice ? Math.round(((originalPrice - displayPrice) / originalPrice) * 100) : 0;
  const image = getKitImage(kit);
  const inStock = kit.stock > 0;

  const handleAdd = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (!inStock) return;
    addItem({
      itemType: "PROJECT_KIT",
      projectKitId: kit.id,
      productName: kit.title,
      productImage: image,
      price: Number(displayPrice),
      quantity: 1,
    });
    toast.success("Kit added to cart", { description: kit.title });
    setCartOpen(true);
  };

  return (
    <article
      className="group relative bg-white border border-gray-100 rounded overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
      role="button"
      tabIndex={0}
      onClick={() => onOpen(kit.slug)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpen(kit.slug);
        }
      }}
    >
      <div className="relative aspect-square bg-gray-50 overflow-hidden">
        {image && !imageError ? (
          <img
            src={image}
            alt={kit.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gray-100">
            <Package className="h-8 w-8 text-gray-300" />
          </div>
        )}
        {discount > 0 && <span className="absolute left-2 top-2 bg-[#0EA5E9] px-2 py-0.5 text-[10px] font-bold text-white rounded-full">-{discount}%</span>}
        {!inStock && <span className="absolute left-2 top-2 bg-gray-700 px-2 py-0.5 text-[10px] font-bold text-white rounded-full">Out of stock</span>}
        {/* Hover overlay */}
        <div className="absolute bottom-0 left-0 right-0 flex gap-2 p-2.5 opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
          <button
            type="button"
            aria-label="Add kit to cart"
            onClick={(e) => { e.stopPropagation(); handleAdd(e as any); }}
            disabled={!inStock}
            className="flex-1 bg-[#0EA5E9] text-white text-xs font-semibold py-2 rounded hover:bg-sky-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
          >
            <ShoppingCart className="h-3.5 w-3.5" />
            {inStock ? "Add to Cart" : "Out of Stock"}
          </button>
          <button
            type="button"
            aria-label="Add kit to wishlist"
            className="p-2 rounded bg-white/80 border border-white/30 text-gray-700 hover:bg-white transition-colors"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
          >
            <Heart className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      <div className="p-3">
        {kit.category && <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-1 font-medium">{kit.category}</p>}
        <h2 className="text-sm font-medium text-gray-800 line-clamp-2 mb-2 leading-snug group-hover:text-[#0EA5E9] transition-colors">{kit.titleBn || kit.title}</h2>
        <div className="flex items-center gap-2">
          <span className="text-base font-bold text-[#0EA5E9]">{displayPrice > 0 ? `৳${Number(displayPrice).toLocaleString()}` : "Free"}</span>
          {originalPrice && <del className="text-xs text-gray-400">৳{Number(originalPrice).toLocaleString()}</del>}
        </div>
        {(kit.difficulty || kit.itemCount != null) && (
          <p className="text-[11px] text-gray-400 mt-1">
            {[kit.difficulty, kit.itemCount != null ? `${kit.itemCount} items` : null].filter(Boolean).join(" · ")}
          </p>
        )}
      </div>
    </article>
  );
}

function KitListRow({ kit, onOpen }: { kit: ProjectKit; onOpen: (slug: string) => void }) {
  const addItem = useCartStore((state) => state.addItem);
  const setCartOpen = useUIStore((state) => state.setCartOpen);
  const image = getKitImage(kit);
  const displayPrice = getKitPrice(kit);
  const inStock = kit.stock > 0;

  const handleAdd = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (!inStock) return;
    addItem({
      itemType: "PROJECT_KIT",
      projectKitId: kit.id,
      productName: kit.title,
      productImage: image,
      price: Number(displayPrice),
      quantity: 1,
    });
    toast.success("Kit added to cart", { description: kit.title });
    setCartOpen(true);
  };

  return (
    <article
      className="flex gap-4 border border-gray-100 rounded bg-white p-4 hover:shadow-md transition-shadow cursor-pointer group"
      role="button"
      tabIndex={0}
      onClick={() => onOpen(kit.slug)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpen(kit.slug);
        }
      }}
    >
      <div className="h-24 w-24 shrink-0 overflow-hidden rounded bg-gray-50 sm:h-32 sm:w-32">
        {image
          ? <img src={image} alt={kit.title} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
          : <Package className="m-8 h-8 w-8 text-gray-300" />}
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-center">
        {kit.category && <p className="mb-1 text-[10px] text-gray-400 font-medium uppercase tracking-widest">{kit.category}</p>}
        <h2 className="font-medium text-sm text-gray-800 line-clamp-2 mb-1 leading-snug group-hover:text-[#0EA5E9] transition-colors">{kit.titleBn || kit.title}</h2>
        <p className="line-clamp-2 text-xs leading-5 text-gray-500">{kit.description}</p>
        <div className="mt-2 flex items-center gap-2">
          <span className="text-base font-bold text-[#0EA5E9]">{displayPrice > 0 ? `৳${Number(displayPrice).toLocaleString()}` : "Free"}</span>
          {kit.salePrice != null && kit.salePrice < kit.price && <del className="text-sm text-gray-400">৳{Number(kit.price).toLocaleString()}</del>}
        </div>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); handleAdd(e); }}
          disabled={!inStock}
          className="mt-3 w-fit bg-[#0EA5E9] text-white text-xs font-semibold px-4 py-2 rounded hover:bg-sky-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {inStock ? "Add to Cart" : "Out of Stock"}
        </button>
      </div>
    </article>
  );
}

function LatestKit({ kit, onOpen }: { kit: ProjectKit; onOpen: (id: string) => void }) {
  const image = getKitImage(kit);
  return (
    <button type="button" onClick={() => onOpen(kit.slug)} className="group flex w-full gap-2.5 text-left">
      <div className="w-12 h-12 rounded bg-gray-100 overflow-hidden shrink-0">
        {image ? <img src={image} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" /> : <Package className="m-3 h-5 w-5 text-gray-300" />}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-gray-700 line-clamp-2 group-hover:text-[#0EA5E9] transition-colors leading-snug">{kit.title}</p>
        <p className="text-xs font-bold text-[#0EA5E9] mt-0.5">{getKitPrice(kit) > 0 ? `৳${Number(getKitPrice(kit)).toLocaleString()}` : "Free"}</p>
      </div>
    </button>
  );
}

function ProjectKitsPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialCategory = searchParams.get("category") || "";
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(12);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [sort, setSort] = useState(searchParams.get("sort") || "featured");
  const [category, setCategory] = useState(initialCategory);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const kitsQuery = useQuery<{ data: ProjectKit[] }>({
    queryKey: ["project-kits-list"],
    queryFn: () => apiFetch<{ data: ProjectKit[] }>("/api/project-kits"),
    staleTime: 60 * 1000,
  });

  const allKits = kitsQuery.data?.data ?? [];
  const categories = useMemo(
    () => Array.from(new Set(allKits.map((kit) => kit.category).filter((value): value is string => Boolean(value)))),
    [allKits],
  );
  const filteredKits = useMemo(() => {
    const min = minPrice ? Number(minPrice) : 0;
    const max = maxPrice ? Number(maxPrice) : Number.POSITIVE_INFINITY;
    const result = allKits.filter((kit) => {
      const price = getKitPrice(kit);
      return (!category || kit.category === category) && price >= min && price <= max;
    });

    return result.sort((first, second) => {
      if (sort === "price-asc") return getKitPrice(first) - getKitPrice(second);
      if (sort === "price-desc") return getKitPrice(second) - getKitPrice(first);
      if (sort === "latest") return new Date(second.createdAt || 0).getTime() - new Date(first.createdAt || 0).getTime();
      return 0;
    });
  }, [allKits, category, maxPrice, minPrice, sort]);
  const total = filteredKits.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const visibleKits = filteredKits.slice((page - 1) * limit, page * limit);
  const firstResult = total === 0 ? 0 : (page - 1) * limit + 1;
  const lastResult = Math.min(page * limit, total);
  const selectedCategoryName = category || "";
  const activeFilterCount = [category, minPrice, maxPrice].filter(Boolean).length;

  const openKit = (slug: string) => {
    router.push(`/project-kits/${slug}`);
  };

  const resetPageAnd = (action: () => void) => {
    action();
    setPage(1);
  };

  const clearFilters = () => {
    setCategory("");
    setMinPrice("");
    setMaxPrice("");
    setPage(1);
  };

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="mb-6 flex items-center gap-2 text-xs text-gray-500">
            <a href="/" className="hover:text-gray-900">Home</a>
            <ChevronRight className="h-3 w-3 text-gray-300" />
            <span className="text-gray-900 font-medium">{selectedCategoryName || "Project Kits"}</span>
          </div>

          <div className="flex gap-8">
            {/* Sidebar — desktop only */}
            <aside className={cn("w-56 shrink-0 space-y-5 md:block", filtersOpen ? "block" : "hidden")}>
              {/* Mobile close */}
              <div className="flex items-center justify-between md:hidden">
                <h3 className="font-semibold text-sm uppercase tracking-wider">Filters</h3>
                <button type="button" onClick={() => setFiltersOpen(false)} className="text-gray-400" aria-label="Close filters">
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Kit Category */}
              <div>
                <h3 className="font-semibold text-sm mb-3 uppercase tracking-wider">Kit Category</h3>
                <div className="space-y-1">
                  <button
                    type="button"
                    onClick={() => resetPageAnd(() => setCategory(""))}
                    className={cn("w-full flex items-center justify-between py-1.5 text-sm", !category ? "text-[#0EA5E9] font-semibold" : "text-gray-500 hover:text-gray-900")}
                  >
                    <span>All Kits</span>
                    <span className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">{allKits.length}</span>
                  </button>
                  {kitsQuery.isLoading ? (
                    <div className="space-y-2 py-1">{Array.from({ length: 5 }).map((_, index) => <div key={index} className="h-4 animate-pulse rounded bg-gray-100" />)}</div>
                  ) : categories.length > 0 ? (
                    categories.map((item) => {
                      const count = allKits.filter((k) => k.category === item).length;
                      return (
                        <button
                          type="button"
                          key={item}
                          onClick={() => resetPageAnd(() => setCategory(item))}
                          className={cn("w-full flex items-center justify-between py-1.5 text-sm", category === item ? "text-[#0EA5E9] font-semibold" : "text-gray-500 hover:text-gray-900")}
                        >
                          <span>{item}</span>
                          <span className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">{count}</span>
                        </button>
                      );
                    })
                  ) : <p className="py-2 text-sm text-gray-400">No categories yet.</p>}
                </div>
              </div>

              {/* Price Range */}
              <div className="border-t border-gray-200 pt-5">
                <h3 className="font-semibold text-sm mb-3 uppercase tracking-wider">Price Range</h3>
                <div className="flex items-center gap-2">
                  <input value={minPrice} onChange={(event) => resetPageAnd(() => setMinPrice(event.target.value.replace(/\D/g, "")))} inputMode="numeric" placeholder="Min" aria-label="Minimum kit price" className="h-8 w-full rounded border border-gray-300 px-2 text-xs outline-none focus:border-[#0EA5E9] transition-colors" />
                  <span className="text-gray-400 text-xs">—</span>
                  <input value={maxPrice} onChange={(event) => resetPageAnd(() => setMaxPrice(event.target.value.replace(/\D/g, "")))} inputMode="numeric" placeholder="Max" aria-label="Maximum kit price" className="h-8 w-full rounded border border-gray-300 px-2 text-xs outline-none focus:border-[#0EA5E9] transition-colors" />
                </div>
              </div>

              {/* Latest Project Kits */}
              <div className="border-t border-gray-200 pt-5">
                <h3 className="font-semibold text-sm mb-3 uppercase tracking-wider">Latest Products</h3>
                <div className="space-y-3">
                  {kitsQuery.isLoading
                    ? Array.from({ length: 3 }).map((_, index) => <div key={index} className="h-14 animate-pulse rounded bg-gray-100" />)
                    : allKits.slice(0, 4).map((kit) => <LatestKit key={kit.id} kit={kit} onOpen={openKit} />)}
                </div>
              </div>

              {/* Clear filters */}
              {(category || minPrice || maxPrice) && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="w-full border border-gray-200 rounded py-2 text-xs font-medium text-gray-500 hover:text-[#0EA5E9] hover:border-[#0EA5E9] transition-colors"
                >
                  Clear All Filters
                </button>
              )}
            </aside>

            <section className="flex-1 min-w-0">
              {/* Toolbar */}
              <div className="flex items-center justify-between mb-5 gap-3 flex-wrap">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setFiltersOpen((open) => !open)}
                    className="md:hidden flex items-center gap-1.5 border border-gray-200 rounded px-3 py-1.5 text-xs font-medium"
                  >
                    <SlidersHorizontal className="h-3 w-3" /> Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
                  </button>
                  <p className="text-xs text-gray-500"><span className="font-semibold text-gray-900">{total}</span> kits found</p>
                </div>
                <div className="flex items-center gap-3">
                  <select id="kit-sort" value={sort} onChange={(event) => resetPageAnd(() => setSort(event.target.value))} className="text-xs border border-gray-200 rounded px-3 py-1.5 outline-none bg-white">
                    {sortOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                  </select>
                  <div className="flex border border-gray-200 rounded overflow-hidden">
                    <button type="button" onClick={() => setView("grid")} className={cn("p-1.5", view === "grid" ? "bg-[#0EA5E9] text-white" : "text-gray-500 hover:bg-gray-100")} aria-label="Grid view"><Grid2X2 className="h-3.5 w-3.5" /></button>
                    <button type="button" onClick={() => setView("list")} className={cn("p-1.5", view === "list" ? "bg-[#0EA5E9] text-white" : "text-gray-500 hover:bg-gray-100")} aria-label="List view"><List className="h-3.5 w-3.5" /></button>
                  </div>
                </div>
              </div>

              {kitsQuery.isError ? (
                <div className="rounded border border-red-100 bg-white px-5 py-16 text-center">
                  <p className="font-semibold text-gray-800">We couldn&apos;t load the project kits.</p>
                  <p className="mt-1 text-sm text-gray-500">Please check your connection and try again.</p>
                  <button type="button" onClick={() => kitsQuery.refetch()} className="mt-4 rounded bg-[#0EA5E9] px-4 py-2 text-sm font-semibold text-white hover:bg-sky-600">Try again</button>
                </div>
              ) : kitsQuery.isLoading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">{Array.from({ length: 10 }).map((_, index) => <div key={index} className="aspect-square animate-pulse border border-gray-100 bg-white rounded" />)}</div>
              ) : total === 0 ? (
                <div className="text-center py-20">
                  <Package className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                  <h2 className="text-lg font-semibold text-gray-800 mb-2">No project kits found</h2>
                  <p className="text-gray-500 text-sm">Try another category or clear your filters.</p>
                  <button type="button" onClick={clearFilters} className="mt-4 rounded bg-[#0EA5E9] px-4 py-2 text-sm font-semibold text-white hover:bg-sky-600">Clear all filters</button>
                </div>
              ) : view === "grid" ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">{visibleKits.map((kit) => <KitCard key={kit.id} kit={kit} onOpen={openKit} />)}</div>
              ) : (
                <div className="space-y-3">{visibleKits.map((kit) => <KitListRow key={kit.id} kit={kit} onOpen={openKit} />)}</div>
              )}

              {!kitsQuery.isLoading && total > 0 && (
                <div className="mt-7 flex flex-wrap items-center justify-between gap-4 border-t border-gray-200 pt-5">
                  <p className="text-sm text-gray-500">Showing <span className="font-semibold text-gray-700">{firstResult}–{lastResult}</span> of <span className="font-semibold text-gray-700">{total}</span> kits</p>
                  <div className="flex items-center gap-3">
                    <label htmlFor="kit-limit" className="hidden text-sm text-gray-500 sm:inline">Show:</label>
                    <select id="kit-limit" value={limit} onChange={(event) => resetPageAnd(() => setLimit(Number(event.target.value)))} className="h-9 rounded border border-gray-300 bg-white px-2 text-sm text-gray-700 outline-none focus:border-[#0EA5E9]">
                      {[6, 12, 24].map((value) => <option key={value} value={value}>{value}</option>)}
                    </select>
                    <div className="flex items-center gap-1.5">
                      <button type="button" disabled={page <= 1} onClick={() => setPage((value) => value - 1)} className="w-8 h-8 border border-gray-300 rounded flex items-center justify-center text-gray-400 hover:border-[#0EA5E9] hover:text-[#0EA5E9] disabled:opacity-30 transition-colors bg-white" aria-label="Previous page"><ChevronLeft className="h-3.5 w-3.5" /></button>
                      {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((n) => (
                        <button key={n} type="button" onClick={() => setPage(n)} className={`w-8 h-8 border rounded text-sm font-medium transition-colors ${page === n ? "bg-[#0EA5E9] text-white border-[#0EA5E9]" : "border-gray-300 text-gray-600 hover:border-[#0EA5E9] hover:text-[#0EA5E9] bg-white"}`}>{n}</button>
                      ))}
                      <button type="button" disabled={page >= totalPages} onClick={() => setPage((value) => value + 1)} className="w-8 h-8 border border-gray-300 rounded flex items-center justify-center text-gray-400 hover:border-[#0EA5E9] hover:text-[#0EA5E9] disabled:opacity-30 transition-colors bg-white" aria-label="Next page"><ChevronRight className="h-3.5 w-3.5" /></button>
                    </div>
                  </div>
                </div>
              )}
            </section>
          </div>
        </div>
      </main>
      <Footer />
      <CartDrawer />
      <CheckoutDialog />
      <ChatWidget />
      <BackToTopButton />
      {kitsQuery.isFetching && !kitsQuery.isLoading && <div className="fixed bottom-5 left-1/2 z-40 flex -translate-x-1/2 items-center gap-2 rounded-full bg-[#0d1a2d] px-3 py-2 text-xs text-white shadow-lg"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Updating project kits</div>}
    </>
  );
}

function ProjectKitsPageFallback() {
  return <div className="flex min-h-screen items-center justify-center bg-gray-50"><Loader2 className="h-6 w-6 animate-spin text-[#0EA5E9]" /></div>;
}

export default function ProjectKitsPage() {
  return <Suspense fallback={<ProjectKitsPageFallback />}><ProjectKitsPageContent /></Suspense>;
}
