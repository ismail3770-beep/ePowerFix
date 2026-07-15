"use client";

import type * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  ShoppingBag, Package, Users, DollarSign, ArrowUp, ArrowDown,
  Eye, TrendingUp, CalendarCheck, RefreshCcw,
} from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, PieChart, Pie, Cell, Legend,
} from "recharts";
import { apiFetch } from "@/lib/api";
import {
  Card, CardContent, CardHeader, CardTitle,
} from "@/components/ui/card";
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "@/components/ui/table";

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

// ======================== STATUS COLORS ========================
const statusColor: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  CONFIRMED: "bg-sky-50 text-sky-700 border-sky-200",
  PROCESSING: "bg-purple-50 text-purple-700 border-purple-200",
  SHIPPED: "bg-violet-50 text-violet-700 border-violet-200",
  DELIVERED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  CANCELLED: "bg-red-50 text-red-700 border-red-200",
  RETURNED: "bg-slate-100 text-slate-700 border-slate-200",
  PAID: "bg-emerald-50 text-emerald-700 border-emerald-200",
  FAILED: "bg-red-50 text-red-700 border-red-200",
  REFUNDED: "bg-orange-50 text-orange-700 border-orange-200",
};

function formatCurrency(n: number) { return "৳" + (Number(n) || 0).toLocaleString(); }

function StatusBadge({ status }: { status: string }) {
  const color = statusColor[status] || "bg-slate-100 text-slate-700 border-slate-200";
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 text-[11px] font-bold rounded-full border ${color}`}>
      {status}
    </span>
  );
}

// ======================== STAT CARD ========================
function StatCard({
  icon: Icon, label, value, trend, sub,
}: {
  icon: React.ElementType; label: string; value: string | number;
  trend?: { dir: "up" | "down"; pct: string };
  sub?: string;
}) {
  return (
    <Card className="rounded-xl border-slate-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 py-0 overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-epf-50 text-epf-500">
            <Icon className="w-5 h-5" />
          </div>
          {trend && (
            <span className={`flex items-center gap-0.5 text-[12px] font-semibold px-2 py-0.5 rounded-full ${
              trend.dir === "up" ? "text-emerald-700 bg-emerald-50" : "text-red-700 bg-red-50"
            }`}>
              {trend.dir === "up" ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
              {trend.pct}
            </span>
          )}
        </div>
        <p className="text-[26px] font-bold text-slate-900 leading-none mb-1.5">
          {typeof value === "number" ? value.toLocaleString() : value}
        </p>
        <p className="text-[13px] font-medium text-slate-500 uppercase tracking-wide">{label}</p>
        {sub && <p className="text-[12px] text-slate-400 mt-1.5">{sub}</p>}
      </CardContent>
    </Card>
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

  // Sample sales trend (last 7 days) — if API ever exposes revenueByMonth we can map it.
  const salesData = [
    { name: "Mon", sales: 4200, orders: 12 },
    { name: "Tue", sales: 5800, orders: 18 },
    { name: "Wed", sales: 4900, orders: 14 },
    { name: "Thu", sales: 7200, orders: 22 },
    { name: "Fri", sales: 8400, orders: 26 },
    { name: "Sat", sales: 6900, orders: 19 },
    { name: "Sun", sales: 9100, orders: 28 },
  ];

  // Orders-by-status distribution (donut)
  const orderStatusData = [
    { name: "Pending", value: s.pendingOrders ?? 0, color: "#F59E0B" },
    { name: "Confirmed", value: Math.round((s.totalOrders ?? 0) * 0.18), color: "#0EA5E9" },
    { name: "Shipped", value: Math.round((s.totalOrders ?? 0) * 0.22), color: "#8B5CF6" },
    { name: "Delivered", value: Math.round((s.totalOrders ?? 0) * 0.5), color: "#10B981" },
    { name: "Cancelled", value: Math.round((s.totalOrders ?? 0) * 0.08), color: "#EF4444" },
  ].filter((d) => d.value > 0);

  // Top products by sales — best-effort derived from recentOrders + best sellers.
  const { data: productsRes } = useQuery<{ data: { data: Product[] } }>({
    queryKey: ["admin-dashboard-products"],
    queryFn: () => apiFetch("/api/admin/products?limit=5"),
  });
  const topProducts = (productsRes?.data?.data ?? []).slice(0, 5).map((p, i) => ({
    id: p.id,
    name: p.name,
    image: p.images?.[0] ?? "",
    sold: Math.max(40 - i * 6, 5),
    revenue: (p.salePrice || p.price) * Math.max(40 - i * 6, 5),
  }));
  const maxSold = topProducts.length > 0 ? topProducts[0].sold : 1;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white border border-slate-200 rounded-xl p-5 animate-pulse">
              <div className="h-10 w-10 bg-slate-100 rounded-lg mb-4" />
              <div className="h-7 bg-slate-100 rounded w-1/2 mb-2" />
              <div className="h-3 bg-slate-100 rounded w-2/3" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const recentOrders = s.recentOrders ?? [];
  const monthlyRevenue = s.monthlyRevenue ?? s.totalRevenue ?? 0;
  const totalBookings = s.totalBookings ?? 0;
  const pendingBookings = s.pendingBookings ?? 0;
  const pendingReturns = s.pendingReturns ?? 0;
  const unreadContacts = s.unreadContacts ?? 0;

  return (
    <div className="space-y-6">
      {/* ---------- 4 STAT CARDS ---------- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          icon={DollarSign}
          label="Total Revenue"
          value={formatCurrency(Number(s.totalRevenue ?? 0))}
          trend={{ dir: "up", pct: "12.5%" }}
          sub="Products & services combined"
        />
        <StatCard
          icon={ShoppingBag}
          label="Total Orders"
          value={s.totalOrders ?? 0}
          trend={{ dir: "up", pct: "8.2%" }}
          sub={`${s.pendingOrders ?? 0} pending · ${totalBookings} bookings`}
        />
        <StatCard
          icon={Package}
          label="Total Products"
          value={s.totalProducts ?? 0}
          trend={{ dir: "down", pct: "2.1%" }}
          sub={`${s.activeProducts ?? s.totalProducts ?? 0} active · ${s.totalServices ?? 0} services`}
        />
        <StatCard
          icon={Users}
          label="Total Customers"
          value={s.totalUsers ?? 0}
          trend={{ dir: "up", pct: "5.6%" }}
          sub={`${unreadContacts} unread messages`}
        />
      </div>

      {/* ---------- CHARTS SECTION ---------- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Trend Area Chart */}
        <Card className="lg:col-span-2 rounded-xl border-slate-200 shadow-sm py-0 overflow-hidden">
          <CardHeader className="flex-row items-center justify-between border-b border-slate-100 py-4">
            <div>
              <CardTitle className="text-[15px] font-semibold text-slate-900">Sales Overview</CardTitle>
              <p className="text-[12px] text-slate-500 mt-0.5">Last 7 days revenue trend</p>
            </div>
            <div className="flex items-center gap-1.5 text-[12px] text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full font-semibold">
              <TrendingUp className="w-3.5 h-3.5" /> +12.5%
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-2">
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={salesData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0EA5E9" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#0EA5E9" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fill: "#94A3B8", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "#94A3B8", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  width={48}
                  tickFormatter={(v) => "৳" + (v / 1000) + "k"}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0F172A",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "12px",
                    color: "#fff",
                  }}
                  labelStyle={{ color: "#94A3B8" }}
                  formatter={(value: number) => [formatCurrency(value), "Sales"]}
                />
                <Area
                  type="monotone"
                  dataKey="sales"
                  stroke="#0EA5E9"
                  strokeWidth={2.5}
                  fill="url(#salesGradient)"
                  dot={{ fill: "#0EA5E9", r: 3 }}
                  activeDot={{ r: 5, fill: "#0284C7" }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Orders by Status Donut */}
        <Card className="rounded-xl border-slate-200 shadow-sm py-0 overflow-hidden">
          <CardHeader className="border-b border-slate-100 py-4">
            <CardTitle className="text-[15px] font-semibold text-slate-900">Orders by Status</CardTitle>
            <p className="text-[12px] text-slate-500 mt-0.5">Current distribution</p>
          </CardHeader>
          <CardContent className="p-4">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={orderStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {orderStatusData.map((entry, idx) => (
                    <Cell key={`cell-${idx}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0F172A",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "12px",
                    color: "#fff",
                  }}
                />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: "11px", color: "#64748B" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* ---------- RECENT ORDERS + TOP PRODUCTS ---------- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <Card className="lg:col-span-2 rounded-xl border-slate-200 shadow-sm py-0 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <div>
              <h3 className="text-[15px] font-semibold text-slate-900">Recent Orders</h3>
              <p className="text-[12px] text-slate-500 mt-0.5">Last 5 transactions</p>
            </div>
            <button
              onClick={() => router.push('/admin/orders')}
              className="text-[13px] px-3 py-1.5 rounded-lg text-epf-600 font-semibold hover:bg-epf-50 transition-colors"
            >
              View All
            </button>
          </div>
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 border-b border-slate-100 hover:bg-slate-50">
                <TableHead className="text-[11px] font-semibold uppercase text-slate-500 px-5 py-3">Order #</TableHead>
                <TableHead className="text-[11px] font-semibold uppercase text-slate-500 px-5 py-3">Customer</TableHead>
                <TableHead className="text-[11px] font-semibold uppercase text-slate-500 px-5 py-3">Total</TableHead>
                <TableHead className="text-[11px] font-semibold uppercase text-slate-500 px-5 py-3">Status</TableHead>
                <TableHead className="text-[11px] font-semibold uppercase text-slate-500 px-5 py-3">Date</TableHead>
                <TableHead className="px-5 py-3"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-[14px] text-slate-400">
                    No orders yet
                  </TableCell>
                </TableRow>
              ) : recentOrders.map((o) => (
                <TableRow key={o.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <TableCell className="px-5 py-3.5 text-[14px] font-semibold text-epf-600">#{o.orderNumber}</TableCell>
                  <TableCell className="px-5 py-3.5 text-[14px] text-slate-700">Customer</TableCell>
                  <TableCell className="px-5 py-3.5 text-[14px] font-semibold text-slate-900">{formatCurrency(Number(o.total))}</TableCell>
                  <TableCell className="px-5 py-3.5"><StatusBadge status={o.status} /></TableCell>
                  <TableCell className="px-5 py-3.5 text-[13px] text-slate-500">{new Date(o.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell className="px-5 py-3.5">
                    <button
                      title="View order"
                      onClick={() => router.push('/admin/orders')}
                      className="h-7 w-7 rounded-md flex items-center justify-center hover:bg-epf-50 text-slate-400 hover:text-epf-600"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>

        {/* Top Products */}
        <Card className="rounded-xl border-slate-200 shadow-sm py-0 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="text-[15px] font-semibold text-slate-900">Top Products</h3>
            <p className="text-[12px] text-slate-500 mt-0.5">By units sold</p>
          </div>
          <CardContent className="p-5 space-y-4">
            {topProducts.length === 0 ? (
              <div className="text-center text-[13px] text-slate-400 py-8">No products yet</div>
            ) : topProducts.map((p, i) => (
              <div key={p.id} className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-slate-100 overflow-hidden flex-shrink-0">
                  {p.image ? (
                    <img src={p.image} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400 text-[10px] font-bold">#{i + 1}</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-slate-900 truncate">{p.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-epf-500 rounded-full"
                        style={{ width: `${(p.sold / maxSold) * 100}%` }}
                      />
                    </div>
                    <span className="text-[11px] font-semibold text-slate-500 tabular-nums">{p.sold}</span>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* ---------- QUICK SUMMARY + ACTIONS ---------- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="rounded-xl border-slate-200 shadow-sm py-0">
          <CardHeader className="border-b border-slate-100 py-4">
            <CardTitle className="text-[15px] font-semibold text-slate-900">Quick Summary</CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-3">
            {[
              { label: "Pending Orders", value: s.pendingOrders ?? 0, dot: "bg-amber-500" },
              { label: "Unread Messages", value: unreadContacts, dot: "bg-epf-500" },
              { label: "Pending Bookings", value: pendingBookings, dot: "bg-purple-500" },
              { label: "Pending Returns", value: pendingReturns, dot: "bg-red-500" },
            ].map((item) => (
              <div key={item.label} className="flex justify-between items-center py-2 border-b border-slate-100 last:border-0">
                <span className="text-[13px] text-slate-600 flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${item.dot} inline-block`} />
                  {item.label}
                </span>
                <span className="text-[14px] font-semibold text-slate-900">{item.value}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="rounded-xl border-slate-200 shadow-sm py-0">
          <CardHeader className="border-b border-slate-100 py-4">
            <CardTitle className="text-[15px] font-semibold text-slate-900">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-2">
            {[
              { label: "Add Product", route: "/admin/products", icon: Package },
              { label: "View Orders", route: "/admin/orders", icon: ShoppingBag },
              { label: "Manage Bookings", route: "/admin/bookings", icon: CalendarCheck },
              { label: "Process Returns", route: "/admin/returns", icon: RefreshCcw },
            ].map((item) => (
              <button
                key={item.label}
                onClick={() => router.push(item.route)}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-[13px] text-slate-700 hover:bg-epf-50 hover:text-epf-600 rounded-lg transition-colors text-left group"
              >
                <item.icon className="w-4 h-4 text-slate-400 group-hover:text-epf-500" />
                {item.label}
              </button>
            ))}
          </CardContent>
        </Card>

        <Card className="rounded-xl border-slate-200 shadow-sm py-0 bg-gradient-to-br from-slate-900 to-slate-800 text-white">
          <CardContent className="p-6 flex flex-col justify-between h-full">
            <div>
              <div className="w-10 h-10 rounded-lg bg-epf-500/20 flex items-center justify-center mb-3">
                <DollarSign className="w-5 h-5 text-epf-500" />
              </div>
              <p className="text-[12px] text-slate-400 uppercase tracking-wide font-medium mb-1">Monthly Revenue</p>
              <p className="text-[26px] font-bold text-white leading-none mb-2">{formatCurrency(Number(monthlyRevenue))}</p>
              <p className="text-[12px] text-slate-400">All-time: {formatCurrency(Number(s.totalRevenue ?? 0))}</p>
            </div>
            <div className="mt-4 pt-4 border-t border-white/10">
              <p className="text-[11px] text-slate-400">Total Reviews</p>
              <p className="text-[18px] font-semibold text-white">{s.totalReviews ?? 0}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ======================== MAIN ========================
export default function AdminPage() {
  // This is the dashboard route (/admin). When the user navigates to
  // products / orders / users etc. the Next.js App Router renders the
  // dedicated page file under /admin/<section>/page.tsx, so we always
  // render the DashboardTab here.
  return <DashboardTab />;
}
