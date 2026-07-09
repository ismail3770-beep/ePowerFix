"use client";

import { useState, memo } from "react";
import { ShoppingCart } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/store";
import { toast } from "sonner";
import WishlistButton from "@/components/WishlistButton";
import { addRecentlyViewed } from "@/components/epf/RecentlyViewed";

// ═══════════════════════════════════════════════════════════════════════════
// Premium Product Card — clean e-commerce card with hover-reveal cart button
// ═══════════════════════════════════════════════════════════════════════════

export interface PremiumCardData {
  id: string;
  name: string;
  slug?: string;
  price: number;
  salePrice?: number | null;
  comparePrice?: number | null;
  images?: string[];
  image?: string;
  coverImage?: string | null;
  isFeatured?: boolean;
  isBestDeal?: boolean;
  isActive?: boolean;
  stock?: number;
  sku?: string;
  category?: string | null;
  badge?: string;
  itemType?: "PRODUCT" | "PROJECT";
}

interface PremiumCardProps {
  data: PremiumCardData;
  onCardClick?: (id: string) => void;
  onAddToCart?: (data: PremiumCardData) => void;
  className?: string;
}

function PremiumCardBase({ data, onCardClick, onAddToCart, className }: PremiumCardProps) {
  const [imgError, setImgError] = useState(false);
  const [added, setAdded] = useState(false);

  const addItem = useCartStore((s) => s.addItem);

  const images = data.images || [];
  const imageUrl = data.image || data.coverImage || images[0] || "";

  // Pricing
  const hasDiscount =
    data.comparePrice != null && data.comparePrice > data.price;
  const discountPercent = hasDiscount
    ? Math.round(((data.comparePrice! - data.price) / data.comparePrice!) * 100)
    : 0;
  const displayPrice = data.salePrice ?? data.price;
  const originalPrice = data.comparePrice ?? data.salePrice ?? null;
  const showOriginal = originalPrice != null && originalPrice > displayPrice;

  const badgeText =
    discountPercent > 0
      ? `-${discountPercent}%`
      : data.badge || (data.isBestDeal ? "Best Deal" : data.isFeatured ? "Featured" : null);

  const handleClick = () => {
    addRecentlyViewed(data.id, {
      id: data.id,
      name: data.name,
      price: data.price,
      salePrice: data.salePrice,
      comparePrice: data.comparePrice,
      images: data.images || [],
    });
    if (onCardClick) onCardClick(data.id);
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    if (onAddToCart) {
      onAddToCart(data);
      return;
    }

    addItem({
      itemType: data.itemType || "PRODUCT",
      productId: data.id,
      productName: data.name,
      productImage: imageUrl,
      price: Number(displayPrice),
      quantity: 1,
    });

    setAdded(true);
    toast.success("Added to cart", { description: data.name });
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <div
      onClick={handleClick}
      className={cn(
        "group relative flex flex-col bg-white rounded-xl overflow-hidden",
        "border border-slate-200",
        "shadow-sm hover:shadow-lg hover:-translate-y-0.5",
        "transition-all duration-200 ease-out",
        "cursor-pointer",
        className
      )}
    >
      {/* ─── Image Area (square proportion, modern look) ─── */}
      <div className="relative aspect-square bg-slate-50 overflow-hidden">
        {imageUrl && !imgError ? (
          <img
            src={imageUrl}
            alt={data.name}
            className="w-full h-full object-contain p-3 group-hover:scale-105 transition-transform duration-500 ease-out"
            onError={() => setImgError(true)}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
              <ShoppingCart className="w-6 h-6 text-slate-300" />
            </div>
          </div>
        )}

        {/* Discount/Feature Badge — top left (rounded pill) */}
        {badgeText && (
          <span className="absolute top-2.5 left-2.5 z-10 px-2 py-0.5 rounded-full text-[11px] font-bold text-white bg-epf-500 leading-tight tracking-wide shadow-sm">
            {badgeText}
          </span>
        )}

        {/* Wishlist — top right */}
        <div
          className="absolute top-2 right-2 z-10"
          onClick={(e) => e.stopPropagation()}
        >
          <WishlistButton productId={data.id} initialFav={false} />
        </div>

        {/* ─── Add to Cart — reveals on hover (rounded pill, bottom overlay) ─── */}
        <button
          onClick={handleAddToCart}
          disabled={added}
          className={cn(
            "absolute bottom-2 left-2 right-2 z-10",
            "h-9 flex items-center justify-center gap-1.5 text-[13px] font-bold rounded-lg",
            "bg-slate-900/95 text-white backdrop-blur-sm",
            "translate-y-[calc(100%+0.5rem)] opacity-0",
            "group-hover:translate-y-0 group-hover:opacity-100",
            "group-focus-within:translate-y-0 group-focus-within:opacity-100",
            "active:translate-y-0 active:opacity-100",
            "transition-all duration-200 ease-out",
            added && "bg-green-600"
          )}
        >
          {added ? (
            <>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Added
            </>
          ) : (
            <>
              <ShoppingCart className="w-3.5 h-3.5" />
              Add to Cart
            </>
          )}
        </button>
      </div>

      {/* ─── Content Area ─── */}
      <div className="flex flex-col flex-1 p-3 gap-1.5">
        {/* Title */}
        <h3
          className="text-[13px] font-medium text-slate-800 line-clamp-2 leading-[1.4] min-h-[2.4rem] group-hover:text-epf-600 transition-colors"
          title={data.name}
        >
          {data.name}
        </h3>

        {/* Price */}
        <div className="mt-auto pt-1 flex items-baseline gap-1.5 flex-wrap">
          {showOriginal && (
            <del className="text-[12px] font-normal text-slate-400">
              ৳{Number(originalPrice).toLocaleString()}
            </del>
          )}
          <span className="text-[15px] font-bold text-epf-600">
            ৳{Number(displayPrice).toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}

export const PremiumCard = memo(PremiumCardBase);

// ═══════════════════════════════════════════════════════════════════════════
// Skeleton loader
// ═══════════════════════════════════════════════════════════════════════════

export function PremiumCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="aspect-square bg-slate-100 animate-pulse" />
      <div className="p-3 space-y-2">
        <div className="h-3 bg-slate-100 rounded animate-pulse w-3/4" />
        <div className="h-3 bg-slate-100 rounded animate-pulse w-1/2" />
        <div className="h-4 bg-slate-100 rounded animate-pulse w-1/3 mt-1" />
      </div>
    </div>
  );
}