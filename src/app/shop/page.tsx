"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  ChevronRight,
  Home,
  Star,
  ShoppingCart,
  Eye,
  Heart,
  Package,
  FileText,
  Search,
  SlidersHorizontal,
  ChevronDown,
  ChevronLeft,
  X,
  Grid3X3,
  List,
  PackageSearch,
  Check,
  Boxes,
} from "lucide-react";
import { toast } from "sonner";
import { useUIStore, useCartStore } from "@/store";
import { apiFetch } from "@/lib/api";
import Header from "@/components/epf/Header";
import Footer from "@/components/epf/Footer";
import CartDrawer from "@/components/epf/CartDrawer";
import CheckoutDialog from "@/components/epf/CheckoutDialog";
import ProductDetailDialog from "@/components/epf/ProductDetailDialog";
import ServiceBookingDialog from "@/components/epf/ServiceBookingDialog";
import ProjectDetailDialog from "@/components/epf/ProjectDetailDialog";
import ChatWidget from "@/components/epf/ChatWidget";
import BackToTopButton from "@/components/epf/BackToTopButton";
import {
  EPFStar,
  EPFCart,
} from "@/components/epf/icons/EPFIcons";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
interface Category {
  id: string;
  name: string;
  nameBn?: string;
  slug: string;
  image?: string | null;
  sortOrder?: number;
}

interface Product {
  id: string;
  name: string;
  nameBn?: string;
  price: number;
  comparePrice: number | null;
  rating: number;
  review_count?: number;
  reviews?: number;
  stock: number;
  sold?: number;
  image: string | null;
  images?: string[];
  sku?: string;
  specifications?: Record<string, unknown>;
  category?: { id: string; name: string; slug: string } | null;
  type?: string;
  createdAt?: string;
}

interface ProductsResponse {
  success: boolean;
  data: {
    data: Product[];
    pagination: { total: number; page: number; limit: number };
  };
  message?: string;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */
const PRODUCTS_PER_PAGE = 20;

type SortOption = "featured" | "price-asc" | "price-desc" | "newest";
type ViewMode = "grid" | "list";

interface Kit {
  id: string;
  title: string;
  slug: string;
  price: number | null;
  salePrice: number | null;
  coverImage: string | null;
  images: string[];
  isSellable: boolean;
  location?: string | null;
}

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "featured", label: "Featured" },
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
];

const PRICE_RANGES = [
  { label: "Under ৳500", min: 0, max: 500 },
  { label: "৳500 – ৳2,000", min: 500, max: 2000 },
  { label: "৳2,000 – ৳5,000", min: 2000, max: 5000 },
  { label: "Above ৳5,000", min: 5000, max: Infinity },
];

const RATING_OPTIONS = [5, 4, 3, 2, 1];

/* ------------------------------------------------------------------ */
/*  Skeletons                                                          */
/* ------------------------------------------------------------------ */
function ProductCardSkeleton() {
  return (
    <div className="bg-white border border-[#E2E8F0] rounded-lg shadow-sm animate-pulse overflow-hidden">
      <div className="aspect-square bg-[#F1F5F9]" />
      <div className="p-3.5 space-y-2.5">
        <div className="h-3 bg-[#F1F5F9] rounded w-16" />
        <div className="h-4 bg-[#F1F5F9] rounded w-full" />
        <div className="h-4 bg-[#F1F5F9] rounded w-3/4" />
        <div className="flex gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-3.5 w-3.5 bg-[#F1F5F9] rounded-sm" />
          ))}
        </div>
        <div className="h-5 bg-[#F1F5F9] rounded w-20" />
      </div>
    </div>
  );
}

function ProductListCardSkeleton() {
  return (
    <div className="bg-white border border-[#E2E8F0] rounded-lg shadow-sm animate-pulse overflow-hidden flex gap-4 p-4">
      <div className="w-36 h-36 sm:w-44 sm:h-44 shrink-0 bg-[#F1F5F9] rounded-lg" />
      <div className="flex-1 space-y-3 py-1">
        <div className="h-3 bg-[#F1F5F9] rounded w-16" />
        <div className="h-5 bg-[#F1F5F9] rounded w-full max-w-sm" />
        <div className="h-5 bg-[#F1F5F9] rounded w-2/3" />
        <div className="flex gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-3.5 w-3.5 bg-[#F1F5F9] rounded-sm" />
          ))}
        </div>
        <div className="h-6 bg-[#F1F5F9] rounded w-24" />
        <div className="h-9 bg-[#F1F5F9] rounded-lg w-32" />
      </div>
    </div>
  );
}

function SidebarSkeleton() {
  return (
    <div className="bg-white border border-[#E2E8F0] rounded-lg p-5 space-y-6 animate-pulse">
      {/* Categories */}
      <div>
        <div className="h-5 bg-[#F1F5F9] rounded w-28 mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="h-4 w-4 bg-[#F1F5F9] rounded" />
              <div className="h-3.5 bg-[#F1F5F9] rounded w-28 flex-1" />
            </div>
          ))}
        </div>
      </div>
      {/* Price Range */}
      <div>
        <div className="h-5 bg-[#F1F5F9] rounded w-24 mb-4" />
        <div className="grid grid-cols-2 gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-9 bg-[#F1F5F9] rounded-lg" />
          ))}
        </div>
      </div>
      {/* Rating */}
      <div>
        <div className="h-5 bg-[#F1F5F9] rounded w-16 mb-4" />
        <div className="space-y-2.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-7 bg-[#F1F5F9] rounded w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Star Rating Display                                                */
/* ------------------------------------------------------------------ */
function StarRating({ rating, size = "sm" }: { rating: number; size?: "sm" | "md" }) {
  const fullStars = Math.round(rating || 0);
  const cls = size === "sm" ? "h-3 w-3" : "h-4 w-4";
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`${cls} ${i < fullStars ? "fill-amber-400 text-amber-400" : "text-[#D1D5DB]"}`}
        />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Product Card – Grid View                                           */
/* ------------------------------------------------------------------ */
function ProductCardGrid({ product }: { product: Product }) {
  const { setSelectedProductId, setProductDetailOpen } = useUIStore();
  const addItem = useCartStore((s) => s.addItem);

  const discount = product.comparePrice
    ? Math.round((1 - product.price / product.comparePrice) * 100)
    : 0;
  const isDigital =
    product.name?.toLowerCase().includes("guide") ||
    product.name?.toLowerCase().includes("pdf");
  const reviewCount = product.review_count ?? product.reviews ?? 0;

  return (
    <div className="group bg-white border border-[#E2E8F0] rounded-lg shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 overflow-hidden">
      {/* Image */}
      <div className="relative overflow-hidden aspect-square bg-[#F8FAFC]">
        <a href={`/product/${product.id}`} className="block w-full h-full">
          {product.image ? (
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : isDigital ? (
            <div className="w-full h-full flex items-center justify-center">
              <FileText className="h-12 w-12 text-[#CBD5E1]" />
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="h-12 w-12 text-[#CBD5E1]" />
            </div>
          )}
        </a>

        {/* Discount badge */}
        {discount > 0 && (
          <span className="absolute top-2.5 left-2.5 bg-red-500 text-white text-[11px] font-semibold px-2 py-0.5 rounded-md leading-tight">
            Save {discount}%
          </span>
        )}

        {/* Wishlist heart */}
        <button
          onClick={(e) => {
            e.stopPropagation();
          }}
          className="absolute top-2.5 right-2.5 h-8 w-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center text-[#9CA3AF] hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-sm"
          title="Wishlist"
        >
          <Heart className="h-4 w-4" />
        </button>

        {/* Hover overlay with actions */}
        <div className="absolute inset-x-0 bottom-0 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
          <div className="bg-gradient-to-t from-black/60 via-black/20 to-transparent pt-12 pb-3 px-3 flex items-end justify-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                addItem({
                  productId: product.id,
                  productName: product.name,
                  productImage: product.image || "",
                  price: product.price,
                  quantity: 1,
                });
              }}
              className="flex items-center gap-1.5 h-8 px-3.5 bg-white text-[#111827] text-[12px] font-semibold rounded-lg hover:bg-[#F8FAFC] transition-colors shadow-sm"
              title="Add to Cart"
            >
              <EPFCart size={14} strokeWidth={2} />
              <span>Add to Cart</span>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedProductId(product.id);
                setProductDetailOpen(true);
              }}
              className="flex items-center gap-1.5 h-8 px-3.5 border border-white/80 text-white text-[12px] font-medium rounded-lg hover:bg-white/20 transition-colors backdrop-blur-sm"
              title="Quick View"
            >
              <Eye className="h-3.5 w-3.5" />
              <span>Quick View</span>
            </button>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="p-3.5">
        {product.category && (
          <p className="text-[11px] font-medium uppercase tracking-wider text-[#9CA3AF] mb-1">
            {product.category.name}
          </p>
        )}
        <a href={`/product/${product.id}`} className="block">
          <h3 className="text-[14px] font-medium text-[#111827] line-clamp-2 leading-snug mb-1.5 group-hover:text-epf-500 transition-colors">
            {product.name}
          </h3>
        </a>
        <div className="flex items-center gap-1.5 mb-2">
          <StarRating rating={product.rating} />
          <span className="text-[12px] text-[#9CA3AF]">({reviewCount})</span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-[16px] font-bold text-[#111827]">
            ৳{(product.price ?? 0).toLocaleString()}
          </span>
          {product.comparePrice && (
            <span className="text-[13px] text-[#9CA3AF] line-through">
              ৳{(product.comparePrice ?? 0).toLocaleString()}
            </span>
          )}
        </div>
        {product.stock < 50 && (
          <p className="text-[12px] text-blue-500 font-medium mt-1.5">
            Only {product.stock} left
          </p>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Product Card – List View                                           */
/* ------------------------------------------------------------------ */
function ProductCardList({ product }: { product: Product }) {
  const { setSelectedProductId, setProductDetailOpen } = useUIStore();
  const addItem = useCartStore((s) => s.addItem);

  const discount = product.comparePrice
    ? Math.round((1 - product.price / product.comparePrice) * 100)
    : 0;
  const isDigital =
    product.name?.toLowerCase().includes("guide") ||
    product.name?.toLowerCase().includes("pdf");
  const reviewCount = product.review_count ?? product.reviews ?? 0;

  return (
    <div className="group bg-white border border-[#E2E8F0] rounded-lg shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
      <div className="flex flex-col sm:flex-row">
        {/* Image */}
        <div className="relative overflow-hidden sm:w-44 sm:h-44 md:w-52 md:h-52 shrink-0 aspect-square sm:aspect-auto bg-[#F8FAFC]">
          <a href={`/product/${product.id}`} className="block w-full h-full">
            {product.image ? (
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            ) : isDigital ? (
              <div className="w-full h-full flex items-center justify-center">
                <FileText className="h-12 w-12 text-[#CBD5E1]" />
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Package className="h-12 w-12 text-[#CBD5E1]" />
              </div>
            )}
          </a>
          {discount > 0 && (
            <span className="absolute top-2.5 left-2.5 bg-red-500 text-white text-[11px] font-semibold px-2 py-0.5 rounded-md leading-tight">
              Save {discount}%
            </span>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 p-4 sm:p-5 flex flex-col justify-between min-w-0">
          <div>
            {product.category && (
              <p className="text-[11px] font-medium uppercase tracking-wider text-[#9CA3AF] mb-1">
                {product.category.name}
              </p>
            )}
            <a href={`/product/${product.id}`} className="block">
              <h3 className="text-[16px] font-medium text-[#111827] line-clamp-2 leading-snug mb-2 group-hover:text-epf-500 transition-colors">
                {product.name}
              </h3>
            </a>
            <div className="flex items-center gap-1.5 mb-2.5">
              <StarRating rating={product.rating} size="md" />
              <span className="text-[13px] text-[#9CA3AF]">
                ({reviewCount} reviews)
              </span>
            </div>
            {product.stock < 50 && (
              <p className="text-[12px] text-blue-500 font-medium mb-2">
                Only {product.stock} left
              </p>
            )}
          </div>
          <div className="flex items-center justify-between gap-4 mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-[18px] font-bold text-[#111827]">
                ৳{(product.price ?? 0).toLocaleString()}
              </span>
              {product.comparePrice && (
                <span className="text-[14px] text-[#9CA3AF] line-through">
                  ৳{(product.comparePrice ?? 0).toLocaleString()}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  addItem({
                    productId: product.id,
                    productName: product.name,
                    productImage: product.image || "",
                    price: product.price,
                    quantity: 1,
                  });
                }}
                className="flex items-center gap-1.5 h-9 px-4 bg-epf-500 hover:bg-epf-600 text-white text-[13px] font-semibold rounded-lg transition-colors"
              >
                <EPFCart size={15} strokeWidth={2} />
                <span className="hidden sm:inline">Add to Cart</span>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedProductId(product.id);
                  setProductDetailOpen(true);
                }}
                className="flex items-center justify-center h-9 w-9 border border-[#E2E8F0] rounded-lg text-[#6B7280] hover:bg-[#F8FAFC] hover:text-[#111827] transition-colors"
                title="Quick View"
              >
                <Eye className="h-4 w-4" />
              </button>
              <button
                onClick={(e) => e.stopPropagation()}
                className="flex items-center justify-center h-9 w-9 border border-[#E2E8F0] rounded-lg text-[#6B7280] hover:bg-[#F8FAFC] hover:text-red-500 transition-colors"
                title="Wishlist"
              >
                <Heart className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Filter Sidebar                                                     */
/* ------------------------------------------------------------------ */
function FilterSidebar({
  categories,
  selectedCategoryId,
  onSelectCategory,
  selectedPriceRange,
  onSelectPriceRange,
  selectedRating,
  onSelectRating,
  isLoading,
  onClearAll,
}: {
  categories: Category[];
  selectedCategoryId: string | null;
  onSelectCategory: (id: string | null) => void;
  selectedPriceRange: number | null;
  onSelectPriceRange: (idx: number | null) => void;
  selectedRating: number | null;
  onSelectRating: (rating: number | null) => void;
  isLoading: boolean;
  onClearAll: () => void;
}) {
  const [catOpen, setCatOpen] = useState(true);
  const [priceOpen, setPriceOpen] = useState(true);
  const [ratingOpen, setRatingOpen] = useState(true);

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-lg overflow-hidden">
      {/* Clear All */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#E2E8F0] bg-[#F8FAFC]">
        <h2 className="text-[15px] font-semibold text-[#111827]">Filters</h2>
        {(selectedCategoryId || selectedPriceRange !== null || selectedRating !== null) && (
          <button
            onClick={onClearAll}
            className="text-[12px] text-epf-500 font-medium hover:text-epf-600 transition-colors"
          >
            Clear All
          </button>
        )}
      </div>

      <div className="p-5 space-y-6">
        {/* Categories */}
        <div>
          <button
            onClick={() => setCatOpen(!catOpen)}
            className="flex items-center justify-between w-full mb-3"
          >
            <h3 className="text-[14px] font-semibold text-[#111827]">Categories</h3>
            <ChevronDown
              className={`h-4 w-4 text-[#6B7280] transition-transform duration-200 ${catOpen ? "rotate-180" : ""}`}
            />
          </button>
          {catOpen && (
            <div className="space-y-1 max-h-64 overflow-y-auto pr-1 custom-scrollbar">
              {/* All Products */}
              <label className="flex items-center gap-2.5 py-1.5 cursor-pointer group">
                <div
                  className={`h-4 w-4 rounded-[3px] border-2 flex items-center justify-center shrink-0 transition-colors ${
                    selectedCategoryId === null
                      ? "bg-[#111827] border-[#111827]"
                      : "border-[#D1D5DB] group-hover:border-[#9CA3AF]"
                  }`}
                  onClick={() => onSelectCategory(null)}
                >
                  {selectedCategoryId === null && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
                </div>
                <span
                  className={`text-[13px] transition-colors ${
                    selectedCategoryId === null ? "text-[#111827] font-medium" : "text-[#374151]"
                  }`}
                  onClick={() => onSelectCategory(null)}
                >
                  All Products
                </span>
              </label>
              {isLoading
                ? Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-2.5 py-1.5 animate-pulse">
                      <div className="h-4 w-4 bg-[#F1F5F9] rounded-[3px]" />
                      <div className="h-3.5 bg-[#F1F5F9] rounded w-24 flex-1" />
                    </div>
                  ))
                : categories.map((cat) => (
                    <label key={cat.id} className="flex items-center gap-2.5 py-1.5 cursor-pointer group">
                      <div
                        className={`h-4 w-4 rounded-[3px] border-2 flex items-center justify-center shrink-0 transition-colors ${
                          selectedCategoryId === cat.id
                            ? "bg-epf-500 border-epf-500"
                            : "border-[#D1D5DB] group-hover:border-[#9CA3AF]"
                        }`}
                        onClick={() => onSelectCategory(cat.id)}
                      >
                        {selectedCategoryId === cat.id && (
                          <Check className="h-3 w-3 text-white" strokeWidth={3} />
                        )}
                      </div>
                      <span
                        className={`text-[13px] flex-1 truncate transition-colors ${
                          selectedCategoryId === cat.id ? "text-[#111827] font-medium" : "text-[#374151]"
                        }`}
                        onClick={() => onSelectCategory(cat.id)}
                      >
                        {cat.name}
                      </span>
                    </label>
                  ))}
            </div>
          )}
        </div>

        {/* Price Range */}
        <div>
          <button
            onClick={() => setPriceOpen(!priceOpen)}
            className="flex items-center justify-between w-full mb-3"
          >
            <h3 className="text-[14px] font-semibold text-[#111827]">Price Range</h3>
            <ChevronDown
              className={`h-4 w-4 text-[#6B7280] transition-transform duration-200 ${priceOpen ? "rotate-180" : ""}`}
            />
          </button>
          {priceOpen && (
            <div className="grid grid-cols-2 gap-2">
              {PRICE_RANGES.map((range, idx) => (
                <button
                  key={idx}
                  onClick={() => onSelectPriceRange(selectedPriceRange === idx ? null : idx)}
                  className={`text-[12px] font-medium h-9 px-3 rounded-lg border transition-all duration-200 text-center leading-tight ${
                    selectedPriceRange === idx
                      ? "bg-[#111827] text-white border-[#111827]"
                      : "border-[#E2E8F0] text-[#374151] hover:border-[#9CA3AF] hover:text-[#111827]"
                  }`}
                >
                  {range.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Rating */}
        <div>
          <button
            onClick={() => setRatingOpen(!ratingOpen)}
            className="flex items-center justify-between w-full mb-3"
          >
            <h3 className="text-[14px] font-semibold text-[#111827]">Rating</h3>
            <ChevronDown
              className={`h-4 w-4 text-[#6B7280] transition-transform duration-200 ${ratingOpen ? "rotate-180" : ""}`}
            />
          </button>
          {ratingOpen && (
            <div className="space-y-1">
              {RATING_OPTIONS.map((r) => (
                <button
                  key={r}
                  onClick={() => onSelectRating(selectedRating === r ? null : r)}
                  className={`flex items-center gap-2 w-full px-2.5 py-1.5 rounded-lg text-left transition-colors ${
                    selectedRating === r
                      ? "bg-[#111827]/5"
                      : "hover:bg-[#F8FAFC]"
                  }`}
                >
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-3.5 w-3.5 ${
                          i < r ? "fill-amber-400 text-amber-400" : "text-[#D1D5DB]"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-[12px] text-[#6B7280]">& up</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Mobile Filter Drawer                                               */
/* ------------------------------------------------------------------ */
function MobileFilterDrawer({
  open,
  onClose,
  categories,
  selectedCategoryId,
  onSelectCategory,
  selectedPriceRange,
  onSelectPriceRange,
  selectedRating,
  onSelectRating,
  isLoading,
  onClearAll,
  onApply,
}: {
  open: boolean;
  onClose: () => void;
  categories: Category[];
  selectedCategoryId: string | null;
  onSelectCategory: (id: string | null) => void;
  selectedPriceRange: number | null;
  onSelectPriceRange: (idx: number | null) => void;
  selectedRating: number | null;
  onSelectRating: (rating: number | null) => void;
  isLoading: boolean;
  onClearAll: () => void;
  onApply: () => void;
}) {
  if (!open) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/40 z-40 transition-opacity lg:hidden"
        onClick={onClose}
      />
      {/* Drawer */}
      <div className="fixed top-0 left-0 bottom-0 w-[300px] max-w-[85vw] bg-[#F8FAFC] z-50 overflow-y-auto shadow-2xl lg:hidden transition-transform">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-5 h-14 bg-white border-b border-[#E2E8F0]">
          <h2 className="text-[16px] font-semibold text-[#111827]">Filters</h2>
          <button
            onClick={onClose}
            className="h-8 w-8 flex items-center justify-center rounded-lg text-[#6B7280] hover:bg-[#F1F5F9] hover:text-[#111827] transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Filter content */}
        <div className="p-4 pb-24">
          <FilterSidebar
            categories={categories}
            selectedCategoryId={selectedCategoryId}
            onSelectCategory={onSelectCategory}
            selectedPriceRange={selectedPriceRange}
            onSelectPriceRange={onSelectPriceRange}
            selectedRating={selectedRating}
            onSelectRating={onSelectRating}
            isLoading={isLoading}
            onClearAll={onClearAll}
          />
        </div>

        {/* Apply button */}
        <div className="fixed bottom-0 left-0 w-[300px] max-w-[85vw] p-4 bg-white border-t border-[#E2E8F0] z-10 lg:hidden">
          <button
            onClick={onApply}
            className="w-full h-11 bg-epf-500 hover:bg-epf-600 text-white text-[14px] font-semibold rounded-lg transition-colors"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Pagination                                                         */
/* ------------------------------------------------------------------ */
function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  const pages: (number | "...")[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (currentPage > 3) pages.push("...");
    for (
      let i = Math.max(2, currentPage - 1);
      i <= Math.min(totalPages - 1, currentPage + 1);
      i++
    ) {
      pages.push(i);
    }
    if (currentPage < totalPages - 2) pages.push("...");
    pages.push(totalPages);
  }

  return (
    <div className="flex items-center justify-center gap-1.5 py-8">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        className="h-9 w-9 flex items-center justify-center border border-[#E2E8F0] rounded-lg text-[#374151] hover:bg-[#F8FAFC] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        aria-label="Previous page"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      {pages.map((p, i) =>
        p === "..." ? (
          <span
            key={`ellipsis-${i}`}
            className="h-9 w-9 flex items-center justify-center text-[#6B7280] text-[14px]"
          >
            ...
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`h-9 w-9 flex items-center justify-center rounded-lg text-[14px] font-medium transition-colors ${
              p === currentPage
                ? "bg-[#111827] text-white"
                : "border border-[#E2E8F0] text-[#374151] hover:bg-[#F8FAFC]"
            }`}
          >
            {p}
          </button>
        )
      )}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        className="h-9 w-9 flex items-center justify-center border border-[#E2E8F0] rounded-lg text-[#374151] hover:bg-[#F8FAFC] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        aria-label="Next page"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Empty State                                                        */
/* ------------------------------------------------------------------ */
function EmptyState({ onClear }: { onClear: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4">
      <div className="h-20 w-20 rounded-full bg-[#F1F5F9] flex items-center justify-center mb-5">
        <PackageSearch className="h-10 w-10 text-[#CBD5E1]" />
      </div>
      <h3 className="text-[18px] font-semibold text-[#111827] mb-2">
        No products found
      </h3>
      <p className="text-[14px] text-[#6B7280] mb-6 text-center max-w-md">
        We couldn&apos;t find any products matching your filters. Try adjusting
        your selection or search terms.
      </p>
      <button
        onClick={onClear}
        className="h-10 px-6 bg-epf-500 hover:bg-epf-600 text-white text-[14px] font-semibold rounded-lg transition-colors"
      >
        Clear All Filters
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Project Kit Card                                                   */
/* ------------------------------------------------------------------ */
function KitCard({ kit }: { kit: Kit }) {
  const { setSelectedProjectId, setProjectDetailOpen } = useUIStore();
  const addItem = useCartStore((s) => s.addItem);
  const buyable = kit.isSellable && kit.price != null;
  const price = Number(kit.salePrice || kit.price || 0);

  const openDetail = () => {
    setSelectedProjectId(kit.id);
    setProjectDetailOpen(true);
  };

  const addToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem({
      itemType: "PROJECT",
      productId: kit.id,
      productName: kit.title,
      productImage: kit.coverImage || kit.images?.[0] || "",
      price,
      quantity: 1,
    });
    toast.success("Kit added to cart", { description: kit.title });
  };

  return (
    <button
      onClick={openDetail}
      className="group flex flex-col text-left bg-white border border-[#E2E8F0] rounded-lg overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300"
    >
      <div className="relative aspect-square bg-[#F1F5F9] overflow-hidden">
        {kit.coverImage || kit.images?.[0] ? (
          <img
            src={kit.coverImage || kit.images[0]}
            alt={kit.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Boxes className="w-9 h-9 text-[#CBD5E1]" />
          </div>
        )}
        <span className="absolute top-2 left-2 bg-epf-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-sm flex items-center gap-1">
          <Boxes className="w-3 h-3" /> KIT
        </span>
        {buyable && (
          <div className="absolute inset-x-0 bottom-0 p-2 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
            <button
              onClick={addToCart}
              className="w-full bg-[#111827]/90 hover:bg-[#111827] text-white text-[12px] font-medium py-2 rounded-md flex items-center justify-center gap-1.5 backdrop-blur-sm"
            >
              <ShoppingCart className="w-3.5 h-3.5" /> Add to Cart
            </button>
          </div>
        )}
      </div>
      <div className="p-2.5 flex flex-col gap-1 flex-1">
        <p className="text-[10px] text-[#94A3B8] uppercase tracking-wider font-medium">Project Kit</p>
        <h4 className="text-[12.5px] font-medium text-[#111827] line-clamp-2 leading-snug min-h-[2.2rem] group-hover:text-epf-500 transition-colors">
          {kit.title}
        </h4>
        <div className="mt-auto pt-1">
          {buyable ? (
            <span className="text-[14px] font-bold text-[#111827]">৳{price.toLocaleString()}</span>
          ) : (
            <span className="text-[12px] font-medium text-epf-500">View details</span>
          )}
        </div>
      </div>
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Page                                                          */
/* ------------------------------------------------------------------ */
export default function ShopPage() {
  /* ---- State ---- */
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const [appliedSearch, setAppliedSearch] = useState(() => searchParams?.get("search") || "");
  const [sort, setSort] = useState<SortOption>("featured");
  const [page, setPage] = useState(1);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [tab, setTab] = useState<"products" | "kits">(
    searchParams?.get("tab") === "kits" ? "kits" : "products"
  );

  /* Filter state (client-side) */
  const [selectedPriceRange, setSelectedPriceRange] = useState<number | null>(null);
  const [selectedRating, setSelectedRating] = useState<number | null>(null);

  /* ---- Stores ---- */
  const { setSearchQuery } = useUIStore();

  /* ---- Sync search to global store ---- */
  useEffect(() => {
    setSearchQuery(appliedSearch);
  }, [appliedSearch, setSearchQuery]);

  /* ---- Fetch products ---- */
  const { data, isLoading, isError } = useQuery<ProductsResponse>({
    queryKey: [
      "shop-products",
      selectedCategoryId,
      appliedSearch,
      page,
      PRODUCTS_PER_PAGE,
    ],
    queryFn: () => {
      let url = `/api/products?limit=${PRODUCTS_PER_PAGE}&page=${page}`;
      if (selectedCategoryId) url += `&category=${encodeURIComponent(selectedCategoryId)}`;
      if (appliedSearch) url += `&search=${encodeURIComponent(appliedSearch)}`;
      return apiFetch(url);
    },
  });

  /* ---- Fetch project kits (sellable projects) ---- */
  const { data: kitsData, isLoading: kitsLoading } = useQuery<{ data: Kit[] }>({
    queryKey: ["shop-project-kits"],
    queryFn: () => apiFetch("/api/projects"),
    enabled: tab === "kits",
  });
  const allKits = kitsData?.data ?? [];
  const sellableKits = allKits.filter((k) => k.isSellable && k.price != null);
  const kits = sellableKits.length > 0 ? sellableKits : allKits;

  /* ---- Fetch categories ---- */
  const { data: categoriesData, isLoading: categoriesLoading } = useQuery({
    queryKey: ["product-categories"],
    queryFn: () => apiFetch<{ data: Category[] }>("/api/product-categories"),
    staleTime: 5 * 60 * 1000,
  });
  const categories: Category[] = categoriesData?.data ?? [];
  const totalProducts = data?.data?.pagination?.total ?? 0;
  const totalPages = Math.ceil(totalProducts / PRODUCTS_PER_PAGE);

  /* ---- Derived data with client-side sort + filter ---- */
  const processedProducts = useMemo(() => {
    const products = data?.data?.data ?? [];
    let arr = [...products];

    // Client-side price range filter
    if (selectedPriceRange !== null) {
      const range = PRICE_RANGES[selectedPriceRange];
      arr = arr.filter((p) => p.price >= range.min && p.price < range.max);
    }

    // Client-side rating filter
    if (selectedRating !== null) {
      arr = arr.filter((p) => Math.round(p.rating || 0) >= selectedRating);
    }

    // Sort
    switch (sort) {
      case "price-asc":
        arr.sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
        break;
      case "price-desc":
        arr.sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
        break;
      case "newest":
        arr.sort(
          (a, b) =>
            new Date(b.createdAt || 0).getTime() -
            new Date(a.createdAt || 0).getTime()
        );
        break;
      default:
        break;
    }
    return arr;
  }, [data?.data?.data, sort, selectedPriceRange, selectedRating]);

  /* ---- Handlers ---- */
  useEffect(() => {
    const urlSearch = searchParams?.get("search") || "";
    setAppliedSearch(urlSearch);
  }, [searchParams]);

  const handleClearFilters = useCallback(() => {
    setSelectedCategoryId(null);
    setAppliedSearch("");
    setSort("featured");
    setPage(1);
    setSelectedPriceRange(null);
    setSelectedRating(null);
  }, []);

  const handleCategorySelect = useCallback((catId: string | null) => {
    setSelectedCategoryId(catId);
    setPage(1);
  }, []);

  const handleSortChange = useCallback((newSort: SortOption) => {
    setSort(newSort);
    setPage(1);
  }, []);

  const handleApplyMobileFilters = useCallback(() => {
    setMobileFilterOpen(false);
  }, []);

  /* ---- Scroll to top on page change ---- */
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [page]);

  /* ---- Active labels ---- */
  const activeCategoryName = useMemo(() => {
    if (!selectedCategoryId) return null;
    return categories.find((c) => c.id === selectedCategoryId)?.name ?? null;
  }, [selectedCategoryId, categories]);

  const activePriceLabel = useMemo(() => {
    if (selectedPriceRange === null) return null;
    return PRICE_RANGES[selectedPriceRange]?.label ?? null;
  }, [selectedPriceRange]);

  const showingFrom = (page - 1) * PRODUCTS_PER_PAGE + 1;
  const showingTo = Math.min(page * PRODUCTS_PER_PAGE, totalProducts);

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      <Header />

      <main className="flex-1">
        {/* Breadcrumb */}
        <div className="bg-white border-b border-[#E2E8F0]">
          <div className="mx-auto max-w-[1400px] px-4 sm:px-12">
            <nav className="flex items-center gap-1.5 h-11 text-[13px]">
              <a
                href="/"
                className="flex items-center gap-1 text-[#6B7280] hover:text-[#111827] transition-colors"
              >
                <Home className="h-3.5 w-3.5" />
                <span>Home</span>
              </a>
              <ChevronRight className="h-3 w-3 text-[#CBD5E1]" />
              <span className="text-[#111827] font-medium">Shop</span>
            </nav>
          </div>
        </div>

        {/* Tabs: Products | Project Kits */}
        <div className="bg-white border-b border-[#E2E8F0]">
          <div className="mx-auto max-w-[1400px] px-4 sm:px-12">
            <div className="flex items-center gap-1">
              {([
                { key: "products", label: "Products", icon: Package },
                { key: "kits", label: "Project Kits", icon: Boxes },
              ] as const).map((t) => {
                const Icon = t.icon;
                const active = tab === t.key;
                return (
                  <button
                    key={t.key}
                    onClick={() => setTab(t.key)}
                    className={`relative flex items-center gap-2 px-4 py-3 text-[14px] font-semibold transition-colors ${
                      active ? "text-epf-500" : "text-[#6B7280] hover:text-[#111827]"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {t.label}
                    {active && <span className="absolute inset-x-2 -bottom-px h-0.5 bg-epf-500 rounded-full" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Top Toolbar (products only) */}
        {tab === "products" && (
        <div className="bg-white border-b border-[#E2E8F0]">
          <div className="mx-auto max-w-[1400px] px-4 sm:px-12">
            <div className="flex items-center justify-between h-12 gap-4">
              {/* Left: Results count */}
              <div className="text-[13px] text-[#6B7280]">
                {isLoading ? (
                  <span className="inline-block w-40 h-4 bg-[#F1F5F9] rounded animate-pulse" />
                ) : processedProducts.length > 0 ? (
                  <>
                    Showing{" "}
                    <span className="text-[#111827] font-medium">{showingFrom}</span>
                    {" – "}
                    <span className="text-[#111827] font-medium">{showingTo}</span>
                    {" of "}
                    <span className="text-[#111827] font-medium">{totalProducts}</span>
                    {" products"}
                  </>
                ) : (
                  <>
                    Showing <span className="text-[#111827] font-medium">0</span> products
                  </>
                )}
              </div>

              {/* Right: Sort + View toggle + Mobile filter */}
              <div className="flex items-center gap-2.5">
                {/* Mobile filter button */}
                <button
                  onClick={() => setMobileFilterOpen(true)}
                  className="lg:hidden flex items-center gap-1.5 h-8.5 px-3 border border-[#E2E8F0] rounded-lg text-[13px] text-[#374151] hover:bg-[#F8FAFC] transition-colors"
                >
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                  <span>Filter</span>
                </button>

                {/* Sort dropdown */}
                <div className="relative">
                  <select
                    value={sort}
                    onChange={(e) => handleSortChange(e.target.value as SortOption)}
                    className="appearance-none h-8.5 pl-3 pr-8 border border-[#E2E8F0] rounded-lg bg-white text-[13px] text-[#374151] cursor-pointer hover:border-[#9CA3AF] focus:outline-none focus:border-epf-500 focus:ring-1 focus:ring-epf-500/20 transition-colors"
                  >
                    {SORT_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#6B7280] pointer-events-none" />
                </div>

                {/* View toggle */}
                <div className="hidden sm:flex items-center border border-[#E2E8F0] rounded-lg overflow-hidden">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`h-8.5 w-9 flex items-center justify-center transition-colors ${
                      viewMode === "grid"
                        ? "bg-[#111827] text-white"
                        : "text-[#6B7280] hover:bg-[#F8FAFC]"
                    }`}
                    title="Grid view"
                    aria-label="Grid view"
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={`h-8.5 w-9 flex items-center justify-center transition-colors ${
                      viewMode === "list"
                        ? "bg-[#111827] text-white"
                        : "text-[#6B7280] hover:bg-[#F8FAFC]"
                    }`}
                    title="List view"
                    aria-label="List view"
                  >
                    <List className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        )}

        {/* Active Filter Tags */}
        {tab === "products" && (selectedCategoryId || appliedSearch || selectedPriceRange !== null || selectedRating !== null) && (
          <div className="bg-white border-b border-[#E2E8F0]">
            <div className="mx-auto max-w-[1400px] px-4 sm:px-12 py-2.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[12px] text-[#6B7280] font-medium">Active:</span>
                {activeCategoryName && (
                  <span className="inline-flex items-center gap-1.5 h-7 px-2.5 bg-[#F1F5F9] border border-[#E2E8F0] rounded-full text-[12px] text-[#374151] font-medium">
                    {activeCategoryName}
                    <button
                      onClick={() => setSelectedCategoryId(null)}
                      className="text-[#9CA3AF] hover:text-[#111827] transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
                {activePriceLabel && (
                  <span className="inline-flex items-center gap-1.5 h-7 px-2.5 bg-[#F1F5F9] border border-[#E2E8F0] rounded-full text-[12px] text-[#374151] font-medium">
                    {activePriceLabel}
                    <button
                      onClick={() => setSelectedPriceRange(null)}
                      className="text-[#9CA3AF] hover:text-[#111827] transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
                {selectedRating !== null && (
                  <span className="inline-flex items-center gap-1.5 h-7 px-2.5 bg-[#F1F5F9] border border-[#E2E8F0] rounded-full text-[12px] text-[#374151] font-medium">
                    {selectedRating}★ & up
                    <button
                      onClick={() => setSelectedRating(null)}
                      className="text-[#9CA3AF] hover:text-[#111827] transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
                {appliedSearch && (
                  <span className="inline-flex items-center gap-1.5 h-7 px-2.5 bg-[#F1F5F9] border border-[#E2E8F0] rounded-full text-[12px] text-[#374151] font-medium">
                    &quot;{appliedSearch}&quot;
                    <button
                      onClick={() => setAppliedSearch("")}
                      className="text-[#9CA3AF] hover:text-[#111827] transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
                <button
                  onClick={handleClearFilters}
                  className="text-[12px] text-epf-500 font-medium hover:text-epf-600 transition-colors ml-1"
                >
                  Clear all
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Content: Sidebar + Grid */}
        <div className="mx-auto max-w-[1400px] px-4 sm:px-12 py-6">
          <div className="flex gap-6">
            {/* ---- Desktop Sidebar (products only) ---- */}
            {tab === "products" && (
            <aside className="hidden lg:block w-[280px] shrink-0">
              <div className="sticky top-[80px]">
                {categoriesLoading ? (
                  <SidebarSkeleton />
                ) : (
                  <FilterSidebar
                    categories={categories}
                    selectedCategoryId={selectedCategoryId}
                    onSelectCategory={handleCategorySelect}
                    selectedPriceRange={selectedPriceRange}
                    onSelectPriceRange={setSelectedPriceRange}
                    selectedRating={selectedRating}
                    onSelectRating={setSelectedRating}
                    isLoading={categoriesLoading}
                    onClearAll={handleClearFilters}
                  />
                )}
              </div>
            </aside>
            )}

            {/* ---- Content Area ---- */}
            <div className="flex-1 min-w-0">
              {tab === "kits" ? (
                kitsLoading ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
                    {Array.from({ length: 10 }).map((_, i) => <ProductCardSkeleton key={i} />)}
                  </div>
                ) : kits.length === 0 ? (
                  <div className="bg-white border border-[#E2E8F0] rounded-lg flex flex-col items-center justify-center py-20 text-center px-4">
                    <Boxes className="w-12 h-12 text-[#CBD5E1] mb-3" />
                    <p className="text-[15px] font-medium text-[#6B7280]">No project kits available yet</p>
                    <p className="text-[13px] text-[#94A3B8] mt-1">Check back soon for build-ready component kits.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
                    {kits.map((kit) => <KitCard key={kit.id} kit={kit} />)}
                  </div>
                )
              ) : isError ? (
                <div className="flex flex-col items-center justify-center py-20 px-4">
                  <div className="h-16 w-16 rounded-full bg-red-50 flex items-center justify-center mb-4">
                    <X className="h-8 w-8 text-red-400" />
                  </div>
                  <p className="text-[14px] text-[#6B7280]">
                    Failed to load products. Please try again later.
                  </p>
                </div>
              ) : isLoading ? (
                viewMode === "grid" ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-3 gap-4">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <ProductCardSkeleton key={i} />
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <ProductListCardSkeleton key={i} />
                    ))}
                  </div>
                )
              ) : processedProducts.length === 0 ? (
                <div className="bg-white border border-[#E2E8F0] rounded-lg">
                  <EmptyState onClear={handleClearFilters} />
                </div>
              ) : (
                <>
                  {viewMode === "grid" ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-3 gap-4">
                      {processedProducts.map((product) => (
                        <ProductCardGrid key={product.id} product={product} />
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4">
                      {processedProducts.map((product) => (
                        <ProductCardList key={product.id} product={product} />
                      ))}
                    </div>
                  )}

                  {/* Pagination */}
                  <Pagination
                    currentPage={page}
                    totalPages={totalPages}
                    onPageChange={setPage}
                  />
                </>
              )}
            </div>
          </div>
        </div>
      </main>

      <div className="mt-auto">
        <Footer />
      </div>

      {/* Mobile Filter Drawer */}
      <MobileFilterDrawer
        open={mobileFilterOpen}
        onClose={() => setMobileFilterOpen(false)}
        categories={categories}
        selectedCategoryId={selectedCategoryId}
        onSelectCategory={handleCategorySelect}
        selectedPriceRange={selectedPriceRange}
        onSelectPriceRange={setSelectedPriceRange}
        selectedRating={selectedRating}
        onSelectRating={setSelectedRating}
        isLoading={categoriesLoading}
        onClearAll={handleClearFilters}
        onApply={handleApplyMobileFilters}
      />

      {/* Overlays & Dialogs */}
      <CartDrawer />
      <CheckoutDialog />
      <ServiceBookingDialog />
      <ProductDetailDialog />
      <ProjectDetailDialog />
      <ChatWidget />
      <BackToTopButton />
    </div>
  );
}
