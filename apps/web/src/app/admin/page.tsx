"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import DashboardSection from "@/components/epf/admin/sections/DashboardSection";
import type { AdminStats, BookingItem, Order } from "@/components/epf/admin/types";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | undefined>();
  const [orders, setOrders] = useState<Order[]>([]);
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [statsLoading, setStatsLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [bookingsLoading, setBookingsLoading] = useState(true);

  useEffect(() => {
    apiFetch<AdminStats>("/api/admin/stats")
      .then((res) => setStats(res))
      .catch((err) => console.error("Failed to load stats:", err))
      .finally(() => setStatsLoading(false));
  }, []);

  useEffect(() => {
    apiFetch<Order[]>("/api/admin/orders?limit=5")
      .then((res) => setOrders(Array.isArray(res) ? res : []))
      .catch(() => setOrders([]))
      .finally(() => setOrdersLoading(false));
  }, []);

  useEffect(() => {
    apiFetch<BookingItem[]>("/api/admin/bookings?limit=5")
      .then((res) => setBookings(Array.isArray(res) ? res : []))
      .catch(() => setBookings([]))
      .finally(() => setBookingsLoading(false));
  }, []);

  return (
    <DashboardSection
      stats={stats}
      isLoading={statsLoading}
      orders={orders}
      bookings={bookings}
      ordersLoading={ordersLoading}
      bookingsLoading={bookingsLoading}
    />
  );
}