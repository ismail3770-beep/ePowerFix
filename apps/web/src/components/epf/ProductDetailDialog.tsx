"use client";

import { useState, useEffect } from "react";
import { Minus, Plus, ShoppingCart, Star, Zap, ShoppingBag, Battery, Lightbulb, Plug, Loader2, Package } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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

const productIcons = [Zap, ShoppingBag, Battery, Lightbulb, Plug];

export default function ProductDetailDialog() {
  const { productDetailOpen, setProductDetailOpen, selectedProductId, setSelectedProductId, setCheckoutOpen } = useUIStore();
  const { addItem } = useCartStore();
  const [product, setProduct] = useState<Product | null>(null);
  const [qty, setQty] = useState(1);
  const [specs, setSpecs] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    if (!selectedProductId || !productDetailOpen) return;
    setIsLoading(true);
    setActiveImage(0);
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
    toast.success("কার্টে যোগ হয়েছে!");
  };

  const handleBuyNow = () => {
    handleAddToCart();
    handleClose();
    setTimeout(() => setCheckoutOpen(true), 200);
  };

  const productImages = product?.images?.length ? product.images : [];
  const IconComp = product ? productIcons[product.name.length % productIcons.length] : Zap;
  const discount = product?.comparePrice ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100) : 0;

  return (
    <Dialog key={selectedProductId || "closed"} open={productDetailOpen} onOpenChange={(open) => { if (!open) handleClose(); }}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="line-clamp-1">{product?.nameBn || product?.name}</DialogTitle>
          <DialogDescription className="line-clamp-1">{product?.name}</DialogDescription>
        </DialogHeader>

        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="size-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {!isLoading && !product && (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            Product not found
          </div>
        )}

        {!isLoading && product && (
          <>
            <div className="grid sm:grid-cols-2 gap-5">
              {/* Image Gallery */}
              <div>
                <div className="aspect-square bg-gradient-to-br from-muted to-muted/60 rounded-lg flex items-center justify-center relative overflow-hidden">
                  {productImages.length > 0 ? (
                    <img
                      src={productImages[activeImage]}
                      alt={product.name}
                      className="w-full h-full object-contain p-4"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                        (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                  ) : null}
                  <div className={productImages.length > 0 ? "hidden" : ""}>
                    <IconComp className="size-20 text-muted-foreground/25" />
                  </div>
                  {discount > 0 && (
                    <Badge className="absolute top-2 left-2 bg-destructive text-white text-[14px]">-{discount}%</Badge>
                  )}
                </div>
                {productImages.length > 1 && (
                  <div className="flex gap-2 mt-2 overflow-x-auto">
                    {productImages.map((img, i) => (
                      <button
                        key={i}
                        onClick={() => setActiveImage(i)}
                        className={`size-14 shrink-0 rounded border-2 overflow-hidden ${i === activeImage ? 'border-primary' : 'border-transparent'}`}
                      >
                        <img src={img} alt="" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex flex-col">
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-2xl font-bold text-primary">৳{(product.price ?? 0).toLocaleString()}</span>
                  {product.comparePrice && product.comparePrice > product.price && (
                    <span className="text-sm text-muted-foreground line-through">৳{product.comparePrice.toLocaleString()}</span>
                  )}
                </div>

                {/* Rating */}
                <div className="flex items-center gap-1 mb-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`size-3.5 ${i < Math.round(product.rating) ? "fill-[#0EA5E9] text-[#0EA5E9]" : "text-gray-300"}`} />
                  ))}
                  <span className="text-xs text-muted-foreground ml-1">({product.reviewCount} reviews)</span>
                  <span className="text-xs text-muted-foreground ml-2">{product.sold} sold</span>
                </div>

                <p className="text-sm text-muted-foreground mb-4 line-clamp-4">{product.descriptionBn || product.description}</p>

                {/* Quantity */}
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-sm font-medium">Quantity / পরিমাণ:</span>
                  <div className="flex items-center border rounded-lg">
                    <button onClick={() => setQty(Math.max(1, qty - 1))} className="p-2 hover:bg-muted transition-colors rounded-l-lg">
                      <Minus className="size-3.5" />
                    </button>
                    <span className="w-10 text-center text-sm font-medium">{qty}</span>
                    <button onClick={() => setQty(Math.min(product.stock, qty + 1))} className="p-2 hover:bg-muted transition-colors rounded-r-lg">
                      <Plus className="size-3.5" />
                    </button>
                  </div>
                  <span className="text-xs text-muted-foreground">Stock: {product.stock}</span>
                </div>

                {/* Buttons */}
                <div className="flex gap-2 mt-auto">
                  <Button variant="outline" className="flex-1 bg-[#111827] text-white border-[#111827] hover:bg-[#0EA5E9] hover:border-[#0EA5E9] hover:text-white" onClick={handleAddToCart}>
                    <ShoppingCart className="size-4" />
                    কার্টে যোগ
                  </Button>
                  <Button className="flex-1" onClick={handleBuyNow}>
                    এখনই কিনুন
                  </Button>
                </div>
              </div>
            </div>

            {/* Specifications */}
            {Object.keys(specs).length > 0 && (
              <div className="mt-4">
                <Separator className="mb-4" />
                <h4 className="font-semibold text-sm mb-3">Specifications / স্পেসিফিকেশন</h4>
                <div className="rounded-lg border overflow-hidden">
                  <table className="w-full text-sm">
                    <tbody>
                      {Object.entries(specs).map(([key, val], i) => (
                        <tr key={key} className={i % 2 === 0 ? "bg-muted/30" : ""}>
                          <td className="px-3 py-2 font-medium text-muted-foreground w-1/3">{key}</td>
                          <td className="px-3 py-2">{val}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
