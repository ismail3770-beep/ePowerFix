"use client";

import type * as React from "react";
import { useState, useEffect, useCallback } from "react";
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
  ShoppingBag,
  Lock,
} from "lucide-react";
import { EPFHome, EPFChevronRight } from "@/components/epf/icons/EPFIcons";
import { toast } from "sonner";
import { useCartStore, toOrderItemPayload } from "@/store";
import { apiFetch } from "@/lib/api";
import Header from "@/components/epf/Header";
import Footer from "@/components/epf/Footer";
import ChatWidget from "@/components/epf/ChatWidget";
import BackToTopButton from "@/components/epf/BackToTopButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

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

type OnlinePaymentMethod = "BKASH" | "NAGAD" | "SSLCOMMERZ";
type PendingOnlineOrder = {
  orderId: string;
  orderNumber: string;
  paymentMethod: OnlinePaymentMethod;
};

type ActivePaymentReservationResponse = {
  data: {
    id: string;
    orderNumber: string;
    paymentMethod: OnlinePaymentMethod;
    reservationExpiresAt: string | null;
  } | null;
};

type PaymentStatusResponse = {
  data: {
    id: string;
    status: string;
    paymentStatus: string;
    reservationStatus: string;
    reservationExpiresAt?: string | null;
  };
};

function isOnlinePaymentMethod(value: string): value is OnlinePaymentMethod {
  return value === "BKASH" || value === "NAGAD" || value === "SSLCOMMERZ";
}

function createIdempotencyKey(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `checkout-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/* ------------------------------------------------------------------ */
/*  Step Indicator                                                     */
/* ------------------------------------------------------------------ */
function StepIndicator() {
  const steps = [
    { num: 1, label: "Cart", icon: ShoppingCart },
    { num: 2, label: "Checkout", icon: Package },
    { num: 3, label: "Complete", icon: CheckCircle2 },
  ];

  return (
    <div className="flex items-center justify-center gap-1 sm:gap-2 mb-8">
      {steps.map((step, idx) => {
        const Icon = step.icon;
        const isActive = step.num === 2;
        const isDone = step.num < 2;
        return (
          <div key={step.num} className="flex items-center gap-1 sm:gap-2">
            <div className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-semibold transition-colors ${
                  isActive
                    ? "bg-epf-500 text-white"
                    : isDone
                    ? "bg-emerald-500 text-white"
                    : "bg-slate-200 text-slate-500"
                }`}
              >
                {isDone ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
              </div>
              <span
                className={`text-[13px] font-medium hidden sm:inline ${
                  isActive ? "text-epf-600" : isDone ? "text-emerald-600" : "text-slate-500"
                }`}
              >
                {step.label}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <div
                className={`w-8 sm:w-16 h-px ${isDone ? "bg-emerald-400" : "bg-slate-200"}`}
                aria-hidden
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Section Card Wrapper                                               */
/* ------------------------------------------------------------------ */
function SectionCard({
  icon: Icon,
  title,
  desc,
  children,
}: {
  icon: React.ElementType;
  title: string;
  desc?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="overflow-hidden rounded-xl border-slate-200 shadow-sm">
      <CardHeader className="flex flex-row items-center gap-3 space-y-0 border-b border-slate-800 bg-slate-900 px-5 py-3.5 sm:px-6">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-epf-500 text-white">
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <CardTitle className="text-[15px] font-bold leading-tight text-white">
            {title}
          </CardTitle>
          {desc && <p className="mt-0.5 text-[12px] text-white/60">{desc}</p>}
        </div>
      </CardHeader>
      <CardContent className="p-5 pt-5 sm:p-6">{children}</CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Page                                                          */
/* ------------------------------------------------------------------ */
export default function CheckoutPage() {
  const router = useRouter();
  const { items, removeItem, updateQuantity, getTotal, clearCart, getItemCount } = useCartStore();
  const [mounted, setMounted] = useState(false);
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
  const [paymentStarting, setPaymentStarting] = useState(false);
  const [idempotencyKey, setIdempotencyKey] = useState<string | null>(null);
  const [pendingOnlineOrder, setPendingOnlineOrder] = useState<PendingOnlineOrder | null>(null);
  const [shippingRates, setShippingRates] = useState({
    insideDhaka: 60,
    outsideDhaka: 120,
    freeShippingThreshold: 0,
  });

  useEffect(() => { setMounted(true); }, []);

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

  // The API, not browser storage or redirect query values, is the durable
  // source of truth for an authenticated user's active payment reservation.
  const recoverActiveOnlineOrder = useCallback(async (): Promise<boolean> => {
    const response = await apiFetch<ActivePaymentReservationResponse>(
      "/api/orders/active-payment-reservation"
    );
    const reservation = response.data;
    if (!reservation || !isOnlinePaymentMethod(reservation.paymentMethod)) {
      return false;
    }

    const pending = {
      orderId: reservation.id,
      orderNumber: reservation.orderNumber,
      paymentMethod: reservation.paymentMethod,
    } satisfies PendingOnlineOrder;
    setPendingOnlineOrder(pending);
    setForm((current) => ({ ...current, paymentMethod: pending.paymentMethod }));
    return true;
  }, []);

  useEffect(() => {
    void recoverActiveOnlineOrder().catch(() => {
      // An offline or signed-out browser cannot restore UI state, but the
      // server-side create guard still prevents a duplicate online reservation.
    });
  }, [recoverActiveOnlineOrder]);

  useEffect(() => {
    if (!pendingOnlineOrder) {return;}
    let active = true;
    apiFetch<PaymentStatusResponse>(`/api/orders/${encodeURIComponent(pendingOnlineOrder.orderId)}/payment-status`)
      .then((response) => {
        if (!active) {return;}
        const status = response.data;
        if (status.paymentStatus === "PAID") {
          router.replace(`/payment/success?order=${encodeURIComponent(status.id)}`);
          return;
        }
        if (status.reservationStatus !== "ACTIVE") {
          setPendingOnlineOrder(null);
        }
      })
      .catch(() => {
        // Ownership is verified server-side whenever the status is retried.
      });
    return () => { active = false; };
  }, [pendingOnlineOrder?.orderId, router]);

  const discardPendingOnlineOrder = () => {
    setPendingOnlineOrder(null);
  };

  const startPayment = async (pending: PendingOnlineOrder) => {
    setPaymentStarting(true);
    try {
      const pay = await apiFetch<{ paymentUrl?: string; transactionId?: string }>("/api/payments/initiate", {
        method: "POST",
        body: JSON.stringify({
          orderId: pending.orderId,
          paymentMethod: pending.paymentMethod.toLowerCase(),
        }),
      });
      if (!pay.paymentUrl) {
        throw new Error("Payment initiation did not return a checkout link.");
      }
      window.location.assign(pay.paymentUrl);
    } catch (err: any) {
      let reservationReleased = false;
      try {
        const response = await apiFetch<PaymentStatusResponse>(
          `/api/orders/${encodeURIComponent(pending.orderId)}/payment-status`
        );
        if (response.data.paymentStatus === "PAID") {
          router.replace(`/payment/success?order=${encodeURIComponent(response.data.id)}`);
          return;
        }
        if (response.data.reservationStatus !== "ACTIVE") {
          reservationReleased = true;
          discardPendingOnlineOrder();
        }
      } catch {
        // Retain the opaque retry marker when the status cannot be verified.
      }
      toast.error("Payment could not be started", {
        description: reservationReleased
          ? "This payment reservation is no longer active. Your cart is still available to place a new order."
          : err?.message || "Please try again. Your cart has not been cleared.",
      });
    } finally {
      setPaymentStarting(false);
    }
  };

  const subtotal = getTotal();
  const formArea = (form.area || "").trim().toLowerCase();
  // Match only exact area names from the standard list to avoid false positives like "New Dhaka City".
  const dhakaAreas = ["dhaka", "mirpur", "dhanmondi", "gulshan", "banani", "uttara", "mohammadpur", "rampura", "badda", "bashundhara", "wari", "motijheel", "tejgaon", "mohakhali", "cantonment", "banani dohs", "baridhara dohs", "ঢাকা"];
  const isInsideDhaka = dhakaAreas.includes(formArea);
  let delivery = subtotal > 0 ? (isInsideDhaka ? shippingRates.insideDhaka : shippingRates.outsideDhaka) : 0;
  // Free shipping if subtotal is above the threshold (and threshold > 0).
  if (shippingRates.freeShippingThreshold > 0 && subtotal >= shippingRates.freeShippingThreshold) {
    delivery = 0;
  }
  // Clamp total so discount can't push it below zero.
  const total = Math.max(0, subtotal + delivery - discount);
  const itemCount = getItemCount();

  /* Coupon */
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {return;}
    setCouponLoading(true);
    try {
      const result = await apiFetch<{ data: any }>(
        `/api/coupons/validate?code=${encodeURIComponent(couponCode.trim())}&orderTotal=${subtotal}`
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
      if (!res.success) {throw new Error(res.error || "Order failed");}
      return res;
    },
    onSuccess: async (data, variables) => {
      const order = data.data || data;
      const num = order?.orderNumber || order?.id || "";
      const orderId = order?.id;
      const selectedMethod = String(variables.paymentMethod || form.paymentMethod).toUpperCase();

      if (orderId && isOnlinePaymentMethod(selectedMethod)) {
        const pending = {
          orderId: String(orderId),
          orderNumber: String(num),
          paymentMethod: selectedMethod,
        } satisfies PendingOnlineOrder;
        setPendingOnlineOrder(pending);
        setIdempotencyKey(null);
        await startPayment(pending);
        return;
      }

      // COD → confirm immediately.
      setOrderNumber(String(num));
      setOrderPlaced(true);
      setIdempotencyKey(null);
      discardPendingOnlineOrder();
      clearCart();
    },
    onError: (err: Error) => {
      void recoverActiveOnlineOrder()
        .catch(() => false)
        .then((recovered) => {
          toast.error("Order failed", {
            description: recovered
              ? "Your existing online payment has been restored. Complete or verify it before placing another online order."
              : err.message,
          });
        });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.customerName.trim() || !form.customerPhone.trim() || !form.area) {
      toast.error("Please fill in required fields", { description: "Name, Phone, and Area are required." });
      return;
    }
    if (items.length === 0) {return;}

    if (pendingOnlineOrder) {
      if (!isOnlinePaymentMethod(form.paymentMethod) || form.paymentMethod !== pendingOnlineOrder.paymentMethod) {
        toast.error("A payment is already pending", {
          description: `Retry the existing ${pendingOnlineOrder.paymentMethod} payment before placing another order.`,
        });
        return;
      }
      void startPayment(pendingOnlineOrder);
      return;
    }

    const nextIdempotencyKey = idempotencyKey || createIdempotencyKey();
    setIdempotencyKey(nextIdempotencyKey);
    mutation.mutate({
      customerName: form.customerName,
      customerPhone: form.customerPhone,
      customerEmail: form.customerEmail || undefined,
      address: form.address || "Dhaka",
      area: form.area,
      notes: form.notes || undefined,
      couponCode: appliedCoupon ?? undefined,
      paymentMethod: form.paymentMethod,
      idempotencyKey: nextIdempotencyKey,
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
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm max-w-md w-full p-8 text-center">
            <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-5">
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
  /*  Empty Cart View                                                  */
  /* ---------------------------------------------------------------- */
  if (mounted && items.length === 0 && !orderPlaced) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Header />
        <main className="flex-1 flex items-center justify-center px-4 py-16">
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm max-w-md w-full p-8 sm:p-10 text-center">
            <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-5">
              <ShoppingCart className="w-10 h-10 text-slate-400" />
            </div>
            <h1 className="text-[22px] font-bold text-slate-900 mb-2">Your cart is empty</h1>
            <p className="text-[14px] text-slate-500 mb-6">
              You need to add some products to your cart before checking out.
            </p>
            <Button
              asChild
              className="h-11 px-5 bg-epf-500 hover:bg-epf-600 text-white rounded-lg font-semibold"
            >
              <a href="/shop">
                <ShoppingBag className="w-4 h-4" />
                Continue Shopping
              </a>
            </Button>
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
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 py-8">
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

          {/* Step Indicator */}
          <StepIndicator />

          {/* Page Title */}
          <div className="flex items-center gap-3 mb-8">
            <button
              onClick={() => router.back()}
              className="w-9 h-9 flex items-center justify-center border border-slate-200 bg-white rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-colors"
              aria-label="Go back"
            >
              <ArrowLeft className="w-4 h-4 text-slate-700" />
            </button>
            <div>
              <h1 className="text-[24px] font-bold text-slate-900">Checkout</h1>
              <p className="text-[14px] text-slate-500 mt-0.5">
                {mounted ? `${itemCount} item${itemCount !== 1 ? "s" : ""} in your cart` : "..."}
              </p>
            </div>
          </div>

          {mounted && items.length > 0 && (
            <form onSubmit={handleSubmit}>
              <div className="flex flex-col lg:flex-row gap-6">
                {/* ========== LEFT: Form Sections ========== */}
                <div className="flex-1 space-y-6">
                  {/* Contact Information */}
                  <SectionCard icon={User} title="Contact Information" desc="We'll use this to confirm your order">
                    <div className="space-y-4">
                      {/* Name & Phone row */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label htmlFor="customer-name" className="text-[13px] font-medium text-slate-700">
                            Full Name <span className="text-red-500">*</span>
                          </Label>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                            <Input
                              id="customer-name"
                              type="text"
                              placeholder="Enter your full name"
                              value={form.customerName}
                              onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                              className="h-11 pl-10 pr-3 text-[14px] rounded-lg border-slate-200 focus-visible:border-epf-500 focus-visible:ring-epf-500/20"
                              required
                            />
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="customer-phone" className="text-[13px] font-medium text-slate-700">
                            Phone Number <span className="text-red-500">*</span>
                          </Label>
                          <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                            <Input
                              id="customer-phone"
                              type="tel"
                              placeholder="01XXXXXXXXX"
                              value={form.customerPhone}
                              onChange={(e) => setForm({ ...form, customerPhone: e.target.value })}
                              className="h-11 pl-10 pr-3 text-[14px] rounded-lg border-slate-200 focus-visible:border-epf-500 focus-visible:ring-epf-500/20"
                              required
                            />
                          </div>
                        </div>
                      </div>

                      {/* Email */}
                      <div className="space-y-1.5">
                        <Label htmlFor="customer-email" className="text-[13px] font-medium text-slate-700">
                          Email Address <span className="text-slate-400 text-[11px] font-normal">(optional)</span>
                        </Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                          <Input
                            id="customer-email"
                            type="email"
                            placeholder="email@example.com"
                            value={form.customerEmail}
                            onChange={(e) => setForm({ ...form, customerEmail: e.target.value })}
                            className="h-11 pl-10 pr-3 text-[14px] rounded-lg border-slate-200 focus-visible:border-epf-500 focus-visible:ring-epf-500/20"
                          />
                        </div>
                      </div>
                    </div>
                  </SectionCard>

                  {/* Shipping Address */}
                  <SectionCard icon={Truck} title="Shipping Address" desc="Where should we deliver your order?">
                    <div className="space-y-4">
                      {/* Address */}
                      <div className="space-y-1.5">
                        <Label htmlFor="customer-address" className="text-[13px] font-medium text-slate-700">
                          Street Address
                        </Label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                          <Input
                            id="customer-address"
                            type="text"
                            placeholder="House #, Road #, Block, Area details"
                            value={form.address}
                            onChange={(e) => setForm({ ...form, address: e.target.value })}
                            className="h-11 pl-10 pr-3 text-[14px] rounded-lg border-slate-200 focus-visible:border-epf-500 focus-visible:ring-epf-500/20"
                          />
                        </div>
                      </div>

                      {/* Area Dropdown */}
                      <div className="space-y-1.5">
                        <Label htmlFor="customer-area" className="text-[13px] font-medium text-slate-700">
                          Delivery Area <span className="text-red-500">*</span>
                        </Label>
                        <div className="relative">
                          <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                          <select
                            id="customer-area"
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
                          <svg
                            className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                        {form.area && (
                          <p className="text-[12px] text-slate-500 mt-1 flex items-center gap-1">
                            <Truck className="w-3.5 h-3.5 text-epf-500" />
                            {isInsideDhaka
                              ? `Delivery charge: ৳${shippingRates.insideDhaka} (Inside Dhaka)`
                              : `Delivery charge: ৳${shippingRates.outsideDhaka} (Outside Dhaka)`}
                          </p>
                        )}
                      </div>

                      {/* Notes */}
                      <div className="space-y-1.5">
                        <Label htmlFor="customer-notes" className="text-[13px] font-medium text-slate-700">
                          Order Notes <span className="text-slate-400 text-[11px] font-normal">(optional)</span>
                        </Label>
                        <textarea
                          id="customer-notes"
                          placeholder="Any special instructions for delivery..."
                          rows={3}
                          value={form.notes}
                          onChange={(e) => setForm({ ...form, notes: e.target.value })}
                          className="w-full px-3 py-2.5 text-[14px] border border-slate-200 rounded-lg focus:outline-none focus:border-epf-500 focus:ring-1 focus:ring-epf-500/20 transition-colors resize-none bg-transparent"
                        />
                      </div>
                    </div>
                  </SectionCard>

                  {/* Payment Method */}
                  <SectionCard icon={CreditCard} title="Payment Method" desc="Choose how you want to pay">
                    <div>
                      <RadioGroup
                        value={form.paymentMethod}
                        onValueChange={(v) => setForm({ ...form, paymentMethod: v })}
                        className="grid grid-cols-1 sm:grid-cols-2 gap-3"
                      >
                        {PAYMENT_METHODS.map((pm) => {
                          const PmIcon = pm.icon;
                          const isActive = form.paymentMethod === pm.value;
                          return (
                            <label
                              key={pm.value}
                              htmlFor={`pm-${pm.value}`}
                              className={`flex items-center gap-3 p-3.5 border-2 rounded-lg cursor-pointer text-left transition-all duration-200 ${
                                isActive
                                  ? "border-epf-500 bg-epf-50 shadow-sm"
                                  : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm"
                              }`}
                            >
                              <RadioGroupItem
                                id={`pm-${pm.value}`}
                                value={pm.value}
                                className="sr-only"
                              />
                              <div
                                className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                                  isActive ? "bg-epf-500 text-white" : "bg-slate-100 text-slate-500"
                                }`}
                              >
                                <PmIcon className="w-5 h-5" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p
                                  className={`text-[14px] font-semibold transition-colors ${
                                    isActive ? "text-epf-600" : "text-slate-900"
                                  }`}
                                >
                                  {pm.label}
                                </p>
                                <p className="text-[12px] text-slate-400">{pm.desc}</p>
                              </div>
                              {isActive && (
                                <div className="ml-auto shrink-0">
                                  <CheckCircle2 className="w-5 h-5 text-epf-500" />
                                </div>
                              )}
                            </label>
                          );
                        })}
                      </RadioGroup>

                      {form.paymentMethod !== "COD" && (
                        <div className="mt-3 flex items-start gap-2 text-[13px] text-epf-600 bg-epf-50 border border-epf-100 rounded-lg px-3 py-2.5">
                          <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
                          <span>
                            You&apos;ll be redirected to the secure {form.paymentMethod} gateway to complete
                            payment after placing your order.
                          </span>
                        </div>
                      )}
                    </div>
                  </SectionCard>
                </div>

                {/* ========== RIGHT: Order Summary (sticky) ========== */}
                <div className="w-full lg:w-[400px] shrink-0">
                  <div className="lg:sticky lg:top-[130px] space-y-4">
                    <Card className="rounded-xl border-slate-200 shadow-sm overflow-hidden">
                      {/* Header */}
                      <CardHeader className="px-5 sm:px-6 py-4 border-b border-slate-100 flex flex-row items-center justify-between space-y-0">
                        <CardTitle className="text-[16px] font-semibold text-slate-900 flex items-center gap-2">
                          <span className="w-7 h-7 rounded-lg bg-epf-50 text-epf-500 flex items-center justify-center">
                            <ShoppingCart className="w-4 h-4" />
                          </span>
                          Order Summary
                        </CardTitle>
                        <Badge className="bg-epf-50 text-epf-600 border border-epf-100 rounded-full px-2.5 py-0.5 text-[11px] font-bold">
                          {itemCount} {itemCount === 1 ? "item" : "items"}
                        </Badge>
                      </CardHeader>

                      <CardContent className="p-5 sm:p-6">
                        {/* Cart Items List */}
                        <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1 mb-4 -mr-1">
                          {items.map((item) => (
                            <div
                              key={item.id}
                              className="flex gap-3 p-2.5 bg-slate-50 rounded-lg border border-slate-100 hover:border-slate-200 transition-colors"
                            >
                              {/* Image */}
                              <div className="w-14 h-14 bg-gradient-to-br from-slate-200 to-slate-100 rounded-lg flex items-center justify-center shrink-0 overflow-hidden">
                                {item.productImage ? (
                                  <img
                                    src={item.productImage}
                                    alt=""
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).style.display = "none";
                                    }}
                                  />
                                ) : (
                                  <Zap className="w-5 h-5 text-slate-300" />
                                )}
                              </div>

                              {/* Info */}
                              <div className="flex-1 min-w-0">
                                <p className="text-[13px] font-medium text-slate-900 line-clamp-2 leading-snug">
                                  {item.productName}
                                </p>
                                <div className="flex items-center justify-between mt-1.5">
                                  <span className="text-[12px] text-slate-500">৳{item.price.toLocaleString()}</span>
                                  <span className="text-[14px] font-semibold text-slate-900">
                                    ৳{(item.price * item.quantity).toLocaleString()}
                                  </span>
                                </div>
                              </div>

                              {/* Qty controls */}
                              <div className="flex flex-col items-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => removeItem(item.id)}
                                  className="text-slate-400 hover:text-red-500 transition-colors"
                                  title="Remove"
                                  aria-label={`Remove ${item.productName}`}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                                <div className="flex items-center border border-slate-200 rounded-md bg-white">
                                  <button
                                    type="button"
                                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                    className="w-7 h-7 flex items-center justify-center hover:bg-slate-50 rounded-l-md transition-colors"
                                    aria-label="Decrease quantity"
                                  >
                                    <Minus className="w-3 h-3" />
                                  </button>
                                  <span className="w-7 text-center text-[12px] font-semibold text-slate-900">
                                    {item.quantity}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                    className="w-7 h-7 flex items-center justify-center hover:bg-slate-50 rounded-r-md transition-colors"
                                    aria-label="Increase quantity"
                                  >
                                    <Plus className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Coupon */}
                        {appliedCoupon ? (
                          <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2.5 mb-4 text-[13px]">
                            <span className="text-emerald-700 font-medium flex items-center gap-1.5">
                              <CheckCircle2 className="w-4 h-4 shrink-0" />
                              Coupon &quot;{appliedCoupon}&quot; applied
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setAppliedCoupon(null);
                                setDiscount(0);
                                setCouponCode("");
                              }}
                              className="text-slate-400 hover:text-red-500 transition-colors"
                              aria-label="Remove coupon"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex gap-2 mb-4">
                            <div className="relative flex-1">
                              <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                              <Input
                                type="text"
                                placeholder="Enter coupon code"
                                value={couponCode}
                                onChange={(e) => setCouponCode(e.target.value)}
                                onKeyDown={(e) =>
                                  e.key === "Enter" && (e.preventDefault(), handleApplyCoupon())
                                }
                                className="h-10 pl-9 pr-3 text-[13px] rounded-lg border-slate-200 focus-visible:border-epf-500 focus-visible:ring-epf-500/20"
                              />
                            </div>
                            <Button
                              type="button"
                              onClick={handleApplyCoupon}
                              disabled={couponLoading || !couponCode.trim()}
                              variant="outline"
                              className="h-10 px-4 text-[13px] font-medium border-slate-300 text-slate-700 rounded-lg hover:border-epf-500 hover:text-epf-500 hover:bg-white whitespace-nowrap"
                            >
                              {couponLoading ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                "Apply"
                              )}
                            </Button>
                          </div>
                        )}

                        <Separator className="my-4" />

                        {/* Totals */}
                        <div className="space-y-2.5 text-[14px]">
                          <div className="flex justify-between">
                            <span className="text-slate-500">Subtotal</span>
                            <span className="text-slate-900 font-medium">৳{subtotal.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500 flex items-center gap-1">
                              <Truck className="w-3.5 h-3.5" />
                              Delivery {isInsideDhaka ? "(Inside Dhaka)" : form.area ? "(Outside Dhaka)" : ""}
                            </span>
                            <span className="text-slate-900 font-medium">
                              {delivery === 0 && subtotal > 0 ? (
                                <span className="text-emerald-600">Free</span>
                              ) : (
                                `৳${delivery.toLocaleString()}`
                              )}
                            </span>
                          </div>
                          {discount > 0 && (
                            <div className="flex justify-between text-emerald-600">
                              <span className="flex items-center gap-1">
                                <Tag className="w-3.5 h-3.5" />
                                Discount
                              </span>
                              <span className="font-medium">-৳{discount.toLocaleString()}</span>
                            </div>
                          )}
                          <Separator className="my-3" />
                          <div className="flex justify-between items-center">
                            <span className="text-[16px] font-bold text-slate-900">Total</span>
                            <span className="text-[22px] font-bold text-epf-600">
                              ৳{total.toLocaleString()}
                            </span>
                          </div>
                        </div>

                        {/* Place Order Button */}
                        <Button
                          type="submit"
                          disabled={mutation.isPending || paymentStarting}
                          className="w-full h-12 mt-5 bg-epf-500 hover:bg-epf-600 text-white text-[15px] font-semibold rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
                        >
                          {mutation.isPending || paymentStarting ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              {paymentStarting ? "Opening secure payment..." : "Processing..."}
                            </>
                          ) : (
                            <>
                              <Package className="w-4 h-4" />
                              Place Order — ৳{total.toLocaleString()}
                            </>
                          )}
                        </Button>

                        {/* Trust Badges */}
                        <div className="flex items-center justify-center gap-4 mt-4 pt-3 border-t border-slate-100">
                          <div className="flex items-center gap-1 text-[11px] text-slate-500">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                            Secure Payment
                          </div>
                          <div className="flex items-center gap-1 text-[11px] text-slate-500">
                            <Truck className="w-3.5 h-3.5 text-epf-500" />
                            Fast Delivery
                          </div>
                          <div className="flex items-center gap-1 text-[11px] text-slate-500">
                            <Lock className="w-3.5 h-3.5 text-slate-400" />
                            100% Safe
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Help card */}
                    <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-epf-50 text-epf-500 flex items-center justify-center shrink-0">
                        <Phone className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[13px] font-semibold text-slate-900">Need help with your order?</p>
                        <p className="text-[12px] text-slate-500">Call us at +880 1234 567 890</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </form>
          )}

          {/* Show a quick "back to cart" link if not mounted yet (avoids hydration flash) */}
          {!mounted && (
            <div className="text-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-epf-500 mx-auto" />
              <p className="text-[14px] text-slate-500 mt-2">Loading checkout...</p>
            </div>
          )}
        </div>
      </main>

      <Footer />
      <ChatWidget />
      <BackToTopButton />
    </div>
  );
}
