"use client";

import { Suspense, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Grid2X2, List, Loader2, Package, SlidersHorizontal, X } from "lucide-react";
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
import ProductGridCard, { formatBdt } from "@/components/epf/ProductGridCard";

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

const perPageOptions = [12, 24, 48];

function prices(product: Product) {
  const sale =
    product.salePrice != null && product.salePrice < product.price ? product.salePrice : null;
  return { price: sale ?? product.price, compareAtPrice: sale != null ? product.price : null };
}

/** Sidebar latest-products row (FleetCart vertical product card). */
function VerticalProduct({ product }: { product: Product }) {
  const { price } = prices(product);
  const image = product.images?.[0];
  const href = `/shop/${product.slug || product.id}`;
  return (
    <Link href={href} className="group flex gap-3">
      <div className="w-14 h-14 shrink-0 rounded-lg overflow-hidden bg-[#f9f9f9] flex items-center justify-center">
        {image ? (
          <img src={image} alt={product.name} loading="lazy" className="w-full h-full object-contain" />
        ) : (
          <Package className="h-5 w-5 text-[#c8c8c8]" />
        )}
      </div>
      <div className="min-w-0 flex flex-col justify-center">
        <span className="text-[13px] leading-[18px] text-[#191919] line-clamp-2 group-hover:text-[#0068e1] transition-colors">
          {product.name}
        </span>
        <span className="text-[14px] font-medium text-[#0068e1] mt-1">{formatBdt(price)}</span>
      </div>
    </Link>
  );
}

/** FleetCart list-view product row. */
function ListProductCard({ product, onAdd }: { product: Product; onAdd: (product: Product) => void }) {
  const { price, compareAtPrice } = prices(product);
  const image = product.images?.[0];
  const inStock = product.stock > 0;
  const href = `/shop/${product.slug || product.id}`;
  return (
    <div className="flex flex-col sm:flex-row gap-4 border border-[#e8e7eb] rounded-[10px] p-3 transition-shadow hover:shadow-[rgba(0,0,0,0.04)_0px_3px_5px]">
      <div className="relative shrink-0">
        <Link
          href={href}
          className="block w-full sm:w-[170px] h-[170px] rounded-lg overflow-hidden bg-[#f9f9f9] flex items-center justify-center"
        >
          {image ? (
            <img src={image} alt={product.name} loading="lazy" className="w-full h-full object-contain" />
          ) : (
            <Package className="h-10 w-10 text-[#c8c8c8]" />
          )}
        </Link>
        {!inStock && (
          <span className="ff-badge ff-badge-danger absolute top-2 left-2 z-[1]">স্টক নেই</span>
        )}
      </div>
      <div className="flex flex-1 flex-col">
        <Link href={href} className="group">
          <span className="block text-[16px] font-medium leading-[22px] text-[#191919] line-clamp-2 group-hover:text-[#0068e1] transition-colors mb-4">
            {product.name}
          </span>
        </Link>
        <div className="flex items-baseline gap-2 mb-3">
          <span className="text-[18px] font-medium text-[#0068e1]">{formatBdt(price)}</span>
          {compareAtPrice != null && (
            <span className="text-[14px] text-[#6e6e6e] line-through">{formatBdt(compareAtPrice)}</span>
          )}
        </div>
        <button
          type="button"
          onClick={() => onAdd(product)}
          disabled={!inStock}
          className="w-fit h-[35px] px-5 rounded-[8px] bg-[#0068e1] text-white text-[14px] hover:bg-[#0057bd] disabled:bg-[#efeef1] disabled:text-[#cac7d1] disabled:cursor-not-allowed transition-colors"
        >
          {inStock ? "Add to Cart" : "Out of Stock"}
        </button>
      </div>
    </div>
  );
}

function ShopPageContent() {
  const searchParams = useSearchParams();
  const addItem = useCartStore((state) => state.addItem);
  const setCartOpen = useUIStore((state) => state.setCartOpen);
  const search = searchParams.get("search") || "";

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(24);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [sort, setSort] = useState(searchParams.get("sort") || "latest");
  const [category, setCategory] = useState(searchParams.get("category") || "");
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
    queryFn: () => apiFetch<ProductListResponse>("/api/products?limit=5&sort=latest"),
    staleTime: 60 * 1000,
  });

  const products = productQuery.data?.data.data ?? [];
  const total = productQuery.data?.data.total ?? 0;
  const totalPages = productQuery.data?.data.totalPages ?? 1;
  const categories = categoriesQuery.data?.categories ?? [];
  const latestProducts = latestQuery.data?.data.data ?? [];
  const firstResult = total === 0 ? 0 : (page - 1) * limit + 1;
  const lastResult = Math.min(page * limit, total);
  const selectedCategoryName = categories.find((item) => item.slug === category)?.name;
  const emptyProducts = !productQuery.isLoading && products.length === 0;

  const activeFilterCount = useMemo(
    () => [category, minPrice, maxPrice].filter(Boolean).length,
    [category, minPrice, maxPrice],
  );

  const resetPageAnd = (action: () => void) => {
    action();
    setPage(1);
  };

  const clearFilters = () =>
    resetPageAnd(() => {
      setCategory("");
      setMinPrice("");
      setMaxPrice("");
    });

  const addToCart = (product: Product) => {
    const { price } = prices(product);
    addItem({
      itemType: "PRODUCT",
      productId: product.id,
      productName: product.name,
      productImage: product.images?.[0] || "",
      price,
      quantity: 1,
    });
    toast.success("Added to cart", { description: product.name });
    setCartOpen(true);
  };

  const SectionTitle = ({ children }: { children: React.ReactNode }) => (
    <h4 className="relative text-[18px] leading-6 font-semibold text-[#191919] pb-3 mb-6 after:content-[''] after:absolute after:left-0 after:bottom-[-1px] after:w-[50px] after:border-b-2 after:border-[#0068e1]">
      {children}
    </h4>
  );

  return (
    <>
      <Header />
      <main className="ff min-h-screen bg-white">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-12 py-6 lg:py-10">
          <div className="flex flex-col-reverse lg:flex-row gap-8">
            {/* Sidebar */}
            <aside
              className={cn(
                "w-full lg:w-[263px] lg:min-w-[263px] shrink-0",
                filtersOpen ? "block" : "hidden lg:block",
              )}
            >
              {/* Mobile close */}
              <div className="flex items-center justify-between mb-4 lg:hidden">
                <h4 className="text-[18px] font-semibold text-[#191919]">Filters</h4>
                <button type="button" onClick={() => setFiltersOpen(false)} aria-label="Close filters">
                  <X className="h-5 w-5 text-[#191919]" />
                </button>
              </div>

              {/* Browse categories */}
              {categories.length > 0 && (
                <div className="mb-8">
                  <SectionTitle>Browse Categories</SectionTitle>
                  <ul className="space-y-3">
                    <li>
                      <button
                        type="button"
                        onClick={() => resetPageAnd(() => setCategory(""))}
                        className={cn(
                          "text-[15px] transition-colors",
                          !category ? "text-[#0068e1] font-medium" : "text-[#191919] hover:text-[#0068e1]",
                        )}
                      >
                        All Products
                      </button>
                    </li>
                    {categories.map((item) => (
                      <li key={item.id}>
                        <button
                          type="button"
                          onClick={() => resetPageAnd(() => setCategory(item.slug))}
                          className={cn(
                            "text-[15px] transition-colors text-left",
                            category === item.slug
                              ? "text-[#0068e1] font-medium"
                              : "text-[#191919] hover:text-[#0068e1]",
                          )}
                        >
                          {item.name}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Price filter */}
              <div className="mb-8">
                <h6 className="text-[16px] font-medium text-[#191919] mb-4">Price</h6>
                <div className="flex items-center gap-4">
                  <input
                    type="number"
                    placeholder="From"
                    aria-label="Minimum price"
                    value={minPrice}
                    onChange={(e) => resetPageAnd(() => setMinPrice(e.target.value.replace(/\D/g, "")))}
                    className="h-10 w-full rounded-lg border border-[#e8e7eb] px-3 text-sm outline-none focus:border-[#0068e1] transition-colors"
                  />
                  <span className="text-[#6e6e6e]">-</span>
                  <input
                    type="number"
                    placeholder="To"
                    aria-label="Maximum price"
                    value={maxPrice}
                    onChange={(e) => resetPageAnd(() => setMaxPrice(e.target.value.replace(/\D/g, "")))}
                    className="h-10 w-full rounded-lg border border-[#e8e7eb] px-3 text-sm outline-none focus:border-[#0068e1] transition-colors"
                  />
                </div>
              </div>

              {(category || minPrice || maxPrice) && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="w-full border border-[#e8e7eb] rounded-lg py-2 text-sm text-[#6e6e6e] hover:text-[#0068e1] hover:border-[#0068e1] transition-colors mb-8"
                >
                  Clear All Filters
                </button>
              )}

              {/* Latest products */}
              {latestProducts.length > 0 && (
                <div>
                  <SectionTitle>Latest Products</SectionTitle>
                  <div className="space-y-4">
                    {latestProducts.slice(0, 5).map((product) => (
                      <VerticalProduct key={product.id} product={product} />
                    ))}
                  </div>
                </div>
              )}
            </aside>

            {/* Results */}
            <section className="flex-1 min-w-0">
              {/* Top bar */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
                <h1 className="text-[22px] text-[#6e6e6e] font-normal">
                  {search ? (
                    <>
                      Search results for <span className="text-[#191919] font-medium">{search}</span>
                    </>
                  ) : (
                    <span className="text-[#191919] font-medium">{selectedCategoryName || "Shop"}</span>
                  )}
                </h1>

                <div className="flex items-center gap-4 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setFiltersOpen((v) => !v)}
                    className="lg:hidden flex items-center gap-1.5 text-[#6e6e6e] hover:text-[#0068e1] transition-colors text-sm"
                  >
                    <SlidersHorizontal className="h-4 w-4" />
                    Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
                  </button>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setView("grid")}
                      className={cn("transition-colors", view === "grid" ? "text-[#0068e1]" : "text-[#a6a6a6] hover:text-[#0068e1]")}
                      aria-label="Grid view"
                    >
                      <Grid2X2 className="h-[22px] w-[22px]" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setView("list")}
                      className={cn("transition-colors", view === "list" ? "text-[#0068e1]" : "text-[#a6a6a6] hover:text-[#0068e1]")}
                      aria-label="List view"
                    >
                      <List className="h-[22px] w-[22px]" />
                    </button>
                  </div>

                  <select
                    aria-label="Sort"
                    value={sort}
                    onChange={(e) => resetPageAnd(() => setSort(e.target.value))}
                    className="h-10 rounded-lg border border-[#e8e7eb] px-3 text-sm bg-white text-[#191919] outline-none focus:border-[#0068e1] cursor-pointer transition-colors"
                  >
                    {sortOptions.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>

                  <select
                    aria-label="Per page"
                    value={limit}
                    onChange={(e) => resetPageAnd(() => setLimit(Number(e.target.value)))}
                    className="h-10 rounded-lg border border-[#e8e7eb] px-3 text-sm bg-white text-[#191919] outline-none focus:border-[#0068e1] cursor-pointer transition-colors"
                  >
                    {perPageOptions.map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Body */}
              {productQuery.isError ? (
                <div className="rounded-lg border border-red-100 bg-white px-5 py-16 text-center">
                  <p className="font-semibold text-[#191919]">We couldn&apos;t load the products.</p>
                  <p className="mt-1 text-sm text-[#6e6e6e]">Please check your connection and try again.</p>
                  <button
                    type="button"
                    onClick={() => productQuery.refetch()}
                    className="mt-4 rounded-lg bg-[#0068e1] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0057bd]"
                  >
                    Try again
                  </button>
                </div>
              ) : productQuery.isLoading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4">
                  {Array.from({ length: 15 }).map((_, index) => (
                    <div key={index} className="mx-auto h-[364px] w-full max-w-[231px] animate-pulse rounded-lg bg-[#f2f2f2]" />
                  ))}
                </div>
              ) : emptyProducts ? (
                <div className="text-center py-20">
                  <Package className="mx-auto h-12 w-12 text-[#d4d4d4] mb-4" />
                  <h2 className="text-lg font-semibold text-[#191919] mb-2">No products found</h2>
                  <p className="text-[#6e6e6e] text-sm">Try a different category or clear your filters.</p>
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="mt-4 rounded-lg bg-[#0068e1] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0057bd]"
                  >
                    Clear all filters
                  </button>
                </div>
              ) : view === "grid" ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4">
                  {products.map((product) => {
                    const { price, compareAtPrice } = prices(product);
                    return (
                      <ProductGridCard
                        key={product.id}
                        href={`/shop/${product.slug || product.id}`}
                        name={product.name}
                        price={price}
                        comparePrice={compareAtPrice}
                        image={product.images?.[0]}
                        inStock={product.stock > 0}
                        onAddToCart={() => addToCart(product)}
                      />
                    );
                  })}
                </div>
              ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                  {products.map((product) => (
                    <ListProductCard key={product.id} product={product} onAdd={addToCart} />
                  ))}
                </div>
              )}

              {/* Bottom */}
              {!emptyProducts && !productQuery.isLoading && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8">
                  <span className="text-sm text-[#6e6e6e]">
                    Showing {firstResult}–{lastResult} of {total} results
                  </span>
                  {totalPages > 1 && (
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        disabled={page <= 1}
                        onClick={() => setPage((v) => v - 1)}
                        className="w-9 h-9 border border-[#e8e7eb] rounded-lg flex items-center justify-center text-[#6e6e6e] hover:border-[#0068e1] hover:text-[#0068e1] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        aria-label="Previous page"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((n) => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => setPage(n)}
                          className={cn(
                            "w-9 h-9 border rounded-lg text-sm font-medium transition-colors",
                            page === n
                              ? "bg-[#0068e1] text-white border-[#0068e1]"
                              : "border-[#e8e7eb] text-[#191919] hover:border-[#0068e1] hover:text-[#0068e1]",
                          )}
                        >
                          {n}
                        </button>
                      ))}
                      <button
                        type="button"
                        disabled={page >= totalPages}
                        onClick={() => setPage((v) => v + 1)}
                        className="w-9 h-9 border border-[#e8e7eb] rounded-lg flex items-center justify-center text-[#6e6e6e] hover:border-[#0068e1] hover:text-[#0068e1] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        aria-label="Next page"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  )}
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
    <div className="flex min-h-screen items-center justify-center bg-white">
      <Loader2 className="h-6 w-6 animate-spin text-[#0068e1]" />
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
