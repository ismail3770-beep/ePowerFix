"use client";

import { useState, memo } from "react";
import { ShoppingCart, Star, Check, Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/store";
import { toast } from "sonner";
import { addRecentlyViewed } from "@/components/epf/RecentlyViewed";

// ═══════════════════════════════════════════════════════════════════════════
// Premium Product Card — FleetCart-aligned for ePowerFix
// Clean, subtle, professional. NOT AI-generated.
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
  rating?: number;
  reviewCount?: number;
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
  const [wished, setWished] = useState(false);

  const addItem = useCartStore((s) => s.addItem);

  const images = data.images || [];
  const imageUrl = data.image || data.coverImage || images[0] || "";

  // Pricing — displayPrice is what's shown; originalPrice is strikethrough
  const hasDiscount =
    data.comparePrice != null && data.comparePrice > data.price;
  const discountPercent = hasDiscount
    ? Math.round(((data.comparePrice! - data.price) / data.comparePrice!) * 100)
    : 0;
  const displayPrice = data.salePrice ?? data.price;
  const originalPrice = data.comparePrice ?? data.salePrice ?? null;
  const showOriginal = originalPrice != null && originalPrice > displayPrice;
  const inStock = data.stock == null || data.stock > 0;
  const rating = data.rating || 0;
  const reviewCount = data.reviewCount || 0;

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
    if (!inStock) return;

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

  const handleWishlist = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setWished((v) => !v);
  };

  return (
    <div
      onClick={handleClick}
      className={cn(
        "group relative flex flex-col bg-white rounded-lg overflow-hidden",
        "border border-slate-200",
        "shadow-sm hover:shadow-md hover:border-slate-300 hover:-translate-y-0.5",
        "transition-all duration-200 ease-out",
        "cursor-pointer",
        className
      )}
    >
      {/* ─── Image Area — square, soft bg ─── */}
      <div className="relative aspect-square bg-slate-50 overflow-hidden">
        {imageUrl && !imgError ? (
          <img
            src={imageUrl}
            alt={data.name}
            className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-500 ease-out"
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

        {/* Discount badge — top-left, emerald */}
        {discountPercent > 0 && (
          <span className="absolute top-2 left-2 z-10 px-1.5 py-0.5 rounded text-[11px] font-bold text-white bg-emerald-500 leading-tight tracking-wide">
            -{discountPercent}%
          </span>
        )}

        {/* Out of stock badge — top-left if no discount, else top-right */}
        {!inStock && (
          <span
            className={cn(
              "absolute top-2 z-10 px-1.5 py-0.5 rounded text-[11px] font-bold text-white bg-red-500 leading-tight",
              discountPercent > 0 ? "right-2" : "left-2"
            )}
          >
            Out of Stock
          </span>
        )}

        {/* Featured / New badge — top-left if no discount & in stock */}
        {discountPercent === 0 && inStock && data.isFeatured && (
          <span className="absolute top-2 left-2 z-10 px-1.5 py-0.5 rounded text-[11px] font-bold text-white bg-epf-500 leading-tight">
            Featured
          </span>
        )}

        {/* Wishlist — top-right (subtle, no glass) */}
        <button
          onClick={handleWishlist}
          aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
          className={cn(
            "absolute top-1.5 right-1.5 z-10 h-7 w-7 flex items-center justify-center rounded-md",
            "bg-white/80 backdrop-blur-sm border border-slate-200",
            "transition-colors duration-200",
            wished
              ? "text-red-500"
              : "text-slate-500 hover:text-red-500 hover:bg-white"
          )}
        >
          <Heart className={cn("w-3.5 h-3.5", wished && "fill-red-500")} />
        </button>

        {/* Add to cart — bottom-right (small icon button) */}
        {inStock && (
          <button
            onClick={handleAddToCart}
            disabled={added}
            aria-label="Add to cart"
            className={cn(
              "absolute bottom-2 right-2 z-10",
              "h-8 w-8 flex items-center justify-center rounded-lg",
              "bg-slate-100 text-slate-700",
              "transition-all duration-200 ease-out",
              added
                ? "bg-emerald-500 text-white"
                : "hover:bg-epf-500 hover:text-white"
            )}
          >
            {added ? (
              <Check className="w-4 h-4" strokeWidth={2.5} />
            ) : (
              <ShoppingCart className="w-4 h-4" />
            )}
          </button>
        )}
      </div>

      {/* ─── Content Area — compact ─── */}
      <div className="flex flex-col flex-1 p-3 gap-1">
        {/* Category label (muted, small) */}
        {data.category && (
          <span className="text-[10px] font-medium text-epf-500 uppercase tracking-wide truncate">
            {data.category}
          </span>
        )}

        {/* Title */}
        <h3
          className="text-[13px] font-medium text-slate-800 line-clamp-2 leading-[1.35] min-h-[2.2rem] group-hover:text-epf-600 transition-colors"
          title={data.name}
        >
          {data.name}
        </h3>

        {/* Rating (compact) */}
        {rating > 0 && (
          <div className="flex items-center gap-1">
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  className={cn(
                    "w-3 h-3",
                    s <= Math.round(rating)
                      ? "fill-amber-400 text-amber-400"
                      : "fill-slate-200 text-slate-200"
                  )}
                />
              ))}
            </div>
            <span className="text-[11px] text-slate-400">({reviewCount})</span>
          </div>
        )}

        {/* Price — dark text, FleetCart style */}
        <div className="mt-auto pt-1 flex items-center gap-1.5">
          <span className="text-[15px] font-bold text-slate-900">
            ৳{Number(displayPrice).toLocaleString()}
          </span>
          {showOriginal && (
            <del className="text-[12px] text-slate-400">
              ৳{Number(originalPrice).toLocaleString()}
            </del>
          )}
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
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
      <div className="aspect-square bg-slate-100 animate-pulse" />
      <div className="p-3 space-y-2">
        <div className="h-2 bg-slate-100 rounded animate-pulse w-1/3" />
        <div className="h-3 bg-slate-100 rounded animate-pulse w-3/4" />
        <div className="h-3 bg-slate-100 rounded animate-pulse w-1/2" />
        <div className="h-4 bg-slate-100 rounded animate-pulse w-1/3 mt-1" />
      </div>
    </div>
  );
}
