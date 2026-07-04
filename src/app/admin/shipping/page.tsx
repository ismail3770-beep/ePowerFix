"use client";
import { Card, CardContent } from "@/components/ui/card";
import { Truck } from "lucide-react";

export default function AdminShippingPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#111827]">Shipping</h1>
        <p className="text-sm text-[#6B7280] mt-1">Shipping zones, rates, and delivery partners</p>
      </div>
      <Card>
        <CardContent className="p-12 flex flex-col items-center justify-center text-center">
          <div className="h-14 w-14 rounded-full bg-teal-100 flex items-center justify-center mb-4">
            <Truck className="h-7 w-7 text-teal-600" />
          </div>
          <h3 className="text-lg font-semibold text-[#111827] mb-2">Shipping Configuration</h3>
          <p className="text-sm text-[#6B7280] max-w-md">
            Manage shipping zones (Dhaka, Outside Dhaka, National), set delivery rates,
            and configure courier partners. Delivery charge rules are currently managed via
            site settings. Full shipping zone management coming soon.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
