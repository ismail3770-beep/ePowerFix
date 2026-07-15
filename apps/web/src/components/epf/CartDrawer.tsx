"use client";

import { useEffect, useState } from "react";
import { Minus, Plus, Trash2, ShoppingBag, Zap } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useUIStore, useCartStore } from "@/store";
import { EPFCartFilled } from "@/components/epf/icons/EPFIcons";
import { apiFetch } from "@/lib/api";

export default function CartDrawer() {
  const { cartOpen, setCartOpen } = useUIStore();
  const { items, removeItem, updateQuantity, getTotal, getItemCount } = useCartStore();
  const subtotal = getTotal();

  // Fetch shipping rates from site settings so the cart total matches
  // what the checkout page will actually charge.
  const [insideDhakaRate, setInsideDhakaRate] = useState(60);
  const [freeShippingThreshold, setFreeShippingThreshold] = useState(0);

  useEffect(() => {
    apiFetch<{ data: any }>("/api/settings")
      .then((res) => {
        const s = res.data;
        setInsideDhakaRate(s?.shippingInsideDhaka ?? 60);
        setFreeShippingThreshold(s?.freeShippingThreshold ?? 0);
      })
      .catch(() => {});
  }, []);

  let delivery = subtotal > 0 ? insideDhakaRate : 0;
  if (freeShippingThreshold > 0 && subtotal >= freeShippingThreshold) {
    delivery = 0;
  }
  const total = subtotal + delivery;

  const handleRemove = (productId: string) => {
    removeItem(productId);
  };

  const handleUpdateQty = (productId: string, qty: number) => {
    updateQuantity(productId, qty);
  };

  const handleCheckout = () => {
    setCartOpen(false);
    window.location.href = "/checkout";
  };

  return (
    <>
      <style>{`
        @keyframes cartItemIn {
          from { opacity: 0; transform: translateX(8px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>

      <Sheet open={cartOpen} onOpenChange={setCartOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col">
          <SheetHeader className="p-4 border-b shrink-0">
            <SheetTitle className="flex items-center gap-2">
              <ShoppingBag className="size-5" />
              শপিং কার্ট
              {getItemCount() > 0 && (
                <span className="text-sm font-normal text-muted-foreground">({getItemCount()} items)</span>
              )}
            </SheetTitle>
          </SheetHeader>

          {items.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center px-6 text-center py-12">
              <div className="w-24 h-24 bg-epf-50 rounded-full flex items-center justify-center mb-5">
                <EPFCartFilled size={48} className="text-epf-500" />
              </div>
              <p className="font-medium text-foreground mb-1">আপনার কার্ট খালি</p>
              <p className="text-sm text-muted-foreground mb-6">আমাদের দোকানে ব্রাউজ করুন এবং পণ্য যোগ করুন</p>
              <Button
                className="w-full rounded-md bg-epf-500 hover:bg-epf-600 text-white"
                onClick={() => setCartOpen(false)}
              >
                শপিং শুরু করুন
              </Button>
            </div>
          ) : (
            <>
              <ScrollArea className="flex-1">
                <div className="p-4 space-y-3">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="flex gap-3 bg-muted/50 rounded-lg p-3 hover:bg-muted transition-colors duration-150"
                      style={{ animation: 'cartItemIn 0.2s ease-out' }}
                    >
                      {/* Image placeholder */}
                      <div className="w-16 h-16 bg-gradient-to-br from-muted to-muted/80 rounded-md flex items-center justify-center shrink-0">
                        <Zap className="size-5 text-muted-foreground/30" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium line-clamp-1">{item.productName}</p>
                        <p className="text-sm font-bold text-primary mt-0.5">৳{(item.price ?? 0).toLocaleString()}</p>

                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center border rounded-md">
                            <button
                              onClick={() => handleUpdateQty(item.productId, item.quantity - 1)}
                              className="p-1 hover:bg-muted transition-colors rounded-l-md"
                            >
                              <Minus className="size-3" />
                            </button>
                            <span className="w-8 text-center text-xs font-medium">{item.quantity}</span>
                            <button
                              onClick={() => handleUpdateQty(item.productId, item.quantity + 1)}
                              className="p-1 hover:bg-muted transition-colors rounded-r-md"
                            >
                              <Plus className="size-3" />
                            </button>
                          </div>
                          <button
                            onClick={() => handleRemove(item.productId)}
                            className="p-1.5 text-muted-foreground hover:text-destructive transition-colors"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              <div className="border-t p-4 space-y-3 shrink-0 bg-background">
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal</span>
                    <span>৳{subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Delivery (ঢাকার ভিতরে)</span>
                    <span>৳{delivery}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold text-base">
                    <span>Total / মোট</span>
                    <span className="text-primary">৳{total.toLocaleString()}</span>
                  </div>
                </div>
                <Button className="w-full" size="lg" onClick={handleCheckout}>
                  চেকআউট করুন
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}