"use client";
import { Card, CardContent } from "@/components/ui/card";
import { Package } from "lucide-react";

export default function AdminProjectKitsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#111827]">Project Kits</h1>
        <p className="text-sm text-[#6B7280] mt-1">Sellable project bundles</p>
      </div>
      <Card>
        <CardContent className="p-12 flex flex-col items-center justify-center text-center">
          <div className="h-14 w-14 rounded-full bg-amber-100 flex items-center justify-center mb-4">
            <Package className="h-7 w-7 text-amber-600" />
          </div>
          <h3 className="text-lg font-semibold text-[#111827] mb-2">Project Kits Management</h3>
          <p className="text-sm text-[#6B7280] max-w-md">
            Project kits are sellable project bundles. To manage kit items, use the{" "}
            <a href="/admin/products" className="text-[#0EA5E9] hover:underline">Products</a>{" "}
            page and mark products as part of a kit. Full kit management features coming soon.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
