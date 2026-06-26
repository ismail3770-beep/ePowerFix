"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Stats {
  totalProducts: number;
  totalOrders: number;
  totalUsers: number;
  totalRevenue: number;
  pendingOrders: number;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<{ data: Stats }>("/api/admin/stats")
      .then((res) => {
        setStats(res.data);
      })
      .catch((err) => console.error("Failed to load stats:", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  const cards = [
    { title: "Total Products", value: stats?.totalProducts ?? 0, icon: "📦" },
    { title: "Total Orders", value: stats?.totalOrders ?? 0, icon: "🛒" },
    { title: "Total Users", value: stats?.totalUsers ?? 0, icon: "👥" },
    { title: "Total Revenue", value: `৳${stats?.totalRevenue ?? 0}`, icon: "💰" },
    { title: "Pending Orders", value: stats?.pendingOrders ?? 0, icon: "⏳" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Admin Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">
                {card.title}
              </CardTitle>
              <span className="text-2xl">{card.icon}</span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
