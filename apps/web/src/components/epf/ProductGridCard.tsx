"use client";

import Link from "next/link";
import { Package, ShoppingCart } from "lucide-react";
import { cn } from "@/lib/utils";

export function formatBdt(value: number) {
  return `৳${Number(value).toLocaleString()}`;
}

export interface ProductGridCardProps {
  href: string;
  name: string;
  price: number;
  comparePrice?: number | null;
  image?: string | null;
  inStock?: boolean;
  className?: string;
  /** When provided, renders an "Add to Cart" button that is hidden until the card is hovered / touched. */
  onAddToCart?: () => void;
}

/**
 * Active eCommerce product card — matches the shop page reference exactly:
 * a thin-bordered rounded card, square light-grey image area with a small
 * circular store icon top-right, centered grey product name (2 lines) and a
 * centered bold blue price. Shared by the shop page grid and the home page
 * Shop / Project Kits sections so every surface uses the same card size/style.
 */
export default function ProductGridCard({
  href,
  name,
  price,
  comparePrice,
  image,
  inStock = true,
  className,
  onAddToCart,
}: ProductGridCardProps) {
  const showCompare = comparePrice != null && comparePrice > price;

  return (
    <div
      className={cn(
        "epf-card-border group relative mx-auto flex w-full max-w-[231px] h-[364px] flex-col border border-[#ededed] bg-white p-3 transition-shadow duration-200 hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)]",
        className
      )}
    >
      {/* Image — clickable (navigates to details); square, very light grey background, rounded */}
      <Link
        href={href}
        aria-label={name}
        className="relative block aspect-square shrink-0 overflow-hidden bg-[#f7f7f9]"
      >
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image}
            alt={name}
            loading="lazy"
            className="h-full w-full object-contain p-5 transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center">
            <Package className="h-10 w-10 text-[#c8c8c8]" />
          </span>
        )}
        {!inStock && (
          <span className="absolute left-2 top-2 rounded bg-slate-500 px-1.5 py-0.5 text-[11px] font-bold leading-none text-white">
            স্টক নেই
          </span>
        )}
      </Link>

      {/* Add to Cart — sits below the image; slides up into view on hover / touch and slides back down when leaving */}
      {onAddToCart && (
        <div className="mt-3 overflow-hidden">
          <button
            type="button"
            onClick={onAddToCart}
            disabled={!inStock}
            className="group/btn relative block h-9 w-full translate-y-full bg-[#0068e1] text-[13px] font-semibold text-white pointer-events-none transition-transform duration-300 ease-out group-hover:translate-y-0 group-hover:pointer-events-auto group-focus-within:translate-y-0 group-focus-within:pointer-events-auto hover:bg-[#0057bd] disabled:cursor-not-allowed disabled:bg-[#efeef1] disabled:text-[#cac7d1]"
          >
            {inStock ? (
              <>
                <span className="block transition-opacity duration-200 group-hover/btn:opacity-0">
                  Add to Cart
                </span>
                <ShoppingCart
                  aria-hidden="true"
                  className="absolute inset-0 m-auto h-[18px] w-[18px] opacity-0 transition-opacity duration-200 group-hover/btn:opacity-100"
                />
              </>
            ) : (
              "Out of Stock"
            )}
          </button>
        </div>
      )}

      {/* Name — clickable (navigates to details); centered, grey, 2 lines */}
      <Link href={href} className={cn("block", onAddToCart ? "mt-2" : "mt-4")}>
        <h3 className="line-clamp-2 min-h-[40px] text-center text-[13px] leading-[1.4] text-[#3f4254] transition-colors group-hover:text-[#0068e1]">
          {name}
        </h3>
      </Link>

      {/* Price — centered, bold blue */}
      <div className="mt-2 mb-1 flex items-baseline justify-center gap-1.5 leading-none">
        {showCompare && (
          <span className="text-[13px] text-[#a6a6a6] line-through">
            {formatBdt(comparePrice!)}
          </span>
        )}
        <span className="text-center text-[17px] font-bold text-[#0068e1]">
          {formatBdt(price)}
        </span>
      </div>
    </div>
  );
}
