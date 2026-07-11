"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Star,
  ShoppingCart,
  Heart,
  Share2,
  Minus,
  Plus,
  ChevronLeft,
  ChevronRight,
  Home,
  ChevronRight as ChevronRightIcon,
  Package,
  Truck,
  ShieldCheck,
  RotateCcw,
  Loader2,
  Eye,
  Zap,
  Tag,
  Check,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useCartStore } from "@/store";
import { useUIStore } from "@/store";
import { useAuthStore } from "@/store";
import { toast } from "sonner";
import Header from "@/components/epf/Header";
import Footer from "@/components/epf/Footer";
import CartDrawer from "@/components/epf/CartDrawer";
import CheckoutDialog from "@/components/epf/CheckoutDialog";
import ChatWidget from "@/components/epf/ChatWidget";
import BackToTopButton from "@/components/epf/BackToTopButton";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

interface Product {
  id: string;
  name: string;
  nameBn?: string;
  description: string;
  descriptionBn?: string;
  price: number;
  comparePrice: number | null;
  images: string[];
  stock: number;
  sold: number;
  rating: number;
  reviewCount: number;
  specs?: Record<string, string> | string | null;
  category?: { id: string; name: string; slug: string } | null;
  brand?: { id: string; name: string; slug: string } | null;
  sku?: string;
  tags?: string[];
}

/* ------------------------------------------------------------------ */
/*  Star Rating                                                        */
/* ------------------------------------------------------------------ */
function StarRating({
  rating,
  count,
  size = "size-4",
}: {
  rating: number;
  count?: number;
  size?: string;
}) {
  const safeRating = typeof rating === "number" ? rating : 0;

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={`${size} ${
              i < Math.round(safeRating)
                ? "fill-amber-500 text-amber-500"
                : "fill-slate-200 text-slate-200"
            }`}
          />
        ))}
      </div>
      <span className="text-[13px] font-medium text-slate-700">
        {safeRating.toFixed(1)}
      </span>
      {typeof count === "number" && (
        <span className="text-[13px] text-slate-500">({count} reviews)</span>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Page                                                          */
/* ------------------------------------------------------------------ */
export default function ProductDetailPage() {
  const params = useParams();
  const productId = params?.id as string;
  const addItem = useCartStore((s) => s.addItem);
  const { setChatOpen } = useUIStore();

  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [qty, setQty] = useState(1);
  const [activeTab, setActiveTab] = useState<string>("description");
  const [specs, setSpecs] = useState<Record<string, string>>({});
  const [viewers] = useState(() => Math.floor(Math.random() * 20) + 3);
  const [wishlisted, setWishlisted] = useState(false);
  const [zooming, setZooming] = useState(false);
  const [zoomPos, setZoomPos] = useState<{ x: number; y: number }>({ x: 50, y: 50 });
  const imageWrapRef = useRef<HTMLDivElement | null>(null);

  // Reviews
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [
    reviews,
    setReviews,
  ] = useState<
    Array<{
      id: string;
      rating: number;
      title: string;
      comment: string;
      createdAt: string;
      user?: { name: string };
    }>
  >([]);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState("");
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    if (!productId) {return;}
    apiFetch<{ data: { data: typeof reviews } }>(
      `/api/reviews?productId=${productId}`
    )
      .then((r) => setReviews(r?.data?.data ?? []))
      .catch(() => setReviews([]));
  }, [productId]);

  const submitReview = async () => {
    if (!isAuthenticated) {
      toast.error("Please log in to write a review");
      return;
    }
    setSubmittingReview(true);
    try {
      await apiFetch("/api/reviews", {
        method: "POST",
        body: JSON.stringify({
          productId,
          rating: reviewRating,
          title: reviewTitle,
          comment: reviewComment,
        }),
      });
      toast.success("Review submitted", {
        description: "It will appear once approved.",
      });
      setShowReviewForm(false);
      setReviewTitle("");
      setReviewComment("");
      setReviewRating(5);
    } catch (err: any) {
      toast.error("Could not submit review", {
        description: err?.message || "Please try again.",
      });
    } finally {
      setSubmittingReview(false);
    }
  };

  useEffect(() => {
    if (!productId) {return;}
    setIsLoading(true);
    setActiveImage(0);
    setQty(1);

    apiFetch<{ data: { product: Product } }>(`/api/products/${productId}`)
      .then((data) => {
        const p = data?.data?.product ?? null;
        if (p) {
          setProduct(p);
          try {
            const rawSpecs = p.specs;
            setSpecs(
              typeof rawSpecs === "string"
                ? JSON.parse(rawSpecs)
                : rawSpecs && typeof rawSpecs === "object"
                  ? (rawSpecs as Record<string, string>)
                  : {}
            );
          } catch {
            setSpecs({});
          }
        }
      })
      .catch(() => {
        // product not found — leave product as null so the page shows "not found"
      })
      .finally(() => setIsLoading(false));
  }, [productId]);

  const discount = product?.comparePrice
    ? Math.round(
        ((product.comparePrice - product.price) / product.comparePrice) * 100
      )
    : 0;
  const productImages = product?.images?.length ? product.images : [];

  const handleAddToCart = () => {
    if (!product) {return;}
    addItem({
      productId: product.id,
      productName: product.name,
      productImage: product.images?.[0] || "",
      price: product.price,
      quantity: qty,
    });
    toast.success("Added to cart!", {
      description: `${qty} × ${product.name}`,
    });
  };

  const handleBuyNow = () => {
    if (!product) {return;}
    addItem({
      productId: product.id,
      productName: product.name,
      productImage: product.images?.[0] || "",
      price: product.price,
      quantity: qty,
    });
    toast.success("Redirecting to checkout...");
    setTimeout(() => {
      window.location.href = "/checkout";
    }, 500);
  };

  const handlePrevImage = () => {
    setActiveImage((prev) => (prev > 0 ? prev - 1 : productImages.length - 1));
  };

  const handleNextImage = () => {
    setActiveImage((prev) =>
      prev < productImages.length - 1 ? prev + 1 : 0
    );
  };

  const handleWishlist = async () => {
    if (!product) {return;}
    if (!isAuthenticated) {
      toast.error("Please login to save favorites");
      return;
    }
    try {
      await apiFetch("/api/wishlist", {
        method: "POST",
        body: JSON.stringify({ productId: product.id }),
      });
      setWishlisted(true);
      toast.success("Added to wishlist");
    } catch (err: any) {
      toast.error(err?.message || "Failed to add to wishlist");
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Link copied!", {
      description: "Product link is in your clipboard.",
    });
  };

  // Hover-zoom on main image
  const handleImageMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageWrapRef.current) {return;}
    const rect = imageWrapRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPos({ x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="size-8 animate-spin text-epf-500" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Package className="size-16 text-slate-300 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-800 mb-2">
              Product Not Found
            </h2>
            <Link
              href="/"
              className="text-epf-600 hover:text-epf-700 underline text-sm"
            >
              Back to Home
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />
      <CartDrawer />
      <CheckoutDialog />
      <main className="flex-1">
        {/* Breadcrumb */}
        <div className="bg-white border-b border-slate-200">
          <div className="mx-auto max-w-[1400px] px-4 sm:px-6 py-3">
            <nav
              className="flex items-center gap-1.5 text-[13px] text-slate-500"
              aria-label="Breadcrumb"
            >
              <Link
                href="/"
                className="flex items-center gap-1 hover:text-epf-600 transition-colors"
              >
                <Home className="size-3.5" />
                Home
              </Link>
              <ChevronRightIcon className="size-3 text-slate-300" />
              <Link
                href="/shop"
                className="hover:text-epf-600 transition-colors"
              >
                Shop
              </Link>
              {product.category?.name && (
                <>
                  <ChevronRightIcon className="size-3 text-slate-300" />
                  <Link
                    href={`/shop?category=${product.category.slug}`}
                    className="hover:text-epf-600 transition-colors truncate max-w-[140px]"
                  >
                    {product.category.name}
                  </Link>
                </>
              )}
              <ChevronRightIcon className="size-3 text-slate-300" />
              <span className="text-slate-800 font-medium truncate max-w-[200px]">
                {product.name}
              </span>
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 py-6 sm:py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
            {/* Left: Image Gallery */}
            <div className="flex flex-col gap-3">
              {/* Main image with hover-zoom */}
              <div
                ref={imageWrapRef}
                onMouseEnter={() => setZooming(true)}
                onMouseLeave={() => setZooming(false)}
                onMouseMove={handleImageMove}
                className="relative aspect-square bg-white rounded-xl border border-slate-200 overflow-hidden group cursor-zoom-in shadow-sm"
              >
                {productImages.length > 0 ? (
                  <img
                    src={productImages[activeImage]}
                    alt={product.name}
                    className="w-full h-full object-contain p-6 transition-transform duration-200 ease-out"
                    style={
                      zooming
                        ? {
                            transform: `scale(1.8)`,
                            transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`,
                          }
                        : undefined
                    }
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="size-24 text-slate-200" />
                  </div>
                )}

                {/* Discount badge */}
                {discount > 0 && (
                  <span className="absolute top-4 left-4 bg-epf-500 text-white text-[12px] font-bold px-2.5 py-1 rounded-full shadow-sm">
                    -{discount}%
                  </span>
                )}

                {/* Action icons */}
                <div className="absolute top-4 right-4 flex flex-col gap-2">
                  <button
                    onClick={handleWishlist}
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-sm border ${
                      wishlisted
                        ? "bg-epf-500 border-epf-500 text-white"
                        : "bg-white/90 backdrop-blur-sm border-slate-200 text-slate-600 hover:text-epf-500 hover:border-epf-500"
                    }`}
                    aria-label="Add to wishlist"
                  >
                    <Heart
                      className={`size-4 ${wishlisted ? "fill-white" : ""}`}
                    />
                  </button>
                  <button
                    onClick={handleShare}
                    className="w-10 h-10 bg-white/90 backdrop-blur-sm border border-slate-200 rounded-full flex items-center justify-center text-slate-600 hover:text-epf-500 hover:border-epf-500 transition-all shadow-sm"
                    aria-label="Share product"
                  >
                    <Share2 className="size-4" />
                  </button>
                </div>

                {/* Nav arrows */}
                {productImages.length > 1 && (
                  <>
                    <button
                      onClick={handlePrevImage}
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 backdrop-blur-sm border border-slate-200 rounded-full flex items-center justify-center text-slate-700 hover:bg-epf-500 hover:text-white hover:border-epf-500 transition-all shadow-sm opacity-0 group-hover:opacity-100"
                      aria-label="Previous image"
                    >
                      <ChevronLeft className="size-5" />
                    </button>
                    <button
                      onClick={handleNextImage}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 backdrop-blur-sm border border-slate-200 rounded-full flex items-center justify-center text-slate-700 hover:bg-epf-500 hover:text-white hover:border-epf-500 transition-all shadow-sm opacity-0 group-hover:opacity-100"
                      aria-label="Next image"
                    >
                      <ChevronRight className="size-5" />
                    </button>
                  </>
                )}

                {/* Image counter */}
                {productImages.length > 1 && (
                  <span className="absolute bottom-4 right-4 bg-slate-900/70 backdrop-blur-sm text-white text-[12px] font-medium px-2.5 py-1 rounded-full">
                    {activeImage + 1} / {productImages.length}
                  </span>
                )}
              </div>

              {/* Thumbnail strip */}
              <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
                {productImages.length > 0 ? (
                  productImages.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveImage(i)}
                      className={`size-20 shrink-0 rounded-lg overflow-hidden border-2 transition-all ${
                        i === activeImage
                          ? "border-epf-500 shadow-sm"
                          : "border-slate-200 hover:border-slate-400"
                      }`}
                      aria-label={`View image ${i + 1}`}
                    >
                      <img
                        src={img}
                        alt=""
                        className="w-full h-full object-cover bg-white"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    </button>
                  ))
                ) : (
                  Array.from({ length: 4 }).map((_, i) => (
                    <div
                      key={i}
                      className={`size-20 shrink-0 rounded-lg border-2 flex items-center justify-center bg-slate-50 ${
                        i === 0 ? "border-epf-500" : "border-slate-200"
                      }`}
                    >
                      <Package className="size-6 text-slate-300" />
                    </div>
                  ))
                )}
              </div>

              {/* Trust badges row (under gallery on desktop) */}
              <div className="hidden lg:grid grid-cols-3 gap-3 mt-2">
                <div className="flex items-center gap-2.5 p-3 bg-white rounded-xl border border-slate-200 shadow-sm">
                  <div className="size-9 rounded-lg bg-epf-50 text-epf-600 flex items-center justify-center shrink-0">
                    <Truck className="size-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[12px] font-semibold text-slate-800 truncate">
                      Free Delivery
                    </p>
                    <p className="text-[11px] text-slate-500 truncate">
                      On orders over ৳2,000
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5 p-3 bg-white rounded-xl border border-slate-200 shadow-sm">
                  <div className="size-9 rounded-lg bg-epf-50 text-epf-600 flex items-center justify-center shrink-0">
                    <ShieldCheck className="size-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[12px] font-semibold text-slate-800 truncate">
                      Warranty
                    </p>
                    <p className="text-[11px] text-slate-500 truncate">
                      Official brand warranty
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5 p-3 bg-white rounded-xl border border-slate-200 shadow-sm">
                  <div className="size-9 rounded-lg bg-epf-50 text-epf-600 flex items-center justify-center shrink-0">
                    <RotateCcw className="size-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[12px] font-semibold text-slate-800 truncate">
                      Easy Return
                    </p>
                    <p className="text-[11px] text-slate-500 truncate">
                      7-day return policy
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Product Info */}
            <div className="flex flex-col">
              {/* Brand + category badges */}
              <div className="flex items-center gap-2 flex-wrap mb-3">
                {product.brand?.name && (
                  <Badge
                    variant="secondary"
                    className="rounded-full px-3 py-1 text-[11px] font-bold bg-slate-100 text-slate-700 border-0"
                  >
                    {product.brand.name}
                  </Badge>
                )}
                {product.category?.name && (
                  <Badge
                    variant="secondary"
                    className="rounded-full px-3 py-1 text-[11px] font-bold bg-epf-50 text-epf-700 border-0"
                  >
                    {product.category.name}
                  </Badge>
                )}
                {product.stock > 0 ? (
                  <Badge className="rounded-full px-3 py-1 text-[11px] font-bold bg-green-100 text-green-700 border-0 hover:bg-green-100">
                    <Check className="size-3" />
                    In Stock
                  </Badge>
                ) : (
                  <Badge
                    variant="destructive"
                    className="rounded-full px-3 py-1 text-[11px] font-bold"
                  >
                    Out of Stock
                  </Badge>
                )}
              </div>

              {/* Title */}
              <h1 className="text-[24px] font-bold text-slate-900 leading-tight">
                {product.name}
              </h1>

              {/* Rating + viewers row */}
              <div className="mt-3 flex items-center flex-wrap gap-x-4 gap-y-2">
                <StarRating
                  rating={product.rating}
                  count={product.reviewCount}
                />
                <Separator
                  orientation="vertical"
                  className="h-4 bg-slate-200"
                />
                <span className="text-[13px] text-slate-500">
                  {product.sold} sold
                </span>
                <Separator
                  orientation="vertical"
                  className="h-4 bg-slate-200"
                />
                <span className="flex items-center gap-1.5 text-[13px] text-epf-600 font-medium">
                  <Eye className="size-3.5" />
                  {viewers} people viewing
                </span>
              </div>

              {/* Price section */}
              <div className="mt-5 p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-baseline gap-3 flex-wrap">
                  <p className="text-[28px] font-bold text-epf-600 leading-none">
                    ৳{product.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                  {product.comparePrice && (
                    <p className="text-[16px] text-slate-400 line-through">
                      ৳
                      {product.comparePrice.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                      })}
                    </p>
                  )}
                  {discount > 0 && (
                    <Badge className="bg-epf-500 text-white border-0 rounded-full px-2.5 py-0.5 text-[11px] font-bold hover:bg-epf-500">
                      Save {discount}%
                    </Badge>
                  )}
                </div>
                <p className="text-[12px] text-slate-500 mt-2">
                  Inclusive of all taxes
                </p>
              </div>

              {/* Short description */}
              {product.description && (
                <p className="mt-4 text-[14px] text-slate-600 leading-relaxed line-clamp-3">
                  {product.description}
                </p>
              )}

              {/* Quantity + wishlist */}
              <div className="mt-5 flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                  <span className="text-[13px] font-medium text-slate-700">
                    Quantity:
                  </span>
                  <div className="flex items-center bg-white border border-slate-300 rounded-lg overflow-hidden">
                    <button
                      onClick={() => setQty(Math.max(1, qty - 1))}
                      disabled={qty <= 1}
                      className="w-10 h-10 flex items-center justify-center text-slate-600 hover:bg-slate-50 hover:text-epf-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="size-4" />
                    </button>
                    <span className="w-12 h-10 flex items-center justify-center text-[15px] font-semibold text-slate-900 border-x border-slate-200 tabular-nums">
                      {qty}
                    </span>
                    <button
                      onClick={() => setQty(Math.min(product.stock, qty + 1))}
                      disabled={qty >= product.stock}
                      className="w-10 h-10 flex items-center justify-center text-slate-600 hover:bg-slate-50 hover:text-epf-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      aria-label="Increase quantity"
                    >
                      <Plus className="size-4" />
                    </button>
                  </div>
                  <span className="text-[12px] text-slate-500">
                    {product.stock} available
                  </span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="mt-5 flex gap-3">
                <button
                  onClick={handleAddToCart}
                  disabled={product.stock === 0}
                  className="flex-1 h-12 bg-white border-2 border-slate-900 hover:bg-slate-50 text-slate-900 text-[15px] font-semibold rounded-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ShoppingCart className="size-5" />
                  Add to Cart
                </button>
                <button
                  onClick={handleBuyNow}
                  disabled={product.stock === 0}
                  className="flex-1 h-12 bg-epf-500 hover:bg-epf-600 text-white text-[15px] font-semibold rounded-lg flex items-center justify-center gap-2 transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Zap className="size-5" />
                  Buy Now
                </button>
                <button
                  onClick={handleWishlist}
                  className={`h-12 w-12 shrink-0 rounded-lg flex items-center justify-center transition-all border ${
                    wishlisted
                      ? "bg-epf-500 border-epf-500 text-white"
                      : "bg-white border-slate-300 text-slate-600 hover:text-epf-500 hover:border-epf-500"
                  }`}
                  aria-label="Add to wishlist"
                >
                  <Heart className={`size-5 ${wishlisted ? "fill-white" : ""}`} />
                </button>
              </div>

              {/* Message seller */}
              <button
                onClick={() => setChatOpen(true)}
                className="mt-3 text-[13px] text-epf-600 hover:text-epf-700 font-medium transition-colors self-start"
              >
                Ask about this product →
              </button>

              {/* Trust badges row (mobile — under buttons) */}
              <div className="lg:hidden mt-6 grid grid-cols-3 gap-2">
                <div className="flex flex-col items-center text-center p-3 bg-white rounded-xl border border-slate-200 shadow-sm">
                  <div className="size-8 rounded-lg bg-epf-50 text-epf-600 flex items-center justify-center mb-1.5">
                    <Truck className="size-4" />
                  </div>
                  <span className="text-[11px] text-slate-700 font-semibold">
                    Free Delivery
                  </span>
                </div>
                <div className="flex flex-col items-center text-center p-3 bg-white rounded-xl border border-slate-200 shadow-sm">
                  <div className="size-8 rounded-lg bg-epf-50 text-epf-600 flex items-center justify-center mb-1.5">
                    <ShieldCheck className="size-4" />
                  </div>
                  <span className="text-[11px] text-slate-700 font-semibold">
                    Warranty
                  </span>
                </div>
                <div className="flex flex-col items-center text-center p-3 bg-white rounded-xl border border-slate-200 shadow-sm">
                  <div className="size-8 rounded-lg bg-epf-50 text-epf-600 flex items-center justify-center mb-1.5">
                    <RotateCcw className="size-4" />
                  </div>
                  <span className="text-[11px] text-slate-700 font-semibold">
                    Easy Return
                  </span>
                </div>
              </div>

              {/* Meta section: SKU, category, tags */}
              <div className="mt-6 pt-5 border-t border-slate-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[13px]">
                  {product.sku && (
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500 min-w-[80px]">SKU:</span>
                      <span className="text-slate-800 font-medium">
                        {product.sku}
                      </span>
                    </div>
                  )}
                  {product.category?.name && (
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500 min-w-[80px]">
                        Category:
                      </span>
                      <Link
                        href={`/shop?category=${product.category.slug}`}
                        className="text-epf-600 hover:text-epf-700 font-medium"
                      >
                        {product.category.name}
                      </Link>
                    </div>
                  )}
                  {product.brand?.name && (
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500 min-w-[80px]">Brand:</span>
                      <span className="text-slate-800 font-medium">
                        {product.brand.name}
                      </span>
                    </div>
                  )}
                </div>

                {product.tags && product.tags.length > 0 && (
                  <div className="mt-3 flex items-center gap-2 flex-wrap">
                    <Tag className="size-3.5 text-slate-400" />
                    {product.tags.map((t) => (
                      <span
                        key={t}
                        className="text-[12px] text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Tabs Section */}
          <div className="mt-10 sm:mt-12">
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="bg-white border border-slate-200 rounded-xl p-1 h-auto w-full sm:w-fit flex justify-start shadow-sm">
                <TabsTrigger
                  value="description"
                  className="rounded-lg px-5 py-2.5 text-[14px] font-semibold data-[state=active]:bg-epf-500 data-[state=active]:text-white data-[state=active]:shadow-sm text-slate-600"
                >
                  Description
                </TabsTrigger>
                <TabsTrigger
                  value="reviews"
                  className="rounded-lg px-5 py-2.5 text-[14px] font-semibold data-[state=active]:bg-epf-500 data-[state=active]:text-white data-[state=active]:shadow-sm text-slate-600"
                >
                  Reviews ({product.reviewCount})
                </TabsTrigger>
                <TabsTrigger
                  value="related"
                  className="rounded-lg px-5 py-2.5 text-[14px] font-semibold data-[state=active]:bg-epf-500 data-[state=active]:text-white data-[state=active]:shadow-sm text-slate-600"
                >
                  Related Products
                </TabsTrigger>
              </TabsList>

              {/* Description Tab */}
              <TabsContent value="description" className="mt-6">
                <Card className="rounded-xl border-slate-200 shadow-sm">
                  <CardContent className="p-6">
                    <h3 className="text-[18px] font-bold text-slate-900 mb-4">
                      Product Description
                    </h3>
                    <p className="text-[14px] text-slate-600 leading-relaxed whitespace-pre-line">
                      {product.description ||
                        "No description available for this product yet."}
                    </p>

                    {/* Specs table */}
                    {Object.keys(specs).length > 0 && (
                      <>
                        <h4 className="text-[16px] font-bold text-slate-800 mt-6 mb-3">
                          Specifications
                        </h4>
                        <div className="border border-slate-200 rounded-xl overflow-hidden">
                          <table className="w-full text-[14px]">
                            <tbody>
                              {Object.entries(specs).map(([key, val], i) => (
                                <tr
                                  key={key}
                                  className={
                                    i % 2 === 0 ? "bg-slate-50" : "bg-white"
                                  }
                                >
                                  <td className="px-4 py-2.5 font-medium text-slate-500 w-1/3">
                                    {key}
                                  </td>
                                  <td className="px-4 py-2.5 text-slate-800">
                                    {val}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Reviews Tab */}
              <TabsContent value="reviews" className="mt-6">
                <Card className="rounded-xl border-slate-200 shadow-sm">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-6 mb-6 flex-wrap">
                      <div className="text-center">
                        <p className="text-[40px] font-bold text-slate-900 leading-none">
                          {product.rating.toFixed(1)}
                        </p>
                        <div className="flex items-center mt-2 justify-center">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`size-4 ${
                                i < Math.round(product.rating)
                                  ? "fill-amber-500 text-amber-500"
                                  : "fill-slate-200 text-slate-200"
                              }`}
                            />
                          ))}
                        </div>
                        <p className="text-[13px] text-slate-500 mt-1.5">
                          {product.reviewCount} reviews
                        </p>
                      </div>
                      <Separator
                        orientation="vertical"
                        className="h-16 bg-slate-200 hidden sm:block"
                      />
                      <div>
                        <Button
                          onClick={() =>
                            isAuthenticated
                              ? setShowReviewForm((v) => !v)
                              : toast.error("Please log in to write a review")
                          }
                          variant="outline"
                          className="border-slate-300 hover:border-epf-500 hover:text-epf-500 rounded-lg h-11 px-5 font-semibold"
                        >
                          Write a Review
                        </Button>
                      </div>
                    </div>

                    {showReviewForm && (
                      <div className="border border-slate-200 rounded-xl p-5 mb-6 bg-slate-50">
                        <h4 className="text-[15px] font-semibold text-slate-800 mb-3">
                          Your Review
                        </h4>
                        <div className="flex items-center gap-1 mb-3">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => setReviewRating(i + 1)}
                              aria-label={`${i + 1} star`}
                              className="hover:scale-110 transition-transform"
                            >
                              <Star
                                className={`size-7 ${
                                  i < reviewRating
                                    ? "fill-amber-500 text-amber-500"
                                    : "fill-slate-200 text-slate-200"
                                }`}
                              />
                            </button>
                          ))}
                          <span className="text-[13px] text-slate-500 ml-2">
                            {reviewRating}/5
                          </span>
                        </div>
                        <input
                          value={reviewTitle}
                          onChange={(e) => setReviewTitle(e.target.value)}
                          placeholder="Review title"
                          className="w-full h-11 px-3.5 mb-3 text-[14px] bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-epf-500 focus:ring-2 focus:ring-epf-100 transition-all"
                        />
                        <textarea
                          value={reviewComment}
                          onChange={(e) => setReviewComment(e.target.value)}
                          placeholder="Share your experience with this product…"
                          rows={3}
                          className="w-full px-3.5 py-2.5 mb-3 text-[14px] bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-epf-500 focus:ring-2 focus:ring-epf-100 transition-all resize-none"
                        />
                        <Button
                          onClick={submitReview}
                          disabled={submittingReview}
                          className="bg-epf-500 hover:bg-epf-600 text-white rounded-lg h-11 px-5 font-semibold"
                        >
                          {submittingReview ? (
                            <>
                              <Loader2 className="size-4 animate-spin" />
                              Submitting…
                            </>
                          ) : (
                            "Submit Review"
                          )}
                        </Button>
                      </div>
                    )}

                    {reviews.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <Star className="size-10 text-slate-200 mb-3" />
                        <p className="text-[15px] font-medium text-slate-500">
                          No reviews yet
                        </p>
                        <p className="text-[13px] text-slate-400 mt-1">
                          Be the first to share your experience
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-5">
                        {reviews.map((rv) => (
                          <div
                            key={rv.id}
                            className="border-b border-slate-100 pb-5 last:border-0"
                          >
                            <div className="flex items-center gap-2 mb-2">
                              <div className="flex">
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`size-3.5 ${
                                      i < rv.rating
                                        ? "fill-amber-500 text-amber-500"
                                        : "fill-slate-200 text-slate-200"
                                    }`}
                                  />
                                ))}
                              </div>
                              <span className="text-[14px] font-semibold text-slate-800">
                                {rv.title}
                              </span>
                            </div>
                            <p className="text-[14px] text-slate-600 leading-relaxed">
                              {rv.comment}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <div className="size-6 rounded-full bg-epf-500 text-white text-[11px] font-bold flex items-center justify-center">
                                {(rv.user?.name || "C").charAt(0).toUpperCase()}
                              </div>
                              <p className="text-[12px] text-slate-500">
                                {rv.user?.name || "Customer"}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Related Products Tab */}
              <TabsContent value="related" className="mt-6">
                <Card className="rounded-xl border-slate-200 shadow-sm">
                  <CardContent className="p-6">
                    <RelatedProducts
                      categoryId={product.category?.id}
                      currentId={product.id}
                    />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
      <div className="mt-auto">
        <Footer />
      </div>
      <ChatWidget />
      <BackToTopButton />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Related Products (loaded when Related tab is active)               */
/* ------------------------------------------------------------------ */
function RelatedProducts({
  categoryId,
  currentId,
}: {
  categoryId?: string;
  currentId: string;
}) {
  const [items, setItems] = useState<
    Array<{
      id: string;
      name: string;
      price: number;
      comparePrice: number | null;
      images: string[];
      rating: number;
      slug?: string;
    }>
  >([]);
  const [loading, setLoading] = useState(true);
  const hasFetched = useRef(false);

  useEffect(() => {
    if (!categoryId) {
      return;
    }
    if (hasFetched.current) {return;}
    hasFetched.current = true;
    apiFetch<{
      data: {
        data?: Array<{
          id: string;
          name: string;
          price: number;
          comparePrice: number | null;
          images: string[];
          rating: number;
          slug?: string;
        }>;
        products?: Array<{
          id: string;
          name: string;
          price: number;
          comparePrice: number | null;
          images: string[];
          rating: number;
          slug?: string;
        }>;
      };
    }>(`/api/products?categoryId=${categoryId}&limit=6`)
      .then((r) => {
        const list = r?.data?.data ?? r?.data?.products ?? [];
        setItems(list.filter((p) => p.id !== currentId).slice(0, 4));
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [categoryId, currentId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="size-6 animate-spin text-epf-500" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Package className="size-10 text-slate-200 mb-3" />
        <p className="text-[15px] font-medium text-slate-500">
          No related products found
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {items.map((p) => {
        const d = p.comparePrice
          ? Math.round(((p.comparePrice - p.price) / p.comparePrice) * 100)
          : 0;
        return (
          <Link
            key={p.id}
            href={`/product/${p.id}`}
            className="group block bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all"
          >
            <div className="aspect-square bg-slate-50 overflow-hidden relative">
              {p.images?.[0] ? (
                <img
                  src={p.images[0]}
                  alt={p.name}
                  className="w-full h-full object-contain p-3 group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="size-10 text-slate-200" />
                </div>
              )}
              {d > 0 && (
                <span className="absolute top-2 left-2 bg-epf-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  -{d}%
                </span>
              )}
            </div>
            <div className="p-3">
              <h4 className="text-[13px] font-medium text-slate-800 line-clamp-2 mb-2 min-h-[34px]">
                {p.name}
              </h4>
              <div className="flex items-baseline gap-1.5">
                <span className="text-[14px] font-bold text-epf-600">
                  ৳{p.price.toLocaleString()}
                </span>
                {p.comparePrice && (
                  <span className="text-[11px] text-slate-400 line-through">
                    ৳{p.comparePrice.toLocaleString()}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-0.5 mt-1.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`size-3 ${
                      i < Math.round(p.rating || 0)
                        ? "fill-amber-500 text-amber-500"
                        : "fill-slate-200 text-slate-200"
                    }`}
                  />
                ))}
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
