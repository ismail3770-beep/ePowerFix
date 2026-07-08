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
        <div className="mf-section-header">
          <h3>ক্যাটাগরি / Categories</h3>
          <a
            href="/shop"
            className="hidden sm:flex items-center gap-1 text-[14px] font-medium text-dark-500 hover:text-dark-900 transition-colors"
          >
            সব দেখুন <EPFChevronRight size={14} />
          </a>
        </div>

        {/* Grid — table-style borders: container provides left edge, header provides top edge, cells provide right & bottom */}
        <FadeIn delay={0.05}>
        <div className="border-l border-dark-200">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
            {categories.map((cat) => {
              const Icon = cat.icon;
              return (
                <Link
                  key={cat.slug}
                  href={`/shop?category=${cat.slug}`}
                  className="flex flex-col items-center justify-center py-5 px-2 border-r border-b border-dark-200 hover:bg-dark-50 hover:-translate-y-0.5 transition-all duration-200 group"
                >
                  {/* Square icon area */}
                  <div className="w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center bg-dark-50 text-epf-500 group-hover:bg-white group-hover:scale-105 transition-all duration-200">
                    <Icon size={28} className="sm:w-7 sm:h-7" />
                  </div>

                  {/* Category name */}
                  <span className="mt-2.5 text-[13px] sm:text-[14px] font-semibold text-dark-900 text-center leading-tight">
                    {cat.name}
                  </span>

                  {/* Subtitle */}
                  <span className="mt-1 text-[11px] sm:text-[12px] text-dark-500 text-center">
                    {cat.subtitle}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
        </FadeIn>
      </div>
    </section>
  );
}
