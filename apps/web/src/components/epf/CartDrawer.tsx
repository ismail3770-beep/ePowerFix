"use client";

import { Minus, Plus, Trash2, ShoppingBag, Zap } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useUIStore, useCartStore } from "@/store";

export default function CartDrawer() {
  const { cartOpen, setCartOpen, setCheckoutOpen } = useUIStore();
  const { items, removeItem, updateQuantity, getTotal, getItemCount } = useCartStore();
  const subtotal = getTotal();
  const delivery = subtotal > 0 ? 60 : 0;
  const total = subtotal + delivery;

  const handleRemove = (productId: string) => {
    removeItem(productId);
  };

  const handleUpdateQty = (productId: string, qty: number) => {
    updateQuantity(productId, qty);
  };

  const handleCheckout = () => {
    setCartOpen(false);
    setTimeout(() => setCheckoutOpen(true), 200);
  };

  return (
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
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <div className="p-4 bg-muted rounded-full mb-4">
              <ShoppingBag className="size-8 text-muted-foreground/40" />
            </div>
            <p className="font-medium text-muted-foreground mb-1">কার্ট খালি করুন</p>
            <p className="text-xs text-muted-foreground/70">আপনার কার্টে কোনো আইটেম নেই</p>
            <Button variant="outline" className="mt-4" onClick={() => setCartOpen(false)}>
              শপ করুন
            </Button>
          </div>
        ) : (
          <>
            <ScrollArea className="flex-1">
              <div className="p-4 space-y-3">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-3 bg-muted/50 rounded-lg p-3">
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
  );
}