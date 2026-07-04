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
import ChatWidget from "@/components/epf/ChatWidget";

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

const demoProducts: Record<string, Product> = {
  bd1: {
    id: "bd1",
    name: "Gold Wristwatch — Premium",
    description: "High-quality premium gold wristwatch with stainless steel band, water-resistant up to 50m. Features Japanese quartz movement, sapphire crystal glass, and luminous hands. Perfect for both formal and casual occasions.\n\nKey Features:\n• Japanese Quartz Movement\n• Sapphire Crystal Glass\n• Water Resistant 50M\n• Stainless Steel Band\n• Luminous Hands & Markers",
    price: 6693.75,
    comparePrice: 7875.00,
    images: [],
    stock: 8,
    sold: 12,
    rating: 4.5,
    reviewCount: 23,
    specs: { "Movement": "Japanese Quartz", "Case Material": "Stainless Steel", "Band": "Gold Plated Steel", "Water Resistance": "50M", "Crystal": "Sapphire", "Diameter": "42mm" },
    category: { id: "cat1", name: "Watches", slug: "watches" },
  },
  bd2: {
    id: "bd2",
    name: "Solar Inverter 5kVA",
    description: "Powerful 5kVA solar inverter with MPPT charge controller. Supports 48V battery system, pure sine wave output, and multiple protection features. Ideal for home and small office solar setups.\n\nKey Features:\n• 5kVA / 5000W Output\n• MPPT Charge Controller\n• Pure Sine Wave\n• 48V Battery System\n• Overload & Short Circuit Protection",
    price: 1879.50,
    comparePrice: 1890.00,
    images: [],
    stock: 14,
    sold: 18,
    rating: 4.2,
    reviewCount: 15,
    specs: { "Capacity": "5kVA / 5000W", "Input Voltage": "48V DC", "Output": "220V AC Pure Sine Wave", "Charge Controller": "Built-in MPPT", "Efficiency": ">93%", "Protection": "Overload, Short Circuit, Over Temperature" },
    category: { id: "cat2", name: "Solar", slug: "solar" },
  },
  bd3: {
    id: "bd3",
    name: "USB-C Fast Charger 65W",
    description: "Compact 65W USB-C GaN fast charger with PD 3.0 support. Charges laptops, tablets, and phones quickly. Features foldable plug, universal compatibility, and multiple safety protections.\n\nKey Features:\n• 65W Maximum Output\n• GaN Technology (Compact)\n• PD 3.0 & QC 4.0\n• Foldable Plug Design\n• Universal Compatibility",
    price: 12.60,
    comparePrice: null,
    images: [],
    stock: 22,
    sold: 34,
    rating: 4.7,
    reviewCount: 42,
    specs: { "Max Output": "65W", "Ports": "USB-C x1, USB-A x1", "Technology": "GaN", "Protocol": "PD 3.0, QC 4.0", "Input": "100-240V AC", "Size": "55 x 55 x 28mm" },
    category: { id: "cat3", name: "Chargers", slug: "chargers" },
  },
  bd4: {
    id: "bd4",
    name: "Industrial Safety Cap",
    description: "Premium industrial safety helmet with adjustable headband, ventilation holes, and sweatband. Meets EN397 safety standards. Lightweight and durable for all-day comfort on construction sites.\n\nKey Features:\n• EN397 Certified\n• Adjustable Headband\n• Ventilation Design\n• Sweatband Included\n• UV Resistant Shell",
    price: 15.75,
    comparePrice: null,
    images: [],
    stock: 45,
    sold: 89,
    rating: 4.0,
    reviewCount: 31,
    specs: { "Standard": "EN397", "Material": "ABS + HDPE", "Weight": "350g", "Head Size": "52-62cm", "Color": "Yellow", "Certification": "CE, ISO" },
    category: { id: "cat4", name: "Safety", slug: "safety" },
  },
  bd5: {
    id: "bd5",
    name: "3-core 4mm² PVC Cable",
    description: "High-quality 3-core 4mm² PVC insulated copper cable suitable for residential and commercial wiring. Features pure copper conductor, flame retardant PVC insulation, and excellent durability.\n\nKey Features:\n• Pure Copper Conductor\n• 3-Core (Red, Yellow, Blue)\n• Flame Retardant PVC\n• ISI Certified\n• 100m Per Coil",
    price: 1850.00,
    comparePrice: 2200.00,
    images: [],
    stock: 30,
    sold: 56,
    rating: 4.3,
    reviewCount: 28,
    specs: { "Size": "4mm²", "Cores": "3", "Conductor": "Pure Copper", "Insulation": "PVC", "Voltage Rating": "600/1000V", "Length": "100m Coil" },
    category: { id: "cat5", name: "Cables", slug: "cables" },
  },
  bd6: {
    id: "bd6",
    name: "MCB 32A Double Pole",
    description: "32A double pole miniature circuit breaker for reliable protection against overcurrent and short circuit. Suitable for residential and light commercial installations.\n\nKey Features:\n• 32A Rated Current\n• Double Pole (DP)\n• C-Curve Tripping\n• 6kA Breaking Capacity\n• DIN Rail Mountable",
    price: 450.00,
    comparePrice: 550.00,
    images: [],
    stock: 18,
    sold: 73,
    rating: 4.4,
    reviewCount: 37,
    specs: { "Rating": "32A", "Poles": "Double Pole", "Curve": "C-Curve", "Breaking Capacity": "6kA", "Voltage": "240/415V AC", "Standard": "IEC 60898" },
    category: { id: "cat6", name: "Circuit Breakers", slug: "circuit-breakers" },
  },
  bd7: {
    id: "bd7",
    name: "LED Panel Light 36W",
    description: "Slim profile 36W LED panel light with uniform light distribution. Low energy consumption, long lifespan, and easy installation. Ideal for offices, homes, and commercial spaces.\n\nKey Features:\n• 36W Power Consumption\n• 6000K Cool White\n• 3600 Lumens Output\n• Slim Design (10mm)\n• 50,000hrs Lifespan",
    price: 890.00,
    comparePrice: 1200.00,
    images: [],
    stock: 25,
    sold: 41,
    rating: 4.1,
    reviewCount: 19,
    specs: { "Wattage": "36W", "Color Temp": "6000K Cool White", "Lumens": "3600lm", "Size": "595 x 595mm", "Input": "AC 175-265V", "Lifespan": "50,000 hours" },
    category: { id: "cat7", name: "LED Lights", slug: "led-lights" },
  },
  bd8: {
    id: "bd8",
    name: "Digital Multimeter Fluke",
    description: "Professional-grade digital multimeter with auto-ranging, data hold, and backlit display. Measures AC/DC voltage, current, resistance, capacitance, and more. Built to withstand drops up to 3 meters.\n\nKey Features:\n• Auto-ranging\n• AC/DC Voltage & Current\n• Resistance & Capacitance\n• Data Hold Function\n• Backlit Display",
    price: 3200.00,
    comparePrice: 3800.00,
    images: [],
    stock: 10,
    sold: 15,
    rating: 4.8,
    reviewCount: 52,
    specs: { "Display": "4000 Count Backlit LCD", "AC Voltage": "0.1mV - 600V", "DC Voltage": "0.1mV - 600V", "Resistance": "0.1Ω - 40MΩ", "Accuracy": "±0.5%", "Protection": "CAT III 600V" },
    category: { id: "cat8", name: "Testing Tools", slug: "testing-tools" },
  },
  bd9: {
    id: "bd9",
    name: "Safety Boots — Industrial",
    description: "Heavy-duty industrial safety boots with steel toe cap, puncture-resistant sole, and anti-slip design. Water-resistant leather upper with padded collar for all-day comfort on job sites.\n\nKey Features:\n• Steel Toe Cap\n• Puncture Resistant Sole\n• Anti-Slip Design\n• Water Resistant Leather\n• Padded Collar & Tongue",
    price: 1250.00,
    comparePrice: null,
    images: [],
    stock: 20,
    sold: 67,
    rating: 4.2,
    reviewCount: 33,
    specs: { "Toe Protection": "Steel Cap (200J)", "Sole": "Puncture Resistant + Anti-Slip", "Upper": "Water Resistant Leather", "Lining": "Breathable Textile", "Size Range": "6-12 UK", "Standard": "EN ISO 20345 S2" },
    category: { id: "cat9", name: "Safety", slug: "safety-gear" },
  },
  bd10: {
    id: "bd10",
    name: "Solar Panel 400W Mono",
    description: "High-efficiency 400W monocrystalline solar panel with PERC technology. Excellent low-light performance, anti-reflective coating, and durable aluminum frame. Perfect for residential and commercial solar installations.\n\nKey Features:\n• 400W Maximum Power\n• Monocrystalline PERC Cells\n• Anti-Reflective Coating\n• Aluminum Frame\n• 25-Year Performance Warranty",
    price: 9500.00,
    comparePrice: 11000.00,
    images: [],
    stock: 12,
    sold: 8,
    rating: 4.6,
    reviewCount: 11,
    specs: { "Max Power": "400W", "Cell Type": "Monocrystalline PERC", "Efficiency": "20.5%", "Voltage (Vmp)": "38V", "Current (Imp)": "10.53A", "Frame": "Anodized Aluminum", "Warranty": "25 Years" },
    category: { id: "cat10", name: "Solar", slug: "solar-panels" },
  },
};

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
        } else if (demoProducts[productId]) {
          const dp = demoProducts[productId];
          setProduct(dp);
          setSpecs(dp.specs as Record<string, string> || {});
        }
      })
      .catch(() => {
        if (demoProducts[productId]) {
          const dp = demoProducts[productId];
          setProduct(dp);
          setSpecs(dp.specs as Record<string, string> || {});
        }
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
      <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center">
        <Loader2 className="size-8 animate-spin text-[#1E1E1E]" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center">
        <div className="text-center">
          <Package className="size-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">Product Not Found</h2>
          <Link href="/" className="text-[#1E1E1E] hover:underline text-sm">Back to Home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
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
      <ChatWidget />
    </div>
  );
}
