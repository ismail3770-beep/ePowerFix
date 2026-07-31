"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowRight, ShoppingCart } from "lucide-react";
import { apiFetch } from "@/lib/api";
import ProductGridCard from "@/components/epf/ProductGridCard";
import { FadeInStagger, FadeInItem } from "@/components/epf/FadeIn";

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  salePrice?: number | null;
  comparePrice?: number | null;
  images?: string[];
  stock?: number;
  rating?: number;
  reviewCount?: number;
  isFeatured?: boolean;
  isBestDeal?: boolean;
}

interface ProductsResponse {
  data: {
    data: Product[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export default function ShopSection() {
  const { data, isLoading } = useQuery<ProductsResponse>({
    queryKey: ["products-home"],
    queryFn: () => apiFetch("/api/products?limit=10&sort=featured"),
  });

  const products = (data?.data?.data ?? []).slice(0, 10);

  return (
    <section id="shop" className="ff bg-white mt-[50px]">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
        {/* ── Section Header ── */}
        <div className="flex items-end justify-between border-b border-[#e5e5e5] pb-4 mb-6">
          <div>
            <h3 className="ff-section-title !text-[20px] !pb-0">Shop</h3>
            <p className="text-[14px] text-[#6e6e6e] mt-2">
              অরিজিনাল ইলেকট্রিক্যাল প্রোডাক্ট · সারাদেশে ডেলিভারি
            </p>
          </div>
          <a
            href="/shop"
            className="hidden sm:inline-flex items-center gap-1 text-[14px] text-[#0068e1] hover:underline group"
          >
            সব দেখুন
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
          </a>
        </div>

        {/* ── Product Grid ── */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-5">
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className="mx-auto h-[364px] w-full max-w-[231px] animate-pulse rounded-lg bg-[#f2f2f2]"
              />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 py-16 px-6 text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center mb-4">
              <ShoppingCart className="h-8 w-8 text-slate-300" strokeWidth={1.5} />
            </div>
            <h3 className="text-[18px] font-medium text-slate-700">No products available</h3>
            <p className="text-[14px] text-slate-400 mt-1.5">
              Products will appear here once published.
            </p>
          </div>
        ) : (
          <FadeInStagger className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-5">
            {products.map((product) => {
              const hasSale =
                product.salePrice != null && Number(product.salePrice) < Number(product.price);
              const displayPrice = hasSale ? Number(product.salePrice) : Number(product.price);
              const comparePrice = hasSale ? Number(product.price) : null;
              return (
                <FadeInItem key={product.id}>
                  <ProductGridCard
                    href={`/product/${product.id}`}
                    name={product.name}
                    price={displayPrice}
                    comparePrice={comparePrice}
                    image={product.images?.[0]}
                    inStock={(product.stock ?? 0) > 0}
                  />
                </FadeInItem>
              );
            })}
          </FadeInStagger>
        )}

        {/* ── Mobile "View All" ── */}
        {products.length > 0 && (
          <div className="sm:hidden mt-8 text-center">
            <a
              href="/shop"
              className="inline-flex items-center justify-center gap-1.5 text-[14px] font-semibold text-white bg-epf-500 hover:bg-epf-600 h-11 px-6 rounded-lg transition-colors"
            >
              View All Products
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        )}
      </div>
    </section>
  );
}
