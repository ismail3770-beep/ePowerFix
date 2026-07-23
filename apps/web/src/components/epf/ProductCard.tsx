"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ShoppingCart, Heart, Eye, Star, type LucideIcon } from "lucide-react";
import { useCartStore } from "@epowerfix/store";
import { formatPrice } from "@epowerfix/utils";

export interface ProductCardData {
  id: string;
  name: string;
  price: number;
  compareAtPrice?: number;
  images?: string[];
  rating?: number;
  reviewCount?: number;
  inStock?: boolean;
  badge?: string;
  brand?: string;
  icon?: LucideIcon;
  tile?: string;
}

export default function ProductCard({ product }: { product: ProductCardData }) {
  const [wished, setWished] = useState(false);
  const { addItem } = useCartStore();
  const Icon = product.icon;
  const discount = product.compareAtPrice
    ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
    : 0;

  return (
    <div className="group relative bg-white rounded-2xl border border-slate-200/70 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 overflow-hidden">
      {/* Badges */}
      <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5">
        {discount > 0 && (
          <span className="bg-rose-600 text-white text-[11px] font-bold px-2 py-0.5 rounded-md shadow-sm">
            -{discount}%
          </span>
        )}
        {product.badge && (
          <span className="bg-amber-500 text-white text-[11px] font-bold px-2 py-0.5 rounded-md shadow-sm">
            {product.badge}
          </span>
        )}
      </div>

      {/* Hover actions */}
      <div className="absolute top-3 right-3 z-10 flex flex-col gap-2 opacity-0 translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all">
        <button
          onClick={() => setWished(!wished)}
          className={`p-2 rounded-full bg-white shadow-md border border-slate-100 transition ${
            wished ? "text-rose-600" : "text-slate-400 hover:text-rose-600"
          }`}
          aria-label="wishlist"
        >
          <Heart className={`w-4 h-4 ${wished ? "fill-current" : ""}`} />
        </button>
        <Link
          href={`/shop/${product.id}`}
          className="p-2 rounded-full bg-white shadow-md border border-slate-100 text-slate-400 hover:text-sky-600 transition"
          aria-label="quick view"
        >
          <Eye className="w-4 h-4" />
        </Link>
      </div>

      {/* Image / Tile */}
      <Link href={`/shop/${product.id}`} className="block">
        <div className="relative aspect-square overflow-hidden bg-slate-50">
          {product.images?.[0] ? (
            <Image
              src={product.images[0]}
              alt={product.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div
              className={`absolute inset-0 flex items-center justify-center bg-gradient-to-br ${
                product.tile || "from-sky-50 to-sky-100"
              }`}
            >
              {Icon ? (
                <Icon
                  className="w-16 h-16 text-slate-300 group-hover:text-sky-400 group-hover:scale-110 transition-all duration-500"
                  strokeWidth={1.5}
                />
              ) : (
                <span className="text-5xl opacity-20">⚡</span>
              )}
            </div>
          )}
        </div>
      </Link>

      {/* Body */}
      <div className="p-4 space-y-2.5">
        {product.brand && (
          <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wide">
            {product.brand}
          </p>
        )}
        <Link href={`/shop/${product.id}`}>
          <h3 className="text-sm font-semibold text-slate-800 line-clamp-2 hover:text-sky-600 transition leading-snug min-h-[40px]">
            {product.name}
          </h3>
        </Link>
        <div className="flex items-center gap-1.5">
          <div className="flex">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-3.5 h-3.5 ${
                  i < Math.round(product.rating || 0)
                    ? "text-amber-400 fill-amber-400"
                    : "text-slate-200"
                }`}
              />
            ))}
          </div>
          <span className="text-xs text-slate-400">({product.reviewCount || 0})</span>
        </div>
        <div className="flex items-baseline gap-2 pt-0.5">
          <span className="text-lg font-bold text-slate-900">
            {formatPrice(product.price)}
          </span>
          {product.compareAtPrice && (
            <span className="text-sm text-slate-400 line-through">
              {formatPrice(product.compareAtPrice)}
            </span>
          )}
        </div>
        <button
          onClick={() =>
            addItem({ productId: product.id, productName: product.name, productImage: product.images?.[0] ?? "", price: product.price, quantity: 1 })
          }
          disabled={product.inStock === false}
          className="w-full flex items-center justify-center gap-2 bg-sky-500 hover:bg-sky-600 disabled:bg-slate-100 disabled:text-slate-400 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors"
        >
          <ShoppingCart className="w-4 h-4" />
          কার্টে যোগ করুন
        </button>
      </div>
    </div>
  );
}
