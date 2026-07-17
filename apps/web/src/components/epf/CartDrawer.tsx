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
      <SheetContent side="right" className="flex w-full flex-col border-l border-slate-200 bg-white p-0 sm:max-w-[420px]">
        <SheetHeader className="flex h-[68px] shrink-0 flex-row items-center justify-between border-b border-slate-200 px-5 py-4">
          <SheetTitle className="flex items-center gap-2 text-[19px] font-bold text-slate-900">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-epf-50 text-epf-600"><ShoppingBag className="h-4 w-4" /></span>
            My Cart
            {itemCount > 0 && <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-epf-500 px-1 text-[10px] font-bold text-white">{itemCount}</span>}
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-7 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full border border-epf-100 bg-epf-50"><ShoppingBag className="h-9 w-9 text-epf-500" /></div>
            <p className="mt-5 text-[16px] font-bold text-slate-900">Your cart is empty</p>
            <p className="mt-1 max-w-[250px] text-[13px] leading-5 text-slate-500">Browse our shop and add the products you need for your next project.</p>
            <button type="button" onClick={() => setCartOpen(false)} className="mt-6 h-10 w-full max-w-[220px] bg-epf-500 text-[13px] font-bold text-white transition-colors hover:bg-epf-600">Continue shopping</button>
          </div>
        ) : (
          <>
            <ScrollArea className="min-h-0 flex-1 px-5">
              <div className="space-y-3 py-4">
                {items.map((item) => (
                  <article key={item.id} className="relative flex gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-md border border-slate-200 bg-white">
                      {item.productImage ? <img src={item.productImage} alt={item.productName} className="h-full w-full object-contain p-1" /> : <ShoppingBag className="h-5 w-5 text-slate-300" />}
                    </div>
                    <div className="min-w-0 flex-1 pr-5">
                      {item.itemType === "PROJECT" && <p className="mb-0.5 text-[10px] font-bold uppercase tracking-wide text-epf-600">Project kit</p>}
                      <p className="line-clamp-2 text-[13px] font-semibold leading-5 text-slate-800">{item.productName}</p>
                      {(item.variantLabel || item.variantId) && <p className="mt-0.5 line-clamp-1 text-[11px] text-slate-400">{item.variantLabel || "Selected variant"}</p>}
                      <div className="mt-3 flex items-center justify-between gap-3">
                        <div className="flex h-7 items-center rounded border border-slate-200 bg-white">
                          <button type="button" onClick={() => updateQuantity(item.productId, item.quantity - 1)} className="flex h-full w-7 items-center justify-center text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900" aria-label={`Decrease ${item.productName}`}><Minus className="h-3 w-3" /></button>
                          <span className="flex h-full min-w-8 items-center justify-center border-x border-slate-200 px-1 text-[11px] font-bold text-slate-800">{item.quantity}</span>
                          <button type="button" onClick={() => updateQuantity(item.productId, item.quantity + 1)} className="flex h-full w-7 items-center justify-center text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900" aria-label={`Increase ${item.productName}`}><Plus className="h-3 w-3" /></button>
                        </div>
                        <span className="text-[14px] font-bold text-slate-900">৳{(Number(item.price) * item.quantity).toLocaleString()}</span>
                      </div>
                    </div>
                    <button type="button" onClick={() => removeItem(item.productId)} className="absolute right-3 top-3 text-slate-400 transition-colors hover:text-red-500" aria-label={`Remove ${item.productName}`}><Trash2 className="h-3.5 w-3.5" /></button>
                  </article>
                ))}
              </div>
            </ScrollArea>

            <div className="shrink-0 border-t border-slate-200 bg-white px-5 py-4">
              <div className="flex items-center justify-between"><span className="text-[13px] text-slate-500">Subtotal</span><span className="text-[19px] font-bold text-slate-900">৳{subtotal.toLocaleString()}</span></div>
              <p className="mt-1 text-[11px] text-slate-400">Shipping and discounts are calculated at checkout.</p>
              <div className="mt-4 grid grid-cols-3 gap-2">
                <button type="button" onClick={clearCart} className="h-10 border border-slate-200 bg-white px-2 text-[11px] font-bold text-slate-700 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600">Clear cart</button>
                <button type="button" onClick={() => setCartOpen(false)} className="h-10 border border-epf-500 bg-white px-2 text-[11px] font-bold text-epf-600 transition-colors hover:bg-epf-50">Continue</button>
                <button type="button" onClick={handleCheckout} className="h-10 bg-epf-500 px-2 text-[11px] font-bold text-white transition-colors hover:bg-epf-600">Checkout</button>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
