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
    <section className="bg-white border-y border-slate-200">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-12 py-7">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-0">
          {features.map((feat) => {
            const Icon = feat.icon;
            return (
              <div
                key={feat.label}
                className="flex flex-col md:flex-row items-center gap-2 md:gap-3 text-center md:text-left py-2 md:px-5 md:border-r md:border-slate-200 last:md:border-r-0"
              >
                <Icon
                  className="h-5 w-5 text-epf-500 shrink-0"
                  strokeWidth={1.75}
                />
                <div>
                  <p className="text-[13px] font-semibold text-slate-800 leading-tight">
                    {feat.label}
                  </p>
                  <p className="text-[12px] text-slate-500 mt-0.5">
                    {feat.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
