"use client";
import { useState } from "react";
import Header from "@/components/epf/Header";
import Footer from "@/components/epf/Footer";
import { Search, Package, CheckCircle, Truck, Clock, MapPin } from "lucide-react";
import { apiFetch } from "@/lib/api";

const statusSteps = [
  { key: "PENDING", label: "Placed", icon: Package },
  { key: "CONFIRMED", label: "Confirmed", icon: CheckCircle },
  { key: "SHIPPED", label: "Shipped", icon: Truck },
  { key: "DELIVERED", label: "Delivered", icon: MapPin },
];

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

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      <Header />
      <main className="flex-1">
        <div className="bg-white border-b border-[#E2E8F0]">
          <div className="mx-auto max-w-[1400px] px-4 sm:px-12 py-8 text-center">
            <h1 className="text-[28px] font-bold text-[#111827] mb-2">Track Your Order</h1>
            <p className="text-[15px] text-[#6B7280] mb-6">Enter your Order ID and the phone number used on the order to track its status</p>
            <div className="flex flex-col sm:flex-row max-w-[640px] mx-auto gap-2">
              <input
                type="text"
                placeholder="Order ID (e.g. EPF-XXXX-XXXX)"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="flex-1 h-[46px] px-4 text-[15px] bg-white rounded border border-[#E2E8F0] focus:outline-none focus:border-[#0EA5E9]"
              />
              <input
                type="tel"
                placeholder="Phone Number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="flex-1 h-[46px] px-4 text-[15px] bg-white rounded border border-[#E2E8F0] focus:outline-none focus:border-[#0EA5E9]"
              />
              <button
                onClick={handleSearch}
                disabled={loading}
                className="h-[46px] bg-[#0EA5E9] text-white px-6 rounded flex items-center justify-center gap-2 hover:bg-[#0284C7] transition-colors disabled:opacity-60"
              >
                <Search className="h-4 w-4" />
                <span className="text-[14px] font-semibold">{loading ? "Searching..." : "Track"}</span>
              </button>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-[600px] px-4 py-8">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center text-[14px] text-red-700">{error}</div>
          )}

          {result && (
            <div className="bg-white border border-[#E2E8F0] rounded-lg overflow-hidden">
              <div className="p-5 border-b border-[#E2E8F0]">
                <div className="flex items-center justify-between mb-1">
                  <h2 className="text-[18px] font-bold text-[#111827]">Order #{result.orderNumber}</h2>
                  <span className="text-[13px] font-medium bg-[#0EA5E9]/10 text-[#0EA5E9] px-2.5 py-1 rounded">{result.status}</span>
                </div>
                <p className="text-[13px] text-[#6B7280]">Placed on {new Date(result.createdAt).toLocaleDateString("en-BD", { year: "numeric", month: "long", day: "numeric" })}</p>
              </div>

              {/* Status Timeline */}
              <div className="p-5">
                <div className="flex items-center justify-between mb-8">
                  {statusSteps.map((step, i) => {
                    const Icon = step.icon;
                    const isCompleted = i <= currentStepIndex;
                    const isCurrent = i === currentStepIndex;
                    return (
                      <div key={step.key} className="flex flex-col items-center flex-1">
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center mb-2 transition-colors ${isCompleted ? "bg-[#0EA5E9] text-white" : "bg-[#F1F5F9] text-[#94A3B8]"} ${isCurrent ? "ring-2 ring-[#0EA5E9]/30" : ""}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <span className={`text-[12px] font-medium ${isCompleted ? "text-[#0EA5E9]" : "text-[#94A3B8]"}`}>{step.label}</span>
                        {i < statusSteps.length - 1 && (
                          <div className={`absolute h-0.5 w-16 ${isCompleted ? "bg-[#0EA5E9]" : "bg-[#E2E8F0]"}`} />
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Order Items */}
                <div className="border-t border-[#E2E8F0] pt-4">
                  <h3 className="text-[14px] font-semibold text-[#111827] mb-3">Items</h3>
                  {result.items?.map((item, i) => (
                    <div key={i} className="flex items-center justify-between py-2 text-[14px]">
                      <span className="text-[#374151]">{item.productName} × {item.quantity}</span>
                      <span className="font-medium text-[#111827]">৳{Number(item.price).toLocaleString()}</span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between pt-3 mt-2 border-t border-[#E2E8F0]">
                    <span className="text-[15px] font-bold text-[#111827]">Total</span>
                    <span className="text-[16px] font-bold text-[#0EA5E9]">৳{Number(result.total).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
