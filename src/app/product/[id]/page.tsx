"use client";

import { useState, useEffect } from "react";
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
  sku?: string;
}


/* ------------------------------------------------------------------ */
/*  Star Rating                                                        */
/* ------------------------------------------------------------------ */
function StarRating({ rating, count }: { rating: number; count: number }) {
  const safeRating = typeof rating === 'number' ? rating : 0;
  
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={`size-4 ${
              i < Math.round(safeRating)
                ? "fill-[#F59E0B] text-[#F59E0B]"
                : "text-gray-300"
            }`}
          />
        ))}
      </div>
      <span className="text-[13px] text-gray-500">
        {safeRating.toFixed(1)}/5.0 ({count} reviews)
      </span>
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
  const [activeTab, setActiveTab] = useState<"description" | "reviews" | "queries">("description");
  const [specs, setSpecs] = useState<Record<string, string>>({});
  const [viewers] = useState(() => Math.floor(Math.random() * 20) + 3);

  // Reviews
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [reviews, setReviews] = useState<Array<{ id: string; rating: number; title: string; comment: string; createdAt: string; user?: { name: string } }>>([]);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState("");
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    if (!productId) return;
    apiFetch<{ data: { data: typeof reviews } }>(`/api/reviews?productId=${productId}`)
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
        body: JSON.stringify({ productId, rating: reviewRating, title: reviewTitle, comment: reviewComment }),
      });
      toast.success("Review submitted", { description: "It will appear once approved." });
      setShowReviewForm(false);
      setReviewTitle("");
      setReviewComment("");
      setReviewRating(5);
    } catch (err: any) {
      toast.error("Could not submit review", { description: err?.message || "Please try again." });
    } finally {
      setSubmittingReview(false);
    }
  };

  useEffect(() => {
    if (!productId) return;
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
            setSpecs(typeof rawSpecs === "string" ? JSON.parse(rawSpecs) : (rawSpecs && typeof rawSpecs === "object" ? rawSpecs as Record<string, string> : {}));
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

  const discount = product?.comparePrice ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100) : 0;
  const productImages = product?.images?.length ? product.images : [];

  const handleAddToCart = () => {
    if (!product) return;
    addItem({
      productId: product.id,
      productName: product.name,
      productImage: product.images?.[0] || "",
      price: product.price,
      quantity: qty,
    });
    toast.success("Added to cart!");
  };

  const handleBuyNow = () => {
    if (!product) return;
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
    setActiveImage((prev) => (prev < productImages.length - 1 ? prev + 1 : 0));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-[#F9FAFB]">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="size-8 animate-spin text-[#1E1E1E]" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col bg-[#F9FAFB]">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Package className="size-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-800 mb-2">Product Not Found</h2>
            <Link href="/" className="text-[#1E1E1E] hover:underline text-sm">Back to Home</Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F9FAFB]">
      <Header />
      <CartDrawer />
      <CheckoutDialog />
      <main className="flex-1">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-200">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 py-3">
          <nav className="flex items-center gap-1.5 text-[13px] text-gray-500">
            <Link href="/" className="flex items-center gap-1 hover:text-[#1E1E1E] transition-colors">
              <Home className="size-3.5" />
              Home
            </Link>
            <ChevronRightIcon className="size-3" />
            <Link href="/shop" className="hover:text-[#1E1E1E] transition-colors">Shop</Link>
            <ChevronRightIcon className="size-3" />
            <span className="text-gray-800 font-medium truncate max-w-[200px]">{product.name}</span>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left: Image Gallery */}
          <div className="flex gap-3">
            {/* Thumbnails */}
            <div className="hidden sm:flex flex-col gap-2 w-[72px] shrink-0">
              {productImages.length > 0 ? (
                productImages.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImage(i)}
                    className={`size-[72px] rounded border-2 overflow-hidden transition-all ${
                      i === activeImage
                        ? "border-[#1E1E1E]"
                        : "border-gray-200 hover:border-gray-400"
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                  </button>
                ))
              ) : (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className={`size-[72px] rounded border-2 flex items-center justify-center bg-gray-50 ${i === 0 ? "border-[#1E1E1E]" : "border-gray-200"}`}>
                    <Package className="size-6 text-gray-300" />
                  </div>
                ))
              )}
            </div>

            {/* Main Image */}
            <div className="flex-1 relative">
              <div className="aspect-square bg-white rounded-lg border border-gray-200 flex items-center justify-center overflow-hidden group">
                {productImages.length > 0 ? (
                  <img
                    src={productImages[activeImage]}
                    alt={product.name}
                    className="w-full h-full object-contain p-6 transition-transform duration-300 group-hover:scale-105"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                ) : (
                  <Package className="size-24 text-gray-200" />
                )}

                {/* Discount badge */}
                {discount > 0 && (
                  <span className="absolute top-3 left-3 bg-[#DC2626] text-white text-[12px] font-bold px-2 py-1 rounded">
                    -{discount}%
                  </span>
                )}

                {/* Action icons */}
                <div className="absolute top-3 right-3 flex flex-col gap-2">
                  <button className="w-9 h-9 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-colors shadow-sm">
                    <Heart className="size-4 text-gray-600" />
                  </button>
                  <button className="w-9 h-9 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-colors shadow-sm">
                    <Share2 className="size-4 text-gray-600" />
                  </button>
                </div>

                {/* Nav arrows */}
                {productImages.length > 1 && (
                  <>
                    <button
                      onClick={handlePrevImage}
                      className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-colors shadow-sm opacity-0 group-hover:opacity-100"
                    >
                      <ChevronLeft className="size-4 text-gray-700" />
                    </button>
                    <button
                      onClick={handleNextImage}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-colors shadow-sm opacity-0 group-hover:opacity-100"
                    >
                      <ChevronRight className="size-4 text-gray-700" />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Right: Product Info */}
          <div className="flex flex-col">
            {/* Title */}
            <h1 className="text-[22px] font-bold text-gray-900 leading-tight">
              {product.name}
            </h1>

            {/* Brand / Category */}
            {product.category?.name && (
              <div className="mt-1.5 flex items-center gap-2">
                <span className="text-[14px] text-gray-500">Brand: {product.category.name}</span>
                <span className="text-[14px] text-[#1E1E1E] underline cursor-pointer hover:text-[#333]">Ask about this product</span>
              </div>
            )}

            {/* Rating */}
            <div className="mt-3">
              <StarRating rating={product.rating} count={product.reviewCount} />
            </div>

            {/* Viewers */}
            <div className="flex items-center gap-1.5 mt-1.5 text-[13px] text-gray-400">
              <Eye className="size-3.5" />
              <span>{viewers} people are viewing right now</span>
            </div>

            {/* Price */}
            <div className="mt-5">
              <div className="flex items-baseline gap-2">
                <p className="text-[26px] font-bold text-gray-900">
                  ৳{product.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
                {product.comparePrice && (
                  <p className="text-[16px] text-gray-400 line-through">
                    ৳{product.comparePrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                )}
                {discount > 0 && (
                  <span className="bg-[#DC2626] text-white text-[12px] font-bold px-2 py-0.5 rounded">
                    -{discount}%
                  </span>
                )}
              </div>
              <p className="text-[13px] text-gray-400 mt-1">{product.sold} sold</p>
            </div>

            {/* Quantity */}
            <div className="flex items-center gap-3 mt-5">
              <span className="text-[14px] font-medium text-gray-700">Quantity:</span>
              <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                <button
                  onClick={() => setQty(Math.max(1, qty - 1))}
                  className="w-9 h-9 flex items-center justify-center hover:bg-gray-100 transition-colors"
                >
                  <Minus className="size-3.5" />
                </button>
                <span className="w-10 h-9 flex items-center justify-center text-[14px] font-medium border-x border-gray-300 tabular-nums">
                  {qty}
                </span>
                <button
                  onClick={() => setQty(Math.min(product.stock, qty + 1))}
                  className="w-9 h-9 flex items-center justify-center hover:bg-gray-100 transition-colors"
                >
                  <Plus className="size-3.5" />
                </button>
              </div>
              <span className="text-[13px] text-gray-400">Stock: {product.stock}</span>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 mt-5">
              <button
                onClick={handleAddToCart}
                className="flex-1 h-12 bg-white hover:bg-gray-50 text-[#1E1E1E] text-[15px] font-bold rounded-lg flex items-center justify-center gap-2 transition-colors border-2 border-[#1E1E1E] cursor-pointer"
              >
                <ShoppingCart className="size-5" />
                Add to Cart
              </button>
              <button
                onClick={handleBuyNow}
                className="flex-1 h-12 bg-[#1E1E1E] hover:bg-[#333333] text-white text-[15px] font-bold rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Zap className="size-5" />
                Buy Now
              </button>
            </div>

            {/* In-house badge + Message Seller */}
            <div className="flex items-center gap-3 mt-4">
              <span className="bg-[#1E1E1E] text-white text-[11px] font-semibold px-2.5 py-1 rounded">
                Inhouse Product
              </span>
              <button
                onClick={() => setChatOpen(true)}
                className="text-[13px] text-[#1E1E1E] underline cursor-pointer hover:text-[#333] transition-colors"
              >
                Message Seller
              </button>
            </div>

            {/* Cash on delivery */}
            <div className="flex items-center gap-2 mt-3 text-[13px] text-gray-600">
              <Truck className="size-4 text-[#1E1E1E]" />
              <span>Cash on delivery available</span>
            </div>

            {/* Features */}
            <div className="grid grid-cols-3 gap-3 mt-6">
              <div className="flex flex-col items-center text-center p-3 bg-white rounded-lg border border-gray-200">
                <Truck className="size-5 text-[#1E1E1E] mb-1.5" />
                <span className="text-[12px] text-gray-600 font-medium">Free Delivery</span>
              </div>
              <div className="flex flex-col items-center text-center p-3 bg-white rounded-lg border border-gray-200">
                <ShieldCheck className="size-5 text-[#1E1E1E] mb-1.5" />
                <span className="text-[12px] text-gray-600 font-medium">Warranty</span>
              </div>
              <div className="flex flex-col items-center text-center p-3 bg-white rounded-lg border border-gray-200">
                <RotateCcw className="size-5 text-[#1E1E1E] mb-1.5" />
                <span className="text-[12px] text-gray-600 font-medium">Easy Return</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Section */}
        <div className="mt-10">
          <div className="flex gap-6 border-b border-gray-200">
            {[
              { key: "description" as const, label: "Description" },
              { key: "reviews" as const, label: `Reviews & Ratings (${product.reviewCount})` },
              { key: "queries" as const, label: "Product Queries (0)" },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`pb-3 text-[15px] font-medium transition-colors relative ${
                  activeTab === tab.key
                    ? "text-[#1E1E1E]"
                    : "text-gray-400 hover:text-gray-600"
                }`}
              >
                {tab.label}
                {activeTab === tab.key && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1E1E1E]" />
                )}
              </button>
            ))}
          </div>

          <div className="mt-6">
            {/* Description Tab */}
            {activeTab === "description" && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-[18px] font-bold text-gray-900 mb-4">{product.name}</h3>
                <p className="text-[14px] text-gray-600 leading-relaxed whitespace-pre-line">
                  {product.description || "No description available for this product yet."}
                </p>

                {/* Specs table */}
                {Object.keys(specs).length > 0 && (
                  <>
                    <h4 className="text-[16px] font-bold text-gray-800 mt-6 mb-3">Specifications</h4>
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      <table className="w-full text-[14px]">
                        <tbody>
                          {Object.entries(specs).map(([key, val], i) => (
                            <tr key={key} className={i % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                              <td className="px-4 py-2.5 font-medium text-gray-500 w-1/3">{key}</td>
                              <td className="px-4 py-2.5 text-gray-800">{val}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Reviews Tab */}
            {activeTab === "reviews" && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center gap-4 mb-6">
                  <div className="text-center">
                    <p className="text-[36px] font-bold text-gray-900">{product.rating.toFixed(1)}</p>
                    <div className="flex items-center mt-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`size-4 ${
                            i < Math.round(product.rating)
                              ? "fill-[#F59E0B] text-[#F59E0B]"
                              : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-[13px] text-gray-500 mt-1">Total Review {product.reviewCount}</p>
                  </div>
                  <div className="border-l border-gray-200 pl-6">
                    <button
                      onClick={() => (isAuthenticated ? setShowReviewForm((v) => !v) : toast.error("Please log in to write a review"))}
                      className="h-10 px-5 border-2 border-[#1E1E1E] text-[#1E1E1E] text-[14px] font-medium rounded-lg hover:bg-[#1E1E1E] hover:text-white transition-colors"
                    >
                      Rate this Product
                    </button>
                  </div>
                </div>

                {showReviewForm && (
                  <div className="border border-gray-200 rounded-lg p-4 mb-6 bg-gray-50">
                    <div className="flex items-center gap-1 mb-3">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <button key={i} type="button" onClick={() => setReviewRating(i + 1)} aria-label={`${i + 1} star`}>
                          <Star className={`size-6 ${i < reviewRating ? "fill-[#F59E0B] text-[#F59E0B]" : "text-gray-300"}`} />
                        </button>
                      ))}
                    </div>
                    <input
                      value={reviewTitle}
                      onChange={(e) => setReviewTitle(e.target.value)}
                      placeholder="Review title"
                      className="w-full h-10 px-3 mb-3 text-[14px] border border-gray-200 rounded-lg focus:outline-none focus:border-[#0EA5E9]"
                    />
                    <textarea
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      placeholder="Share your experience with this product…"
                      rows={3}
                      className="w-full px-3 py-2 mb-3 text-[14px] border border-gray-200 rounded-lg focus:outline-none focus:border-[#0EA5E9]"
                    />
                    <button
                      onClick={submitReview}
                      disabled={submittingReview}
                      className="h-10 px-5 bg-[#0EA5E9] hover:bg-[#0284C7] text-white text-[14px] font-semibold rounded-lg transition-colors disabled:opacity-60"
                    >
                      {submittingReview ? "Submitting…" : "Submit Review"}
                    </button>
                  </div>
                )}

                {reviews.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <Star className="size-10 text-gray-300 mb-3" />
                    <p className="text-[15px] text-gray-500">No reviews found!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {reviews.map((rv) => (
                      <div key={rv.id} className="border-b border-gray-100 pb-4 last:border-0">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="flex">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star key={i} className={`size-3.5 ${i < rv.rating ? "fill-[#F59E0B] text-[#F59E0B]" : "text-gray-300"}`} />
                            ))}
                          </div>
                          <span className="text-[13px] font-semibold text-gray-800">{rv.title}</span>
                        </div>
                        <p className="text-[14px] text-gray-600">{rv.comment}</p>
                        <p className="text-[12px] text-gray-400 mt-1">{rv.user?.name || "Customer"}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Queries Tab */}
            {activeTab === "queries" && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <p className="text-[14px] text-gray-500 mb-6">
                  <span className="text-[#1E1E1E] underline cursor-pointer">Login or Register</span> to submit your questions to seller
                </p>
                <h4 className="text-[16px] font-bold text-gray-800 mb-4">Other Questions</h4>
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <Package className="size-10 text-gray-300 mb-3" />
                  <p className="text-[15px] text-gray-500">No queries have been asked to the seller yet</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      </main>
      <div className="mt-auto"><Footer /></div>
      <ChatWidget />
      <BackToTopButton />
    </div>
  );
}
