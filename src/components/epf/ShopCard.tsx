"use client";

import { useState, memo } from "react";
import { ShoppingCart, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/store";
import { toast } from "sonner";

export interface ShopCardData {
  id: string;
  name: string;
  price: number;
  salePrice?: number | null;
  comparePrice?: number | null;
  image?: string;
  images?: string[];
  stock?: number;
  rating?: number;
  reviewCount?: number;
  badge?: string;
  isFeatured?: boolean;
  isBestDeal?: boolean;
}

interface ShopCardProps {
  data: ShopCardData;
  onCardClick?: (id: string) => void;
  className?: string;
}

const ShopCardBase = ({ data, onCardClick, className }: ShopCardProps) => {
  const [imgError, setImgError] = useState(false);
  const [added, setAdded] = useState(false);
  const addItem = useCartStore((s) => s.addItem);

  const imageUrl = data.image || data.images?.[0] || "";

  // Pricing
  const hasDiscount =
    data.comparePrice != null && data.comparePrice > data.price;
  const discountPercent = hasDiscount
    ? Math.round(((data.comparePrice! - data.price) / data.comparePrice!) * 100)
    : 0;
  const displayPrice = data.salePrice ?? data.price;
  const originalPrice = data.comparePrice ?? data.salePrice ?? null;
  const showOriginal = originalPrice != null && originalPrice > displayPrice;

  // Badge
  const badgeText =
    data.badge ||
    (discountPercent > 0
      ? `-${discountPercent}%`
      : data.isBestDeal
      ? "Best Deal"
      : data.isFeatured
      ? "Featured"
      : null);

  // Badge color
  const getBadgeColor = () => {
    if (data.badge === "Out of Stock" || (data.stock != null && data.stock <= 0)) return "bg-red-500";
    if (data.badge === "New") return "bg-green-500";
    return "bg-epf-500";
  };

  const handleClick = () => {
    if (onCardClick) onCardClick(data.id);
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    addItem({
      itemType: "PRODUCT",
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

  const stars = Math.round(data.rating || 0);

  return (
    <div
      onClick={handleClick}
      className={cn(
        "group relative flex flex-col bg-white rounded-lg overflow-hidden",
        "border border-slate-200",
        "hover:shadow-md transition-all duration-200",
        "cursor-pointer",
        className
      )}
    >
      {/* Image Area */}
      <div className="relative aspect-square bg-slate-50 overflow-hidden">
        {imageUrl && !imgError ? (
          <img
            src={imageUrl}
            alt={data.name}
            className="w-full h-full object-contain p-3 group-hover:scale-105 transition-transform duration-300"
            onError={() => setImgError(true)}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ShoppingCart className="w-8 h-8 text-slate-300" />
          </div>
        )}

        {/* Badge — square style */}
        {badgeText && (
          <span
            className={cn(
              "absolute top-2 left-2 z-10 px-2 py-0.5 text-[11px] font-bold text-white rounded-sm leading-tight",
              getBadgeColor()
            )}
          >
            {badgeText}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 px-3 pt-2 pb-3 gap-1">
        {/* Name */}
        <h4 className="text-[13px] font-normal text-slate-800 line-clamp-2 leading-[1.4] min-h-[2.4rem] group-hover:text-epf-600 transition-colors">
          {data.name}
        </h4>

        {/* Rating */}
        <div className="flex items-center gap-1">
          <div className="flex items-center gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={cn(
                  "h-3 w-3",
                  i < stars
                    ? "fill-yellow-400 text-yellow-400"
                    : "fill-slate-200 text-slate-200"
                )}
              />
            ))}
          </div>
          <span className="text-[11px] text-slate-500">
            {data.reviewCount || 0} Review
          </span>
        </div>

        {/* Price */}
        <div className="mt-auto pt-1 flex items-baseline gap-1.5 flex-wrap">
          {showOriginal && (
            <del className="text-[12px] font-normal text-slate-400">
              ৳{Number(originalPrice).toLocaleString()}
            </del>
          )}
          <span className="text-[14px] font-bold text-slate-900">
            ৳{Number(displayPrice).toLocaleString()}
          </span>
        </div>

        {/* Cart Button */}
        <button
          onClick={handleAddToCart}
          disabled={added}
          className={cn(
            "mt-2 w-full h-8 flex items-center justify-center gap-1.5 rounded-md text-[12px] font-semibold transition-colors",
            added
              ? "bg-green-500 text-white"
              : "bg-slate-100 hover:bg-slate-900 hover:text-white text-slate-700"
          )}
        >
          <ShoppingCart className="h-3.5 w-3.5" />
          {added ? "Added!" : "Add to Cart"}
        </button>
      </div>
    </div>
  );
}

export const ShopCard = memo(ShopCardBase);

export function ShopCardSkeleton() {
  return (
    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
      <div className="aspect-square bg-slate-100 animate-pulse" />
      <div className="p-3 space-y-2">
        <div className="h-3 w-full bg-slate-100 rounded animate-pulse" />
        <div className="h-3 w-2/3 bg-slate-100 rounded animate-pulse" />
        <div className="flex items-center gap-1">
          <div className="h-3 w-16 bg-slate-100 rounded animate-pulse" />
        </div>
        <div className="h-4 w-20 bg-slate-100 rounded animate-pulse" />
        <div className="h-8 w-full bg-slate-100 rounded animate-pulse" />
      </div>
    </div>
  );
}
