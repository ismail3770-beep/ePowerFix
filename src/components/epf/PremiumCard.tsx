"use client";

import { useState, memo } from "react";
import { Heart, ShoppingCart, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/store";
import { toast } from "sonner";
import WishlistButton from "@/components/WishlistButton";

// ═══════════════════════════════════════════════════════════════════════════
// Premium Product Card — Clean, Modern, E-commerce Design
// ═══════════════════════════════════════════════════════════════════════════
// Design principles (based on reference):
//   - Light blue/gray border with subtle shadow
//   - Image area with light gray background
//   - Discount badge top-left, wishlist top-right
//   - Clean title with line-clamp
//   - Price row: sale price (bold) + original (strikethrough)
//   - Full-width "Add to Cart" button
//   - Hover: image zoom, shadow lift, border color change
//   - No rating stars (keeps it clean)
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

  // Determine image URL
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

  // Badge
  const badgeText = data.badge || (discountPercent > 0 ? `-${discountPercent}%` : data.isBestDeal ? "Best Deal" : data.isFeatured ? "Featured" : null);

  const handleClick = () => {
    if (onCardClick) onCardClick(data.id);
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    if (onAddToCart) {
      onAddToCart(data);
      return;
    }

    // Default: add to cart store
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
        "border border-slate-200/80",
        "shadow-sm hover:shadow-lg hover:border-epf-300",
        "transition-all duration-300 ease-out",
        "hover:-translate-y-0.5",
        "cursor-pointer",
        className
      )}
    >
      {/* ─── Image Area ─── */}
      <div className="relative aspect-square bg-slate-50 overflow-hidden">
        {imageUrl && !imgError ? (
          <img
            src={imageUrl}
            alt={data.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
            onError={() => setImgError(true)}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="flex flex-col items-center gap-2 text-slate-300">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                <ShoppingCart className="w-5 h-5" />
              </div>
            </div>
          </div>
        )}

        {/* Discount/Feature Badge — top left */}
        {badgeText && (
          <span className="absolute top-2.5 left-2.5 z-10 px-2 py-0.5 rounded-md text-[11px] font-bold text-white shadow-sm bg-epf-500">
            {badgeText}
          </span>
        )}

        {/* Wishlist — top right */}
        <div className="absolute top-2 right-2 z-10" onClick={(e) => e.stopPropagation()}>
          <WishlistButton productId={data.id} initialFav={false} />
        </div>

        {/* Quick view overlay on hover */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300 flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center shadow-md">
              <Eye className="w-4 h-4 text-slate-700" />
            </div>
          </div>
        </div>
      </div>

      {/* ─── Content Area ─── */}
      <div className="flex flex-col flex-1 p-3 gap-2">
        {/* Title */}
        <h3
          className="text-[13px] sm:text-[14px] font-medium text-slate-800 line-clamp-2 leading-snug min-h-[2.5rem] group-hover:text-epf-600 transition-colors"
          title={data.name}
        >
          {data.name}
        </h3>

        {/* Category (optional) */}
        {data.category && (
          <span className="text-[11px] text-slate-400 uppercase tracking-wide font-medium">
            {data.category}
          </span>
        )}

        {/* ─── Footer: Price + Button ─── */}
        <div className="mt-auto pt-2 flex flex-col gap-2">
          {/* Price Row */}
          <div className="flex items-baseline gap-1.5">
            <span className="text-[16px] font-bold text-epf-600">
              ৳{Number(displayPrice).toLocaleString()}
            </span>
            {originalPrice && originalPrice > displayPrice && (
              <span className="text-[12px] text-slate-400 line-through">
                ৳{Number(originalPrice).toLocaleString()}
              </span>
            )}
          </div>

          {/* Add to Cart Button — full width */}
          <button
            onClick={handleAddToCart}
            disabled={added}
            className={cn(
              "w-full h-9 rounded-lg text-[12px] font-semibold transition-all duration-200",
              "flex items-center justify-center gap-1.5",
              added
                ? "bg-green-500 text-white"
                : "bg-slate-800 hover:bg-epf-500 text-white"
            )}
          >
            {added ? (
              <>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Added!
              </>
            ) : (
              <>
                <ShoppingCart className="w-3.5 h-3.5" />
                Add to Cart
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// Memo for performance — prevents re-render when parent updates
export const PremiumCard = memo(PremiumCardBase);

// ═══════════════════════════════════════════════════════════════════════════
// Skeleton loader (matching card dimensions)
// ═══════════════════════════════════════════════════════════════════════════

export function PremiumCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden shadow-sm">
      <div className="aspect-square bg-slate-100 animate-pulse" />
      <div className="p-3 space-y-2">
        <div className="h-3 bg-slate-100 rounded animate-pulse w-3/4" />
        <div className="h-3 bg-slate-100 rounded animate-pulse w-1/2" />
        <div className="h-4 bg-slate-100 rounded animate-pulse w-1/3 mt-2" />
        <div className="h-9 bg-slate-100 rounded-lg animate-pulse w-full mt-2" />
      </div>
    </div>
  );
}
