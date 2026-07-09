"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import {
  Home,
  ShoppingCart,
  Minus,
  Plus,
  Trash2,
  Tag,
  Truck,
  ShieldCheck,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  Zap,
  MapPin,
  Phone,
  Mail,
  User,
  CreditCard,
  Banknote,
  Smartphone,
  Building2,
  Package,
} from "lucide-react";
import { EPFHome, EPFChevronRight } from "@/components/epf/icons/EPFIcons";
import { toast } from "sonner";
import { useCartStore, toOrderItemPayload } from "@/store";
import { apiFetch } from "@/lib/api";
import Header from "@/components/epf/Header";
import Footer from "@/components/epf/Footer";
import ChatWidget from "@/components/epf/ChatWidget";
import BackToTopButton from "@/components/epf/BackToTopButton";

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */
const AREAS = [
  "Mirpur", "Dhanmondi", "Gulshan", "Banani", "Uttara", "Mohammadpur",
  "Rampura", "Badda", "Bashundhara", "Wari", "Motijheel", "Tejgaon",
  "Mohakhali", "Cantonment", "Banani DOHS", "Baridhara DOHS",
];

const PAYMENT_METHODS = [
  { value: "COD", label: "Cash on Delivery", desc: "Pay when you receive", icon: Banknote },
  { value: "BKASH", label: "bKash", desc: "Mobile payment", icon: Smartphone },
  { value: "NAGAD", label: "Nagad", desc: "Mobile payment", icon: Smartphone },
  { value: "SSLCOMMERZ", label: "SSLCommerz", desc: "Card / Mobile Banking", icon: CreditCard },
];

/* ------------------------------------------------------------------ */
/*  Main Page                                                          */
/* ------------------------------------------------------------------ */
export default function CheckoutPage() {
  const router = useRouter();
  const { items, removeItem, updateQuantity, getTotal, clearCart, getItemCount } = useCartStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

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
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");
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
  const isInsideDhaka = /dhaka|ঢাকা/i.test(form.area || "");
  let delivery = subtotal > 0 ? (isInsideDhaka ? shippingRates.insideDhaka : shippingRates.outsideDhaka) : 0;
  // Free shipping if subtotal is above the threshold (and threshold > 0).
  if (shippingRates.freeShippingThreshold > 0 && subtotal >= shippingRates.freeShippingThreshold) {
    delivery = 0;
  }
  const total = subtotal + delivery - discount;

  /* Redirect if cart empty (after mount) */
  useEffect(() => {
    if (mounted && items.length === 0 && !orderPlaced) {
      router.push("/shop");
    }
  }, [mounted, items.length, orderPlaced, router]);

  /* Coupon */
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    try {
      const result = await apiFetch<{ data: any }>(
        `/api/coupons/validate?code=${encodeURIComponent(couponCode.trim())}&orderTotal=${subtotal + delivery}`
      );
      const coupon = result.data;
      setAppliedCoupon(coupon.code);
      setDiscount(Math.round(coupon.discount));
      toast.success("Coupon applied!", { description: `You save ৳${Math.round(coupon.discount).toLocaleString()}` });
    } catch {
      toast.error("Invalid coupon", { description: "This coupon code is not valid or has expired." });
    } finally {
      setCouponLoading(false);
    }
  };

  /* Place order */
  const mutation = useMutation({
    mutationFn: async (body: Record<string, any>) => {
      const res = await apiFetch<any>("/api/orders", {
        method: "POST",
        body: JSON.stringify(body),
      });
      if (!res.success) throw new Error(res.error || "Order failed");
      return res;
    },
    onSuccess: async (data) => {
      const order = data.data || data;
      const num = order?.orderNumber || order?.id || "";
      const orderId = order?.id;
      const method = form.paymentMethod;

      // Online methods → hand off to the payment gateway, then redirect.
      if (method !== "COD" && orderId) {
        try {
          const pay = await apiFetch<{ paymentUrl?: string; error?: string }>("/api/payments/initiate", {
            method: "POST",
            body: JSON.stringify({
              orderId,
              paymentMethod: method.toLowerCase(),
              amount: Number(order.total),
              customerName: form.customerName,
              customerPhone: form.customerPhone,
              customerEmail: form.customerEmail || undefined,
              address: form.address || "Dhaka",
            }),
          });
          if (pay?.paymentUrl) {
            clearCart();
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

      // COD → confirm immediately.
      setOrderNumber(String(num));
      setOrderPlaced(true);
      clearCart();
    },
    onError: (err: Error) => {
      toast.error("Order failed", { description: err.message });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.customerName.trim() || !form.customerPhone.trim() || !form.area) {
      toast.error("Please fill in required fields", { description: "Name, Phone, and Area are required." });
      return;
    }
    if (items.length === 0) return;
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

  /* ---------------------------------------------------------------- */
  /*  Order Success View                                               */
  /* ---------------------------------------------------------------- */
  if (orderPlaced) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Header />
        <main className="flex-1 flex items-center justify-center px-4 py-16">
          <div className="bg-white border border-slate-200 rounded-lg shadow-sm max-w-md w-full p-8 text-center">
            <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-5">
              <CheckCircle2 className="w-10 h-10 text-emerald-600" />
            </div>
            <h1 className="text-[22px] font-bold text-slate-900 mb-2">Order Placed Successfully!</h1>
            <p className="text-[15px] text-slate-500 mb-1">Thank you for your purchase.</p>
            {orderNumber && (
              <p className="text-[14px] font-medium text-epf-500 mb-6">
                Order #{orderNumber}
              </p>
            )}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-6 text-left">
              <p className="text-[13px] text-slate-500 mb-2">What&apos;s next?</p>
              <ul className="space-y-1.5 text-[14px] text-slate-700">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                  You will receive a confirmation call/SMS shortly
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                  Track your order from the order tracking page
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                  Delivery within 2-5 business days inside Dhaka
                </li>
              </ul>
            </div>
            <div className="flex gap-3">
              <a
                href="/"
                className="flex-1 h-11 flex items-center justify-center gap-2 text-[14px] font-medium bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                <Home className="w-4 h-4" /> Continue Shopping
              </a>
              <a
                href="/order-track"
                className="flex-1 h-11 flex items-center justify-center gap-2 text-[14px] font-medium border border-slate-200 text-slate-900 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <Truck className="w-4 h-4" /> Track Order
              </a>
            </div>
          </div>
        </main>
        <Footer />
        <ChatWidget />
        <BackToTopButton />
      </div>
    );
  }

  /* ---------------------------------------------------------------- */
  /*  Checkout Form View                                               */
  /* ---------------------------------------------------------------- */
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />

      <main className="flex-1">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-12 py-6">
          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-[13px] text-slate-500 mb-6">
            <a href="/" className="flex items-center gap-1 hover:text-slate-900 transition-colors">
              <EPFHome size={14} /> Home
            </a>
            <EPFChevronRight size={12} className="text-slate-400" />
            <a href="/shop" className="hover:text-slate-900 transition-colors">Shop</a>
            <EPFChevronRight size={12} className="text-slate-400" />
            <span className="text-slate-900 font-medium">Checkout</span>
          </nav>

          {/* Page Title */}
          <div className="flex items-center gap-3 mb-8">
            <button
              onClick={() => router.back()}
              className="w-9 h-9 flex items-center justify-center border border-slate-200 rounded-lg hover:bg-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4 text-slate-700" />
            </button>
            <div>
              <h1 className="text-[22px] sm:text-[24px] font-bold text-slate-900">Checkout</h1>
              <p className="text-[14px] text-slate-500 mt-0.5">
                {mounted ? `${getItemCount()} item${getItemCount() !== 1 ? "s" : ""} in your cart` : "..."}
              </p>
            </div>
          </div>

          {mounted && items.length > 0 && (
            <form onSubmit={handleSubmit}>
              <div className="flex flex-col lg:flex-row gap-6">
                {/* ========== LEFT: Billing & Shipping ========== */}
                <div className="flex-1 space-y-6">
                  {/* Billing Details */}
                  <div className="bg-white border border-slate-200 rounded-lg">
                    <div className="px-5 sm:px-6 py-4 border-b border-slate-200">
                      <h2 className="text-[16px] font-semibold text-slate-900 flex items-center gap-2">
                        <User className="w-4.5 h-4.5 text-epf-500" />
                        Billing Details
                      </h2>
                    </div>
                    <div className="p-5 sm:p-6 space-y-4">
                      {/* Name & Phone row */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[13px] font-medium text-slate-700 mb-1.5">
                            Full Name <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                              type="text"
                              placeholder="Enter your full name"
                              value={form.customerName}
                              onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                              className="w-full h-11 pl-10 pr-3 text-[14px] border border-slate-200 rounded-lg focus:outline-none focus:border-epf-500 focus:ring-1 focus:ring-epf-500/20 transition-colors"
                              required
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-[13px] font-medium text-slate-700 mb-1.5">
                            Phone Number <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                              type="tel"
                              placeholder="01XXXXXXXXX"
                              value={form.customerPhone}
                              onChange={(e) => setForm({ ...form, customerPhone: e.target.value })}
                              className="w-full h-11 pl-10 pr-3 text-[14px] border border-slate-200 rounded-lg focus:outline-none focus:border-epf-500 focus:ring-1 focus:ring-epf-500/20 transition-colors"
                              required
                            />
                          </div>
                        </div>
                      </div>

                      {/* Email */}
                      <div>
                        <label className="block text-[13px] font-medium text-slate-700 mb-1.5">
                          Email Address <span className="text-slate-400 text-[11px]">(optional)</span>
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input
                            type="email"
                            placeholder="email@example.com"
                            value={form.customerEmail}
                            onChange={(e) => setForm({ ...form, customerEmail: e.target.value })}
                            className="w-full h-11 pl-10 pr-3 text-[14px] border border-slate-200 rounded-lg focus:outline-none focus:border-epf-500 focus:ring-1 focus:ring-epf-500/20 transition-colors"
                          />
                        </div>
                      </div>

                      {/* Address */}
                      <div>
                        <label className="block text-[13px] font-medium text-slate-700 mb-1.5">
                          Street Address
                        </label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                          <input
                            type="text"
                            placeholder="House #, Road #, Block, Area details"
                            value={form.address}
                            onChange={(e) => setForm({ ...form, address: e.target.value })}
                            className="w-full h-11 pl-10 pr-3 text-[14px] border border-slate-200 rounded-lg focus:outline-none focus:border-epf-500 focus:ring-1 focus:ring-epf-500/20 transition-colors"
                          />
                        </div>
                      </div>

                      {/* Area Dropdown */}
                      <div>
                        <label className="block text-[13px] font-medium text-slate-700 mb-1.5">
                          Delivery Area <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                          <select
                            value={form.area}
                            onChange={(e) => setForm({ ...form, area: e.target.value })}
                            className="w-full h-11 pl-10 pr-8 text-[14px] border border-slate-200 rounded-lg focus:outline-none focus:border-epf-500 focus:ring-1 focus:ring-epf-500/20 transition-colors appearance-none bg-white cursor-pointer"
                            required
                          >
                            <option value="">Select your area</option>
                            {AREAS.map((a) => (
                              <option key={a} value={a}>{a}</option>
                            ))}
                          </select>
                          <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>

                      {/* Notes */}
                      <div>
                        <label className="block text-[13px] font-medium text-slate-700 mb-1.5">
                          Order Notes <span className="text-slate-400 text-[11px]">(optional)</span>
                        </label>
                        <textarea
                          placeholder="Any special instructions for delivery..."
                          rows={3}
                          value={form.notes}
                          onChange={(e) => setForm({ ...form, notes: e.target.value })}
                          className="w-full px-3 py-2.5 text-[14px] border border-slate-200 rounded-lg focus:outline-none focus:border-epf-500 focus:ring-1 focus:ring-epf-500/20 transition-colors resize-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Payment Method */}
                  <div className="bg-white border border-slate-200 rounded-lg">
                    <div className="px-5 sm:px-6 py-4 border-b border-slate-200">
                      <h2 className="text-[16px] font-semibold text-slate-900 flex items-center gap-2">
                        <CreditCard className="w-4.5 h-4.5 text-epf-500" />
                        Payment Method
                      </h2>
                    </div>
                    <div className="p-5 sm:p-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {PAYMENT_METHODS.map((pm) => {
                          const PmIcon = pm.icon;
                          const isActive = form.paymentMethod === pm.value;
                          return (
                            <button
                              key={pm.value}
                              type="button"
                              onClick={() => setForm({ ...form, paymentMethod: pm.value })}
                              className={`flex items-center gap-3 p-3.5 border-2 rounded-lg text-left transition-all duration-200 ${
                                isActive
                                  ? "border-epf-500 bg-epf-50 shadow-sm"
                                  : "border-slate-200 bg-white hover:border-slate-400 hover:shadow-sm"
                              }`}
                            >
                              <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                                isActive ? "bg-epf-500 text-white" : "bg-slate-100 text-slate-500"
                              }`}>
                                <PmIcon className="w-5 h-5" />
                              </div>
                              <div className="min-w-0">
                                <p className={`text-[14px] font-semibold transition-colors ${isActive ? "text-epf-600" : "text-slate-900"}`}>
                                  {pm.label}
                                </p>
                                <p className="text-[12px] text-slate-400">{pm.desc}</p>
                              </div>
                              {isActive && (
                                <div className="ml-auto">
                                  <CheckCircle2 className="w-5 h-5 text-epf-500" />
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                      {form.paymentMethod !== "COD" && (
                        <div className="mt-3 flex items-center gap-2 text-[13px] text-epf-600 bg-epf-50 border border-epf-100 rounded-lg px-3 py-2.5">
                          <ShieldCheck className="w-4 h-4 shrink-0" />
                          <span>You&apos;ll be redirected to the secure {form.paymentMethod} gateway to complete payment after placing your order.</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* ========== RIGHT: Order Summary ========== */}
                <div className="w-full lg:w-[400px] shrink-0">
                  <div className="bg-white border border-slate-200 rounded-lg lg:sticky lg:top-[130px]">
                    {/* Header */}
                    <div className="px-5 sm:px-6 py-4 border-b border-slate-200">
                      <h2 className="text-[16px] font-semibold text-slate-900 flex items-center gap-2">
                        <ShoppingCart className="w-4.5 h-4.5 text-epf-500" />
                        Order Summary
                      </h2>
                    </div>

                    <div className="p-5 sm:p-6">
                      {/* Cart Items */}
                      <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1 mb-4">
                        {items.map((item) => (
                          <div key={item.id} className="flex gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                            {/* Image */}
                            <div className="w-16 h-16 bg-gradient-to-br from-slate-200 to-slate-100 rounded-lg flex items-center justify-center shrink-0 overflow-hidden">
                              {item.productImage ? (
                                <img src={item.productImage} alt="" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                              ) : (
                                <Zap className="w-5 h-5 text-slate-300" />
                              )}
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <p className="text-[13px] font-medium text-slate-900 line-clamp-2 leading-snug">
                                {item.productName}
                              </p>
                              <p className="text-[14px] font-semibold text-slate-900 mt-1">
                                ৳{(item.price * item.quantity).toLocaleString()}
                              </p>
                            </div>

                            {/* Qty controls */}
                            <div className="flex flex-col items-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => removeItem(item.productId)}
                                className="text-slate-400 hover:text-red-500 transition-colors"
                                title="Remove"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                              <div className="flex items-center border border-slate-200 rounded-md bg-white">
                                <button
                                  type="button"
                                  onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                                  className="w-7 h-7 flex items-center justify-center hover:bg-slate-50 rounded-l-md transition-colors"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="w-7 text-center text-[12px] font-semibold text-slate-900">
                                  {item.quantity}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                                  className="w-7 h-7 flex items-center justify-center hover:bg-slate-50 rounded-r-md transition-colors"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Coupon */}
                      <div className="flex gap-2 mb-5">
                        <div className="relative flex-1">
                          <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input
                            type="text"
                            placeholder="Enter coupon code"
                            value={couponCode}
                            onChange={(e) => setCouponCode(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleApplyCoupon())}
                            className="w-full h-10 pl-9 pr-3 text-[13px] border border-slate-200 rounded-lg focus:outline-none focus:border-epf-500 transition-colors"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={handleApplyCoupon}
                          disabled={couponLoading || !couponCode.trim()}
                          className="h-10 px-4 text-[13px] font-medium border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50 whitespace-nowrap"
                        >
                          {couponLoading ? "..." : "Apply"}
                        </button>
                      </div>

                      {appliedCoupon && (
                        <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-3 py-2 mb-4 text-[13px]">
                          <span className="text-emerald-600 font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />
                            Coupon &quot;{appliedCoupon}&quot; applied
                          </span>
                          <button
                            type="button"
                            onClick={() => { setAppliedCoupon(null); setDiscount(0); }}
                            className="text-slate-400 hover:text-slate-700 transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      )}

                      {/* Divider */}
                      <div className="border-t border-slate-200 my-4" />

                      {/* Totals */}
                      <div className="space-y-2.5 text-[14px]">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Subtotal</span>
                          <span className="text-slate-900 font-medium">৳{subtotal.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Delivery (Inside Dhaka)</span>
                          <span className="text-slate-900 font-medium">৳{delivery.toLocaleString()}</span>
                        </div>
                        {discount > 0 && (
                          <div className="flex justify-between text-emerald-600">
                            <span>Discount</span>
                            <span className="font-medium">-৳{discount.toLocaleString()}</span>
                          </div>
                        )}
                        <div className="border-t border-slate-200 pt-3">
                          <div className="flex justify-between">
                            <span className="text-[16px] font-bold text-slate-900">Total</span>
                            <span className="text-[20px] font-bold text-epf-500">৳{total.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>

                      {/* Place Order Button */}
                      <button
                        type="submit"
                        disabled={mutation.isPending}
                        className="w-full h-12 mt-5 bg-epf-500 hover:bg-epf-600 text-white text-[15px] font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-60 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
                      >
                        {mutation.isPending ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <Package className="w-4 h-4" />
                            Place Order — ৳{total.toLocaleString()}
                          </>
                        )}
                      </button>

                      {/* Trust Badges */}
                      <div className="flex items-center justify-center gap-4 mt-4 pt-3 border-t border-slate-200">
                        <div className="flex items-center gap-1 text-[11px] text-slate-400">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          Secure
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-slate-400">
                          <Truck className="w-3.5 h-3.5" />
                          Fast Delivery
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-slate-400">
                          <CreditCard className="w-3.5 h-3.5" />
                          Safe Pay
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </form>
          )}
        </div>
      </main>

      <Footer />
      <ChatWidget />
      <BackToTopButton />
    </div>
  );
}
