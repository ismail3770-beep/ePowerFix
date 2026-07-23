"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, Wrench, ShieldCheck, Truck, Headphones } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const slides = [
  {
    badge: "⚡ বাংলাদেশের #১ ইলেকট্রিক্যাল মার্কেটপ্লেস",
    title: "আপনার সব ইলেকট্রিক্যাল",
    highlight: "সমাধান এক জায়গায়",
    subtitle: "১০,০০০+ অরিজিনাল প্রোডাক্ট | এক্সপার্ট সার্ভিস | সারাদেশে ডেলিভারি",
    cta1: { label: "শপ করুন", href: "/shop" },
    cta2: { label: "সার্ভিস বুক করুন", href: "/services" },
    bg: "from-[#0EA5E9] to-[#0C4A6E]",
  },
  {
    badge: "🔥 মেগা ফ্ল্যাশ সেল",
    title: "সব প্রোডাক্টে",
    highlight: "৫০% পর্যন্ত ছাড়!",
    subtitle: "সীমিত সময়ের অফার — এখনই অর্ডার করুন",
    cta1: { label: "ডিল দেখুন", href: "/deals" },
    cta2: { label: "সব প্রোডাক্ট", href: "/shop" },
    bg: "from-[#F97316] to-[#DC2626]",
  },
  {
    badge: "🔧 এক্সপার্ট সার্ভিস",
    title: "প্রফেশনাল",
    highlight: "ইলেকট্রিশিয়ান খুঁজুন",
    subtitle: "ভেরিফাইড এক্সপার্ট | ওয়ারেন্টি সহ সার্ভিস | ২৪/৭ সাপোর্ট",
    cta1: { label: "ইলেকট্রিশিয়ান খুঁজুন", href: "/electricians" },
    cta2: { label: "সার্ভিস দেখুন", href: "/services" },
    bg: "from-[#0F172A] to-[#0369A1]",
  },
];

export default function HeroBanner() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const slide = slides[current];

  return (
    <section className="relative overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.5 }}
          className={`bg-gradient-to-br ${slide.bg} text-white`}
        >
          <div className="max-w-[1400px] mx-auto px-4 sm:px-12 py-16 md:py-24">
            <div className="max-w-2xl space-y-5">
              <motion.span
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="inline-block bg-white/15 backdrop-blur-sm text-sm font-semibold px-4 py-1.5 rounded-full"
              >
                {slide.badge}
              </motion.span>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight"
              >
                {slide.title}
                <br />
                <span className="text-[#F59E0B]">{slide.highlight}</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-white/80 text-base md:text-lg"
              >
                {slide.subtitle}
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="flex flex-wrap gap-3 pt-2"
              >
                <Link
                  href={slide.cta1.href}
                  className="inline-flex items-center gap-2 bg-[#F97316] hover:bg-[#EA580C] text-white px-7 py-3 rounded-xl font-bold transition shadow-lg shadow-orange-500/25"
                >
                  {slide.cta1.label}
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link
                  href={slide.cta2.href}
                  className="inline-flex items-center gap-2 border-2 border-white/40 hover:bg-white hover:text-[#0F172A] px-7 py-3 rounded-xl font-bold transition"
                >
                  <Wrench className="w-5 h-5" />
                  {slide.cta2.label}
                </Link>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Slide Indicators */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`h-2 rounded-full transition-all ${
              i === current ? "w-8 bg-white" : "w-2 bg-white/40"
            }`}
          />
        ))}
      </div>

      {/* Trust Strip */}
      <div className="bg-white border-b border-[#E2E8F0]">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-12 py-3 grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { icon: Truck, text: "ফ্রি ডেলিভারি", sub: "৫০০৳+ অর্ডারে" },
            { icon: ShieldCheck, text: "অরিজিনাল প্রোডাক্ট", sub: "১০০% গ্যারান্টি" },
            { icon: Wrench, text: "এক্সপার্ট সার্ভিস", sub: "ওয়ারেন্টি সহ" },
            { icon: Headphones, text: "২৪/৭ সাপোর্ট", sub: "যেকোনো সময়" },
          ].map((item) => (
            <div key={item.text} className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#F0F9FF] rounded-lg flex items-center justify-center shrink-0">
                <item.icon className="w-5 h-5 text-[#0EA5E9]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#0F172A]">{item.text}</p>
                <p className="text-xs text-[#94A3B8]">{item.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
