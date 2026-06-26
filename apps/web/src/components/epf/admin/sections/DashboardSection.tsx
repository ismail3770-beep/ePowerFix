"use client";

import { motion } from "framer-motion";
import {
  LayoutDashboard, CalendarCheck, ShoppingBag, Mail, Wrench, Package,
  Star, Users, DollarSign, RotateCcw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { formatTaka, formatDate, StatusBadge, TableSkeleton, bookingStatusMap, orderStatusMap } from "../shared";
import type { AdminStats, BookingItem, Order } from "../types";

export default function DashboardSection({ stats, isLoading, bookings, orders, bookingsLoading, ordersLoading }: {
  stats: AdminStats | undefined; isLoading: boolean; bookings: BookingItem[]; orders: Order[]; bookingsLoading: boolean; ordersLoading: boolean;
}) {
  const statCards = [
    { label: "Products", value: stats?.totalProducts ?? 0, icon: Package, color: "bg-emerald-50 text-emerald-600 border-emerald-200" },
    { label: "Services", value: stats?.totalServices ?? 0, icon: Wrench, color: "bg-sky-50 text-sky-600 border-sky-200" },
    { label: "Orders", value: stats?.totalOrders ?? 0, icon: ShoppingBag, color: "bg-orange-50 text-orange-600 border-orange-200" },
    { label: "Bookings", value: stats?.totalBookings ?? 0, icon: CalendarCheck, color: "bg-purple-50 text-purple-600 border-purple-200" },
    { label: "Revenue", value: stats?.totalRevenue ?? 0, icon: DollarSign, color: "bg-green-50 text-green-600 border-green-200", isCurrency: true },
    { label: "Users", value: stats?.totalUsers ?? 0, icon: Users, color: "bg-indigo-50 text-indigo-600 border-indigo-200" },
    { label: "Reviews", value: stats?.totalReviews ?? 0, icon: Star, color: "bg-amber-50 text-amber-600 border-amber-200" },
    { label: "Messages", value: stats?.totalMessages ?? 0, icon: Mail, color: "bg-rose-50 text-rose-600 border-rose-200" },
    { label: "Returns", value: stats?.totalReturns ?? 0, icon: RotateCcw, color: "bg-teal-50 text-teal-600 border-teal-200" },
  ];

  const recentOrders = orders.slice(0, 5);
  const recentBookings = bookings.slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Dashboard</h2>
        <p className="text-sm text-gray-500 mt-0.5">ePowerFix Admin Overview</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <motion.div key={card.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
              <Card className="border border-[#E2E8F0] shadow-none bg-white">
                <CardContent className="p-4">
                  {isLoading ? (
                    <div className="space-y-2">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <Skeleton className="h-3 w-16" />
                      <Skeleton className="h-6 w-12" />
                    </div>
                  ) : (
                    <div className="flex items-start gap-3">
                      <div className={`rounded-full p-2 border ${card.color}`}>
                        <Icon className="size-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-gray-500 leading-tight">{card.label}</p>
                        <p className="text-xl font-bold text-gray-900 mt-0.5">
                          {"isCurrency" in card ? formatTaka(card.value as number) : card.value}
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

      {/* Pending alerts */}
      <div className="grid grid-cols-2 md:grid-cols-2 gap-3">
        {((stats?.pendingOrders ?? 0) > 0) && (
          <Card className="border-l-4 border-l-orange-400 border border-[#E2E8F0] shadow-none bg-white">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="bg-orange-50 rounded-full p-2"><ShoppingBag className="size-4 text-orange-600" /></div>
              <div>
                <p className="text-sm font-medium text-gray-900">{stats?.pendingOrders} Pending Orders</p>
                <p className="text-xs text-gray-500">Need attention</p>
              </div>
            </CardContent>
          </Card>
        )}
        {((stats?.pendingBookings ?? 0) > 0) && (
          <Card className="border-l-4 border-l-purple-400 border border-[#E2E8F0] shadow-none bg-white">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="bg-purple-50 rounded-full p-2"><CalendarCheck className="size-4 text-purple-600" /></div>
              <div>
                <p className="text-sm font-medium text-gray-900">{stats?.pendingBookings} Pending Bookings</p>
                <p className="text-xs text-gray-500">Need attention</p>
              </div>
            </CardContent>
          </Card>
        )}
        {((stats?.unreadMessages ?? 0) > 0) && (
          <Card className="border-l-4 border-l-rose-400 border border-[#E2E8F0] shadow-none bg-white">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="bg-rose-50 rounded-full p-2"><Mail className="size-4 text-rose-600" /></div>
              <div>
                <p className="text-sm font-medium text-gray-900">{stats?.unreadMessages} Unread Messages</p>
                <p className="text-xs text-gray-500">Need attention</p>
              </div>
            </CardContent>
          </Card>
        )}
        {((stats?.pendingReturns ?? 0) > 0) && (
          <Card className="border-l-4 border-l-teal-400 border border-[#E2E8F0] shadow-none bg-white">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="bg-teal-50 rounded-full p-2"><RotateCcw className="size-4 text-teal-600" /></div>
              <div>
                <p className="text-sm font-medium text-gray-900">{stats?.pendingReturns} Pending Returns</p>
                <p className="text-xs text-gray-500">Need attention</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border border-[#E2E8F0] shadow-none bg-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-gray-700">Recent Orders</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {ordersLoading ? <TableSkeleton rows={3} cols={3} /> : recentOrders.length === 0 ? (
              <div className="py-8 text-center text-sm text-gray-400">No orders yet</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-[#E2E8F0]">
                    <TableHead className="text-xs">Order #</TableHead>
                    <TableHead className="text-xs">Customer</TableHead>
                    <TableHead className="text-xs">Amount</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentOrders.map((o) => (
                    <TableRow key={o.id} className="border-b border-[#E2E8F0]">
                      <TableCell className="text-xs font-mono">{o.orderNumber.slice(-8)}</TableCell>
                      <TableCell className="text-xs">{o.customerName}</TableCell>
                      <TableCell className="text-xs font-medium">{formatTaka(o.totalAmount)}</TableCell>
                      <TableCell><StatusBadge status={o.status} map={orderStatusMap} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card className="border border-[#E2E8F0] shadow-none bg-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-gray-700">Recent Bookings</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {bookingsLoading ? <TableSkeleton rows={3} cols={3} /> : recentBookings.length === 0 ? (
              <div className="py-8 text-center text-sm text-gray-400">No bookings yet</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-[#E2E8F0]">
                    <TableHead className="text-xs">Service</TableHead>
                    <TableHead className="text-xs">Customer</TableHead>
                    <TableHead className="text-xs">Date</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentBookings.map((b) => (
                    <TableRow key={b.id} className="border-b border-[#E2E8F0]">
                      <TableCell className="text-xs font-medium">{b.service.name}</TableCell>
                      <TableCell className="text-xs">{b.customerName}</TableCell>
                      <TableCell className="text-xs">{b.preferredDate ? formatDate(b.preferredDate) : "—"}</TableCell>
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
