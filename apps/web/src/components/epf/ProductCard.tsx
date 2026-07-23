"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ShoppingCart, Heart, Eye, Star, Zap } from "lucide-react";
import { useCartStore } from "@epowerfix/store";
import { formatPrice } from "@epowerfix/utils";

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    slug?: string;
    price: number;
    compareAtPrice?: number;
    images?: string[];
    rating?: number;
    reviewCount?: number;
    inStock?: boolean;
    badge?: string;
    brand?: string;
  };
}

export default function ProductCard({ product }: ProductCardProps) {
  const [wishlisted, setWishlisted] = useState(false);
  const { addItem } = useCartStore();

  const discount = product.compareAtPrice
    ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
    : 0;

  return (
    <div className="group relative bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden hover:shadow-xl hover:border-[#0EA5E9]/20 transition-all duration-300">
      {/* Badges */}
      <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5">
        {discount > 0 && (
          <span className="bg-[#DC2626] text-white text-xs font-bold px-2.5 py-1 rounded-lg">-{discount}%</span>
        )}
        {product.badge && (
          <span className="bg-[#F59E0B] text-white text-xs font-bold px-2.5 py-1 rounded-lg">{product.badge}</span>
        )}
      </div>

      {/* Wishlist + Quick View */}
      <div className="absolute top-3 right-3 z-10 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => setWishlisted(!wishlisted)}
          className={`p-2 rounded-full shadow-md transition ${
            wishlisted ? "bg-[#DC2626] text-white" : "bg-white text-[#334155] hover:text-[#DC2626]"
          }`}
        >
          <Heart className={`w-4 h-4 ${wishlisted ? "fill-current" : ""}`} />
        </button>
        <Link href={`/shop/${product.id}`} className="p-2 bg-white rounded-full shadow-md text-[#334155] hover:text-[#0EA5E9] transition">
          <Eye className="w-4 h-4" />
        </Link>
      </div>

      {/* Image */}
      <Link href={`/shop/${product.id}`}>
        <div className="relative aspect-square bg-[#F8FAFC] overflow-hidden">
          {product.images?.[0] ? (
            <Image src={product.images[0]} alt={product.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Zap className="w-16 h-16 text-[#E2E8F0]" />
            </div>
          )}
        </div>
      </Link>

      {/* Info */}
      <div className="p-4 space-y-2">
        {product.brand && (
          <p className="text-xs text-[#94A3B8] uppercase tracking-wide">{product.brand}</p>
        )}
        <Link href={`/shop/${product.id}`}>
          <h3 className="text-sm font-semibold text-[#0F172A] line-clamp-2 hover:text-[#0EA5E9] transition min-h-[40px]">
            {product.name}
          </h3>
        </Link>

        {/* Rating */}
        <div className="flex items-center gap-1.5">
          <div className="flex">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className={`w-3.5 h-3.5 ${i < (product.rating || 0) ? "text-[#F59E0B] fill-[#F59E0B]" : "text-[#E2E8F0]"}`} />
            ))}
          </div>
          <span className="text-xs text-[#94A3B8]">({product.reviewCount || 0})</span>
        </div>

        {/* Price */}
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-[#0EA5E9]">{formatPrice(product.price)}</span>
          {product.compareAtPrice && (
            <span className="text-sm text-[#94A3B8] line-through">{formatPrice(product.compareAtPrice)}</span>
          )}
        </div>

        {/* Stock */}
        <p className={`text-xs font-medium ${product.inStock !== false ? "text-[#4D7300]" : "text-[#DC2626]"}`}>
          {product.inStock !== false ? "✓ স্টকে আছে" : "✗ স্টক নেই"}
        </p>

        {/* Add to Cart */}
        <button
          onClick={() => addItem({ productId: product.id, productName: product.name, productImage: product.images?.[0] ?? "", price: product.price, quantity: 1 })}
          disabled={product.inStock === false}
          className="w-full flex items-center justify-center gap-2 bg-[#0EA5E9] hover:bg-[#0284C7] disabled:bg-[#E2E8F0] disabled:text-[#94A3B8] text-white py-2.5 rounded-xl text-sm font-semibold transition"
        >
          <ShoppingCart className="w-4 h-4" />
          কার্টে যোগ করুন
        </button>
      </div>
    </div>
  );
}
