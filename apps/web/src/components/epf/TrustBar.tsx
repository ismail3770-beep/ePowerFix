"use client";
import { Truck, RotateCcw, Shield, Headphones, BadgeCheck } from "lucide-react";

const features = [
  { icon: Truck, label: "Free Delivery", desc: "Orders over ৳5,000" },
  { icon: RotateCcw, label: "Easy Returns", desc: "7-day return policy" },
  { icon: Shield, label: "Secure Payment", desc: "100% secure checkout" },
  { icon: Headphones, label: "24/7 Support", desc: "Expert help anytime" },
  { icon: BadgeCheck, label: "Authentic Products", desc: "Official warranty" },
];

export default function TrustBar() {
  return (
    <section className="bg-white border-b border-[#E2E8F0]">
      <div className="mx-auto max-w-[1920px] px-4 sm:px-12">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-0">
          {features.map((feat, i) => {
            const Icon = feat.icon;
            return (
              <div key={feat.label}
                className={`flex items-center gap-3 py-5 px-4 ${i < 4 ? "border-r border-[#E2E8F0]" : ""}`}>
                <div className="text-[#6B7280] shrink-0"><Icon className="h-6 w-6" strokeWidth={1.5} /></div>
                <div>
                  <p className="text-[14px] font-medium text-[#111827] leading-tight">{feat.label}</p>
                  <p className="text-[14px] text-[#6B7280] mt-0.5">{feat.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}