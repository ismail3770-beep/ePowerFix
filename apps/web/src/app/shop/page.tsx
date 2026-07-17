"use client";

import { type MouseEvent, Suspense, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
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
  Star,
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

interface Product {
  id: string;
  name: string;
  slug?: string;
  price: number;
  salePrice: number | null;
  comparePrice?: number | null;
  images: string[];
  stock: number;
  rating: number;
  reviewCount: number;
  sku?: string | null;
  category?: { id?: string; name: string; slug: string } | null;
}

interface ProductListResponse {
  data: {
    data: Product[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

interface Category {
  id: string;
  name: string;
  slug: string;
  image: string | null;
  _count?: { products: number };
}

const sortOptions = [
  { value: "featured", label: "Featured" },
  { value: "latest", label: "Newest" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "rating", label: "Top Rated" },
];

function getCardData(product: Product) {
  const salePrice = product.salePrice != null && product.salePrice < product.price
    ? product.salePrice
    : null;

  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    price: salePrice ?? product.price,
    comparePrice: salePrice != null ? product.price : null,
    images: product.images,
    stock: product.stock,
    rating: product.rating,
    reviewCount: product.reviewCount,
    category: product.category?.name,
    sku: product.sku ?? undefined,
  };
}

function StoreProductCard({ product }: { product: Product }) {
  const addItem = useCartStore((state) => state.addItem);
  const setCartOpen = useUIStore((state) => state.setCartOpen);
  const [imageError, setImageError] = useState(false);
  const card = getCardData(product);
  const displayPrice = card.price;
  const originalPrice = card.comparePrice;
  const discount = originalPrice ? Math.round(((originalPrice - displayPrice) / originalPrice) * 100) : 0;
  const image = card.images?.[0];
  const inStock = product.stock > 0;
  const href = `/shop/${product.slug || product.id}`;

  const handleAdd = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (!inStock) return;
    addItem({
      itemType: "PRODUCT",
      productId: product.id,
      productName: product.name,
      productImage: image || "",
      price: Number(displayPrice),
      quantity: 1,
    });
    toast.success("Added to cart", { description: product.name });
    setCartOpen(true);
  };

  return (
    <article className="epf-reference-product-card group relative flex min-w-0 flex-col overflow-hidden border border-slate-200 bg-white">
      <div className="relative aspect-square overflow-hidden bg-slate-50">
        {image && !imageError ? (
          <img src={image} alt={product.name} className="h-full w-full object-contain p-3 transition-transform duration-500 group-hover:scale-105" loading="lazy" onError={() => setImageError(true)} />
        ) : (
          <div className="flex h-full items-center justify-center"><Package className="h-8 w-8 text-slate-300" /></div>
        )}
        {discount > 0 && <span className="absolute left-2 top-2 bg-epf-500 px-2 py-0.5 text-[10px] font-bold text-white">-{discount}%</span>}
        {!inStock && <span className="absolute left-2 top-2 bg-slate-700 px-2 py-0.5 text-[10px] font-bold text-white">Out of stock</span>}
        <div className="absolute inset-x-0 bottom-0 flex translate-y-full gap-2 border-t border-slate-200 bg-white/95 p-2 opacity-0 backdrop-blur-sm transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          {inStock ? <button type="button" onClick={handleAdd} className="flex h-8 flex-1 items-center justify-center gap-1.5 bg-epf-500 px-2 text-[11px] font-bold text-white transition-colors hover:bg-epf-600"><ShoppingCart className="h-3.5 w-3.5" /> Add to cart</button> : <span className="flex h-8 flex-1 items-center justify-center bg-slate-100 text-[11px] font-semibold text-slate-500">Out of stock</span>}
          <button type="button" aria-label="Add to wishlist" className="flex h-8 w-8 items-center justify-center border border-slate-200 bg-white text-slate-500 transition-colors hover:border-red-200 hover:text-red-500" onClick={(event) => { event.preventDefault(); event.stopPropagation(); }}><Heart className="h-3.5 w-3.5" /></button>
        </div>
      </div>
      <Link href={href} className="flex min-h-[122px] flex-1 flex-col border-t border-slate-100 p-3">
        {product.category?.name && <span className="truncate text-[10px] font-bold uppercase tracking-[0.12em] text-epf-600">{product.category.name}</span>}
        <h3 className="mt-1 line-clamp-2 text-[14px] font-semibold leading-5 text-slate-800 transition-colors group-hover:text-epf-600">{product.name}</h3>
        <div className="mt-auto pt-2">
          {(product.rating || 0) > 0 && <span className="inline-flex items-center gap-1 text-[11px] text-slate-400"><Star className="h-3 w-3 fill-amber-400 text-amber-400" /> {Number(product.rating).toFixed(1)} ({product.reviewCount || 0})</span>}
          <div className="mt-1 flex items-baseline gap-1.5"><span className="text-[16px] font-bold text-slate-900">৳{Number(displayPrice).toLocaleString()}</span>{originalPrice && <del className="text-[12px] text-slate-400">৳{Number(originalPrice).toLocaleString()}</del>}</div>
        </div>
      </Link>
    </article>
  );
}

function RatingStars({ rating, count }: { rating: number; count: number }) {
  return (
    <div className="flex items-center gap-1">
      <span className="flex items-center gap-0.5" aria-label={`${rating.toFixed(1)} out of 5 stars`}>
        {Array.from({ length: 5 }).map((_, index) => (
          <Star
            key={index}
            className={cn(
              "h-3.5 w-3.5",
              index < Math.round(rating)
                ? "fill-amber-400 text-amber-400"
                : "fill-slate-200 text-slate-200",
            )}
          />
        ))}
      </span>
      <span className="text-xs text-slate-400">({count})</span>
    </div>
  );
}

function LatestProduct({ product }: { product: Product }) {
  const card = getCardData(product);
  const image = card.images?.[0];

  return (
    <Link
      href={`/shop/${product.slug || product.id}`}
      className="group flex items-center gap-3 border-b border-slate-100 py-3 last:border-b-0"
    >
      <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-md bg-slate-50">
        {image ? (
          <img src={image} alt="" className="h-full w-full object-contain p-1" loading="lazy" />
        ) : (
          <Package className="h-5 w-5 text-slate-300" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 text-[13px] font-medium leading-5 text-slate-700 transition-colors group-hover:text-epf-600">
          {product.name}
        </p>
        <p className="mt-1 text-sm font-bold text-slate-900">
          ৳{Number(card.price).toLocaleString()}
        </p>
      </div>
    </Link>
  );
}

function ListProductRow({ product, onAddToCart }: { product: Product; onAddToCart: (product: Product) => void }) {
  const card = getCardData(product);
  const image = card.images?.[0];
  const inStock = product.stock > 0;

  return (
    <article className="flex gap-4 rounded-lg border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
      <Link
        href={`/shop/${product.slug || product.id}`}
        className="flex h-32 w-32 shrink-0 items-center justify-center overflow-hidden rounded-md bg-slate-50 sm:h-40 sm:w-40"
      >
        {image ? (
          <img src={image} alt={product.name} className="h-full w-full object-contain p-2" />
        ) : (
          <Package className="h-8 w-8 text-slate-300" />
        )}
      </Link>
      <div className="flex min-w-0 flex-1 flex-col justify-center">
        {product.category?.name && (
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-epf-500">
            {product.category.name}
          </p>
        )}
        <Link href={`/shop/${product.slug || product.id}`}>
          <h3 className="line-clamp-2 text-base font-semibold text-slate-800 hover:text-epf-600 sm:text-lg">
            {product.name}
          </h3>
        </Link>
        <div className="mt-2">
          <RatingStars rating={product.rating || 0} count={product.reviewCount || 0} />
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-lg font-bold text-slate-900">৳{Number(card.price).toLocaleString()}</span>
          {card.comparePrice != null && (
            <del className="text-sm text-slate-400">৳{Number(card.comparePrice).toLocaleString()}</del>
          )}
        </div>
        <button
          type="button"
          onClick={() => onAddToCart(product)}
          disabled={!inStock}
          className="mt-3 w-fit rounded-md bg-epf-500 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-epf-600 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {inStock ? "Add to cart" : "Out of stock"}
        </button>
      </div>
    </article>
  );
}

function ShopPageContent() {
  const searchParams = useSearchParams();
  const addItem = useCartStore((state) => state.addItem);
  const setCartOpen = useUIStore((state) => state.setCartOpen);
  const initialCategory = searchParams.get("category") || "";
  const search = searchParams.get("search") || "";

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(24);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [sort, setSort] = useState(searchParams.get("sort") || "featured");
  const [category, setCategory] = useState(initialCategory);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const productQuery = useQuery<ProductListResponse>({
    queryKey: ["shop-products", { page, limit, search, category, sort, minPrice, maxPrice }],
    queryFn: () => {
      const params = new URLSearchParams({ page: String(page), limit: String(limit), sort });
      if (search) params.set("search", search);
      if (category) params.set("category", category);
      if (minPrice) params.set("minPrice", minPrice);
      if (maxPrice) params.set("maxPrice", maxPrice);
      return apiFetch<ProductListResponse>(`/api/products?${params.toString()}`);
    },
  });

  const categoriesQuery = useQuery<{ categories: Category[] }>({
    queryKey: ["shop-categories"],
    queryFn: () => apiFetch<{ categories: Category[] }>("/api/categories?counts=true"),
    staleTime: 5 * 60 * 1000,
  });

  const latestQuery = useQuery<ProductListResponse>({
    queryKey: ["shop-latest-products"],
    queryFn: () => apiFetch<ProductListResponse>("/api/products?limit=4&sort=latest"),
    staleTime: 60 * 1000,
  });

  const products = productQuery.data?.data.data ?? [];
  const total = productQuery.data?.data.total ?? 0;
  const totalPages = productQuery.data?.data.totalPages ?? 1;
  const categories = categoriesQuery.data?.categories ?? [];
  const firstResult = total === 0 ? 0 : (page - 1) * limit + 1;
  const lastResult = Math.min(page * limit, total);
  const selectedCategoryName = categories.find((item) => item.slug === category)?.name;

  const activeFilterCount = useMemo(
    () => [category, minPrice, maxPrice].filter(Boolean).length,
    [category, minPrice, maxPrice],
  );

  const clearFilters = () => {
    setCategory("");
    setMinPrice("");
    setMaxPrice("");
    setPage(1);
  };

  const addProductToCart = (product: Product) => {
    const card = getCardData(product);
    addItem({
      itemType: "PRODUCT",
      productId: product.id,
      productName: product.name,
      productImage: card.images?.[0] || "",
      price: card.price,
      quantity: 1,
    });
    toast.success("Added to cart", { description: product.name });
    setCartOpen(true);
  };

  const resetPageAnd = (action: () => void) => {
    action();
    setPage(1);
  };

  return (
    <>
      <Header />
      <main className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-[1440px] px-4 py-5 sm:px-6 sm:py-7 lg:px-8">
          <div className="mb-5 flex flex-wrap items-center gap-2 text-sm text-slate-500">
            <Link href="/" className="hover:text-epf-600">Home</Link>
            <ChevronRight className="h-4 w-4 text-slate-300" />
            <span className="font-medium text-slate-800">Shop</span>
            {selectedCategoryName && (
              <>
                <ChevronRight className="h-4 w-4 text-slate-300" />
                <span className="text-epf-600">{selectedCategoryName}</span>
              </>
            )}
          </div>

          <div className="flex items-end justify-between gap-4 border-b border-slate-200 pb-5">
            <div>
              <p className="mb-1 text-xs font-bold uppercase tracking-[0.18em] text-epf-500">ePowerFix marketplace</p>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Shop</h1>
              <p className="mt-1 text-sm text-slate-500">Find quality electrical products at the right price.</p>
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
                  <span>All Products</span>
                  <span className="text-xs text-slate-400">{total || "—"}</span>
                </button>
                {categoriesQuery.isLoading ? (
                  <div className="space-y-3 py-2">
                    {Array.from({ length: 6 }).map((_, index) => <div key={index} className="h-4 animate-pulse rounded bg-slate-100" />)}
                  </div>
                ) : (
                  categories.map((item) => (
                    <button
                      type="button"
                      key={item.id}
                      onClick={() => resetPageAnd(() => setCategory(item.slug))}
                      className={cn("flex w-full items-center justify-between gap-2 py-1.5 text-left text-sm", category === item.slug ? "font-semibold text-epf-600" : "text-slate-600 hover:text-epf-600")}
                    >
                      <span className="truncate">{item.name}</span>
                      <span className="shrink-0 text-xs text-slate-400">{item._count?.products ?? "—"}</span>
                    </button>
                  ))
                )}
              </div>

              <div className="border-b border-slate-200 px-4 py-4">
                <h3 className="mb-3 text-sm font-bold text-slate-900">Price Range</h3>
                <div className="flex items-center gap-2">
                  <input
                    value={minPrice}
                    onChange={(event) => resetPageAnd(() => setMinPrice(event.target.value.replace(/\D/g, "")))}
                    inputMode="numeric"
                    placeholder="Min"
                    aria-label="Minimum price"
                    className="h-9 w-full rounded border border-slate-200 px-2 text-sm outline-none focus:border-epf-500"
                  />
                  <span className="text-slate-300">—</span>
                  <input
                    value={maxPrice}
                    onChange={(event) => resetPageAnd(() => setMaxPrice(event.target.value.replace(/\D/g, "")))}
                    inputMode="numeric"
                    placeholder="Max"
                    aria-label="Maximum price"
                    className="h-9 w-full rounded border border-slate-200 px-2 text-sm outline-none focus:border-epf-500"
                  />
                </div>
                <p className="mt-2 text-[11px] text-slate-400">Prices are shown in Bangladeshi Taka.</p>
              </div>

              <div className="px-4 py-4">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900">Latest Products</h3>
                  <ChevronDown className="h-4 w-4 text-slate-400" />
                </div>
                {latestQuery.isLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, index) => <div key={index} className="h-14 animate-pulse rounded bg-slate-100" />)}
                  </div>
                ) : (
                  latestQuery.data?.data.data.slice(0, 4).map((product) => <LatestProduct key={product.id} product={product} />)
                )}
              </div>
            </aside>

            <section className="min-w-0">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3 py-3 sm:px-4">
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <span className="font-semibold text-slate-900">Shop</span>
                  <span className="hidden text-slate-300 sm:inline">|</span>
                  <span>{total} results</span>
                </div>
                <div className="flex items-center gap-2">
                  <label htmlFor="shop-sort" className="hidden text-sm text-slate-500 sm:inline">Sort by:</label>
                  <select
                    id="shop-sort"
                    value={sort}
                    onChange={(event) => resetPageAnd(() => setSort(event.target.value))}
                    className="h-9 rounded border border-slate-200 bg-white px-2 text-sm text-slate-700 outline-none focus:border-epf-500"
                  >
                    {sortOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                  </select>
                  <div className="hidden items-center rounded border border-slate-200 sm:flex">
                    <button type="button" onClick={() => setView("grid")} className={cn("flex h-9 w-9 items-center justify-center", view === "grid" ? "bg-epf-50 text-epf-600" : "text-slate-400 hover:text-slate-700")} aria-label="Grid view">
                      <Grid2X2 className="h-4 w-4" />
                    </button>
                    <button type="button" onClick={() => setView("list")} className={cn("flex h-9 w-9 items-center justify-center", view === "list" ? "bg-epf-50 text-epf-600" : "text-slate-400 hover:text-slate-700")} aria-label="List view">
                      <List className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              {productQuery.isError ? (
                <div className="rounded-lg border border-red-100 bg-white px-5 py-16 text-center">
                  <p className="font-semibold text-slate-800">We couldn&apos;t load the products.</p>
                  <p className="mt-1 text-sm text-slate-500">Please check your connection and try again.</p>
                  <button type="button" onClick={() => productQuery.refetch()} className="mt-4 rounded-md bg-epf-500 px-4 py-2 text-sm font-semibold text-white hover:bg-epf-600">Try again</button>
                </div>
              ) : productQuery.isLoading ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-5">
                  {Array.from({ length: 12 }).map((_, index) => <div key={index} className="aspect-square animate-pulse border border-slate-200 bg-white" />)}
                </div>
              ) : products.length === 0 ? (
                <div className="rounded-lg border border-slate-200 bg-white px-5 py-20 text-center">
                  <Package className="mx-auto h-10 w-10 text-slate-300" />
                  <h2 className="mt-4 text-lg font-semibold text-slate-800">No products found</h2>
                  <p className="mt-1 text-sm text-slate-500">Try a different category or clear your filters.</p>
                  <button type="button" onClick={clearFilters} className="mt-4 rounded-md bg-epf-500 px-4 py-2 text-sm font-semibold text-white hover:bg-epf-600">Clear all filters</button>
                </div>
              ) : view === "grid" ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-5">
                  {products.map((product) => (
                    <StoreProductCard key={product.id} product={product} />
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {products.map((product) => <ListProductRow key={product.id} product={product} onAddToCart={addProductToCart} />)}
                </div>
              )}

              {!productQuery.isLoading && products.length > 0 && (
                <div className="mt-7 flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 pt-5">
                  <p className="text-sm text-slate-500">Showing <span className="font-semibold text-slate-700">{firstResult}–{lastResult}</span> of <span className="font-semibold text-slate-700">{total}</span> products</p>
                  <div className="flex items-center gap-3">
                    <label htmlFor="shop-limit" className="hidden text-sm text-slate-500 sm:inline">Show:</label>
                    <select id="shop-limit" value={limit} onChange={(event) => resetPageAnd(() => setLimit(Number(event.target.value)))} className="h-9 rounded border border-slate-200 bg-white px-2 text-sm text-slate-700 outline-none focus:border-epf-500">
                      {[12, 24, 48].map((value) => <option key={value} value={value}>{value}</option>)}
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
      {productQuery.isFetching && !productQuery.isLoading && (
        <div className="fixed bottom-5 left-1/2 z-40 flex -translate-x-1/2 items-center gap-2 rounded-full bg-slate-900 px-3 py-2 text-xs text-white shadow-lg">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Updating products
        </div>
      )}
    </>
  );
}

function ShopPageFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <Loader2 className="h-6 w-6 animate-spin text-epf-500" />
    </div>
  );
}

export default function ShopPage() {
  return (
    <Suspense fallback={<ShopPageFallback />}>
      <ShopPageContent />
    </Suspense>
  );
}
