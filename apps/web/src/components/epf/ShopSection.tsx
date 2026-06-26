"use client";
import { useRef, useState, useCallback, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, ChevronLeft, Star, ShoppingCart, Eye, Heart, Package, FileText } from "lucide-react";
import { useUIStore, useCartStore } from "@/store";
import { apiFetch } from "@/lib/api";

interface Product {
  id: string;
  name: string;
  price: number;
  comparePrice: number | null;
  rating: number;
  reviews: number;
  stock: number;
  sold: number;
  images: string[];
  type?: string;
  category?: { name: string; slug: string } | null;
}

function getCardsPerView(width: number): number {
  if (width >= 1280) return 6;
  if (width >= 1024) return 5;
  if (width >= 768) return 4;
  if (width >= 640) return 3;
  return 2;
}

export default function ShopSection() {
  const { setSelectedProductId, setProductDetailOpen } = useUIStore();
  const addItem = useCartStore((s) => s.addItem);
  const containerRef = useRef<HTMLDivElement>(null);
  const [cardsPerView, setCardsPerView] = useState(6);
  const [currentSlide, setCurrentSlide] = useState(0);

  const { data: productsData, isLoading } = useQuery<{ data: { data: Product[] } }>({
    queryKey: ["products-shop-home"],
    queryFn: () => apiFetch("/api/products?limit=24"),
  });

  const products = productsData?.data?.data ?? [];
  const maxSlide = Math.max(0, products.length - cardsPerView);

  useEffect(() => {
    const updateCards = () => setCardsPerView(getCardsPerView(window.innerWidth));
    updateCards();
    const ro = new ResizeObserver(updateCards);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  const scrollToIndex = useCallback((index: number) => {
    const clamped = Math.max(0, Math.min(index, maxSlide));
    setCurrentSlide(clamped);
    containerRef.current?.scrollTo({
      left: clamped * (containerRef.current.scrollWidth / products.length || 1),
      behavior: "smooth",
    });
  }, [maxSlide, products.length]);

  return (
    <section id="shop" className="bg-[#F8FAFC]">
      <div className="mx-auto max-w-[1920px] px-4 sm:px-12 pt-6">
        {/* Header */}
        <div className="mf-section-header rounded-t">
          <h3>Shop</h3>
          <a href="/shop" className="hidden sm:flex items-center gap-1 text-[14px] font-medium text-[#6B7280] hover:text-[#111827]">
            View All <ChevronRight className="h-3.5 w-3.5" />
          </a>
        </div>

        {/* Slider */}
        <div className="bg-white border border-[#E2E8F0] border-t-0 relative">
          <div
            ref={containerRef}
            className="flex overflow-x-auto scroll-smooth snap-x snap-mandatory custom-scrollbar"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {isLoading
              ? Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="min-w-[calc(50%-0px)] sm:min-w-[calc(33.333%-0px)] md:min-w-[calc(25%-0px)] lg:min-w-[calc(20%-0px)] xl:min-w-[calc(16.666%-0px)] snap-start border-r border-b border-[#E2E8F0] animate-pulse shrink-0">
                    <div className="aspect-square bg-[#F8FAFC]" />
                    <div className="p-3 space-y-2">
                      <div className="h-3 bg-[#F1F5F9] rounded w-20" />
                      <div className="h-4 bg-[#F1F5F9] rounded w-16" />
                      <div className="h-3 bg-[#F1F5F9] rounded w-full" />
                    </div>
                  </div>
                ))
              : products.map((product) => {
                  const discount = product.comparePrice ? Math.round((1 - product.price / product.comparePrice) * 100) : 0;
                  const isDigital = product.name?.toLowerCase().includes("guide") || product.name?.toLowerCase().includes("pdf");
                  const fullStars = Math.round(product.rating || 0);
                  return (
                    <div key={product.id} className="product-card relative min-w-[calc(50%-0px)] sm:min-w-[calc(33.333%-0px)] md:min-w-[calc(25%-0px)] lg:min-w-[calc(20%-0px)] xl:min-w-[calc(16.666%-0px)] snap-start border-r border-b border-[#E2E8F0] shrink-0">
                      <div className="product-thumb relative overflow-hidden aspect-square bg-[#F8FAFC] flex items-center justify-center">
                        {product.images?.[0] ? (
                          <img src={product.images[0]} alt={product.name} className="w-full h-full object-contain p-2" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                        ) : isDigital ? <FileText className="h-10 w-10 text-[#CBD5E1]" /> : <Package className="h-10 w-10 text-[#CBD5E1]" />}
                        {discount > 0 && <span className="discount-badge">-{discount}%</span>}
                        <div className="product-actions">
                          <button
                            onClick={(e) => { e.stopPropagation(); addItem({ productId: product.id, productName: product.name, productImage: product.images?.[0] || "", price: product.price, quantity: 1 }); }}
                            className="h-[32px] w-[32px] rounded-full bg-[#111827] flex items-center justify-center text-white hover:bg-[#0EA5E9] transition-colors"
                            title="Add to cart"
                          >
                            <ShoppingCart className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setSelectedProductId(product.id); setProductDetailOpen(true); }}
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
                              <Star key={s} className={s < fullStars ? "fill-[#0EA5E9] text-[#0EA5E9] h-3 w-3" : "h-3 w-3 text-[#CBD5E1]"} />
                            ))}
                          </div>
                          <span className="text-[13px] text-[#6B7280]">({product.reviews || 0})</span>
                        </div>
                        <button
                          onClick={() => { setSelectedProductId(product.id); setProductDetailOpen(true); }}
                          className="block text-[14px] text-[#374151] line-clamp-2 leading-snug mb-1.5 hover:text-[#111827] transition-colors text-left w-full"
                        >
                          {product.name}
                        </button>
                        <div className="flex items-baseline gap-1.5 mb-1">
                          <span className="text-[16px] font-semibold text-[#111827]">৳{product.price.toLocaleString()}</span>
                          {product.comparePrice && <span className="text-[14px] text-[#6B7280] line-through">৳{product.comparePrice.toLocaleString()}</span>}
                        </div>
                        {product.stock < 50 && <p className="text-[13px] text-[#0EA5E9] font-medium mt-1">Only {product.stock} left</p>}
                      </div>
                    </div>
                  );
                })}
          </div>

          {/* Navigation Arrows */}
          {products.length > cardsPerView && (
            <>
              <button
                onClick={() => scrollToIndex(currentSlide - cardsPerView)}
                disabled={currentSlide === 0}
                className="absolute left-2 top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full bg-white border border-[#E2E8F0] shadow-sm flex items-center justify-center text-[#374151] hover:bg-[#0EA5E9] hover:text-white hover:border-[#0EA5E9] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => scrollToIndex(currentSlide + cardsPerView)}
                disabled={currentSlide >= maxSlide}
                className="absolute right-2 top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full bg-white border border-[#E2E8F0] shadow-sm flex items-center justify-center text-[#374151] hover:bg-[#0EA5E9] hover:text-white hover:border-[#0EA5E9] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      </div>
    </section>
  );
}