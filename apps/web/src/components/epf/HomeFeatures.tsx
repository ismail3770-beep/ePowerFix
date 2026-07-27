"use client";

import { Headphones, CreditCard, ShieldCheck, Truck, RotateCcw } from "lucide-react";

/**
 * FleetCart features strip — mirrors home_features.blade.php + _features.scss:
 * a bordered container with evenly split features separated by thin vertical
 * dividers. 5 items on desktop, wraps down responsively.
 */

const features = [
  { icon: Headphones, title: "২৪/৭ সাপোর্ট", subtitle: "সবসময় পাশে আছি" },
  { icon: CreditCard, title: "সহজ পেমেন্ট", subtitle: "বিকাশ, নগদ, কার্ড" },
  { icon: ShieldCheck, title: "নিরাপদ পেমেন্ট", subtitle: "১০০% সুরক্ষিত" },
  { icon: Truck, title: "ফ্রি ডেলিভারি", subtitle: "৫০০৳+ অর্ডারে" },
  { icon: RotateCcw, title: "৭ দিনে রিটার্ন", subtitle: "সহজ রিটার্ন নীতি" },
];

export default function HomeFeatures() {
  return (
    <section className="ff bg-white mt-[30px]">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
        <div className="border border-[#e8e7eb] rounded-[8px]">
          <div className="flex flex-wrap gap-y-6 py-6 sm:py-[30px]">
            {features.map((f, i) => (
              <div
                key={f.title}
                className={`relative flex justify-start sm:justify-center px-4 w-1/2 sm:w-1/3 lg:w-1/5 ${
                  // Vertical dividers only on sm+ where items sit in a single row region.
                  i < features.length - 1
                    ? "sm:after:absolute sm:after:top-0 sm:after:right-0 sm:after:h-[42px] sm:after:w-px sm:after:bg-[#e8e7eb] sm:after:content-['']"
                    : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="text-[#0068e1] shrink-0">
                    <f.icon className="w-6 h-6 sm:w-7 sm:h-7" strokeWidth={1.6} />
                  </div>
                  <div className="min-w-0">
                    <h6 className="text-[12px] sm:text-[13px] font-semibold text-[#191919] uppercase tracking-wide leading-tight">
                      {f.title}
                    </h6>
                    <span className="text-[11px] sm:text-[12px] text-[#6e6e6e]">{f.subtitle}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
