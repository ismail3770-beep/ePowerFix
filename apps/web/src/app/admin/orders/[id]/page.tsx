"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";
import { Home, Mail, Printer } from "lucide-react";
import { format } from "date-fns";

interface OrderItem {
  id: string;
  productName: string;
  productImage?: string;
  price: number;
  quantity: number;
  total: number;
  variantName?: string;
}

interface OrderData {
  id: string;
  orderNumber: string;
  createdAt: string;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  subtotal: number;
  shipping: number;
  total: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  trackingNumber: string;
  address?: {
    billingAddress1?: string;
    billingAddress2?: string;
    billingCity?: string;
    billingState?: string;
    billingZip?: string;
    billingCountry?: string;
    shippingAddress1?: string;
    shippingAddress2?: string;
    shippingCity?: string;
    shippingState?: string;
    shippingZip?: string;
    shippingCountry?: string;
  };
  items: OrderItem[];
}

export default function ShowOrderPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [trackingNumber, setTrackingNumber] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const res = await apiFetch<{ data: OrderData }>(`/api/admin/orders/${id}`);
        setOrder(res.data);
        setTrackingNumber(res.data.trackingNumber || "");
        setStatus(res.data.status || "PENDING");
      } catch {
        toast.error("Failed to load order");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  const saveTracking = async () => {
    setSaving(true);
    try {
      await apiFetch(`/api/admin/orders/${id}`, {
        method: "PUT",
        body: JSON.stringify({ trackingNumber }),
      });
      toast.success("Tracking reference updated");
    } catch {
      toast.error("Failed to update tracking");
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (newStatus: string) => {
    setStatus(newStatus);
    try {
      await apiFetch(`/api/admin/orders/${id}`, {
        method: "PUT",
        body: JSON.stringify({ status: newStatus }),
      });
      toast.success("Order status updated");
    } catch {
      toast.error("Failed to update status");
    }
  };

  if (loading) return <div className="p-6 text-slate-500">Loading...</div>;
  if (!order) return <div className="p-6 text-red-500">Order not found</div>;

  return (
    <div className="font-poppins bg-[#f3f4f6] min-h-screen -m-6 p-6 text-slate-700">
      
      {/* Header section */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-[22px] font-normal text-slate-800">Show Order</h1>
        </div>
        <div className="flex flex-col items-end gap-3">
          <div className="flex items-center gap-2 text-[13px] text-slate-500">
            <Home className="w-3.5 h-3.5 cursor-pointer hover:text-blue-600" onClick={() => router.push("/admin/dashboard")} />
            <span className="text-slate-300">&gt;</span>
            <span className="cursor-pointer hover:text-blue-600" onClick={() => router.push("/admin/orders")}>Orders</span>
            <span className="text-slate-300">&gt;</span>
            <span>Show Order</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-6 max-w-[1200px]">
        
        {/* Order Tracking */}
        <div className="bg-white border border-slate-200 shadow-sm rounded-sm p-6">
          <h2 className="text-[16px] font-medium text-slate-800 mb-4 pb-2 border-b border-slate-100">Order Tracking</h2>
          <div className="max-w-[500px]">
            <label className="text-[13px] font-medium text-slate-700 block mb-1.5">Tracking Reference</label>
            <input 
              type="text" 
              placeholder="Tracking reference such as Tracking Code, Tracking URL, Tracking ID, etc."
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              className="h-9 w-full text-[13px] rounded-sm border border-slate-300 px-3 outline-none focus:border-blue-500 mb-3"
            />
            <button 
              onClick={saveTracking}
              disabled={saving}
              className="bg-[#0052cc] hover:bg-[#0047b3] text-white px-5 py-1.5 rounded-sm text-[13px] font-medium transition-colors"
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>

        {/* Order & Account Information */}
        <div className="bg-white border border-slate-200 shadow-sm rounded-sm p-6 relative">
          <h2 className="text-[16px] font-medium text-slate-800 mb-6 pb-2 border-b border-slate-100 flex justify-between">
            Order & Account Information
            <div className="flex gap-2">
              <button className="w-8 h-8 flex items-center justify-center rounded-sm bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">
                <Mail className="w-4 h-4" />
              </button>
              <button className="w-8 h-8 flex items-center justify-center rounded-sm bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">
                <Printer className="w-4 h-4" />
              </button>
            </div>
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
            {/* Left: Order Info */}
            <div>
              <h3 className="text-[15px] font-medium text-slate-700 mb-4">Order Information</h3>
              <div className="space-y-4 text-[13px]">
                <div className="grid grid-cols-[140px_1fr] items-start">
                  <span className="font-medium text-slate-800">Order ID</span>
                  <span className="text-slate-600">{order.orderNumber || order.id.slice(0, 8)}</span>
                </div>
                <div className="grid grid-cols-[140px_1fr] items-start">
                  <span className="font-medium text-slate-800">Order Date</span>
                  <span className="text-slate-600">{format(new Date(order.createdAt), 'MMM dd, yyyy')}</span>
                </div>
                <div className="grid grid-cols-[140px_1fr] items-center">
                  <span className="font-medium text-slate-800">Order Status</span>
                  <select 
                    value={status}
                    onChange={(e) => updateStatus(e.target.value)}
                    className="h-8 text-[13px] rounded-sm border border-slate-300 px-2 outline-none focus:border-blue-500 bg-white"
                  >
                    <option value="PENDING">Pending</option>
                    <option value="PROCESSING">Processing</option>
                    <option value="SHIPPED">Shipped</option>
                    <option value="DELIVERED">Delivered</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>
                <div className="grid grid-cols-[140px_1fr] items-start">
                  <span className="font-medium text-slate-800">Shipping Method</span>
                  <span className="text-slate-600">Free Shipping</span>
                </div>
                <div className="grid grid-cols-[140px_1fr] items-start">
                  <span className="font-medium text-slate-800">Payment Method</span>
                  <div className="text-slate-600 space-y-1">
                    <div className="font-medium text-slate-800">{order.paymentMethod || "Bank Transfer"}</div>
                    <div className="text-[12px] text-slate-500">
                      Payment Status: {order.paymentStatus || "Pending"}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-[140px_1fr] items-start pt-2">
                  <span className="font-medium text-slate-800">Currency</span>
                  <span className="text-slate-600">USD</span>
                </div>
                <div className="grid grid-cols-[140px_1fr] items-start">
                  <span className="font-medium text-slate-800">Currency Rate</span>
                  <span className="text-slate-600">1.0000</span>
                </div>
              </div>
            </div>

            {/* Right: Account Info */}
            <div>
              <h3 className="text-[15px] font-medium text-slate-700 mb-4">Account Information</h3>
              <div className="space-y-4 text-[13px]">
                <div className="grid grid-cols-[140px_1fr] items-start">
                  <span className="font-medium text-slate-800">Customer Name</span>
                  <span className="text-slate-600">{order.customerName || "Guest"}</span>
                </div>
                <div className="grid grid-cols-[140px_1fr] items-start">
                  <span className="font-medium text-slate-800">Customer Email</span>
                  <span className="text-slate-600">{order.customerEmail || "-"}</span>
                </div>
                <div className="grid grid-cols-[140px_1fr] items-start">
                  <span className="font-medium text-slate-800">Customer Phone</span>
                  <span className="text-slate-600">{order.customerPhone || "-"}</span>
                </div>
                <div className="grid grid-cols-[140px_1fr] items-start">
                  <span className="font-medium text-slate-800">Customer Group</span>
                  <span className="text-slate-600">Registered</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Address Information */}
        <div className="bg-white border border-slate-200 shadow-sm rounded-sm p-6">
          <h2 className="text-[16px] font-medium text-slate-800 mb-6 pb-2 border-b border-slate-100">Address Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6 text-[13px]">
            <div>
              <h3 className="text-[14px] font-medium text-slate-700 mb-3">Billing Address</h3>
              <div className="text-slate-600 space-y-1">
                <div className="font-medium text-slate-800">{order.customerName}</div>
                <div>{order.address?.billingAddress1 || "N/A"}</div>
                {order.address?.billingAddress2 && <div>{order.address?.billingAddress2}</div>}
                <div>{order.address?.billingCity}, {order.address?.billingState} {order.address?.billingZip}</div>
                <div>{order.address?.billingCountry || "Bangladesh"}</div>
              </div>
            </div>
            <div>
              <h3 className="text-[14px] font-medium text-slate-700 mb-3">Shipping Address</h3>
              <div className="text-slate-600 space-y-1">
                <div className="font-medium text-slate-800">{order.customerName}</div>
                <div>{order.address?.shippingAddress1 || order.address?.billingAddress1 || "N/A"}</div>
                {order.address?.shippingAddress2 && <div>{order.address?.shippingAddress2}</div>}
                <div>{order.address?.shippingCity}, {order.address?.shippingState} {order.address?.shippingZip}</div>
                <div>{order.address?.shippingCountry || "Bangladesh"}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Items Ordered */}
        <div className="bg-white border border-slate-200 shadow-sm rounded-sm p-6">
          <h2 className="text-[16px] font-medium text-slate-800 mb-4 pb-2 border-b border-slate-100">Items Ordered</h2>
          
          <div className="overflow-x-auto mb-6">
            <table className="w-full text-left border-collapse">
              <thead className="bg-[#f9fafb] text-[13px] text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 font-medium">Product</th>
                  <th className="px-4 py-3 font-medium w-32">Unit Price</th>
                  <th className="px-4 py-3 font-medium w-24">Quantity</th>
                  <th className="px-4 py-3 font-medium w-32 text-right">Line Total</th>
                </tr>
              </thead>
              <tbody>
                {order.items.length === 0 ? (
                  <tr><td colSpan={4} className="text-center py-6 text-slate-500 text-[13px]">No items found in this order.</td></tr>
                ) : (
                  order.items.map((item, i) => (
                    <tr key={i} className="border-b border-slate-100 text-[13px] text-slate-700">
                      <td className="px-4 py-4">
                        <div className="font-medium text-slate-800">{item.productName}</div>
                        {item.variantName && (
                          <div className="text-[12px] text-slate-500 mt-1 whitespace-pre-line">
                            {item.variantName}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4">${Number(item.price || 0).toFixed(2)}</td>
                      <td className="px-4 py-4 text-blue-600">{item.quantity}</td>
                      <td className="px-4 py-4 text-right font-medium text-slate-800">${Number(item.total || 0).toFixed(2)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end">
            <div className="w-[300px] text-[13px]">
              <div className="flex justify-between py-2">
                <span className="font-medium text-slate-700">Subtotal</span>
                <span className="text-slate-800">${Number(order.subtotal || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="font-medium text-slate-700">Shipping</span>
                <span className="text-slate-800">${Number(order.shipping || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-3">
                <span className="font-bold text-[14px] text-slate-800">Total</span>
                <span className="font-bold text-[14px] text-slate-800">${Number(order.total || 0).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
        
      </div>
    </div>
  );
}
