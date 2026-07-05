"use client";

import { useState, useEffect } from "react";
import { Minus, Plus, ShoppingCart, Loader2, ChevronRight } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
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
  const { productDetailOpen, setProductDetailOpen, selectedProductId, setSelectedProductId, setCheckoutOpen } = useUIStore();
  const { addItem } = useCartStore();
  const [product, setProduct] = useState<Product | null>(null);
  const [qty, setQty] = useState(1);
  const [specs, setSpecs] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const [activeTab, setActiveTab] = useState<"description" | "specs">("description");

  useEffect(() => {
    if (!selectedProductId || !productDetailOpen) return;
    setIsLoading(true);
    setActiveImage(0);
    setActiveTab("description");
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
  };

  const handleAddToCart = () => {
    if (!product) return;
    addItem({
      productId: product.id,
      productName: product.nameBn || product.name,
      productImage: product.images?.[0] || "",
      price: product.price,
      quantity: qty,
    });
    toast.success("Added to cart!");
  };

  const handleBuyNow = () => {
    handleAddToCart();
    handleClose();
    window.location.href = "/checkout";
  };

  const productImages = product?.images?.length ? product.images : [];
  const discount = product?.comparePrice ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100) : 0;

  return (
    <Dialog key={selectedProductId || "closed"} open={productDetailOpen} onOpenChange={(open) => { if (!open) handleClose(); }}>
      <DialogContent className="sm:max-w-[900px] max-w-[95vw] max-h-[92vh] overflow-y-auto p-0 rounded-lg">
        {/* Breadcrumb */}
        <div className="px-5 pt-4 pb-2 text-[12px] text-dark-400 flex items-center gap-1 border-b border-dark-200/60">
          <a href="/" className="hover:text-dark-700 transition-colors">Home</a>
          <ChevronRight className="w-3 h-3" />
          <a href="/shop" className="hover:text-dark-700 transition-colors">Shop</a>
          <ChevronRight className="w-3 h-3" />
          <span className="text-dark-700 truncate max-w-[200px]">{product?.name || "Product"}</span>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="size-8 animate-spin text-dark-400" />
          </div>
        )}

        {!isLoading && !product && (
          <div className="flex items-center justify-center py-16 text-dark-500">
            Product not found
          </div>
        )}

        {!isLoading && product && (
          <div className="p-5">
            {/* Two-column layout */}
            <div className="grid sm:grid-cols-[340px_1fr] gap-6 lg:gap-8">
              {/* LEFT: Image Gallery */}
              <div className="flex flex-col">
                {/* Main Image */}
                <div className="aspect-square bg-dark-50 rounded-md border border-dark-200/60 flex items-center justify-center relative overflow-hidden">
                  {productImages.length > 0 ? (
                    <img
                      src={productImages[activeImage]}
                      alt={product.name}
                      className="w-full h-full object-contain p-3"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="text-dark-300 text-[13px]">No Image</div>
                  )}
                  {discount > 0 && (
                    <span className="absolute top-2.5 left-2.5 bg-red-500 text-white text-[11px] font-bold px-2 py-0.5 rounded-sm">
                      -{discount}%
                    </span>
                  )}
                </div>

                {/* Thumbnails */}
                {productImages.length > 1 && (
                  <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
                    {productImages.map((img, i) => (
                      <button
                        key={i}
                        onClick={() => setActiveImage(i)}
                        className={`w-[56px] h-[56px] shrink-0 rounded border-2 overflow-hidden bg-dark-50 transition-colors ${
                          i === activeImage ? 'border-epf-500' : 'border-dark-200/60 hover:border-dark-400'
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
                <h1 className="text-[18px] sm:text-[20px] font-bold text-dark-900 leading-snug">
                  {product.name}
                </h1>

                {/* Rating + Reviews */}
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <EPFStar
                        key={star}
                        size={14}
                        className={star <= Math.round(product.rating) ? "text-amber-400" : "text-dark-200"}
                      />
                    ))}
                  </div>
                  <span className="text-[13px] text-dark-400">({product.reviewCount} reviews)</span>
                  {product.sold > 0 && (
                    <span className="text-[13px] text-dark-400 ml-1">{product.sold} sold</span>
                  )}
                </div>

                {/* Price */}
                <div className="flex items-baseline gap-2.5 mt-4 pb-4 border-b border-dark-200/60">
                  <span className="text-[24px] font-bold text-epf-500">
                    ৳{product.price.toLocaleString()}
                  </span>
                  {product.comparePrice && product.comparePrice > product.price && (
                    <span className="text-[15px] text-dark-400 line-through">
                      ৳{product.comparePrice.toLocaleString()}
                    </span>
                  )}
                </div>

                {/* Quantity */}
                <div className="flex items-center gap-3 mt-5">
                  <span className="text-[13px] text-dark-700 font-medium">Quantity</span>
                  <div className="flex items-center gap-0">
                    <button
                      onClick={() => setQty(Math.max(1, qty - 1))}
                      className="w-8 h-8 rounded-full border border-dark-300 flex items-center justify-center hover:bg-dark-100 transition-colors"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <input
                      type="text"
                      readOnly
                      value={qty}
                      className="w-12 h-8 text-center text-[14px] font-medium border-t border-b border-dark-300 outline-none bg-white"
                    />
                    <button
                      onClick={() => setQty(Math.min(product.stock, qty + 1))}
                      className="w-8 h-8 rounded-full border border-dark-300 flex items-center justify-center hover:bg-dark-100 transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                  <span className="text-[12px] text-dark-400">
                    ({product.stock} available)
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={handleAddToCart}
                    className="flex-1 h-11 rounded-md border-2 border-epf-500 bg-epf-500/10 text-epf-500 text-[14px] font-medium flex items-center justify-center gap-2 hover:bg-epf-500 hover:text-white transition-all duration-200"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    Add to Cart
                  </button>
                  <button
                    onClick={handleBuyNow}
                    className="flex-1 h-11 rounded-md bg-epf-500 text-white text-[14px] font-medium flex items-center justify-center gap-2 hover:bg-epf-600 transition-colors duration-200"
                  >
                    Buy Now
                  </button>
                </div>

                {/* Quick Info */}
                <div className="mt-5 grid grid-cols-3 gap-3">
                  <div className="flex flex-col items-center text-center p-3 bg-dark-50 rounded-md">
                    <span className="text-[11px] text-dark-500 mt-1">Free Delivery</span>
                  </div>
                  <div className="flex flex-col items-center text-center p-3 bg-dark-50 rounded-md">
                    <span className="text-[11px] text-dark-500 mt-1">Cash on Delivery</span>
                  </div>
                  <div className="flex flex-col items-center text-center p-3 bg-dark-50 rounded-md">
                    <span className="text-[11px] text-dark-500 mt-1">7 Days Return</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Tabs: Description / Specifications */}
            {(product.description || Object.keys(specs).length > 0) && (
              <div className="mt-8">
                {/* Tab Headers */}
                <div className="flex gap-0 border-b border-dark-200">
                  {product.description && (
                    <button
                      onClick={() => setActiveTab("description")}
                      className={`px-5 py-3 text-[14px] font-medium transition-colors relative ${
                        activeTab === "description"
                          ? "text-dark-900"
                          : "text-dark-400 hover:text-dark-600"
                      }`}
                    >
                      Description
                      {activeTab === "description" && (
                        <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-epf-500" />
                      )}
                    </button>
                  )}
                  {Object.keys(specs).length > 0 && (
                    <button
                      onClick={() => setActiveTab("specs")}
                      className={`px-5 py-3 text-[14px] font-medium transition-colors relative ${
                        activeTab === "specs"
                          ? "text-dark-900"
                          : "text-dark-400 hover:text-dark-600"
                      }`}
                    >
                      Specifications
                      {activeTab === "specs" && (
                        <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-epf-500" />
                      )}
                    </button>
                  )}
                </div>

                {/* Tab Content */}
                <div className="py-5 text-[14px] text-dark-700 leading-relaxed">
                  {activeTab === "description" && (
                    <div className="whitespace-pre-line">{product.descriptionBn || product.description}</div>
                  )}
                  {activeTab === "specs" && (
                    <div className="rounded-md border border-dark-200/60 overflow-hidden">
                      <table className="w-full text-[13px]">
                        <tbody>
                          {Object.entries(specs).map(([key, val], i) => (
                            <tr key={key} className={i % 2 === 0 ? "bg-white" : "bg-dark-50/50"}>
                              <td className="px-4 py-2.5 font-medium text-dark-600 w-2/5 border-b border-dark-200/40">{key}</td>
                              <td className="px-4 py-2.5 text-dark-700 border-b border-dark-200/40">{val}</td>
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
      </DialogContent>
    </Dialog>
  );
}