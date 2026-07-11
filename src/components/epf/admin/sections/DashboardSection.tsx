"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  LayoutDashboard, CalendarCheck, ShoppingBag, Mail, Wrench, Package,
  Star, Users, DollarSign, RotateCcw, Zap, TrendingUp, ArrowRight,
  Clock, CheckCircle, Truck, XCircle, Eye,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { formatTaka, formatDate, StatusBadge, TableSkeleton, bookingStatusMap, orderStatusMap } from "../shared";
import type { AdminStats, BookingItem, Order } from "../types";

// Main stat cards — demo style with big numbers
const mainStatCards = [
  { label: "Total Customer", key: "totalUsers" as const, icon: Users, color: "#3b82f6", bgColor: "bg-blue-50" },
  { label: "Total Products", key: "totalProducts" as const, icon: Package, color: "#8b5cf6", bgColor: "bg-purple-50" },
  { label: "Total Sales", key: "totalRevenue" as const, icon: DollarSign, color: "#10b981", bgColor: "bg-emerald-50", isCurrency: true },
  { label: "Total Orders", key: "totalOrders" as const, icon: ShoppingBag, color: "#f59e0b", bgColor: "bg-amber-50" },
];

// Order status cards — colorful like demo
const orderStatusCards = [
  { label: "Total Order", key: "totalOrders" as const, icon: ShoppingBag, bg: "bg-[#7C3AED]", textColor: "text-white" },
  { label: "Pending", key: "pendingOrders" as const, icon: Clock, bg: "bg-blue-50", textColor: "text-blue-700" },
  { label: "Confirmed", key: "confirmedOrders" as const, icon: CheckCircle, bg: "bg-green-50", textColor: "text-green-700" },
  { label: "Shipped", key: "shippedOrders" as const, icon: Truck, bg: "bg-amber-50", textColor: "text-amber-700" },
  { label: "Cancelled", key: "cancelledOrders" as const, icon: XCircle, bg: "bg-red-50", textColor: "text-red-700" },
  { label: "Delivered", key: "deliveredOrders" as const, icon: CheckCircle, bg: "bg-emerald-50", textColor: "text-emerald-700" },
];

// Secondary stats
const secondaryStats = [
  { label: "Services", key: "totalServices" as const, icon: Wrench, color: "#8b5cf6" },
  { label: "Bookings", key: "totalBookings" as const, icon: CalendarCheck, color: "#ec4899" },
  { label: "Reviews", key: "totalReviews" as const, icon: Star, color: "#f59e0b" },
  { label: "Messages", key: "totalMessages" as const, icon: Mail, color: "#ef4444" },
  { label: "Returns", key: "totalReturns" as const, icon: RotateCcw, color: "#10b981" },
];

export default function DashboardSection({ stats, isLoading, bookings, orders, bookingsLoading, ordersLoading }: {
  stats: AdminStats | undefined; isLoading: boolean; bookings: BookingItem[]; orders: Order[]; bookingsLoading: boolean; ordersLoading: boolean;
}) {
  const recentOrders = orders.slice(0, 5);
  const recentBookings = bookings.slice(0, 5);

  const getStatValue = (key: string) => {
    if (!stats) {return 0;}
    return (stats as any)[key] ?? 0;
  };

  return (
    <div className="space-y-6">
      {/* ===== TOP ROW: Main Stat Cards ===== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {mainStatCards.map((card, i) => {
          const Icon = card.icon;
          const value = stats?.[card.key] ?? 0;
          return (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
            >
              <Card className="border border-[#e5e7eb] shadow-sm bg-white overflow-hidden">
                <CardContent className="p-5">
                  {isLoading ? (
                    <div className="space-y-3">
                      <Skeleton className="h-10 w-10 rounded-lg" />
                      <Skeleton className="h-3 w-24" />
                      <Skeleton className="h-8 w-16" />
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start justify-between mb-3">
                        <div className={`h-11 w-11 rounded-xl ${card.bgColor} flex items-center justify-center`}>
                          <Icon className="h-5 w-5" style={{ color: card.color }} />
                        </div>
                        <Link href="/admin" className="text-[11px] font-medium hover:underline" style={{ color: card.color }}>
                          View Details
                        </Link>
                      </div>
                      <p className="text-[28px] font-extrabold text-[#1f2937] leading-none mb-1">
                        {"isCurrency" in card && card.isCurrency ? formatTaka(value as number) : value.toLocaleString()}
                      </p>
                      <p className="text-[13px] text-[#6b7280] font-medium">{card.label}</p>
                    </>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* ===== SECONDARY ROW: Services, Bookings, Reviews, Messages, Returns ===== */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {secondaryStats.map((card, i) => {
          const Icon = card.icon;
          const value = stats?.[card.key] ?? 0;
          return (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.04 }}
            >
              <Card className="border border-[#e5e7eb] shadow-sm bg-white">
                <CardContent className="p-4 text-center">
                  {isLoading ? (
                    <Skeleton className="h-7 w-12 mx-auto mb-1.5" />
                  ) : (
                    <>
                      <p className="text-[24px] font-extrabold leading-none mb-1" style={{ color: card.color }}>
                        {value.toLocaleString()}
                      </p>
                      <p className="text-[12px] text-[#6b7280]">{card.label}</p>
                    </>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* ===== ORDER STATUS ROW: Colorful cards ===== */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {orderStatusCards.map((card, i) => {
          const Icon = card.icon;
          const value = getStatValue(card.key);
          return (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 + i * 0.04 }}
            >
              <Card className={`${card.bg} border-0 shadow-sm cursor-pointer hover:shadow-md transition-shadow`}>
                <CardContent className="p-4 flex items-center gap-3">
                  <Icon className={`h-5 w-5 shrink-0 ${card.textColor}`} />
                  <div>
                    <p className={`text-[22px] font-extrabold leading-none ${card.textColor}`}>
                      {isLoading ? "—" : value.toLocaleString()}
                    </p>
                    <p className={`text-[11px] font-medium mt-0.5 ${card.textColor} opacity-70`}>
                      {card.label}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* ===== TABLES ROW ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Orders */}
        <Card className="border border-[#e5e7eb] shadow-sm bg-white">
          <div className="flex items-center justify-between px-5 pt-4 pb-3">
            <h3 className="text-[14px] font-semibold text-[#1f2937]">Recent Orders</h3>
            <Link href="/admin/orders" className="text-[12px] font-medium flex items-center gap-1 hover:underline" style={{ color: "#7C3AED" }}>
              All Orders <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="px-0">
            {ordersLoading ? (
              <TableSkeleton rows={4} cols={4} />
            ) : recentOrders.length === 0 ? (
              <div className="py-10 text-center text-[13px] text-[#9ca3af]">No orders yet</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-[#e5e7eb] bg-[#f8f9fa]">
                    <TableHead className="text-[11px] font-semibold text-[#6b7280] uppercase tracking-wider">Order</TableHead>
                    <TableHead className="text-[11px] font-semibold text-[#6b7280] uppercase tracking-wider">Customer</TableHead>
                    <TableHead className="text-[11px] font-semibold text-[#6b7280] uppercase tracking-wider">Amount</TableHead>
                    <TableHead className="text-[11px] font-semibold text-[#6b7280] uppercase tracking-wider">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentOrders.map((o) => (
                    <TableRow key={o.id} className="border-b border-[#f3f4f6] hover:bg-[#f8f9fa] transition-colors">
                      <TableCell className="text-[13px] font-mono font-medium" style={{ color: "#7C3AED" }}>
                        #{o.orderNumber.slice(-8)}
                      </TableCell>
                      <TableCell className="text-[13px] text-[#374151]">{o.customerName}</TableCell>
                      <TableCell className="text-[13px] font-semibold text-[#1f2937]">{formatTaka(o.total)}</TableCell>
                      <TableCell><StatusBadge status={o.status} map={orderStatusMap} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </Card>

        {/* Recent Bookings */}
        <Card className="border border-[#e5e7eb] shadow-sm bg-white">
          <div className="flex items-center justify-between px-5 pt-4 pb-3">
            <h3 className="text-[14px] font-semibold text-[#1f2937]">Recent Bookings</h3>
            <Link href="/admin/bookings" className="text-[12px] font-medium flex items-center gap-1 hover:underline" style={{ color: "#7C3AED" }}>
              All Bookings <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="px-0">
            {bookingsLoading ? (
              <TableSkeleton rows={4} cols={4} />
            ) : recentBookings.length === 0 ? (
              <div className="py-10 text-center text-[13px] text-[#9ca3af]">No bookings yet</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-[#e5e7eb] bg-[#f8f9fa]">
                    <TableHead className="text-[11px] font-semibold text-[#6b7280] uppercase tracking-wider">Service</TableHead>
                    <TableHead className="text-[11px] font-semibold text-[#6b7280] uppercase tracking-wider">Customer</TableHead>
                    <TableHead className="text-[11px] font-semibold text-[#6b7280] uppercase tracking-wider">Date</TableHead>
                    <TableHead className="text-[11px] font-semibold text-[#6b7280] uppercase tracking-wider">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentBookings.map((b) => (
                    <TableRow key={b.id} className="border-b border-[#f3f4f6] hover:bg-[#f8f9fa] transition-colors">
                      <TableCell className="text-[13px] font-medium text-[#1f2937]">{b.service.name}</TableCell>
                      <TableCell className="text-[13px] text-[#374151]">{b.customerName}</TableCell>
                      <TableCell className="text-[13px] text-[#6b7280]">{b.preferredDate ? formatDate(b.preferredDate) : "—"}</TableCell>
                      <TableCell><StatusBadge status={b.status} map={bookingStatusMap} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}