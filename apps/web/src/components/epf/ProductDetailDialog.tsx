"use client";

import { useState, useEffect, useRef } from "react";
import { Minus, Plus, ShoppingCart, Loader2, ChevronRight, Truck, Banknote, RotateCcw } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { EPFStar } from "@/components/epf/icons/EPFIcons";
import { useUIStore, useCartStore } from "@/store";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";

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
}

export default function ProductDetailDialog() {
  const { productDetailOpen, setProductDetailOpen, selectedProductId, setSelectedProductId } = useUIStore();
  const { addItem } = useCartStore();
  const { setCartOpen } = useUIStore();
  const [product, setProduct] = useState<Product | null>(null);
  const [qty, setQty] = useState(1);
  const [specs, setSpecs] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const [activeTab, setActiveTab] = useState<"description" | "specs">("description");
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const imageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!selectedProductId || !productDetailOpen) {return;}
    setIsLoading(true);
    setActiveImage(0);
    setActiveTab("description");
    setQty(1);
    setIsZoomed(false);
    apiFetch<{ data: { product: Product } }>(`/api/products/${selectedProductId}`)
      .then((data) => {
        const p = data?.data?.product ?? null;
        if (p) {
          setProduct(p);
          const rawSpecs = p.specs;
          try {
            setSpecs(typeof rawSpecs === 'string' ? JSON.parse(rawSpecs) : (rawSpecs && typeof rawSpecs === 'object' ? rawSpecs as Record<string, string> : {}));
          } catch {
            setSpecs({});
          }
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [selectedProductId, productDetailOpen]);

  const handleClose = () => {
    setProductDetailOpen(false);
    setSelectedProductId(null);
    setProduct(null);
    setQty(1);
    setIsZoomed(false);
  };

  const handleAddToCart = () => {
    if (!product) {return;}
    addItem({
      productId: product.id,
      productName: product.nameBn || product.name,
      productImage: product.images?.[0] || "",
      price: product.price,
      quantity: qty,
    });
    toast.success("কার্টে যোগ হয়েছে!", { description: product.nameBn || product.name });
    setCartOpen(true);
    handleClose();
  };

  const handleBuyNow = () => {
    if (!product) {return;}
    addItem({
      productId: product.id,
      productName: product.nameBn || product.name,
      productImage: product.images?.[0] || "",
      price: product.price,
      quantity: qty,
    });
    handleClose();
    window.location.href = "/checkout";
  };

  const handleImageMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageRef.current) {return;}
    const rect = imageRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPos({ x, y });
  };

  const productImages = product?.images?.length ? product.images : [];
  const discount = product?.comparePrice ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100) : 0;
  const hasDiscount = discount > 0;

  return (
    <>
      <style>{`
        @keyframes dialogSlideUp {
          from { opacity: 0; transform: translateY(24px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes dialogFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes tabContentIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .dialog-content-anim > [data-radix-dialog-content] {
          animation: dialogSlideUp 0.25s cubic-bezier(0.25, 0.1, 0.25, 1);
        }
        .dialog-content-anim > [data-radix-overlay] {
          animation: dialogFadeIn 0.2s ease-out;
        }
        .tab-content-anim {
          animation: tabContentIn 0.2s ease-out;
        }
      `}</style>

      <Dialog key={selectedProductId || "closed"} open={productDetailOpen} onOpenChange={(open) => { if (!open) {handleClose();} }}>
        <DialogContent className="dialog-content-anim sm:max-w-[900px] max-w-[100vw] sm:max-h-[92vh] overflow-y-auto p-0 rounded-none sm:rounded-lg">
          <DialogTitle className="sr-only">Product Details</DialogTitle>
          {/* Breadcrumb */}
          <div className="px-4 sm:px-5 pt-3 sm:pt-4 pb-2 text-[12px] text-slate-400 flex items-center gap-1 border-b border-slate-200/60">
            <a href="/" className="hover:text-slate-700 transition-colors">Home</a>
            <ChevronRight className="w-3 h-3 shrink-0" />
            <a href="/shop" className="hover:text-slate-700 transition-colors">Shop</a>
            <ChevronRight className="w-3 h-3 shrink-0" />
            <span className="text-slate-700 truncate max-w-[160px] sm:max-w-[200px]">{product?.name || "Product"}</span>
          </div>

          {isLoading && (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="size-8 animate-spin text-slate-400" />
            </div>
          )}

          {!isLoading && !product && (
            <div className="flex items-center justify-center py-20 text-slate-500">
              Product not found
            </div>
          )}

          {!isLoading && product && (
            <div className="p-4 sm:p-5">
              {/* ── Two-column layout (md+ only, stacked on mobile) ── */}
              <div className="flex flex-col md:grid md:grid-cols-[340px_1fr] gap-5 md:gap-8">

                {/* LEFT: Image Gallery */}
                <div className="flex flex-col">
                  {/* Main Image with Zoom */}
                  <div
                    ref={imageRef}
                    className="aspect-square bg-slate-50 rounded-md border border-slate-200/60 flex items-center justify-center relative overflow-hidden cursor-zoom-in"
                    onMouseEnter={() => setIsZoomed(true)}
                    onMouseLeave={() => setIsZoomed(false)}
                    onMouseMove={handleImageMouseMove}
                  >
                    {productImages.length > 0 ? (
                      <img
                        src={productImages[activeImage]}
                        alt={product.name}
                        className="w-full h-full object-contain p-3 transition-transform duration-200"
                        style={isZoomed ? { transform: 'scale(1.6)', transformOrigin: `${zoomPos.x}% ${zoomPos.y}%` } : {}}
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="text-slate-300 text-[13px]">No Image</div>
                    )}
                    {hasDiscount && (
                      <span className="absolute top-2.5 left-2.5 bg-red-500 text-white text-[11px] font-bold px-2 py-0.5 rounded-sm z-10">
                        -{discount}%
                      </span>
                    )}
                    {/* Image counter */}
                    {productImages.length > 1 && (
                      <span className="absolute bottom-2 right-2 bg-black/50 text-white text-[11px] font-medium px-2 py-0.5 rounded-full z-10">
                        {activeImage + 1}/{productImages.length}
                      </span>
                    )}
                  </div>

                  {/* Thumbnails */}
                  {productImages.length > 1 && (
                    <div className="flex gap-2 mt-2.5 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
                      {productImages.map((img, i) => (
                        <button
                          key={i}
                          onClick={() => setActiveImage(i)}
                          className={`w-[52px] h-[52px] sm:w-[56px] sm:h-[56px] shrink-0 rounded border-2 overflow-hidden bg-slate-50 transition-all duration-150 ${
                            i === activeImage ? 'border-epf-500 scale-105' : 'border-slate-200/60 hover:border-slate-400 opacity-60 hover:opacity-90'
                          }`}
                        >
                          <img src={img} alt="" className="w-full h-full object-contain p-1" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* RIGHT: Product Info */}
                <div className="flex flex-col">
                  {/* Title */}
                  <h1 className="text-[17px] sm:text-[20px] font-bold text-slate-900 leading-snug">
                    {product.nameBn || product.name}
                  </h1>

                  {/* Rating + Reviews */}
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <EPFStar
                          key={star}
                          size={14}
                          className={star <= Math.round(product.rating) ? "text-amber-400" : "text-slate-200"}
                        />
                      ))}
                    </div>
                    <span className="text-[13px] text-slate-400">({product.reviewCount})</span>
                    {product.sold > 0 && (
                      <span className="text-[12px] text-slate-400 ml-1">{product.sold} sold</span>
                    )}
                  </div>

                  {/* Price */}
                  <div className="flex items-baseline gap-2.5 mt-3 pb-3 border-b border-slate-200/60">
                    <span className="text-[22px] sm:text-[24px] font-bold text-epf-500">
                      ৳{product.price.toLocaleString()}
                    </span>
                    {hasDiscount && (
                      <span className="text-[14px] sm:text-[15px] text-slate-400 line-through">
                        ৳{product.comparePrice!.toLocaleString()}
                      </span>
                    )}
                  </div>

                  {/* Quantity */}
                  <div className="flex items-center gap-3 mt-4">
                    <span className="text-[13px] text-slate-700 font-medium">পরিমাণ</span>
                    <div className="flex items-center gap-0">
                      <button
                        onClick={() => setQty(Math.max(1, qty - 1))}
                        className="w-8 h-8 rounded-l-md border border-slate-300 flex items-center justify-center hover:bg-slate-100 active:bg-slate-200 transition-colors"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <input
                        type="text"
                        readOnly
                        value={qty}
                        className="w-10 h-8 text-center text-[14px] font-medium border-t border-b border-slate-300 outline-none bg-white"
                      />
                      <button
                        onClick={() => setQty(Math.min(product.stock, qty + 1))}
                        className="w-8 h-8 rounded-r-md border border-slate-300 flex items-center justify-center hover:bg-slate-100 active:bg-slate-200 transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <span className="text-[12px] text-slate-400">
                      ({product.stock} in stock)
                    </span>
                  </div>

                  {/* Action Buttons — hidden on mobile (shown in sticky bar) */}
                  <div className="hidden md:flex gap-3 mt-5">
                    <button
                      onClick={handleAddToCart}
                      className="flex-1 h-11 rounded-md border-2 border-epf-500 bg-epf-500/10 text-epf-500 text-[14px] font-semibold flex items-center justify-center gap-2 hover:bg-epf-500 hover:text-white transition-all duration-200"
                    >
                      <ShoppingCart className="w-4 h-4" />
                      কার্টে যোগ করুন
                    </button>
                    <button
                      onClick={handleBuyNow}
                      className="flex-1 h-11 rounded-md bg-epf-500 text-white text-[14px] font-semibold flex items-center justify-center gap-2 hover:bg-epf-600 transition-colors duration-200"
                    >
                      এখনই কিনুন
                    </button>
                  </div>

                  {/* Quick Info */}
                  <div className="mt-5 grid grid-cols-3 gap-2 sm:gap-3">
                    <div className="flex flex-col items-center text-center p-2.5 sm:p-3 bg-slate-50 rounded-md">
                      <Truck className="w-4 h-4 text-epf-500 mb-1" />
                      <span className="text-[10px] sm:text-[11px] text-slate-500">ফ্রি ডেলিভারি</span>
                    </div>
                    <div className="flex flex-col items-center text-center p-2.5 sm:p-3 bg-slate-50 rounded-md">
                      <Banknote className="w-4 h-4 text-epf-500 mb-1" />
                      <span className="text-[10px] sm:text-[11px] text-slate-500">ক্যাশ অন ডেলিভারি</span>
                    </div>
                    <div className="flex flex-col items-center text-center p-2.5 sm:p-3 bg-slate-50 rounded-md">
                      <RotateCcw className="w-4 h-4 text-epf-500 mb-1" />
                      <span className="text-[10px] sm:text-[11px] text-slate-500">৭ দিন রিটার্ন</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tabs: Description / Specifications */}
              {(product.description || Object.keys(specs).length > 0) && (
                <div className="mt-6 sm:mt-8">
                  {/* Tab Headers */}
                  <div className="flex gap-0 border-b border-slate-200">
                    {product.description && (
                      <button
                        onClick={() => setActiveTab("description")}
                        className={`px-4 sm:px-5 py-2.5 sm:py-3 text-[13px] sm:text-[14px] font-medium transition-colors relative ${
                          activeTab === "description"
                            ? "text-slate-900"
                            : "text-slate-400 hover:text-slate-600"
                        }`}
                      >
                        বিবরণ
                        {activeTab === "description" && (
                          <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-epf-500 transition-transform" />
                        )}
                      </button>
                    )}
                    {Object.keys(specs).length > 0 && (
                      <button
                        onClick={() => setActiveTab("specs")}
                        className={`px-4 sm:px-5 py-2.5 sm:py-3 text-[13px] sm:text-[14px] font-medium transition-colors relative ${
                          activeTab === "specs"
                            ? "text-slate-900"
                            : "text-slate-400 hover:text-slate-600"
                        }`}
                      >
                        স্পেসিফিকেশন
                        {activeTab === "specs" && (
                          <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-epf-500 transition-transform" />
                        )}
                      </button>
                    )}
                  </div>

                  {/* Tab Content */}
                  <div className="py-4 sm:py-5 text-[13px] sm:text-[14px] text-slate-700 leading-relaxed tab-content-anim" key={activeTab}>
                    {activeTab === "description" && (
                      <div className="whitespace-pre-line">{product.descriptionBn || product.description}</div>
                    )}
                    {activeTab === "specs" && (
                      <div className="rounded-md border border-slate-200/60 overflow-hidden">
                        <table className="w-full text-[12px] sm:text-[13px]">
                          <tbody>
                            {Object.entries(specs).map(([key, val], i) => (
                              <tr key={key} className={i % 2 === 0 ? "bg-white" : "bg-slate-50/50"}>
                                <td className="px-3 sm:px-4 py-2 sm:py-2.5 font-medium text-slate-600 w-2/5 border-b border-slate-200/40">{key}</td>
                                <td className="px-3 sm:px-4 py-2 sm:py-2.5 text-slate-700 border-b border-slate-200/40">{val}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Mobile Sticky Bottom Bar ── */}
          {!isLoading && product && (
            <div className="md:hidden sticky bottom-0 bg-white border-t border-slate-200 p-3 flex gap-2.5 z-10">
              <div className="flex flex-col justify-center min-w-0">
                <span className="text-[18px] font-bold text-epf-500">৳{product.price.toLocaleString()}</span>
                {hasDiscount && (
                  <span className="text-[12px] text-slate-400 line-through">৳{product.comparePrice!.toLocaleString()}</span>
                )}
              </div>
              <button
                onClick={handleAddToCart}
                className="flex-1 h-10 rounded-md border-2 border-epf-500 bg-epf-500/10 text-epf-500 text-[13px] font-semibold flex items-center justify-center gap-1.5 active:bg-epf-500 active:text-white transition-all"
              >
                <ShoppingCart className="w-4 h-4" />
                কার্টে
              </button>
              <button
                onClick={handleBuyNow}
                className="flex-1 h-10 rounded-md bg-epf-500 text-white text-[13px] font-semibold flex items-center justify-center gap-1.5 active:bg-epf-600 transition-colors"
              >
                কিনুন
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}