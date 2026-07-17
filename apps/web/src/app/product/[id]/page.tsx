"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronRight as CrumbArrow,
  Copy,
  CreditCard,
  Eye,
  Headphones,
  Heart,
  Home,
  Minus,
  Package,
  Plus,
  RotateCcw,
  Share2,
  ShieldCheck,
  ShoppingCart,
  Star,
  Tag,
  Truck,
} from "lucide-react";
import { toast } from "sonner";
import Header from "@/components/epf/Header";
import Footer from "@/components/epf/Footer";
import CartDrawer from "@/components/epf/CartDrawer";
import CheckoutDialog from "@/components/epf/CheckoutDialog";
import ChatWidget from "@/components/epf/ChatWidget";
import BackToTopButton from "@/components/epf/BackToTopButton";
import { apiFetch } from "@/lib/api";
import { useAuthStore, useCartStore, useUIStore } from "@/store";
import { cn } from "@/lib/utils";

interface ProductVariant {
  id: string;
  name?: string | null;
  value?: string | null;
  label?: string | null;
  attributes?: string | Record<string, string> | null;
  price?: number | null;
  stock?: number | null;
}

interface ProductReview {
  id: string;
  rating: number;
  title?: string | null;
  comment: string;
  createdAt: string;
  user?: { name: string };
}

interface Product {
  id: string;
  name: string;
  nameBn?: string | null;
  description: string;
  descriptionBn?: string | null;
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
  sku?: string | null;
  tags?: string[] | null;
  variants?: ProductVariant[];
}

interface RelatedProduct {
  id: string;
  name: string;
  slug?: string | null;
  price: number;
  comparePrice: number | null;
  images: string[];
  rating: number;
  reviewCount?: number;
  stock?: number;
}

const featureItems = [
  { icon: Headphones, title: "24/7 SUPPORT", sub: "Support every time" },
  { icon: CreditCard, title: "ACCEPT PAYMENT", sub: "Visa, Paypal, Master" },
  { icon: ShieldCheck, title: "SECURE PAYMENT", sub: "100% secured" },
  { icon: Truck, title: "FREE SHIPPING", sub: "Order over $100" },
  { icon: CalendarDays, title: "30 DAYS RETURN", sub: "30 days guarantee" },
];

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function StarRating({ rating, count }: { rating: number; count?: number }) {
  const safeRating = Number(rating || 0);
  return <div className="flex items-center gap-1.5"><span className="flex items-center gap-0.5">{Array.from({ length: 5 }).map((_, index) => <Star key={index} className={cn("h-3 w-3", index < Math.round(safeRating) ? "fill-amber-400 text-amber-400" : "fill-slate-200 text-slate-200")} />)}</span><span className="text-[10px] text-slate-400">{safeRating.toFixed(1)} {typeof count === "number" && `(${count} Review${count === 1 ? "" : "s"})`}</span></div>;
}

function FeatureRail() {
  return <aside className="space-y-4 pt-1">{featureItems.map(({ icon: Icon, title, sub }) => <div key={title} className="flex items-start gap-2"><Icon className="mt-0.5 h-4 w-4 shrink-0 text-slate-800" /><div><p className="text-[10px] font-semibold text-slate-800">{title}</p><p className="mt-0.5 text-[9px] text-slate-400">{sub}</p></div></div>)}</aside>;
}

function ProductTabs({ product, specs, reviews, activeTab, setActiveTab, isAuthenticated, showReviewForm, setShowReviewForm, reviewRating, setReviewRating, reviewTitle, setReviewTitle, reviewComment, setReviewComment, submittingReview, submitReview }: {
  product: Product;
  specs: Record<string, string>;
  reviews: ProductReview[];
  activeTab: string;
  setActiveTab: (value: string) => void;
  isAuthenticated: boolean;
  showReviewForm: boolean;
  setShowReviewForm: (value: boolean) => void;
  reviewRating: number;
  setReviewRating: (value: number) => void;
  reviewTitle: string;
  setReviewTitle: (value: string) => void;
  reviewComment: string;
  setReviewComment: (value: string) => void;
  submittingReview: boolean;
  submitReview: () => void;
}) {
  const tabs = [{ id: "description", label: "Description" }, { id: "specifications", label: "Specification" }, { id: "reviews", label: `Reviews (${product.reviewCount || 0})` }];
  return <section className="border-t border-slate-200"><div className="flex items-center justify-center gap-7 border-b border-slate-200">{tabs.map((tab) => <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)} className={cn("relative py-3 text-[12px] font-medium text-slate-500 hover:text-slate-900", activeTab === tab.id && "text-slate-900 after:absolute after:bottom-[-1px] after:left-0 after:right-0 after:h-px after:bg-slate-800")}>{tab.label}</button>)}</div><div className="py-6 text-[12px] leading-6 text-slate-600">{activeTab === "description" && <div><h2 className="mb-3 text-[16px] font-semibold text-slate-900">About this item</h2><ul className="list-disc space-y-1 pl-4">{(product.description || "No description available for this product yet.").split(/\r?\n/).map((line) => line.replace(/^[•\-*]\s*/, "").trim()).filter(Boolean).map((line, index) => <li key={`${index}-${line}`}>{line}</li>)}</ul></div>}{activeTab === "specifications" && <div><h2 className="mb-3 text-[16px] font-semibold text-slate-900">Product specifications</h2>{Object.keys(specs).length > 0 ? <div className="overflow-hidden border border-slate-200"><table className="w-full text-left text-[11px]"><tbody>{Object.entries(specs).map(([key, value], index) => <tr key={key} className={index % 2 === 0 ? "bg-slate-50" : "bg-white"}><td className="w-1/3 px-3 py-2 font-medium text-slate-500">{key}</td><td className="px-3 py-2 text-slate-800">{value}</td></tr>)}</tbody></table></div> : <p>No specifications available for this product.</p>}</div>}{activeTab === "reviews" && <ReviewPanel reviews={reviews} product={product} isAuthenticated={isAuthenticated} showReviewForm={showReviewForm} setShowReviewForm={setShowReviewForm} reviewRating={reviewRating} setReviewRating={setReviewRating} reviewTitle={reviewTitle} setReviewTitle={setReviewTitle} reviewComment={reviewComment} setReviewComment={setReviewComment} submittingReview={submittingReview} submitReview={submitReview} />}</div></section>;
}

function ReviewPanel({ reviews, product, isAuthenticated, showReviewForm, setShowReviewForm, reviewRating, setReviewRating, reviewTitle, setReviewTitle, reviewComment, setReviewComment, submittingReview, submitReview }: { reviews: ProductReview[]; product: Product; isAuthenticated: boolean; showReviewForm: boolean; setShowReviewForm: (value: boolean) => void; reviewRating: number; setReviewRating: (value: number) => void; reviewTitle: string; setReviewTitle: (value: string) => void; reviewComment: string; setReviewComment: (value: string) => void; submittingReview: boolean; submitReview: () => void }) {
  return <div><div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-5"><div><p className="text-3xl font-semibold text-slate-900">{Number(product.rating || 0).toFixed(1)}</p><StarRating rating={product.rating} count={product.reviewCount} /></div><button type="button" onClick={() => { if (!isAuthenticated) { toast.error("Please log in to write a review"); return; } setShowReviewForm(!showReviewForm); }} className="border border-slate-300 px-4 py-2 text-[11px] font-semibold text-slate-700 hover:border-epf-500 hover:text-epf-600">Write a Review</button></div>{showReviewForm && <div className="mt-5 border border-slate-200 bg-slate-50 p-4"><div className="mb-3 flex items-center gap-1">{Array.from({ length: 5 }).map((_, index) => <button type="button" key={index} onClick={() => setReviewRating(index + 1)} aria-label={`${index + 1} star`}><Star className={cn("h-5 w-5", index < reviewRating ? "fill-amber-400 text-amber-400" : "fill-slate-200 text-slate-200")} /></button>)}</div><input value={reviewTitle} onChange={(event) => setReviewTitle(event.target.value)} placeholder="Review title" className="mb-2 h-9 w-full border border-slate-200 bg-white px-3 text-xs outline-none focus:border-epf-500" /><textarea value={reviewComment} onChange={(event) => setReviewComment(event.target.value)} placeholder="Share your experience" rows={3} className="mb-2 w-full resize-none border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-epf-500" /><button type="button" disabled={submittingReview} onClick={submitReview} className="bg-epf-500 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50">{submittingReview ? "Submitting…" : "Submit Review"}</button></div>}{reviews.length === 0 ? <div className="py-10 text-center"><Star className="mx-auto h-8 w-8 text-slate-200" /><p className="mt-2 text-xs text-slate-500">No reviews yet</p></div> : <div className="mt-5 space-y-4">{reviews.map((review) => <div key={review.id} className="border-b border-slate-100 pb-4 last:border-0"><div className="flex items-center gap-2"><StarRating rating={review.rating} /><span className="font-medium text-slate-800">{review.title}</span></div><p className="mt-2">{review.comment}</p><p className="mt-1 text-[10px] text-slate-400">{review.user?.name || "Customer"} · {formatDate(review.createdAt)}</p></div>)}</div>}</div>;
}

export default function ProductDetailPage() {
  const params = useParams<{ id: string }>();
  const productId = params.id;
  const addItem = useCartStore((state) => state.addItem);
  const { setChatOpen, setCartOpen } = useUIStore();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<RelatedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState("description");
  const [wishlisted, setWishlisted] = useState(false);
  const [specs, setSpecs] = useState<Record<string, string>>({});
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState("");
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    if (!productId) return;
    setLoading(true);
    setActiveImage(0);
    setQuantity(1);
    apiFetch<{ data: { product: Product; related?: RelatedProduct[] } }>(`/api/products/${productId}`).then((response) => {
      const nextProduct = response.data?.product || null;
      setProduct(nextProduct);
      setRelated(response.data?.related || []);
      if (nextProduct) {
        try {
          const value = nextProduct.specs;
          setSpecs(typeof value === "string" ? JSON.parse(value) : value && typeof value === "object" ? value : {});
        } catch { setSpecs({}); }
      }
    }).catch(() => { setProduct(null); setRelated([]); }).finally(() => setLoading(false));
    apiFetch<{ data: { data: ProductReview[] } }>(`/api/reviews?productId=${productId}`).then((response) => setReviews(response.data?.data || [])).catch(() => setReviews([]));
  }, [productId]);

  const images = product?.images?.filter(Boolean) || [];
  const discount = product?.comparePrice && product.comparePrice > product.price ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100) : 0;
  const variantGroups = useMemo(() => {
    const groups = new Map<string, Set<string>>();
    (product?.variants || []).forEach((variant) => {
      let attributes: Record<string, string> = {};
      try {
        const raw = typeof variant.attributes === "string" ? JSON.parse(variant.attributes) : variant.attributes;
        if (raw && typeof raw === "object") attributes = raw as Record<string, string>;
      } catch { attributes = {}; }
      Object.entries(attributes).forEach(([key, value]) => {
        if (!groups.has(key)) groups.set(key, new Set<string>());
        groups.get(key)?.add(String(value));
      });
    });
    return Array.from(groups.entries()).map(([key, values]) => [key, Array.from(values)] as const);
  }, [product?.variants]);

  const addToCart = () => {
    if (!product || product.stock <= 0) return;
    addItem({ itemType: "PRODUCT", productId: product.id, productName: product.name, productImage: images[0] || "", price: Number(product.price), quantity, variantLabel: variantGroups.map(([group, values]) => `${group}: ${values[0]}`).join(" · ") });
    toast.success("Added to cart", { description: `${quantity} × ${product.name}` });
    setCartOpen(true);
  };
  const handleWishlist = async () => {
    if (!product) return;
    if (!isAuthenticated) { toast.error("Please login to save favorites"); return; }
    try { await apiFetch("/api/wishlist", { method: "POST", body: JSON.stringify({ productId: product.id }) }); setWishlisted(true); toast.success("Added to wishlist"); } catch (error) { toast.error(error instanceof Error ? error.message : "Failed to add to wishlist"); }
  };
  const handleShare = async () => { await navigator.clipboard?.writeText(window.location.href); toast.success("Link copied"); };
  const submitReview = async () => {
    if (!isAuthenticated || !product) { toast.error("Please log in to write a review"); return; }
    setSubmittingReview(true);
    try { await apiFetch("/api/reviews", { method: "POST", body: JSON.stringify({ productId: product.id, rating: reviewRating, title: reviewTitle, comment: reviewComment }) }); toast.success("Review submitted", { description: "It will appear once approved." }); setShowReviewForm(false); setReviewTitle(""); setReviewComment(""); } catch (error) { toast.error(error instanceof Error ? error.message : "Could not submit review"); } finally { setSubmittingReview(false); }
  };

  if (loading) return <StatePage loading />;
  if (!product) return <StatePage />;

  return <div className="min-h-screen bg-white text-slate-900"><Header /><main><div className="mx-auto max-w-[1400px] px-4 py-4 sm:px-10 sm:py-5"><nav className="mb-5 flex items-center gap-1.5 text-[10px] text-slate-400"><Link href="/" className="inline-flex items-center gap-1 hover:text-epf-600"><Home className="h-3 w-3" /> Home</Link><CrumbArrow className="h-3 w-3" /><Link href="/shop" className="hover:text-epf-600">Shop</Link>{product.category && <><CrumbArrow className="h-3 w-3" /><Link href={`/shop?category=${product.category.slug}`} className="hover:text-epf-600">{product.category.name}</Link></>}<CrumbArrow className="h-3 w-3" /><span className="truncate text-slate-700">{product.name}</span></nav>
<div className="grid gap-5 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6 lg:grid-cols-[285px_minmax(0,1fr)_165px]"><Gallery images={images} name={product.name} activeImage={activeImage} setActiveImage={setActiveImage} discount={discount} onShare={handleShare} onWishlist={handleWishlist} wishlisted={wishlisted} /><section className="min-w-0"><div className="flex flex-wrap items-center gap-3 text-[10px] text-slate-400"><StarRating rating={product.rating} count={product.reviewCount} /><span className="text-slate-300">|</span><span className={product.stock > 0 ? "text-emerald-600" : "text-red-500"}>{product.stock > 0 ? "In stock" : "Out of stock"}</span>{product.sold > 0 && <><span className="text-slate-300">|</span><span>{product.sold} sold</span></>}</div><h1 className="mt-2 text-[21px] font-semibold leading-7 text-slate-900">{product.name}</h1><div className="mt-3 flex flex-wrap gap-4 text-[10px] text-slate-400"><button type="button" onClick={handleWishlist} className="inline-flex items-center gap-1 hover:text-epf-600"><Heart className={cn("h-3 w-3", wishlisted && "fill-epf-500 text-epf-500")} /> Wishlist</button><button type="button" onClick={() => toast.info("Compare is available from the shop page")} className="inline-flex items-center gap-1 hover:text-epf-600"><RotateCcw className="h-3 w-3" /> Compare</button></div><div className="my-4 border-t border-slate-200" /><div className="flex items-baseline gap-3"><span className="text-[20px] font-semibold text-slate-900">৳{Number(product.price).toLocaleString()}</span>{product.comparePrice && <del className="text-[13px] text-slate-400">৳{Number(product.comparePrice).toLocaleString()}</del>}{discount > 0 && <span className="bg-epf-500 px-1.5 py-0.5 text-[9px] font-bold text-white">-{discount}%</span>}</div><p className="mt-1 text-[10px] text-slate-400">Inclusive of all taxes</p>{variantGroups.length > 0 && <div className="mt-4 space-y-3">{variantGroups.map(([group, values]) => <div key={group}><p className="text-[11px] font-medium text-slate-800">{group}: <span className="font-normal text-slate-500">{values[0]}</span></p><div className="mt-2 flex flex-wrap gap-1.5">{group.toLowerCase() === "color" ? images.slice(0, values.length).map((image, index) => <button type="button" key={`${values[index]}-${index}`} className="h-7 w-7 overflow-hidden border border-slate-200 bg-white p-0.5 hover:border-epf-500" aria-label={values[index]}><img src={image} alt={values[index]} className="h-full w-full object-contain" /></button>) : values.map((value) => <button type="button" key={value} className="border border-slate-200 px-2 py-1 text-[10px] text-slate-600 hover:border-epf-500 hover:text-epf-600">{value}</button>)}</div></div>)}</div>}<div className="mt-5 flex flex-wrap items-center gap-3"><span className="text-[11px] font-medium text-slate-800">Quantity</span><div className="flex h-7 items-center border border-slate-200"><button type="button" onClick={() => setQuantity(Math.max(1, quantity - 1))} disabled={quantity <= 1} className="flex h-full w-7 items-center justify-center text-slate-500 hover:bg-slate-50 disabled:opacity-40" aria-label="Decrease quantity"><Minus className="h-3 w-3" /></button><span className="flex h-full w-8 items-center justify-center border-x border-slate-200 text-[11px]">{quantity}</span><button type="button" onClick={() => setQuantity(Math.min(product.stock || 1, quantity + 1))} disabled={quantity >= product.stock} className="flex h-full w-7 items-center justify-center text-slate-500 hover:bg-slate-50 disabled:opacity-40" aria-label="Increase quantity"><Plus className="h-3 w-3" /></button></div><button type="button" onClick={addToCart} disabled={!product.stock} className="inline-flex h-8 items-center gap-1.5 bg-slate-800 px-4 text-[11px] font-semibold text-white hover:bg-epf-500 disabled:cursor-not-allowed disabled:bg-slate-300"><ShoppingCart className="h-3.5 w-3.5" /> Add to Cart</button></div><div className="mt-4 border-t border-slate-200 pt-3 text-[10px] text-slate-500"><p><span className="font-medium text-slate-800">SKU:</span> {product.sku || "N/A"}</p><p className="mt-1"><span className="font-medium text-slate-800">Tags:</span> {(product.tags || []).join(", ") || "Product, electrical"}</p><div className="mt-2 flex items-center gap-2"><span className="font-medium text-slate-800">Share:</span><button type="button" onClick={handleShare} className="hover:text-epf-600" aria-label="Copy product link"><Copy className="h-3 w-3" /></button><button type="button" onClick={() => setChatOpen(true)} className="text-epf-600 hover:text-epf-700">Ask about this item</button></div></div></section><FeatureRail /></div>
<div className="mt-8 grid gap-5 lg:grid-cols-[145px_minmax(0,1fr)]"><PromoCard /><ProductTabs product={product} specs={specs} reviews={reviews} activeTab={activeTab} setActiveTab={setActiveTab} isAuthenticated={isAuthenticated} showReviewForm={showReviewForm} setShowReviewForm={setShowReviewForm} reviewRating={reviewRating} setReviewRating={setReviewRating} reviewTitle={reviewTitle} setReviewTitle={setReviewTitle} reviewComment={reviewComment} setReviewComment={setReviewComment} submittingReview={submittingReview} submitReview={submitReview} /></div><RelatedProducts items={related} /></div></main><Footer /><CartDrawer /><CheckoutDialog /><ChatWidget /><BackToTopButton /></div>;
}

function Gallery({ images, name, activeImage, setActiveImage, discount, onShare, onWishlist, wishlisted }: { images: string[]; name: string; activeImage: number; setActiveImage: (value: number) => void; discount: number; onShare: () => void; onWishlist: () => void; wishlisted: boolean }) {
  const safeActive = images.length > 0 ? Math.min(activeImage, images.length - 1) : 0;
  return <div><div className="group relative aspect-square overflow-hidden border border-slate-200 bg-white"><div className="absolute left-2 top-2 z-10 flex flex-col gap-1.5"><button type="button" onClick={onWishlist} className={cn("flex h-7 w-7 items-center justify-center border bg-white", wishlisted ? "border-epf-500 text-epf-500" : "border-slate-200 text-slate-500")} aria-label="Add to wishlist"><Heart className={cn("h-3.5 w-3.5", wishlisted && "fill-epf-500")} /></button><button type="button" onClick={onShare} className="flex h-7 w-7 items-center justify-center border border-slate-200 bg-white text-slate-500 hover:text-epf-600" aria-label="Share product"><Share2 className="h-3.5 w-3.5" /></button></div>{discount > 0 && <span className="absolute right-2 top-2 z-10 bg-epf-500 px-1.5 py-1 text-[9px] font-bold text-white">-{discount}%</span>}{images.length > 0 ? <img src={images[safeActive]} alt={name} className="h-full w-full object-contain p-3" /> : <div className="flex h-full items-center justify-center"><Package className="h-16 w-16 text-slate-200" /></div>}{images.length > 1 && <><button type="button" onClick={() => setActiveImage(safeActive > 0 ? safeActive - 1 : images.length - 1)} className="absolute left-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full bg-slate-800/70 text-white opacity-70 hover:bg-epf-500" aria-label="Previous image"><ChevronLeft className="h-3.5 w-3.5" /></button><button type="button" onClick={() => setActiveImage(safeActive < images.length - 1 ? safeActive + 1 : 0)} className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full bg-slate-800/70 text-white opacity-70 hover:bg-epf-500" aria-label="Next image"><ChevronRight className="h-3.5 w-3.5" /></button></>}</div><div className="mt-2 flex gap-1.5 overflow-x-auto">{images.length > 0 ? images.map((image, index) => <button type="button" key={`${image}-${index}`} onClick={() => setActiveImage(index)} className={cn("h-11 w-11 shrink-0 overflow-hidden border bg-white p-0.5", index === safeActive ? "border-epf-500" : "border-slate-200")}><img src={image} alt="" className="h-full w-full object-contain" /></button>) : Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-11 w-11 shrink-0 border border-slate-200 bg-slate-50" />)}</div></div>;
}

function PromoCard() {
  return <aside className="hidden bg-slate-100 p-3 lg:block"><div className="flex h-full min-h-[170px] flex-col items-center justify-between text-center"><div className="relative mt-2 flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-sm"><Headphones className="h-12 w-12 text-slate-800" /><span className="absolute -right-4 top-0 rounded-full bg-amber-400 px-2 py-1 text-[9px] font-bold text-white">20% OFF</span></div><p className="mt-2 text-[11px] font-semibold text-slate-700">Recommended picks</p><Link href="/shop" className="mt-2 bg-slate-900 px-3 py-1.5 text-[9px] font-semibold text-white hover:bg-epf-500">Shop Now</Link></div></aside>;
}

function RelatedProducts({ items }: { items: RelatedProduct[] }) {
  if (items.length === 0) return null;
  return <section className="mt-7 border-t border-slate-200 pt-6"><div className="mb-3 flex items-center justify-between"><h2 className="text-[16px] font-semibold text-slate-900">Related Products</h2><Link href="/shop" className="inline-flex items-center gap-1 text-[10px] font-semibold text-epf-600">View All <ArrowRight className="h-3 w-3" /></Link></div><div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{items.slice(0, 4).map((item) => <Link key={item.id} href={`/shop/${item.slug || item.id}`} className="group border border-slate-200 bg-white p-2"><div className="aspect-square bg-slate-50">{item.images?.[0] ? <img src={item.images[0]} alt={item.name} className="h-full w-full object-contain transition-transform group-hover:scale-105" loading="lazy" /> : <div className="flex h-full items-center justify-center"><Package className="h-7 w-7 text-slate-300" /></div>}</div><p className="mt-2 line-clamp-2 text-[11px] leading-4 text-slate-700 group-hover:text-epf-600">{item.name}</p><p className="mt-1 text-[12px] font-semibold text-slate-900">৳{Number(item.price).toLocaleString()}</p></Link>)}</div></section>;
}

function StatePage({ loading = false }: { loading?: boolean }) { return <div className="flex min-h-screen flex-col bg-white"><Header /><main className="flex flex-1 items-center justify-center px-4 py-20 text-center">{loading ? <Package className="h-7 w-7 animate-pulse text-epf-500" /> : <div><Package className="mx-auto h-12 w-12 text-slate-300" /><h1 className="mt-3 text-xl font-semibold text-slate-900">Product Not Found</h1><Link href="/shop" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-epf-600"><ArrowLeft className="h-3.5 w-3.5" /> Back to Shop</Link></div>}</main><Footer /></div>; }
