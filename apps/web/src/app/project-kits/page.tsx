"use client";

import { type MouseEvent, Suspense, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ChevronDown,
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
      itemType: "PROJECT",
      productId: kit.id,
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
      className="group relative flex min-w-0 cursor-pointer flex-col border border-slate-200 bg-white transition-shadow hover:border-slate-300 hover:shadow-md"
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
      <div className="relative aspect-square overflow-hidden bg-white">
        {image && !imageError ? (
          <img
            src={image}
            alt={kit.title}
            className="h-full w-full object-contain p-2 transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-slate-50">
            <Package className="h-8 w-8 text-slate-300" />
          </div>
        )}
        {discount > 0 && <span className="absolute left-2 top-2 bg-epf-500 px-1.5 py-0.5 text-[10px] font-bold text-white">-{discount}%</span>}
        {!inStock && <span className="absolute left-2 top-2 bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">Out of stock</span>}
        <button
          type="button"
          aria-label="Add kit to wishlist"
          className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center bg-white/90 text-slate-400 shadow-sm hover:text-red-500"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
          }}
        >
          <Heart className="h-3.5 w-3.5" />
        </button>
        {inStock && (
          <button
            type="button"
            aria-label="Add kit to cart"
            onClick={handleAdd}
            className="absolute bottom-2 right-2 flex h-8 w-8 items-center justify-center rounded-sm bg-slate-900 text-white hover:bg-epf-500"
          >
            <ShoppingCart className="h-4 w-4" />
          </button>
        )}
      </div>
      <div className="flex min-h-[120px] flex-1 flex-col border-t border-slate-100 p-2.5">
        {kit.category && <span className="truncate text-[11px] font-semibold uppercase tracking-wide text-epf-600">{kit.category}</span>}
        <h2 className="mt-1 line-clamp-2 text-[14px] font-medium leading-[1.35] text-slate-800 group-hover:text-epf-600">{kit.titleBn || kit.title}</h2>
        <div className="mt-auto pt-2">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
            {kit.difficulty && <span>{kit.difficulty}</span>}
            {kit.difficulty && kit.itemCount != null && <span>•</span>}
            {kit.itemCount != null && <span>{kit.itemCount} items</span>}
          </div>
          <div className="mt-1 flex items-center gap-1.5">
            <span className="text-[16px] font-bold text-slate-900">{displayPrice > 0 ? `৳${Number(displayPrice).toLocaleString()}` : "Free"}</span>
            {originalPrice && <del className="text-[12px] text-slate-400">৳{Number(originalPrice).toLocaleString()}</del>}
          </div>
        </div>
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
      itemType: "PROJECT",
      productId: kit.id,
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
      className="flex cursor-pointer gap-4 rounded-lg border border-slate-200 bg-white p-3 shadow-sm sm:p-4"
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
      <div className="flex h-32 w-32 shrink-0 items-center justify-center overflow-hidden rounded-md bg-slate-50 sm:h-40 sm:w-40">
        {image ? <img src={image} alt={kit.title} className="h-full w-full object-contain p-2" loading="lazy" /> : <Package className="h-8 w-8 text-slate-300" />}
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-center">
        {kit.category && <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-epf-500">{kit.category}</p>}
        <h2 className="line-clamp-2 text-base font-semibold text-slate-800 sm:text-lg">{kit.titleBn || kit.title}</h2>
        <p className="mt-2 line-clamp-2 text-sm leading-5 text-slate-500">{kit.description}</p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-lg font-bold text-slate-900">{displayPrice > 0 ? `৳${Number(displayPrice).toLocaleString()}` : "Free"}</span>
          {kit.salePrice != null && kit.salePrice < kit.price && <del className="text-sm text-slate-400">৳{Number(kit.price).toLocaleString()}</del>}
        </div>
        <button
          type="button"
          onClick={handleAdd}
          disabled={!inStock}
          className="mt-3 w-fit rounded-md bg-epf-500 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-epf-600 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {inStock ? "Add to cart" : "Out of stock"}
        </button>
      </div>
    </article>
  );
}

function LatestKit({ kit, onOpen }: { kit: ProjectKit; onOpen: (id: string) => void }) {
  const image = getKitImage(kit);
  return (
    <button type="button" onClick={() => onOpen(kit.slug)} className="group flex w-full items-center gap-3 border-b border-slate-100 py-3 text-left last:border-b-0">
      <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-md bg-slate-50">
        {image ? <img src={image} alt="" className="h-full w-full object-contain p-1" loading="lazy" /> : <Package className="h-5 w-5 text-slate-300" />}
      </div>
      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 text-[13px] font-medium leading-5 text-slate-700 transition-colors group-hover:text-epf-600">{kit.title}</p>
        <p className="mt-1 text-sm font-bold text-slate-900">{getKitPrice(kit) > 0 ? `৳${Number(getKitPrice(kit)).toLocaleString()}` : "Free"}</p>
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
      <main className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-[1440px] px-4 py-5 sm:px-6 sm:py-7 lg:px-8">
          <div className="mb-5 flex flex-wrap items-center gap-2 text-sm text-slate-500">
            <a href="/" className="hover:text-epf-600">Home</a>
            <ChevronRight className="h-4 w-4 text-slate-300" />
            <span className="font-medium text-slate-800">Project Kits</span>
            {selectedCategoryName && (
              <>
                <ChevronRight className="h-4 w-4 text-slate-300" />
                <span className="text-epf-600">{selectedCategoryName}</span>
              </>
            )}
          </div>

          <div className="flex items-end justify-between gap-4 border-b border-slate-200 pb-5">
            <div>
              <p className="mb-1 text-xs font-bold uppercase tracking-[0.18em] text-epf-500">ePowerFix project solutions</p>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Project Kits</h1>
              <p className="mt-1 text-sm text-slate-500">Everything you need to build practical electrical and technology projects.</p>
            </div>
            <button
              type="button"
              onClick={() => setFiltersOpen((open) => !open)}
              className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 lg:hidden"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
            </button>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-[248px_minmax(0,1fr)]">
            <aside className={cn("h-fit rounded-lg border border-slate-200 bg-white lg:block", filtersOpen ? "block" : "hidden")}>
              <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4">
                <h2 className="text-base font-bold text-slate-900">Browse Categories</h2>
                <button type="button" onClick={() => setFiltersOpen(false)} className="text-slate-400 lg:hidden" aria-label="Close filters">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="border-b border-slate-200 px-4 py-3">
                <button
                  type="button"
                  onClick={() => resetPageAnd(() => setCategory(""))}
                  className={cn("flex w-full items-center justify-between py-1.5 text-left text-sm", !category ? "font-semibold text-epf-600" : "text-slate-600 hover:text-epf-600")}
                >
                  <span>All Project Kits</span>
                  <span className="text-xs text-slate-400">{allKits.length || "—"}</span>
                </button>
                {kitsQuery.isLoading ? (
                  <div className="space-y-3 py-2">{Array.from({ length: 5 }).map((_, index) => <div key={index} className="h-4 animate-pulse rounded bg-slate-100" />)}</div>
                ) : categories.length > 0 ? (
                  categories.map((item) => (
                    <button
                      type="button"
                      key={item}
                      onClick={() => resetPageAnd(() => setCategory(item))}
                      className={cn("flex w-full items-center justify-between gap-2 py-1.5 text-left text-sm", category === item ? "font-semibold text-epf-600" : "text-slate-600 hover:text-epf-600")}
                    >
                      <span className="truncate">{item}</span>
                      <span className="shrink-0 text-xs text-slate-400">{allKits.filter((kit) => kit.category === item).length}</span>
                    </button>
                  ))
                ) : <p className="py-2 text-sm text-slate-400">No categories yet.</p>}
              </div>

              <div className="border-b border-slate-200 px-4 py-4">
                <h3 className="mb-3 text-sm font-bold text-slate-900">Price Range</h3>
                <div className="flex items-center gap-2">
                  <input value={minPrice} onChange={(event) => resetPageAnd(() => setMinPrice(event.target.value.replace(/\D/g, "")))} inputMode="numeric" placeholder="Min" aria-label="Minimum kit price" className="h-9 w-full rounded border border-slate-200 px-2 text-sm outline-none focus:border-epf-500" />
                  <span className="text-slate-300">—</span>
                  <input value={maxPrice} onChange={(event) => resetPageAnd(() => setMaxPrice(event.target.value.replace(/\D/g, "")))} inputMode="numeric" placeholder="Max" aria-label="Maximum kit price" className="h-9 w-full rounded border border-slate-200 px-2 text-sm outline-none focus:border-epf-500" />
                </div>
                <p className="mt-2 text-[11px] text-slate-400">Prices are shown in Bangladeshi Taka.</p>
              </div>

              <div className="px-4 py-4">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900">Latest Project Kits</h3>
                  <ChevronDown className="h-4 w-4 text-slate-400" />
                </div>
                {kitsQuery.isLoading ? (
                  <div className="space-y-3">{Array.from({ length: 3 }).map((_, index) => <div key={index} className="h-14 animate-pulse rounded bg-slate-100" />)}</div>
                ) : allKits.slice(0, 4).map((kit) => <LatestKit key={kit.id} kit={kit} onOpen={openKit} />)}
              </div>
            </aside>

            <section className="min-w-0">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3 py-3 sm:px-4">
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <span className="font-semibold text-slate-900">Project Kits</span>
                  <span className="hidden text-slate-300 sm:inline">|</span>
                  <span>{total} results</span>
                </div>
                <div className="flex items-center gap-2">
                  <label htmlFor="kit-sort" className="hidden text-sm text-slate-500 sm:inline">Sort by:</label>
                  <select id="kit-sort" value={sort} onChange={(event) => resetPageAnd(() => setSort(event.target.value))} className="h-9 rounded border border-slate-200 bg-white px-2 text-sm text-slate-700 outline-none focus:border-epf-500">
                    {sortOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                  </select>
                  <div className="hidden items-center rounded border border-slate-200 sm:flex">
                    <button type="button" onClick={() => setView("grid")} className={cn("flex h-9 w-9 items-center justify-center", view === "grid" ? "bg-epf-50 text-epf-600" : "text-slate-400 hover:text-slate-700")} aria-label="Grid view"><Grid2X2 className="h-4 w-4" /></button>
                    <button type="button" onClick={() => setView("list")} className={cn("flex h-9 w-9 items-center justify-center", view === "list" ? "bg-epf-50 text-epf-600" : "text-slate-400 hover:text-slate-700")} aria-label="List view"><List className="h-4 w-4" /></button>
                  </div>
                </div>
              </div>

              {kitsQuery.isError ? (
                <div className="rounded-lg border border-red-100 bg-white px-5 py-16 text-center">
                  <p className="font-semibold text-slate-800">We couldn&apos;t load the project kits.</p>
                  <p className="mt-1 text-sm text-slate-500">Please check your connection and try again.</p>
                  <button type="button" onClick={() => kitsQuery.refetch()} className="mt-4 rounded-md bg-epf-500 px-4 py-2 text-sm font-semibold text-white hover:bg-epf-600">Try again</button>
                </div>
              ) : kitsQuery.isLoading ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-5">{Array.from({ length: 10 }).map((_, index) => <div key={index} className="aspect-[.86] animate-pulse border border-slate-200 bg-white" />)}</div>
              ) : total === 0 ? (
                <div className="rounded-lg border border-slate-200 bg-white px-5 py-20 text-center">
                  <Package className="mx-auto h-10 w-10 text-slate-300" />
                  <h2 className="mt-4 text-lg font-semibold text-slate-800">No project kits found</h2>
                  <p className="mt-1 text-sm text-slate-500">Try another category or clear your filters.</p>
                  <button type="button" onClick={clearFilters} className="mt-4 rounded-md bg-epf-500 px-4 py-2 text-sm font-semibold text-white hover:bg-epf-600">Clear all filters</button>
                </div>
              ) : view === "grid" ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-5">{visibleKits.map((kit) => <KitCard key={kit.id} kit={kit} onOpen={openKit} />)}</div>
              ) : (
                <div className="space-y-3">{visibleKits.map((kit) => <KitListRow key={kit.id} kit={kit} onOpen={openKit} />)}</div>
              )}

              {!kitsQuery.isLoading && total > 0 && (
                <div className="mt-7 flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 pt-5">
                  <p className="text-sm text-slate-500">Showing <span className="font-semibold text-slate-700">{firstResult}–{lastResult}</span> of <span className="font-semibold text-slate-700">{total}</span> kits</p>
                  <div className="flex items-center gap-3">
                    <label htmlFor="kit-limit" className="hidden text-sm text-slate-500 sm:inline">Show:</label>
                    <select id="kit-limit" value={limit} onChange={(event) => resetPageAnd(() => setLimit(Number(event.target.value)))} className="h-9 rounded border border-slate-200 bg-white px-2 text-sm text-slate-700 outline-none focus:border-epf-500">
                      {[6, 12, 24].map((value) => <option key={value} value={value}>{value}</option>)}
                    </select>
                    <div className="flex items-center gap-1">
                      <button type="button" disabled={page <= 1} onClick={() => setPage((value) => value - 1)} className="flex h-9 w-9 items-center justify-center rounded border border-slate-200 bg-white text-slate-600 hover:border-epf-500 hover:text-epf-600 disabled:cursor-not-allowed disabled:opacity-40" aria-label="Previous page"><ChevronLeft className="h-4 w-4" /></button>
                      <span className="min-w-16 text-center text-sm text-slate-600">{page} / {totalPages}</span>
                      <button type="button" disabled={page >= totalPages} onClick={() => setPage((value) => value + 1)} className="flex h-9 w-9 items-center justify-center rounded border border-slate-200 bg-white text-slate-600 hover:border-epf-500 hover:text-epf-600 disabled:cursor-not-allowed disabled:opacity-40" aria-label="Next page"><ChevronRight className="h-4 w-4" /></button>
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
      {kitsQuery.isFetching && !kitsQuery.isLoading && <div className="fixed bottom-5 left-1/2 z-40 flex -translate-x-1/2 items-center gap-2 rounded-full bg-slate-900 px-3 py-2 text-xs text-white shadow-lg"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Updating project kits</div>}
    </>
  );
}

function ProjectKitsPageFallback() {
  return <div className="flex min-h-screen items-center justify-center bg-slate-50"><Loader2 className="h-6 w-6 animate-spin text-epf-500" /></div>;
}

export default function ProjectKitsPage() {
  return <Suspense fallback={<ProjectKitsPageFallback />}><ProjectKitsPageContent /></Suspense>;
}
