"use client";

import { type MouseEvent, Suspense, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
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
    <article className="group relative bg-white border border-gray-100 rounded overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5">
      <div className="relative aspect-square bg-gray-50 overflow-hidden">
        {image && !imageError ? (
          <img src={image} alt={product.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" onError={() => setImageError(true)} />
        ) : (
          <div className="flex h-full items-center justify-center bg-gray-100"><Package className="h-8 w-8 text-gray-300" /></div>
        )}
        {discount > 0 && <span className="absolute left-2 top-2 bg-[#0EA5E9] px-2 py-0.5 text-[10px] font-bold text-white rounded-full">-{discount}%</span>}
        {!inStock && <span className="absolute left-2 top-2 bg-gray-700 px-2 py-0.5 text-[10px] font-bold text-white rounded-full">Out of stock</span>}
        {/* Hover overlay — slide up */}
        <div className="absolute bottom-0 left-0 right-0 flex gap-2 p-2.5 opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
          <button
            type="button"
            onClick={handleAdd}
            disabled={!inStock}
            className="flex-1 bg-[#0EA5E9] text-white text-xs font-semibold py-2 rounded hover:bg-sky-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
          >
            <ShoppingCart className="h-3.5 w-3.5" />
            {inStock ? "Add to Cart" : "Out of Stock"}
          </button>
          <button
            type="button"
            aria-label="Add to wishlist"
            className="p-2 rounded bg-white/80 border border-white/30 text-gray-700 hover:bg-white transition-colors"
            onClick={(event) => { event.preventDefault(); event.stopPropagation(); }}
          >
            <Heart className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      <Link href={href} className="block p-3">
        {product.category?.name && <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-1 font-medium">{product.category.name}</p>}
        <h3 className="text-sm font-medium text-gray-800 line-clamp-2 mb-2 leading-snug group-hover:text-[#0EA5E9] transition-colors">{product.name}</h3>
        <div className="flex items-center gap-2">
          <span className="text-base font-bold text-[#0EA5E9]">৳{Number(displayPrice).toLocaleString()}</span>
          {originalPrice && <del className="text-xs text-gray-400">৳{Number(originalPrice).toLocaleString()}</del>}
        </div>
        {(product.rating || 0) > 0 && (
          <span className="inline-flex items-center gap-1 mt-1 text-[11px] text-gray-400">
            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
            {Number(product.rating).toFixed(1)} ({product.reviewCount || 0})
          </span>
        )}
      </Link>
    </article>
  );
}

function RatingStars({ rating, count }: { rating: number; count: number }) {
  return (
    <div className="flex items-center gap-1">
      <span className="flex items-center gap-0.5" aria-label={`${rating.toFixed(1)} out of 5 stars`}>
        {Array.from({ length: 5 }).map((_, index) => (
          <Star key={index} className={cn("h-3.5 w-3.5", index < Math.round(rating) ? "fill-amber-400 text-amber-400" : "fill-gray-200 text-gray-200")} />
        ))}
      </span>
      <span className="text-xs text-gray-400">({count})</span>
    </div>
  );
}

function LatestProduct({ product }: { product: Product }) {
  const card = getCardData(product);
  const image = card.images?.[0];

  return (
    <Link href={`/shop/${product.slug || product.id}`} className="group flex gap-2.5 cursor-pointer">
      <div className="w-12 h-12 rounded bg-gray-100 overflow-hidden shrink-0">
        {image ? (
          <img src={image} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
        ) : (
          <Package className="m-3 h-5 w-5 text-gray-300" />
        )}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-gray-700 line-clamp-2 group-hover:text-[#0EA5E9] transition-colors leading-snug">{product.name}</p>
        <p className="text-xs font-bold text-[#0EA5E9] mt-0.5">৳{Number(card.price).toLocaleString()}</p>
      </div>
    </Link>
  );
}

function ListProductRow({ product, onAddToCart }: { product: Product; onAddToCart: (product: Product) => void }) {
  const card = getCardData(product);
  const image = card.images?.[0];
  const inStock = product.stock > 0;

  return (
    <article className="flex gap-4 border border-gray-100 rounded bg-white p-4 hover:shadow-md transition-shadow cursor-pointer group">
      <Link href={`/shop/${product.slug || product.id}`} className="h-24 w-24 shrink-0 overflow-hidden rounded bg-gray-50 sm:h-32 sm:w-32">
        {image ? (
          <img src={image} alt={product.name} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <Package className="m-8 h-8 w-8 text-gray-300" />
        )}
      </Link>
      <div className="flex min-w-0 flex-1 flex-col justify-center">
        {product.category?.name && (
          <p className="mb-1 text-[10px] text-gray-400 font-medium uppercase tracking-widest">{product.category.name}</p>
        )}
        <Link href={`/shop/${product.slug || product.id}`}>
          <h3 className="font-medium text-sm text-gray-800 group-hover:text-[#0EA5E9] line-clamp-2 mb-1 leading-snug">{product.name}</h3>
        </Link>
        <RatingStars rating={product.rating || 0} count={product.reviewCount || 0} />
        <div className="mt-2 flex items-center gap-2">
          <span className="text-base font-bold text-[#0EA5E9]">৳{Number(card.price).toLocaleString()}</span>
          {card.comparePrice != null && <del className="text-sm text-gray-400">৳{Number(card.comparePrice).toLocaleString()}</del>}
        </div>
        <button
          type="button"
          onClick={() => onAddToCart(product)}
          disabled={!inStock}
          className="mt-3 w-fit bg-[#0EA5E9] text-white text-xs font-semibold px-4 py-2 rounded hover:bg-sky-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {inStock ? "Add to Cart" : "Out of Stock"}
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
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="mb-6 flex items-center gap-2 text-xs text-gray-500">
            <Link href="/" className="hover:text-gray-900">Home</Link>
            <ChevronRight className="h-3 w-3 text-gray-300" />
            <span className="text-gray-900 font-medium">{selectedCategoryName || "All Products"}</span>
          </div>

          <div className="mt-6 flex gap-8">
            {/* Sidebar — desktop only */}
            <aside className={cn("w-56 shrink-0 space-y-5 md:block", filtersOpen ? "block" : "hidden")}>
              {/* Mobile close */}
              <div className="flex items-center justify-between md:hidden">
                <h3 className="font-semibold text-sm uppercase tracking-wider">Filters</h3>
                <button type="button" onClick={() => setFiltersOpen(false)} className="text-gray-400" aria-label="Close filters">
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Categories */}
              <div>
                <h3 className="font-semibold text-sm mb-3 uppercase tracking-wider">Categories</h3>
                <div className="space-y-1">
                  <button
                    type="button"
                    onClick={() => resetPageAnd(() => setCategory(""))}
                    className={cn("w-full flex items-center justify-between py-1.5 text-sm", !category ? "text-[#0EA5E9] font-semibold" : "text-gray-500 hover:text-gray-900")}
                  >
                    <span>All Products</span>
                    <span className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">{total}</span>
                  </button>
                  {categoriesQuery.isLoading ? (
                    <div className="space-y-2 py-1">
                      {Array.from({ length: 6 }).map((_, index) => <div key={index} className="h-4 animate-pulse rounded bg-gray-100" />)}
                    </div>
                  ) : (
                    categories.map((item) => (
                      <button
                        type="button"
                        key={item.id}
                        onClick={() => resetPageAnd(() => setCategory(item.slug))}
                        className={cn("w-full flex items-center justify-between py-1.5 text-sm", category === item.slug ? "text-[#0EA5E9] font-semibold" : "text-gray-500 hover:text-gray-900")}
                      >
                        <span>{item.name}</span>
                        {item._count?.products != null && <span className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">{item._count.products}</span>}
                      </button>
                    ))
                  )}
                </div>
              </div>

              {/* Price Range */}
              <div className="border-t border-gray-200 pt-5">
                <h3 className="font-semibold text-sm mb-3 uppercase tracking-wider">Price Range</h3>
                <div className="flex items-center gap-2">
                  <input
                    value={minPrice}
                    onChange={(event) => resetPageAnd(() => setMinPrice(event.target.value.replace(/\D/g, "")))}
                    inputMode="numeric"
                    placeholder="Min"
                    aria-label="Minimum price"
                    className="h-8 w-full rounded border border-gray-300 px-2 text-xs outline-none focus:border-[#0EA5E9] transition-colors"
                  />
                  <span className="text-gray-400 text-xs">—</span>
                  <input
                    value={maxPrice}
                    onChange={(event) => resetPageAnd(() => setMaxPrice(event.target.value.replace(/\D/g, "")))}
                    inputMode="numeric"
                    placeholder="Max"
                    aria-label="Maximum price"
                    className="h-8 w-full rounded border border-gray-300 px-2 text-xs outline-none focus:border-[#0EA5E9] transition-colors"
                  />
                </div>
              </div>

              {/* Latest Products */}
              <div className="border-t border-gray-200 pt-5">
                <h3 className="font-semibold text-sm mb-3 uppercase tracking-wider">Latest Products</h3>
                <div className="space-y-3">
                  {latestQuery.isLoading ? (
                    Array.from({ length: 3 }).map((_, index) => <div key={index} className="h-14 animate-pulse rounded bg-gray-100" />)
                  ) : (
                    latestQuery.data?.data.data.slice(0, 4).map((product) => <LatestProduct key={product.id} product={product} />)
                  )}
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
                  <p className="text-xs text-gray-500"><span className="font-semibold text-gray-900">{total}</span> products found</p>
                </div>
                <div className="flex items-center gap-3">
                  <select
                    id="shop-sort"
                    value={sort}
                    onChange={(event) => resetPageAnd(() => setSort(event.target.value))}
                    className="text-xs border border-gray-200 rounded px-3 py-1.5 outline-none bg-white"
                  >
                    {sortOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                  </select>
                  <div className="flex border border-gray-200 rounded overflow-hidden">
                    <button type="button" onClick={() => setView("grid")} className={cn("p-1.5", view === "grid" ? "bg-[#0EA5E9] text-white" : "text-gray-500 hover:bg-gray-100")} aria-label="Grid view">
                      <Grid2X2 className="h-3.5 w-3.5" />
                    </button>
                    <button type="button" onClick={() => setView("list")} className={cn("p-1.5", view === "list" ? "bg-[#0EA5E9] text-white" : "text-gray-500 hover:bg-gray-100")} aria-label="List view">
                      <List className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {productQuery.isError ? (
                <div className="rounded border border-red-100 bg-white px-5 py-16 text-center">
                  <p className="font-semibold text-gray-800">We couldn&apos;t load the products.</p>
                  <p className="mt-1 text-sm text-gray-500">Please check your connection and try again.</p>
                  <button type="button" onClick={() => productQuery.refetch()} className="mt-4 rounded bg-[#0EA5E9] px-4 py-2 text-sm font-semibold text-white hover:bg-sky-600">Try again</button>
                </div>
              ) : productQuery.isLoading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {Array.from({ length: 12 }).map((_, index) => <div key={index} className="aspect-square animate-pulse border border-gray-100 bg-white rounded" />)}
                </div>
              ) : products.length === 0 ? (
                <div className="text-center py-20">
                  <Package className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                  <h2 className="text-lg font-semibold text-gray-800 mb-2">No products found</h2>
                  <p className="text-gray-500 text-sm">Try a different category or clear your filters.</p>
                  <button type="button" onClick={clearFilters} className="mt-4 rounded bg-[#0EA5E9] px-4 py-2 text-sm font-semibold text-white hover:bg-sky-600">Clear all filters</button>
                </div>
              ) : view === "grid" ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
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
                <div className="mt-7 flex flex-wrap items-center justify-between gap-4 border-t border-gray-200 pt-5">
                  <p className="text-sm text-gray-500">Showing <span className="font-semibold text-gray-700">{firstResult}–{lastResult}</span> of <span className="font-semibold text-gray-700">{total}</span> products</p>
                  <div className="flex items-center gap-3">
                    <label htmlFor="shop-limit" className="hidden text-sm text-gray-500 sm:inline">Show:</label>
                    <select id="shop-limit" value={limit} onChange={(event) => resetPageAnd(() => setLimit(Number(event.target.value)))} className="h-9 rounded border border-gray-300 bg-white px-2 text-sm text-gray-700 outline-none focus:border-[#0EA5E9]">
                      {[12, 24, 48].map((value) => <option key={value} value={value}>{value}</option>)}
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
      {productQuery.isFetching && !productQuery.isLoading && (
        <div className="fixed bottom-5 left-1/2 z-40 flex -translate-x-1/2 items-center gap-2 rounded-full bg-[#0d1a2d] px-3 py-2 text-xs text-white shadow-lg">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Updating products
        </div>
      )}
    </>
  );
}

function ShopPageFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <Loader2 className="h-6 w-6 animate-spin text-[#0EA5E9]" />
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
