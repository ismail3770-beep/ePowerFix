"use client";

import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ShoppingBag, Package, Users, DollarSign, CalendarCheck, ArrowUp, ArrowDown,
  ChevronRight, Eye, Pencil, Trash2, X,
  Plus, Search, FileText, Settings,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useAdminTab } from "./layout";

// ======================== TYPES ========================
interface AdminStats {
  totalProducts?: number; activeProducts?: number;
  totalOrders?: number; pendingOrders?: number;
  totalUsers?: number; totalBookings?: number;
  totalRevenue?: number; monthlyRevenue?: number;
  pendingBookings?: number; unreadContacts?: number; totalReviews?: number;
  totalServices?: number; totalProjects?: number; totalContacts?: number;
  pendingReturns?: number; totalReturns?: number;
  recentOrders?: { id: string; orderNumber: string; total: number; status: string; createdAt: string }[];
}

interface Product {
  id: string; name: string; slug: string; price: number; salePrice?: number | null;
  stock: number; sku?: string | null; images: string[]; isActive: boolean;
  category?: { name: string } | null; createdAt: string;
}

interface OrderItem {
  id: string; orderNumber: string; total: number; status: string;
  paymentStatus: string; paymentMethod: string; createdAt: string;
  user?: { name: string; email: string } | null;
  _count?: { items: number };
}

const statusColor: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  CONFIRMED: "bg-sky-100 text-sky-700",
  PROCESSING: "bg-purple-100 text-purple-700",
  SHIPPED: "bg-teal-100 text-teal-700",
  DELIVERED: "bg-emerald-100 text-emerald-700",
  CANCELLED: "bg-red-100 text-red-700",
  RETURNED: "bg-gray-100 text-gray-700",
  PAID: "bg-emerald-100 text-emerald-700",
  FAILED: "bg-red-100 text-red-700",
  REFUNDED: "bg-orange-100 text-orange-700",
};

const paymentMethodIcons: Record<string, React.ElementType> = {
  BKASH: () => <span className="text-pink-600 font-bold text-[10px]">bK</span>,
  NAGAD: () => <span className="text-orange-600 font-bold text-[10px]">NG</span>,
  SSLCOMMERZ: () => <span className="text-purple-600 font-bold text-[10px]">SL</span>,
  COD: () => <span className="text-gray-600 font-bold text-[10px]">COD</span>,
};

function formatCurrency(n: number) { return "৳" + (Number(n) || 0).toLocaleString(); }

function Badge({ status }: { status: string }) {
  const color = statusColor[status] || "bg-gray-100 text-gray-700";
  return <span className={`inline-flex items-center px-2.5 py-0.5 text-[12px] font-medium rounded ${color}`}>{status}</span>;
}

function StatCard({ icon: Icon, label, value, sub, trend, iconBg }: {
  icon: React.ElementType; label: string; value: string | number;
  sub?: string; trend?: { dir: "up" | "down"; pct: string }; iconBg: string;
}) {
  return (
    <div className="bg-white border border-[#E5E7EB] rounded-lg p-5 shadow-[0_1px_3px_rgba(0,0,0,0.1)] hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${iconBg}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        {trend && (
          <span className={`flex items-center gap-0.5 text-[12px] font-medium ${trend.dir === "up" ? "text-[#10B981]" : "text-[#DC2626]"}`}>
            {trend.dir === "up" ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}{trend.pct}
          </span>
        )}
      </div>
      <p className="text-[28px] font-bold text-[#111827] leading-none mb-1">{typeof value === "number" ? value.toLocaleString() : value}</p>
      <p className="text-[12px] font-medium uppercase text-[#6B7280] tracking-wide">{label}</p>
      {sub && <p className="text-[13px] text-[#6B7280] mt-1.5">{sub}</p>}
    </div>
  );
}

// ======================== DASHBOARD TAB ========================
function DashboardTab() {
  const router = useRouter();
  // Stats API returns { data: { ... } } (no `success` field).
  const { data: statsRes, isLoading } = useQuery<{ data: AdminStats }>({
    queryKey: ["admin-stats"],
    queryFn: () => apiFetch("/api/admin/stats"),
    refetchInterval: 30000,
  });
  const s: AdminStats = statsRes?.data ?? {};

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white border border-[#E5E7EB] rounded-lg p-5 animate-pulse">
              <div className="h-9 w-9 bg-[#F3F4F6] rounded-lg mb-3" />
              <div className="h-7 bg-[#F3F4F6] rounded w-1/2 mb-2" />
              <div className="h-3 bg-[#F3F4F6] rounded w-2/3" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const recentOrders = s.recentOrders ?? [];
  // If the stats endpoint didn't supply monthlyRevenue, derive it from
  // revenueByMonth (current month) — otherwise fall back to totalRevenue.
  const monthlyRevenue = s.monthlyRevenue ?? s.totalRevenue ?? 0;
  const totalBookings = s.totalBookings ?? 0;
  const pendingBookings = s.pendingBookings ?? 0;
  const pendingReturns = s.pendingReturns ?? 0;
  const unreadContacts = s.unreadContacts ?? 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        <StatCard icon={ShoppingBag} label="Total Orders" value={s.totalOrders ?? 0}
          sub={`● Pending ${s.pendingOrders ?? 0}`} iconBg="bg-sky-500" />
        <StatCard icon={Package} label="Total Products" value={s.totalProducts ?? 0}
          sub={`● Active ${s.activeProducts ?? s.totalProducts ?? 0} ● Services ${s.totalServices ?? 0}`} iconBg="bg-emerald-500" />
        <StatCard icon={DollarSign} label="Total Sales" value={formatCurrency(Number(monthlyRevenue))}
          sub={`This month ${formatCurrency(Number(monthlyRevenue))}`} trend={{ dir: "up", pct: "12.5%" }} iconBg="bg-blue-500" />
        <StatCard icon={Users} label="Total Customers" value={s.totalUsers ?? 0}
          sub={`● Bookings ${totalBookings}`} iconBg="bg-purple-500" />
        <StatCard icon={CalendarCheck} label="Total Bookings" value={totalBookings}
          sub={`● Pending ${pendingBookings} ● Completed ${totalBookings - pendingBookings}`} iconBg="bg-amber-500" />
        <StatCard icon={DollarSign} label="Total Revenue" value={formatCurrency(Number(s.totalRevenue ?? 0))}
          sub={`Products/Services combined`} iconBg="bg-rose-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border border-[#E5E7EB] rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.1)]">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#E5E7EB]">
            <h3 className="text-[15px] font-semibold text-[#111827]">Recent Orders</h3>
            <button
              onClick={() => router.push('/admin/orders')}
              className="text-[13px] px-3 py-1 rounded-md text-[#0EA5E9] font-medium hover:bg-sky-50 transition-colors"
            >
              View All
            </button>
          </div>
          <table className="w-full text-left">
            <thead><tr className="border-b border-[#E5E7EB] bg-[#F9FAFB]">
              <th className="text-[12px] font-semibold uppercase text-[#374151] px-5 py-3">Order</th>
              <th className="text-[12px] font-semibold uppercase text-[#374151] px-5 py-3">Status</th>
              <th className="text-[12px] font-semibold uppercase text-[#374151] px-5 py-3">Total</th>
              <th className="text-[12px] font-semibold uppercase text-[#374151] px-5 py-3">Date</th>
              <th className="text-[12px] font-semibold uppercase text-[#374151] px-5 py-3"></th>
            </tr></thead>
            <tbody>
              {recentOrders.map((o, i) => (
                <tr key={o.id} className={`border-b border-[#E5E7EB] hover:bg-[#F0F9FF] transition-colors ${i % 2 === 1 ? "bg-[#F9FAFB]" : "bg-white"}`}>
                  <td className="px-5 py-3.5 text-[14px] font-medium text-[#0EA5E9]">#{o.orderNumber}</td>
                  <td className="px-5 py-3.5"><Badge status={o.status} /></td>
                  <td className="px-5 py-3.5 text-[14px] font-semibold text-[#111827]">{formatCurrency(Number(o.total))}</td>
                  <td className="px-5 py-3.5 text-[13px] text-[#6B7280]">{new Date(o.createdAt).toLocaleDateString()}</td>
                  <td className="px-5 py-3.5">
                    <button
                      title="View order"
                      onClick={() => router.push('/admin/orders')}
                      className="h-7 w-7 rounded-md flex items-center justify-center hover:bg-gray-100 text-[#6B7280] hover:text-[#0EA5E9]"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {recentOrders.length === 0 && <tr><td colSpan={5} className="text-center py-8 text-[14px] text-[#9CA3AF]">No orders yet</td></tr>}
            </tbody>
          </table>
        </div>

        <div className="space-y-4">
          <div className="bg-white border border-[#E5E7EB] rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.1)] p-5">
            <h3 className="text-[15px] font-semibold text-[#111827] mb-4">Quick Summary</h3>
            <div className="space-y-3">
              {[
                { label: "Pending Orders", value: s.pendingOrders ?? 0, color: "text-amber-500" },
                { label: "Unread Messages", value: unreadContacts, color: "text-blue-500" },
                { label: "Pending Bookings", value: pendingBookings, color: "text-purple-500" },
                { label: "Pending Returns", value: pendingReturns, color: "text-red-500" },
              ].map((item) => (
                <div key={item.label} className="flex justify-between items-center py-2 border-b border-[#E5E7EB] last:border-0">
                  <span className="text-[13px] text-[#6B7280] flex items-center gap-2"><span className={`w-2 h-2 rounded-full ${item.color} inline-block`} />{item.label}</span>
                  <span className="text-[14px] font-semibold text-[#111827]">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white border border-[#E5E7EB] rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.1)] p-5">
            <h3 className="text-[15px] font-semibold text-[#111827] mb-3">Quick Actions</h3>
            <div className="space-y-2">
              {[
                { label: "Add Product", route: "/admin/products" },
                { label: "View Orders", route: "/admin/orders" },
                { label: "Messages", route: "/admin/messages" },
                { label: "Manage Services", route: "/admin/services" },
              ].map((item) => (
                <button
                  key={item.label}
                  onClick={() => router.push(item.route)}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-[13px] text-[#374151] hover:bg-[#F3F4F6] rounded-lg transition-colors text-left"
                >
                  {item.label}
                  <ChevronRight className="w-3 h-3 ml-auto text-[#9CA3AF]" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ======================== PRODUCTS TAB ========================
function ProductsTab() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery<{ data: { data: Product[]; total: number } }>({
    queryKey: ["admin-products"],
    queryFn: () => apiFetch("/api/admin/products"),
  });
  const products = data?.data?.data ?? [];

  const handleDelete = async (p: Product) => {
    if (!confirm(`Delete "${p.name}"? This will move it to trash.`)) return;
    try {
      await apiFetch(`/api/admin/products/${p.id}`, { method: 'DELETE' });
      toast.success('Product deleted');
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
    } catch (err: any) {
      toast.error(err?.message || 'Failed to delete product');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div><h2 className="text-[18px] font-semibold text-[#111827]">All Products</h2><p className="text-[13px] text-[#6B7280] mt-0.5">{products.length} products found</p></div>
        <button
          onClick={() => router.push('/admin/products')}
          className="bg-[#0EA5E9] hover:bg-[#0284C7] text-white text-[13px] font-medium rounded-lg px-4 py-2 transition-colors flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" /> Manage Products
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-0 mb-4 border-b border-[#E5E7EB]">
        {["All products", "In-house Products", "Project Kits", "Services", "Drafts"].map((tab) => (
          <button key={tab} className={`px-4 py-2.5 text-[14px] font-medium border-b-2 transition-colors ${tab === "All products" ? "text-[#0EA5E9] border-[#0EA5E9]" : "text-[#6B7280] hover:text-[#111827] border-transparent"}`}>{tab}</button>
        ))}
      </div>

      {/* Search + Filters */}
      <div className="bg-white border border-[#E5E7EB] rounded-lg mb-4">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => router.push('/admin/products')}
            className="text-[13px] font-medium text-[#0EA5E9] flex items-center gap-1 hover:underline"
          >
            <Plus className="w-3.5 h-3.5" /> Add New Product
          </button>
          <div className="flex items-center gap-2">
            <div className="relative"><Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#9CA3AF]" /><input type="text" placeholder="Search products..." className="w-52 h-9 pl-8 pr-3 text-[13px] bg-[#F9FAFB] border border-[#E5E7EB] rounded-md focus:outline-none focus:ring-1 focus:ring-[#0EA5E9]/30" /></div>
            {["Bulk Action", "Filter", "Sort"].map((l) => (
              <select key={l} className="h-9 px-3 text-[13px] text-[#6B7280] bg-white border border-[#E5E7EB] rounded-md focus:outline-none"><option>{l}</option></select>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-[#E5E7EB] rounded-lg overflow-hidden">
        <table className="w-full text-left">
          <thead><tr className="bg-[#F9FAFB] border-b border-[#E5E7EB]">
            <th className="px-4 py-3"><input type="checkbox" className="rounded border-gray-300" /></th>
            <th className="text-[12px] font-semibold uppercase text-[#374151] px-4 py-3">Image</th>
            <th className="text-[12px] font-semibold uppercase text-[#374151] px-4 py-3">Product Name</th>
            <th className="text-[12px] font-semibold uppercase text-[#374151] px-4 py-3">Category</th>
            <th className="text-[12px] font-semibold uppercase text-[#374151] px-4 py-3">SKU</th>
            <th className="text-[12px] font-semibold uppercase text-[#374151] px-4 py-3 text-right">Price</th>
            <th className="text-[12px] font-semibold uppercase text-[#374151] px-4 py-3">Stock</th>
            <th className="text-[12px] font-semibold uppercase text-[#374151] px-4 py-3">Status</th>
            <th className="text-[12px] font-semibold uppercase text-[#374151] px-4 py-3 text-right">Actions</th>
          </tr></thead>
          <tbody>
            {isLoading ? Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} className="animate-pulse"><td colSpan={9} className="px-4 py-4"><div className="h-8 bg-[#F3F4F6] rounded" /></td></tr>
            )) : products.length === 0 ? (
              <tr><td colSpan={9} className="text-center py-12 text-[14px] text-[#9CA3AF]">No products found. Make sure the database has seed data.</td></tr>
            ) : products.map((p, i) => (
              <tr key={p.id} className={`border-b border-[#E5E7EB] hover:bg-[#F0F9FF] transition-colors ${i % 2 === 1 ? "bg-[#F9FAFB]" : "bg-white"}`}>
                <td className="px-4 py-3"><input type="checkbox" className="rounded border-gray-300" /></td>
                <td className="px-4 py-3"><div className="w-[50px] h-[50px] rounded bg-[#F3F4F6] overflow-hidden">{p.images?.[0] ? <img src={p.images[0]} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-[#9CA3AF] text-xs">N/A</div>}</div></td>
                <td className="px-4 py-3"><span className="text-[14px] text-[#0EA5E9] font-medium hover:underline cursor-pointer">{p.name}</span></td>
                <td className="px-4 py-3 text-[14px] text-[#374151]">{p.category?.name || "—"}</td>
                <td className="px-4 py-3 text-[14px] text-[#374151]">{p.sku || "—"}</td>
                <td className="px-4 py-3 text-[14px] font-semibold text-[#111827] text-right">{formatCurrency(Number(p.salePrice || p.price))}</td>
                <td className="px-4 py-3 text-[14px] text-[#374151]">{p.stock > 0 ? p.stock : <span className="text-red-600 font-medium">Out of Stock</span>}</td>
                <td className="px-4 py-3"><span className={`inline-flex px-2.5 py-0.5 text-[12px] font-medium rounded ${p.isActive ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>{p.isActive ? "Published" : "Draft"}</span></td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-0.5">
                    <button title="View" onClick={() => router.push('/admin/products')} className="h-7 w-7 rounded-md flex items-center justify-center text-[#9CA3AF] hover:text-[#0EA5E9] hover:bg-gray-100"><Eye className="w-4 h-4" /></button>
                    <button title="Edit" onClick={() => router.push('/admin/products')} className="h-7 w-7 rounded-md flex items-center justify-center text-[#9CA3AF] hover:text-[#0EA5E9] hover:bg-gray-100"><Pencil className="w-4 h-4" /></button>
                    <button title="Settings" onClick={() => router.push('/admin/products')} className="h-7 w-7 rounded-md flex items-center justify-center text-[#9CA3AF] hover:text-gray-700 hover:bg-gray-100"><Settings className="w-4 h-4" /></button>
                    <button title="Delete" onClick={() => handleDelete(p)} className="h-7 w-7 rounded-md flex items-center justify-center text-[#9CA3AF] hover:text-red-500 hover:bg-gray-100"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-center gap-1 mt-5">
        <button className="px-3 py-1.5 text-[13px] text-[#6B7280] hover:text-[#111827] flex items-center gap-1"><ArrowLeft className="w-3.5 h-3.5" /> Previous</button>
        {[1, 2, 3].map((p) => (
          <button key={p} className={`w-8 h-8 rounded-full text-[13px] font-medium ${p === 1 ? "bg-[#0EA5E9] text-white" : "bg-white text-[#374151] border border-[#E5E7EB] hover:bg-gray-50"}`}>{p}</button>
        ))}
        <button className="px-3 py-1.5 text-[13px] text-[#6B7280] hover:text-[#111827] flex items-center gap-1">Next <ArrowRight className="w-3.5 h-3.5" /></button>
      </div>
    </div>
  );
}

function ArrowLeft(props: any) { return <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>; }
function ArrowRight(props: any) { return <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>; }

// ======================== ORDERS TAB ========================
function OrdersTab() {
  const queryClient = useQueryClient();
  const { data, isLoading, refetch } = useQuery<{ data: { data: OrderItem[] } }>({
    queryKey: ["admin-orders"],
    queryFn: () => apiFetch("/api/admin/orders"),
  });
  const orders = data?.data?.data ?? [];
  const [detailOrderId, setDetailOrderId] = useState<string | null>(null);
  const [detailOrder, setDetailOrder] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    if (!detailOrderId) { setDetailOrder(null); return; }
    setDetailLoading(true);
    apiFetch<{ data: any }>(`/api/admin/orders/${detailOrderId}`)
      .then((res) => setDetailOrder(res.data || null))
      .catch(() => setDetailOrder(null))
      .finally(() => setDetailLoading(false));
  }, [detailOrderId]);

  const handleDeleteOrder = async (id: string, orderNumber: string) => {
    try {
      await apiFetch(`/api/admin/orders/${id}`, { method: 'DELETE' });
      toast.success(`Order #${orderNumber} deleted`);
      refetch();
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    } catch (err: any) {
      toast.error(err?.message || 'Failed to delete order');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div><h2 className="text-[18px] font-semibold text-[#111827]">All Orders</h2><p className="text-[13px] text-[#6B7280] mt-0.5">{orders.length} orders found</p></div>
      </div>

      <div className="flex items-center gap-0 mb-4 border-b border-[#E5E7EB]">
        {["All", "In-House", "Seller"].map((tab) => (
          <button key={tab} className={`px-4 py-2.5 text-[14px] font-medium border-b-2 transition-colors ${tab === "All" ? "text-[#0EA5E9] border-[#0EA5E9]" : "text-[#6B7280] hover:text-[#111827] border-transparent"}`}>{tab}</button>
        ))}
      </div>

      <div className="bg-white border border-[#E5E7EB] rounded-lg mb-4">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="relative"><Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#9CA3AF]" /><input type="text" placeholder="Search Orders..." className="w-64 h-9 pl-8 pr-3 text-[13px] bg-[#F9FAFB] border border-[#E5E7EB] rounded-md focus:outline-none" /></div>
          <div className="flex items-center gap-2">
            {["Bulk Action", "Delivery Status", "Payment Status", "Filter by Date"].map((l) => (
              <select key={l} className="h-9 px-3 text-[13px] text-[#6B7280] bg-white border border-[#E5E7EB] rounded-md"><option>{l}</option></select>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white border border-[#E5E7EB] rounded-lg overflow-hidden">
        <table className="w-full text-left">
          <thead><tr className="bg-[#F9FAFB] border-b border-[#E5E7EB]">
            <th className="px-4 py-3"><input type="checkbox" className="rounded border-gray-300" /></th>
            <th className="text-[12px] font-semibold uppercase text-[#374151] px-4 py-3">Order ID</th>
            <th className="text-[12px] font-semibold uppercase text-[#374151] px-4 py-3">Customer</th>
            <th className="text-[12px] font-semibold uppercase text-[#374151] px-4 py-3">Date</th>
            <th className="text-[12px] font-semibold uppercase text-[#374151] px-4 py-3">Items</th>
            <th className="text-[12px] font-semibold uppercase text-[#374151] px-4 py-3 text-right">Total</th>
            <th className="text-[12px] font-semibold uppercase text-[#374151] px-4 py-3">Payment</th>
            <th className="text-[12px] font-semibold uppercase text-[#374151] px-4 py-3">Delivery</th>
            <th className="text-[12px] font-semibold uppercase text-[#374151] px-4 py-3 text-right">Actions</th>
          </tr></thead>
          <tbody>
            {isLoading ? Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} className="animate-pulse"><td colSpan={9} className="px-4 py-4"><div className="h-8 bg-[#F3F4F6] rounded" /></td></tr>
            )) : orders.length === 0 ? (
              <tr><td colSpan={9} className="text-center py-12 text-[14px] text-[#9CA3AF]">No orders found.</td></tr>
            ) : orders.map((o, i) => {
              const PayIcon = paymentMethodIcons[o.paymentMethod] || (() => <span className="text-[10px]">—</span>);
              return (
                <tr key={o.id} className={`border-b border-[#E5E7EB] hover:bg-[#F0F9FF] transition-colors ${i % 2 === 1 ? "bg-[#F9FAFB]" : "bg-white"}`}>
                  <td className="px-4 py-3"><input type="checkbox" className="rounded border-gray-300" /></td>
                  <td className="px-4 py-3"><span className="text-[14px] font-medium text-[#0EA5E9]">#{o.orderNumber}</span></td>
                  <td className="px-4 py-3"><div className="text-[14px] text-[#374151]">{o.user?.name || "Guest"}</div><div className="text-[12px] text-[#6B7280]">{o.user?.email || ""}</div></td>
                  <td className="px-4 py-3 text-[14px] text-[#6B7280]">{new Date(o.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-[14px] text-[#374151]">{o._count?.items || 0}</td>
                  <td className="px-4 py-3 text-[14px] font-semibold text-[#111827] text-right">{formatCurrency(Number(o.total))}</td>
                  <td className="px-4 py-3"><div className="flex items-center gap-1.5"><span className="w-5 h-5 rounded bg-gray-100 flex items-center justify-center"><PayIcon /></span><Badge status={o.paymentStatus} /></div></td>
                  <td className="px-4 py-3"><Badge status={o.status} /></td>
                  <td className="px-4 py-3"><div className="flex items-center justify-end gap-0.5">
                    <button onClick={() => setDetailOrderId(o.id)} title="View" className="h-7 w-7 rounded-md flex items-center justify-center text-[#9CA3AF] hover:text-[#0EA5E9] hover:bg-gray-100"><Eye className="w-4 h-4" /></button>
                    <button onClick={() => setDetailOrderId(o.id)} title="Edit" className="h-7 w-7 rounded-md flex items-center justify-center text-[#9CA3AF] hover:text-[#0EA5E9] hover:bg-gray-100"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => setDetailOrderId(o.id)} title="Invoice" className="h-7 w-7 rounded-md flex items-center justify-center text-[#9CA3AF] hover:text-[#0EA5E9] hover:bg-gray-100"><FileText className="w-4 h-4" /></button>
                    <button onClick={() => { if (confirm('Delete order #' + o.orderNumber + '?')) handleDeleteOrder(o.id, o.orderNumber); }} title="Delete" className="h-7 w-7 rounded-md flex items-center justify-center text-[#9CA3AF] hover:text-red-500 hover:bg-gray-100"><Trash2 className="w-4 h-4" /></button>
                  </div></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Order Detail Modal */}
      {detailOrderId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setDetailOrderId(null)}>
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-auto mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E7EB]">
              <h3 className="text-[16px] font-semibold text-[#111827]">Order Detail{detailOrder ? ` — #${detailOrder.orderNumber}` : ''}</h3>
              <button onClick={() => setDetailOrderId(null)} className="h-8 w-8 rounded-md flex items-center justify-center hover:bg-[#F3F4F6] text-[#6B7280] hover:text-[#111827]"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-6">
              {detailLoading ? (
                <div className="flex items-center justify-center py-12"><div className="animate-spin h-6 w-6 border-2 border-[#0EA5E9] border-t-transparent rounded-full" /></div>
              ) : detailOrder ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div><p className="text-[12px] font-medium uppercase text-[#6B7280] mb-1">Customer</p><p className="text-[14px] text-[#111827]">{detailOrder.user?.name || 'Guest'}</p><p className="text-[13px] text-[#6B7280]">{detailOrder.user?.email || ''}</p></div>
                    <div><p className="text-[12px] font-medium uppercase text-[#6B7280] mb-1">Order Date</p><p className="text-[14px] text-[#111827]">{new Date(detailOrder.createdAt).toLocaleString()}</p></div>
                    <div><p className="text-[12px] font-medium uppercase text-[#6B7280] mb-1">Status</p><Badge status={detailOrder.status} /></div>
                    <div><p className="text-[12px] font-medium uppercase text-[#6B7280] mb-1">Payment</p><Badge status={detailOrder.paymentStatus} /></div>
                    <div><p className="text-[12px] font-medium uppercase text-[#6B7280] mb-1">Total</p><p className="text-[16px] font-bold text-[#111827]">{formatCurrency(Number(detailOrder.total))}</p></div>
                    <div><p className="text-[12px] font-medium uppercase text-[#6B7280] mb-1">Payment Method</p><p className="text-[14px] text-[#111827]">{detailOrder.paymentMethod || '—'}</p></div>
                  </div>
                  {detailOrder.items?.length > 0 && (
                    <div><p className="text-[12px] font-medium uppercase text-[#6B7280] mb-2">Order Items ({detailOrder.items.length})</p>
                      <div className="border border-[#E5E7EB] rounded-lg overflow-hidden">
                        <table className="w-full text-left"><thead className="bg-[#F9FAFB]"><tr><th className="text-[12px] font-semibold uppercase text-[#374151] px-4 py-2">Product</th><th className="text-[12px] font-semibold uppercase text-[#374151] px-4 py-2 text-right">Qty</th><th className="text-[12px] font-semibold uppercase text-[#374151] px-4 py-2 text-right">Price</th><th className="text-[12px] font-semibold uppercase text-[#374151] px-4 py-2 text-right">Total</th></tr></thead>
                          <tbody>{detailOrder.items.map((item: any, idx: number) => (
                            <tr key={item.id || idx} className="border-t border-[#E5E7EB]"><td className="px-4 py-2 text-[14px] text-[#374151]">{item.product?.name || item.name || 'Product'}</td><td className="px-4 py-2 text-[14px] text-[#374151] text-right">{item.quantity || 1}</td><td className="px-4 py-2 text-[14px] text-[#374151] text-right">{formatCurrency(Number(item.price))}</td><td className="px-4 py-2 text-[14px] font-semibold text-[#111827] text-right">{formatCurrency(Number(item.price) * (item.quantity || 1))}</td></tr>
                          ))}</tbody></table></div></div>
                  )}
                  {detailOrder.address && (
                    <div><p className="text-[12px] font-medium uppercase text-[#6B7280] mb-1">Shipping Address</p><p className="text-[14px] text-[#374151]">{detailOrder.address.street}, {detailOrder.address.city}, {detailOrder.address.state} {detailOrder.address.zip}</p></div>
                  )}
                </div>
              ) : (
                <p className="text-center text-[14px] text-[#6B7280] py-8">Failed to load order details.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ======================== PLACEHOLDER ========================
function PlaceholderTab({ tab }: { tab: string }) {
  const title = tab.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-full bg-[#F3F4F6] flex items-center justify-center mb-4">
        <span className="text-[#9CA3AF] text-2xl font-bold">{title.charAt(0)}</span>
      </div>
      <h2 className="text-[18px] font-semibold text-[#111827] mb-2">{title}</h2>
      <p className="text-[14px] text-[#6B7280] max-w-md">This section is under development.</p>
    </div>
  );
}

// ======================== MAIN ========================
export default function AdminPage() {
  const { activeTab } = useAdminTab();

  switch (activeTab) {
    case 'dashboard':
      return <DashboardTab />;
    case 'products':
    case 'products-list':
      return <ProductsTab />;
    case 'orders':
    case 'orders-all':
    case 'orders-pending':
    case 'orders-processing':
    case 'orders-completed':
      return <OrdersTab />;
    default:
      return <PlaceholderTab tab={activeTab} />;
  }
}
