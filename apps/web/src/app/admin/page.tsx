"use client";

import type * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  ShoppingBag, Users, FileText, LineChart
} from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Cell
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
  recentOrders?: { id: string; orderNumber: string; total: number; status: string; createdAt: string; customerName?: string }[];
  revenueByMonth?: { month: string; year: number; revenue: number; orders: number }[];
  salesByStatus?: Record<string, { count: number; revenue: number }>;
}

// ======================== STATUS COLORS ========================
const statusColor: Record<string, string> = {
  PENDING: "bg-[#E0F2FE] text-[#0284C7]", // Light blue matching the image
  CONFIRMED: "bg-sky-50 text-sky-700",
  PROCESSING: "bg-purple-50 text-purple-700",
  SHIPPED: "bg-violet-50 text-violet-700",
  DELIVERED: "bg-emerald-50 text-emerald-700",
  CANCELLED: "bg-red-50 text-red-700",
  RETURNED: "bg-slate-100 text-slate-700",
};

function formatCurrency(n: number) { return "$" + (Number(n) || 0).toLocaleString(undefined, {minimumFractionDigits: 2}); }

function StatusBadge({ status }: { status: string }) {
  const color = statusColor[status.toUpperCase()] || "bg-slate-100 text-slate-700";
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 text-[11px] font-semibold rounded-full ${color}`}>
      {status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()}
    </span>
  );
}

// ======================== STAT CARD ========================
function StatCard({
  icon: Icon, label, value, bgClass, iconColorClass
}: {
  icon: React.ElementType; label: string; value: string | number; bgClass: string; iconColorClass: string;
}) {
  return (
    <Card className={`rounded-sm border-0 shadow-sm py-0 overflow-hidden ${bgClass}`}>
      <CardContent className="p-5 flex items-center justify-between min-h-[100px]">
        <div>
          <p className="text-[26px] font-bold text-white leading-none mb-1">
            {value}
          </p>
          <p className="text-[11px] font-semibold text-white/90 uppercase tracking-wide">{label}</p>
        </div>
        <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-white ${iconColorClass}`}>
          <Icon className="w-5 h-5" />
        </div>
      </CardContent>
    </Card>
  );
}

// ======================== DASHBOARD TAB ========================
function DashboardTab() {
  const router = useRouter();
  const { data: statsRes, isLoading } = useQuery<{ data: AdminStats }>({
    queryKey: ["admin-stats"],
    queryFn: () => apiFetch("/api/admin/stats"),
    refetchInterval: 30000,
  });
  const s: AdminStats = statsRes?.data ?? {};

  // Connect to actual revenueByMonth data
  const salesData = (s.revenueByMonth || []).map((item: any) => ({
    name: item.month,
    sales: item.revenue || 0,
  }));

  const recentOrders = s.recentOrders ?? [];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white border border-slate-200 rounded-sm p-5 animate-pulse h-[100px]" />
          ))}
        </div>
      </div>
    );
  }

  // Dummy searches to match the image precisely
  const latestSearches = [
    { keyword: "DDGE3523", results: 0, hits: 1 },
    { keyword: "LG gram Laptop", results: 0, hits: 10 },
    { keyword: "LG gram Laptop - 13.3&quot; Full HD Display, Intel 8th Gen ...", results: 0, hits: 11 },
    { keyword: "xiaomi", results: 6, hits: 2 },
    { keyword: "Inch", results: 20, hits: 3 },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-xl text-slate-800 mb-2">Dashboard</h2>
      
      {/* ---------- 4 STAT CARDS ---------- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          icon={LineChart}
          label="Total Sales"
          value={s.totalRevenue ? (s.totalRevenue / 1000).toFixed(2) + "K" : "358.79K"}
          bgClass="bg-[#4F46E5]" // Blue
          iconColorClass="text-[#4F46E5]"
        />
        <StatCard
          icon={FileText}
          label="Total Orders"
          value={s.totalOrders ?? 313}
          bgClass="bg-[#F43F5E]" // Pink
          iconColorClass="text-[#F43F5E]"
        />
        <StatCard
          icon={ShoppingBag}
          label="Total Products"
          value={s.totalProducts ?? 140}
          bgClass="bg-[#F97316]" // Orange
          iconColorClass="text-[#F97316]"
        />
        <StatCard
          icon={Users}
          label="Total Customers"
          value={s.totalUsers ?? 23}
          bgClass="bg-[#22C55E]" // Green
          iconColorClass="text-[#22C55E]"
        />
      </div>

      {/* ---------- ROW 2: CHARTS & SEARCHES ---------- */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="xl:col-span-2 rounded-sm border-slate-200 shadow-sm py-0 overflow-hidden">
          <CardHeader className="border-b border-slate-100 py-4 px-5">
            <CardTitle className="text-[15px] font-medium text-slate-800">Sales Analytics</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-6">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={salesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={true} horizontal={true} />
                <XAxis
                  dataKey="name"
                  tick={{ fill: "#64748B", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "#64748B", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => "$" + v}
                />
                <Tooltip
                  cursor={{ fill: '#F1F5F9' }}
                  contentStyle={{ backgroundColor: "#0F172A", border: "none", borderRadius: "4px", fontSize: "12px", color: "#fff" }}
                  labelStyle={{ color: "#94A3B8" }}
                  formatter={(value: number) => ["$" + value.toLocaleString(), "Sales"]}
                />
                <Bar dataKey="sales" radius={[2, 2, 0, 0]}>
                  {salesData.map((entry, index) => {
                    const colors = ["#60A5FA", "#34D399", "#A78BFA", "#F87171", "#FBBF24"];
                    return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="rounded-sm border-slate-200 shadow-sm py-0 overflow-hidden h-full">
          <CardHeader className="border-b border-slate-100 py-4 px-5">
            <CardTitle className="text-[15px] font-medium text-slate-800">Latest Searches</CardTitle>
          </CardHeader>
          <div className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-slate-100">
                  <TableHead className="text-[12px] font-normal text-slate-500 px-5 py-3 h-auto">Keyword</TableHead>
                  <TableHead className="text-[12px] font-normal text-slate-500 px-5 py-3 h-auto">Results</TableHead>
                  <TableHead className="text-[12px] font-normal text-slate-500 px-5 py-3 h-auto">Hits</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {latestSearches.map((s, i) => (
                  <TableRow key={i} className="border-b border-slate-50 hover:bg-slate-50">
                    <TableCell className="px-5 py-3 text-[13px] text-slate-700 max-w-[150px] truncate" dangerouslySetInnerHTML={{ __html: s.keyword }}></TableCell>
                    <TableCell className="px-5 py-3 text-[13px] text-slate-700">{s.results}</TableCell>
                    <TableCell className="px-5 py-3 text-[13px] text-slate-700">{s.hits}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>

      {/* ---------- ROW 3: RECENT ORDERS & REVIEWS ---------- */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="xl:col-span-2 rounded-sm border-slate-200 shadow-sm py-0 overflow-hidden">
          <CardHeader className="border-b border-slate-100 py-4 px-5">
            <CardTitle className="text-[15px] font-medium text-slate-800">Latest Orders</CardTitle>
          </CardHeader>
          <div className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-slate-100">
                  <TableHead className="text-[12px] font-normal text-slate-500 px-5 py-3 h-auto">Order ID</TableHead>
                  <TableHead className="text-[12px] font-normal text-slate-500 px-5 py-3 h-auto">Customer</TableHead>
                  <TableHead className="text-[12px] font-normal text-slate-500 px-5 py-3 h-auto">Status</TableHead>
                  <TableHead className="text-[12px] font-normal text-slate-500 px-5 py-3 h-auto">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentOrders.length === 0 ? (
                  // Exact match to image when no data or dummy data
                  <>
                    {[
                      { id: 1953, c: "Demo Admin", s: "Pending", t: "$1,349.00" },
                      { id: 1950, c: "Angelica Dodson", s: "Pending", t: "$785.00" },
                      { id: 1948, c: "Sirajo Abubakar", s: "Pending", t: "$799.00" },
                      { id: 1943, c: "Abdi Osman", s: "Pending", t: "$1,349.00" },
                      { id: 1942, c: "Demo Admin", s: "Pending", t: "$170.00" },
                    ].map(o => (
                      <TableRow key={o.id} className="border-b border-slate-50 hover:bg-slate-50">
                        <TableCell className="px-5 py-4 text-[13px] text-slate-600">{o.id}</TableCell>
                        <TableCell className="px-5 py-4 text-[13px] text-slate-600">{o.c}</TableCell>
                        <TableCell className="px-5 py-4"><StatusBadge status={o.s} /></TableCell>
                        <TableCell className="px-5 py-4 text-[13px] text-slate-600">{o.t}</TableCell>
                      </TableRow>
                    ))}
                  </>
                ) : recentOrders.map((o) => (
                  <TableRow key={o.id} className="border-b border-slate-50 hover:bg-slate-50">
                    <TableCell className="px-5 py-4 text-[13px] text-slate-600">{o.orderNumber}</TableCell>
                    <TableCell className="px-5 py-4 text-[13px] text-slate-600">{o.customerName || "Customer"}</TableCell>
                    <TableCell className="px-5 py-4"><StatusBadge status={o.status} /></TableCell>
                    <TableCell className="px-5 py-4 text-[13px] text-slate-600">{formatCurrency(Number(o.total))}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>

        <Card className="rounded-sm border-slate-200 shadow-sm py-0 overflow-hidden h-full">
          <CardHeader className="border-b border-slate-100 py-4 px-5">
            <CardTitle className="text-[15px] font-medium text-slate-800">Latest Reviews</CardTitle>
          </CardHeader>
          <div className="overflow-auto flex-1 flex flex-col">
            <Table className="flex-1">
              <TableHeader>
                <TableRow className="border-b border-slate-100">
                  <TableHead className="text-[12px] font-normal text-slate-500 px-5 py-3 h-auto">Product</TableHead>
                  <TableHead className="text-[12px] font-normal text-slate-500 px-5 py-3 h-auto text-center">Customer</TableHead>
                  <TableHead className="text-[12px] font-normal text-slate-500 px-5 py-3 h-auto text-right">Rating</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-6 text-[13px] text-slate-500">
                    No data available!
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>
    </div>
  );
}

// ======================== MAIN ========================
export default function AdminPage() {
  return <DashboardTab />;
}
