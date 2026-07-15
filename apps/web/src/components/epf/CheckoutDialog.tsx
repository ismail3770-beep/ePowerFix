"use client";

import type * as React from "react";
import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useUIStore, useCartStore, toOrderItemPayload } from "@/store";
import { apiFetch } from "@/lib/api";

const areas = [
  "Mirpur", "Dhanmondi", "Gulshan", "Banani", "Uttara", "Mohammadpur",
  "Rampura", "Badda", "Bashundhara", "Wari", "Motijheel", "Tejgaon",
  "Mohakhali", "Cantonment", "Banani DOHS", "Baridhara DOHS",
];

const paymentMethods = [
  { value: "COD", label: "Cash on Delivery", labelBn: "ক্যাশ অন ডেলিভারি" },
  { value: "SSLCOMMERZ", label: "SSLCommerz", labelBn: "এসএসএলকমার্জ" },
  { value: "BKASH", label: "bKash", labelBn: "বিকাশ" },
  { value: "NAGAD", label: "Nagad", labelBn: "নগদ" },
];

export default function CheckoutDialog() {
  const { checkoutOpen, setCheckoutOpen } = useUIStore();
  const { items, getTotal, clearCart } = useCartStore();
  const [form, setForm] = useState({
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    address: "",
    area: "",
    notes: "",
    paymentMethod: "COD",
  });
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [discount, setDiscount] = useState(0);
  const [couponLoading, setCouponLoading] = useState(false);
  const [shippingRates, setShippingRates] = useState({
    insideDhaka: 60,
    outsideDhaka: 120,
    freeShippingThreshold: 0,
  });

  // Fetch shipping rates from site settings once.
  useEffect(() => {
    apiFetch<{ data: any }>("/api/settings")
      .then((res) => {
        const s = res.data;
        setShippingRates({
          insideDhaka: s.shippingInsideDhaka ?? 60,
          outsideDhaka: s.shippingOutsideDhaka ?? 120,
          freeShippingThreshold: s.freeShippingThreshold ?? 0,
        });
      })
      .catch(() => {});
  }, []);

  const subtotal = getTotal();
  const formArea = (form.area || "").trim().toLowerCase();
  // Match only exact area names to avoid false positives like "New Dhaka City".
  const dhakaAreas = ["dhaka", "mirpur", "dhanmondi", "gulshan", "banani", "uttara", "mohammadpur", "rampura", "badda", "bashundhara", "wari", "motijheel", "tejgaon", "mohakhali", "cantonment", "banani dohs", "baridhara dohs", "ঢাকা"];
  const isInsideDhaka = dhakaAreas.includes(formArea);
  let delivery = subtotal > 0 ? (isInsideDhaka ? shippingRates.insideDhaka : shippingRates.outsideDhaka) : 0;
  // Free shipping if subtotal is above the threshold (and threshold > 0).
  if (shippingRates.freeShippingThreshold > 0 && subtotal >= shippingRates.freeShippingThreshold) {
    delivery = 0;
  }
  // Clamp total so discount can't push it below zero.
  const total = Math.max(0, subtotal + delivery - discount);

  const mutation = useMutation({
    mutationFn: async (body: Record<string, any>) => {
      const res = await apiFetch<any>("/api/orders", {
        method: "POST",
        body: JSON.stringify(body),
      });
      if (!res.success) {
        throw new Error(res.error || "Order failed");
      }
      return res;
    },
    onSuccess: async (data) => {
      const orderId = data.data?.id || data.id;
      const order = data.data || data;
      const isOnlinePayment = form.paymentMethod !== 'COD';

      // Online methods → hand off to the payment gateway, then redirect.
      if (isOnlinePayment && orderId) {
        try {
          const pay = await apiFetch<{ paymentUrl?: string; error?: string }>("/api/payments/initiate", {
            method: "POST",
            body: JSON.stringify({
              orderId,
              paymentMethod: form.paymentMethod.toLowerCase(),
              amount: Number(order.total),
              customerName: form.customerName,
              customerPhone: form.customerPhone,
              customerEmail: form.customerEmail || undefined,
              address: form.address || "Dhaka",
            }),
          });
          if (pay?.paymentUrl) {
            clearCart();
            handleClose();
            window.location.href = pay.paymentUrl;
            return;
          }
          throw new Error(pay?.error || "Payment initiation failed");
        } catch (err: any) {
          toast.error("Payment could not be started", {
            description: err?.message || "Please try again, or choose Cash on Delivery.",
          });
          return;
        }
      }

      toast.success("অর্ডার সফল!", {
        description: `Order #${order.orderNumber || "confirmed"} — শীঘ্রই যোগাযোগ করা হবে।`,
      });
      clearCart();
      handleClose();
    },
    onError: (err: Error) => {
      toast.error("অর্ডার ব্যর্থ", { description: err.message });
    },
  });

  const handleClose = () => {
    setCheckoutOpen(false);
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {return;}
    setCouponLoading(true);
    try {
      const result = await apiFetch<{ data: any }>(`/api/coupons/validate?code=${encodeURIComponent(couponCode.trim())}&orderTotal=${subtotal}`);
      const coupon = result.data;
      setAppliedCoupon(coupon.code);
      setDiscount(Math.round(coupon.discount));
      toast.success("Coupon applied!", { description: `You save ৳${Math.round(coupon.discount).toLocaleString()}` });
    } catch {
      toast.error("Error", { description: "Failed to validate coupon" });
    } finally {
      setCouponLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.customerName.trim() || !form.customerPhone.trim() || !form.area) {
      toast.error("অনুগ্রহ করে প্রয়োজনীয় তথ্য দিন");
      return;
    }
    if (items.length === 0) {
      toast.error("কার্টে কোনো আইটেম নেই");
      return;
    }
    mutation.mutate({
      customerName: form.customerName,
      customerPhone: form.customerPhone,
      customerEmail: form.customerEmail || undefined,
      address: form.address || "Dhaka",
      area: form.area,
      notes: form.notes || undefined,
      couponCode: appliedCoupon ?? undefined,
      paymentMethod: form.paymentMethod,
      items: items.map(toOrderItemPayload),
    });
  };

  return (
    <Dialog open={checkoutOpen} onOpenChange={(open) => { if (!open) {handleClose();} }}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] p-0 flex flex-col">
        <DialogHeader className="p-4 border-b shrink-0">
          <DialogTitle>চেকআউট / Checkout</DialogTitle>
          <DialogDescription>আপনার অর্ডার কনফার্ম করুন</DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1">
          <div className="p-4">
            {/* Order summary */}
            <div className="bg-muted/50 rounded-lg p-3 mb-5">
              <h4 className="font-semibold text-sm mb-2">Order Summary / অর্ডার সামারি</h4>
              <div className="space-y-1.5 max-h-32 overflow-y-auto">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between text-xs">
                    <span className="text-muted-foreground truncate mr-2">{item.productName} × {item.quantity}</span>
                    <span className="shrink-0">৳{(item.price * item.quantity).toLocaleString()}</span>
                  </div>
                ))}
              </div>
              <Separator className="my-2" />
              <div className="space-y-1 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>৳{subtotal.toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Delivery</span><span>৳{delivery}</span></div>
                {discount > 0 && (
                  <div className="flex justify-between text-green-600"><span>Discount</span><span>-৳{discount.toLocaleString()}</span></div>
                )}
                <div className="flex justify-between font-bold text-base pt-1">
                  <span>Total</span>
                  <span className="text-primary">৳{total.toLocaleString()}</span>
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <Input
                  placeholder="Coupon code"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleApplyCoupon())}
                  className="flex-1 h-8 text-sm"
                />
                <Button type="button" variant="outline" size="sm" onClick={handleApplyCoupon} disabled={couponLoading}>
                  {couponLoading ? "..." : "Apply"}
                </Button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div className="space-y-1.5">
                <Label htmlFor="co-name">Name / নাম <span className="text-destructive">*</span></Label>
                <Input id="co-name" placeholder="আপনার নাম" value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} required />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="co-phone">Phone / ফোন <span className="text-destructive">*</span></Label>
                <Input id="co-phone" type="tel" placeholder="01XXXXXXXXX" value={form.customerPhone} onChange={(e) => setForm({ ...form, customerPhone: e.target.value })} required />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="co-email">Email (optional)</Label>
                <Input id="co-email" type="email" placeholder="email@example.com" value={form.customerEmail} onChange={(e) => setForm({ ...form, customerEmail: e.target.value })} />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="co-address">Address / ঠিকানা</Label>
                <Input id="co-address" placeholder="বাড়ি নং, রোড নং, ব্লক" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
              </div>

              <div className="space-y-1.5">
                <Label>Area / এলাকা <span className="text-destructive">*</span></Label>
                <Select value={form.area} onValueChange={(v) => setForm({ ...form, area: v })}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="এলাকা নির্বাচন করুন" /></SelectTrigger>
                  <SelectContent>
                    {areas.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="co-notes">Notes / নোট</Label>
                <Textarea id="co-notes" placeholder="কোনো বিশেষ নির্দেশনা থাকলে লিখুন..." rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </div>

              <div className="space-y-2.5">
                <Label>Payment Method / পেমেন্ট মেথড</Label>
                <RadioGroup value={form.paymentMethod} onValueChange={(v) => setForm({ ...form, paymentMethod: v })} className="grid grid-cols-2 gap-2">
                  {paymentMethods.map((pm) => (
                    <label key={pm.value} className={`flex items-center gap-2 p-2.5 border rounded-lg cursor-pointer transition-colors hover:bg-muted ${form.paymentMethod === pm.value ? "border-primary bg-primary/5" : ""}`}>
                      <RadioGroupItem value={pm.value} />
                      <div>
                        <p className="text-xs font-medium">{pm.label}</p>
                        <p className="text-[14px] text-muted-foreground">{pm.labelBn}</p>
                      </div>
                    </label>
                  ))}
                </RadioGroup>
              </div>

              <Button type="submit" className="w-full" size="lg" disabled={mutation.isPending}>
                {mutation.isPending && <Loader2 className="size-4 animate-spin" />}
                {mutation.isPending ? "Processing..." : `অর্ডার কনফার্ম করুন — ৳${total.toLocaleString()}`}
              </Button>
            </form>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}