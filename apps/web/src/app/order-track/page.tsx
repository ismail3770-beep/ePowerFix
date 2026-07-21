"use client";
import { useState } from "react";
import Link from "next/link";
import Header from "@/components/epf/Header";
import Footer from "@/components/epf/Footer";
import CartDrawer from "@/components/epf/CartDrawer";
import ChatWidget from "@/components/epf/ChatWidget";
import BackToTopButton from "@/components/epf/BackToTopButton";
import { Search, Package, CheckCircle, Truck, Clock, MapPin, XCircle, RefreshCcw, ChevronRight, Check } from "lucide-react";
import { apiFetch } from "@/lib/api";

const statusSteps = [
  { key: "PENDING", label: "Placed", icon: Package },
  { key: "CONFIRMED", label: "Confirmed", icon: CheckCircle },
  { key: "PROCESSING", label: "Processing", icon: Clock },
  { key: "SHIPPED", label: "Shipped", icon: Truck },
  { key: "DELIVERED", label: "Delivered", icon: MapPin },
];

const SPECIAL_STATUSES: Record<string, { label: string; icon: any; color: string }> = {
  CANCELLED: { label: "Cancelled", icon: XCircle, color: "text-red-500" },
  RETURNED: { label: "Returned", icon: RefreshCcw, color: "text-amber-500" },
};

interface OrderResult {
  orderNumber: string;
  status: string;
  total: string;
  createdAt: string;
  items: { productName: string; quantity: number; price: string }[];
}

export default function OrderTrackPage() {
  const [orderNumber, setOrderNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [result, setResult] = useState<OrderResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSearch = async () => {
    if (!orderNumber.trim() || !phone.trim()) {
      setError("Please enter both your Order ID and the phone number used for the order.");
      return;
    }
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res: any = await apiFetch(
        `/api/orders/track?orderNumber=${encodeURIComponent(orderNumber.trim())}&phone=${encodeURIComponent(phone.trim())}`
      );
      if (res.data) {
        setResult(res.data);
      } else {
        setError("No order found. Please check your Order ID and phone number.");
      }
    } catch {
      setError("No order found. Please check your Order ID and phone number.");
    } finally {
      setLoading(false);
    }
  };

  const currentStepIndex = result
    ? statusSteps.findIndex((s) => s.key === result.status)
    : -1;
  const isSpecialStatus = result ? !!SPECIAL_STATUSES[result.status] : false;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <CartDrawer />
      <main className="flex-1 py-10 px-4">
        <div className="max-w-2xl mx-auto">

          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-6">
            <Link href="/" className="hover:text-[#0EA5E9]">Home</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-gray-700 font-semibold">Track Order</span>
          </div>

          {/* Search card */}
          <div className="bg-white border border-gray-200 rounded shadow-lg overflow-hidden mb-6">
            <div className="bg-[#0EA5E9] px-6 py-4 flex items-center gap-3">
              <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center">
                <Truck className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="font-black text-white text-lg uppercase tracking-wide">Track Your Order</h1>
                <p className="text-sky-100 text-xs mt-0.5">Enter your Order ID and phone number</p>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">Order ID</label>
                <input
                  type="text"
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  placeholder="e.g. EPF-XXXX-XXXX"
                  className="w-full border border-gray-300 rounded px-3 py-2.5 text-sm outline-none focus:border-[#0EA5E9] transition-colors"
                />
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-[10px] text-gray-400 uppercase tracking-wider">or</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">Phone Number</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  placeholder="+880 1XXXXXXXXX"
                  className="w-full border border-gray-300 rounded px-3 py-2.5 text-sm outline-none focus:border-[#0EA5E9] transition-colors"
                />
              </div>
              <button
                onClick={handleSearch}
                disabled={loading}
                className="w-full bg-[#0EA5E9] text-white font-bold py-3 rounded hover:bg-sky-600 transition-colors uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-60"
              >
                <Search className="h-4 w-4" /> {loading ? "Searching..." : "Find My Order"}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center text-sm text-red-700 mb-4">{error}</div>
          )}

          {/* Result */}
          {result && (
            <div className="bg-white border border-gray-200 rounded shadow-lg overflow-hidden">
              {/* Order header */}
              <div className="p-5 border-b border-gray-200 flex items-start gap-4">
                <div className="w-16 h-16 bg-gray-100 rounded border border-gray-200 flex items-center justify-center shrink-0">
                  <Package className="h-7 w-7 text-gray-300" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[10px] font-bold text-[#0EA5E9] uppercase tracking-wider">#{result.orderNumber}</span>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${result.status === "DELIVERED" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>{result.status}</span>
                  </div>
                  <p className="text-xs text-gray-500">Placed on {new Date(result.createdAt).toLocaleDateString("en-BD", { year: "numeric", month: "long", day: "numeric" })}</p>
                  <p className="text-sm font-bold text-[#0EA5E9] mt-1">৳{Number(result.total).toLocaleString()}</p>
                </div>
              </div>

              {/* Timeline */}
              <div className="p-5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-4">Delivery Status</p>
                {isSpecialStatus ? (
                  <div className="flex flex-col items-center justify-center py-6 text-center">
                    {(() => {
                      const Sp = SPECIAL_STATUSES[result.status];
                      const Icon = Sp.icon;
                      return (
                        <>
                          <div className={`h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center mb-2 ${Sp.color}`}>
                            <Icon className="h-6 w-6" />
                          </div>
                          <p className={`text-base font-semibold ${Sp.color}`}>{Sp.label}</p>
                          <p className="text-xs text-gray-500 mt-1">This order has been {Sp.label.toLowerCase()}.</p>
                        </>
                      );
                    })()}
                  </div>
                ) : (
                  <div className="space-y-0">
                    {statusSteps.map((step, i) => {
                      const Icon = step.icon;
                      const isDone = i < currentStepIndex && currentStepIndex >= 0;
                      const isActive = i === currentStepIndex;
                      return (
                        <div key={step.key} className="flex items-start gap-4">
                          <div className="flex flex-col items-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 shrink-0 z-10 ${isDone ? "bg-emerald-500 border-emerald-500 text-white" : isActive ? "bg-[#0EA5E9] border-[#0EA5E9] text-white" : "bg-white border-gray-300 text-gray-400"}`}>
                              {isDone ? <Check className="h-3.5 w-3.5" /> : isActive ? <Icon className="h-3.5 w-3.5" /> : <span className="text-xs font-bold">{i + 1}</span>}
                            </div>
                            {i < statusSteps.length - 1 && (
                              <div className={`w-0.5 h-10 mt-1 ${isDone ? "bg-emerald-400" : "bg-gray-200"}`} />
                            )}
                          </div>
                          <div className="pt-1.5 pb-8">
                            <p className={`text-sm font-semibold ${isActive ? "text-[#0EA5E9]" : isDone ? "text-gray-800" : "text-gray-400"}`}>{step.label}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Items */}
                <div className="border-t border-gray-200 pt-4 mt-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">Order Items</h3>
                  {result.items?.map((item, i) => (
                    <div key={i} className="flex items-center justify-between py-2 text-sm border-b border-gray-50 last:border-0">
                      <span className="text-gray-700">{item.productName} × {item.quantity}</span>
                      <span className="font-medium text-gray-900">৳{Number(item.price).toLocaleString()}</span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between pt-3 mt-2 border-t border-gray-200">
                    <span className="text-sm font-bold text-gray-900">Total</span>
                    <span className="text-base font-bold text-[#0EA5E9]">৳{Number(result.total).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="px-5 pb-5 flex gap-3">
                <Link href="/shop" className="flex-1 border border-gray-300 rounded py-2.5 text-sm font-semibold text-center hover:bg-gray-50 transition-colors">
                  Continue Shopping
                </Link>
                <Link href="/account" className="flex-1 bg-[#0EA5E9] text-white rounded py-2.5 text-sm font-bold text-center hover:bg-sky-600 transition-colors">
                  My Orders
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>
      <div className="mt-auto"><Footer /></div>
      <ChatWidget />
      <BackToTopButton />
    </div>
  );
}
