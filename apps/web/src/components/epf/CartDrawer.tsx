"use client";

import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCartStore, useUIStore } from "@/store";

export default function CartDrawer() {
  const { cartOpen, setCartOpen } = useUIStore();
  const { items, removeItem, updateQuantity, clearCart, getTotal, getItemCount } = useCartStore();
  const subtotal = getTotal();
  const itemCount = getItemCount();

  const handleCheckout = () => {
    setCartOpen(false);
    window.location.href = "/checkout";
  };

  return (
    <Sheet open={cartOpen} onOpenChange={setCartOpen}>
      <SheetContent side="right" className="flex w-full flex-col border-l border-slate-200 bg-white p-0 sm:max-w-[400px]">
        <SheetHeader className="flex h-[60px] shrink-0 flex-row items-center justify-between border-b border-slate-200 px-5 py-4">
          <SheetTitle className="flex items-center gap-1 text-[18px] font-medium text-slate-900">
            My Cart
            {itemCount > 0 && <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold text-white">{itemCount}</span>}
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-epf-50"><ShoppingBag className="h-9 w-9 text-epf-500" /></div>
            <p className="mt-4 text-sm font-medium text-slate-800">Your cart is empty</p>
            <p className="mt-1 text-xs text-slate-500">Browse our shop and add something you like.</p>
            <button type="button" onClick={() => setCartOpen(false)} className="mt-5 h-9 w-full max-w-[220px] bg-epf-500 text-xs font-semibold text-white hover:bg-epf-600">Continue Shopping</button>
          </div>
        ) : (
          <>
            <ScrollArea className="min-h-0 flex-1 px-5">
              <div className="flex min-h-full flex-col py-4">
                <div className="flex-1 space-y-2 rounded-md border border-slate-200 p-3">
                  {items.map((item) => (
                    <div key={item.id} className="relative flex gap-3 border-b border-slate-100 pb-3 last:border-b-0 last:pb-0">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-md border border-slate-200 bg-slate-50">
                        {item.productImage ? <img src={item.productImage} alt={item.productName} className="h-full w-full object-contain p-1" /> : <ShoppingBag className="h-5 w-5 text-slate-300" />}
                      </div>
                      <div className="min-w-0 flex-1 pr-4">
                        <p className="line-clamp-2 text-[13px] font-medium leading-5 text-slate-800">{item.productName}</p>
                        {item.itemType === "PROJECT" && <p className="mt-0.5 text-[11px] text-slate-400">Project Kit</p>}
                        {(item.variantLabel || item.variantId) && <p className="mt-0.5 text-[11px] text-slate-400">{item.variantLabel || "Selected variant"}</p>}
                        <div className="mt-2 flex items-center justify-between gap-3">
                          <div className="flex h-5 items-center gap-1"><button type="button" onClick={() => updateQuantity(item.productId, item.quantity - 1)} className="flex h-5 w-5 items-center justify-center rounded border border-slate-200 text-slate-400 hover:border-slate-400 hover:text-slate-800" aria-label={`Decrease ${item.productName}`}><Minus className="h-2.5 w-2.5" /></button><span className="flex h-5 min-w-7 items-center justify-center rounded border border-slate-200 px-1 text-[10px] text-slate-700">{item.quantity}</span><button type="button" onClick={() => updateQuantity(item.productId, item.quantity + 1)} className="flex h-5 w-5 items-center justify-center rounded border border-slate-200 text-slate-500 hover:border-slate-400 hover:text-slate-800" aria-label={`Increase ${item.productName}`}><Plus className="h-2.5 w-2.5" /></button></div>
                          <span className="text-[13px] font-medium text-slate-700">৳{(Number(item.price) * item.quantity).toLocaleString()}</span>
                        </div>
                      </div>
                      <button type="button" onClick={() => removeItem(item.productId)} className="absolute right-0 top-0 text-slate-400 hover:text-slate-800" aria-label={`Remove ${item.productName}`}><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  ))}
                </div>
              </div>
            </ScrollArea>

            <div className="shrink-0 border-t border-slate-200 bg-white px-5 py-3">
              <div className="flex items-center justify-between text-[16px] font-medium text-slate-900"><span>Subtotal</span><span>৳{subtotal.toLocaleString()}</span></div>
              <div className="mt-4 grid grid-cols-3 gap-3"><button type="button" onClick={clearCart} className="h-9 border border-slate-200 bg-white px-2 text-[12px] font-medium text-slate-800 hover:border-slate-400">Clear Cart</button><button type="button" onClick={() => setCartOpen(false)} className="h-9 bg-slate-100 px-2 text-[12px] font-medium text-slate-800 hover:bg-slate-200">View Cart</button><button type="button" onClick={handleCheckout} className="h-9 bg-slate-800 px-2 text-[12px] font-semibold text-white hover:bg-slate-700">Checkout</button></div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
