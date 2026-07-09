"use client";

import Link from "next/link";
import FadeIn from "@/components/epf/FadeIn";
import {
  EPFCable,
  EPFCircuitBreaker,
  EPFPlug,
  EPFLightbulb,
  EPFSolar,
  EPFSafetyShield,
  EPFFactory,
  EPFGauge,
  EPFChevronRight,
} from "@/components/epf/icons/EPFIcons";

const categories = [
  {
    name: "কেবল ও ওয়্যার",
    subtitle: "সেরা দামে",
    icon: EPFCable,
    slug: "cable",
  },
  {
    name: "সার্কিট ব্রেকার",
    subtitle: "জরুরি সুরক্ষা",
    icon: EPFCircuitBreaker,
    slug: "breaker",
  },
  {
    name: "সুইচ ও সকেট",
    subtitle: "১০০% আসল",
    icon: EPFPlug,
    slug: "switch",
  },
  {
    name: "লাইটিং",
    subtitle: "LED ও সোলার",
    icon: EPFLightbulb,
    slug: "lighting",
  },
  {
    name: "সোলার প্যানেল",
    subtitle: "আপটু ৩০% ছাড়",
    icon: EPFSolar,
    slug: "solar",
  },
  {
    name: "সেফটি সরঞ্জাম",
    subtitle: "শ্রমিক সুরক্ষা",
    icon: EPFSafetyShield,
    slug: "safety",
  },
  {
    name: "ইন্ডাস্ট্রিয়াল",
    subtitle: "অটোমেশন সল্যুশন",
    icon: EPFFactory,
    slug: "industrial",
  },
  {
    name: "টুলস ও মিটার",
    subtitle: "ডিজিটাল মিটার",
    icon: EPFGauge,
    slug: "tools",
  },
];

export default function CategoryGrid() {
  return (
    <section id="categories" className="bg-white w-full">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-12 pt-6">
        {/* Header */}
        <div className="flex items-end justify-between mb-5">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">ক্যাটাগরি</h2>
            <p className="text-sm text-slate-500 mt-1">সব ধরনের ইলেকট্রিক্যাল পণ্য খুঁজুন</p>
          </div>
          <a
            href="/shop"
            className="hidden sm:inline-flex items-center gap-1.5 text-sm font-medium text-epf-500 hover:text-epf-600 transition-colors border border-epf-500 hover:border-epf-600 rounded-md px-4 py-2"
          >
            সব দেখুন <EPFChevronRight size={14} />
          </a>
        </div>

        <FadeIn delay={0.05}>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
          {categories.map((cat) => {
            const Icon = cat.icon;
            return (
              <Link
                key={cat.slug}
                href={`/shop?category=${cat.slug}`}
                className="flex flex-col items-center justify-center py-4 px-2 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.05)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-200 group"
              >
                {/* Square icon area */}
                <div className="w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center bg-slate-50 text-epf-500 group-hover:bg-white group-hover:scale-105 transition-all duration-200">
                  <Icon size={28} className="sm:w-7 sm:h-7" />
                </div>

                {/* Category name */}
                <span className="mt-2.5 text-[13px] sm:text-[14px] font-semibold text-slate-900 text-center leading-tight">
                  {cat.name}
                </span>

                {/* Subtitle */}
                <span className="mt-1 text-[11px] sm:text-[12px] text-slate-500 text-center">
                  {cat.subtitle}
                </span>
              </Link>
            );
          })}
        </div>
        </FadeIn>
      </div>
    </section>
  );
}
