"use client";

import { motion } from "framer-motion";
import {
  LayoutDashboard, CalendarCheck, ShoppingBag, Mail, Wrench, Package,
  Star, Users, DollarSign, RotateCcw, Zap,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { formatTaka, formatDate, StatusBadge, TableSkeleton, bookingStatusMap, orderStatusMap } from "../shared";
import type { AdminStats, BookingItem, Order } from "../types";

const statCards = [
  { label: "Products", key: "totalProducts" as const, icon: Package, bg: "bg-[#0EA5E9]/10", iconColor: "text-[#0EA5E9]" },
  { label: "Services", key: "totalServices" as const, icon: Wrench, bg: "bg-[#8b5cf6]/10", iconColor: "text-[#8b5cf6]" },
  { label: "Orders", key: "totalOrders" as const, icon: ShoppingBag, bg: "bg-[#f59e0b]/10", iconColor: "text-[#f59e0b]" },
  { label: "Bookings", key: "totalBookings" as const, icon: CalendarCheck, bg: "bg-[#10b981]/10", iconColor: "text-[#10b981]" },
  { label: "Revenue", key: "totalRevenue" as const, icon: DollarSign, bg: "bg-[#0EA5E9]/10", iconColor: "text-[#0EA5E9]", isCurrency: true },
  { label: "Users", key: "totalUsers" as const, icon: Users, bg: "bg-[#6366f1]/10", iconColor: "text-[#6366f1]" },
  { label: "Reviews", key: "totalReviews" as const, icon: Star, bg: "bg-[#f59e0b]/10", iconColor: "text-[#f59e0b]" },
  { label: "Messages", key: "totalMessages" as const, icon: Mail, bg: "bg-[#ef4444]/10", iconColor: "text-[#ef4444]" },
];

const alertCards = [
  { label: "Pending Orders", key: "pendingOrders" as const, icon: ShoppingBag, color: "border-l-[#f59e0b]", bg: "bg-[#f59e0b]/5", iconBg: "bg-[#f59e0b]/10", iconColor: "text-[#f59e0b]" },
  { label: "Pending Bookings", key: "pendingBookings" as const, icon: CalendarCheck, color: "border-l-[#8b5cf6]", bg: "bg-[#8b5cf6]/5", iconBg: "bg-[#8b5cf6]/10", iconColor: "text-[#8b5cf6]" },
  { label: "Unread Messages", key: "unreadMessages" as const, icon: Mail, color: "border-l-[#ef4444]", bg: "bg-[#ef4444]/5", iconBg: "bg-[#ef4444]/10", iconColor: "text-[#ef4444]" },
  { label: "Pending Returns", key: "pendingReturns" as const, icon: RotateCcw, color: "border-l-[#10b981]", bg: "bg-[#10b981]/5", iconBg: "bg-[#10b981]/10", iconColor: "text-[#10b981]" },
];

export default function DashboardSection({ stats, isLoading, bookings, orders, bookingsLoading, ordersLoading }: {
  stats: AdminStats | undefined; isLoading: boolean; bookings: BookingItem[]; orders: Order[]; bookingsLoading: boolean; ordersLoading: boolean;
}) {
  const recentOrders = orders.slice(0, 5);
  const recentBookings = bookings.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          const value = stats?.[card.key] ?? 0;
          return (
            <motion.div key={card.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
              <Card className="border border-[#e2e8f0] shadow-sm bg-white">
                <CardContent className="p-4">
                  {isLoading ? (
                    <div className="space-y-2">
                      <Skeleton className="h-9 w-9 rounded-lg" />
                      <Skeleton className="h-3 w-16" />
                      <Skeleton className="h-6 w-12" />
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <div className={`h-10 w-10 rounded-lg ${card.bg} flex items-center justify-center shrink-0`}>
                        <Icon className={`h-5 w-5 ${card.iconColor}`} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[12px] text-[#64748b] font-medium">{card.label}</p>
                        <p className="text-[20px] font-bold text-[#111827] leading-tight mt-0.5">
                          {"isCurrency" in card && card.isCurrency ? formatTaka(value as number) : value}
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Alert Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {alertCards.map((card, i) => {
          const Icon = card.icon;
          const value = stats?.[card.key] ?? 0;
          if (!isLoading && value === 0) return null;
          return (
            <motion.div key={card.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.05 }}>
              <Card className={`border border-[#e2e8f0] border-l-4 ${card.color} shadow-sm bg-white`}>
                <CardContent className="p-3.5 flex items-center gap-3">
                  <div className={`h-9 w-9 rounded-lg ${card.iconBg} flex items-center justify-center shrink-0`}>
                    <Icon className={`h-4 w-4 ${card.iconColor}`} />
                  </div>
                  <div>
                    <p className="text-[20px] font-bold text-[#111827] leading-tight">{isLoading ? "—" : value}</p>
                    <p className="text-[12px] text-[#64748b]">{card.label}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Orders */}
        <Card className="border border-[#e2e8f0] shadow-sm bg-white">
          <CardHeader className="pb-3 px-5 pt-4">
            <CardTitle className="text-[14px] font-semibold text-[#111827]">Recent Orders</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {ordersLoading ? (
              <TableSkeleton rows={3} cols={4} />
            ) : recentOrders.length === 0 ? (
              <div className="py-10 text-center text-[13px] text-[#94a3b8]">No orders yet</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-[#e2e8f0] bg-[#f8fafc]">
                    <TableHead className="text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">Order</TableHead>
                    <TableHead className="text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">Customer</TableHead>
                    <TableHead className="text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">Amount</TableHead>
                    <TableHead className="text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentOrders.map((o) => (
                    <TableRow key={o.id} className="border-b border-[#f1f5f9] hover:bg-[#f8fafc] transition-colors">
                      <TableCell className="text-[13px] font-mono text-[#0EA5E9] font-medium">#{o.orderNumber.slice(-8)}</TableCell>
                      <TableCell className="text-[13px] text-[#374151]">{o.customerName}</TableCell>
                      <TableCell className="text-[13px] font-semibold text-[#111827]">{formatTaka(o.totalAmount)}</TableCell>
                      <TableCell><StatusBadge status={o.status} map={orderStatusMap} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Recent Bookings */}
        <Card className="border border-[#e2e8f0] shadow-sm bg-white">
          <CardHeader className="pb-3 px-5 pt-4">
            <CardTitle className="text-[14px] font-semibold text-[#111827]">Recent Bookings</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {bookingsLoading ? (
              <TableSkeleton rows={3} cols={4} />
            ) : recentBookings.length === 0 ? (
              <div className="py-10 text-center text-[13px] text-[#94a3b8]">No bookings yet</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-[#e2e8f0] bg-[#f8fafc]">
                    <TableHead className="text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">Service</TableHead>
                    <TableHead className="text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">Customer</TableHead>
                    <TableHead className="text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">Date</TableHead>
                    <TableHead className="text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentBookings.map((b) => (
                    <TableRow key={b.id} className="border-b border-[#f1f5f9] hover:bg-[#f8fafc] transition-colors">
                      <TableCell className="text-[13px] font-medium text-[#111827]">{b.service.name}</TableCell>
                      <TableCell className="text-[13px] text-[#374151]">{b.customerName}</TableCell>
                      <TableCell className="text-[13px] text-[#64748b]">{b.preferredDate ? formatDate(b.preferredDate) : "—"}</TableCell>
                      <TableCell><StatusBadge status={b.status} map={bookingStatusMap} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}