"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

const categories = [
  { name: "কেবল ও তার", icon: "🔌", count: "৫০০+", href: "/shop?cat=cables", color: "bg-blue-50" },
  { name: "সার্কিট ব্রেকার", icon: "⚡", count: "৩২০+", href: "/shop?cat=breakers", color: "bg-amber-50" },
  { name: "সুইচ ও সকেট", icon: "🔘", count: "৪৫০+", href: "/shop?cat=switches", color: "bg-green-50" },
  { name: "লাইটিং", icon: "💡", count: "৮০০+", href: "/shop?cat=lighting", color: "bg-yellow-50" },
  { name: "সোলার প্যানেল", icon: "☀️", count: "১৫০+", href: "/shop?cat=solar", color: "bg-orange-50" },
  { name: "সেফটি ইকুইপমেন্ট", icon: "🛡️", count: "২০০+", href: "/shop?cat=safety", color: "bg-red-50" },
  { name: "টুলস", icon: "🔧", count: "৬০০+", href: "/shop?cat=tools", color: "bg-purple-50" },
  { name: "ফ্যান ও মোটর", icon: "🌀", count: "২৮০+", href: "/shop?cat=fans", color: "bg-cyan-50" },
];

export default function CategoryGrid() {
  return (
    <section className="max-w-[1400px] mx-auto px-4 sm:px-12 py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-[#0F172A]">ক্যাটাগরি সমূহ</h2>
          <p className="text-[#94A3B8] text-sm mt-1">আপনার প্রয়োজন অনুযায়ী ব্রাউজ করুন</p>
        </div>
        <Link href="/shop" className="flex items-center gap-1 text-[#0EA5E9] hover:text-[#0284C7] text-sm font-semibold transition">
          সব দেখুন <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {categories.map((cat, i) => (
          <motion.div
            key={cat.name}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.05 }}
          >
            <Link
              href={cat.href}
              className={`group flex flex-col items-center gap-3 p-6 rounded-2xl border border-[#E2E8F0] ${cat.color} hover:shadow-lg hover:border-[#0EA5E9]/30 hover:-translate-y-1 transition-all duration-300`}
            >
              <span className="text-4xl group-hover:scale-110 transition-transform">{cat.icon}</span>
              <span className="text-sm font-semibold text-[#0F172A] text-center">{cat.name}</span>
              <span className="text-xs text-[#94A3B8]">{cat.count} প্রোডাক্ট</span>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
