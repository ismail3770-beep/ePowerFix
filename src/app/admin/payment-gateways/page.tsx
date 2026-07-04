"use client";
import { Card, CardContent } from "@/components/ui/card";
import { CreditCard } from "lucide-react";

export default function AdminPaymentGatewaysPage() {
  const gateways = [
    { name: "bKash", color: "bg-pink-100 text-pink-700", status: "Configure" },
    { name: "Nagad", color: "bg-orange-100 text-orange-700", status: "Configure" },
    { name: "SSLCommerz", color: "bg-blue-100 text-blue-700", status: "Configure" },
    { name: "Bank Transfer", color: "bg-gray-100 text-gray-700", status: "Configure" },
    { name: "Cash on Delivery", color: "bg-green-100 text-green-700", status: "Active" },
  ];
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#111827]">Payment Gateways</h1>
        <p className="text-sm text-[#6B7280] mt-1">Configure payment methods for checkout</p>
      </div>
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b">
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
              <CreditCard className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-[#111827]">Available Gateways</h3>
              <p className="text-xs text-[#6B7280]">Click configure to set up API keys and credentials</p>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {gateways.map((g) => (
              <div key={g.name} className="border rounded-lg p-4 flex items-center justify-between hover:shadow-sm transition-shadow">
                <div className="flex items-center gap-3">
                  <span className={`h-9 w-9 rounded-lg flex items-center justify-center text-xs font-bold ${g.color}`}>
                    {g.name.charAt(0)}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-[#111827]">{g.name}</p>
                    <p className="text-xs text-[#6B7280]">{g.status}</p>
                  </div>
                </div>
                <button className="text-xs text-[#0EA5E9] hover:underline font-medium" disabled>
                  Configure
                </button>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-6 text-center bg-amber-50 p-3 rounded">
            Full payment gateway configuration UI coming soon. API callbacks are already active at <code>/api/payments/</code>.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
