"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowRight, Wrench, ShieldCheck, Truck, Headphones,
  Zap, Lightbulb, Star,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const slides = [
  {
    badge: "⚡ বাংলাদেশের #১ ইলেকট্রিক্যাল মার্কেটপ্লেস",
    title: "আপনার সব ইলেকট্রিক্যাল",
    highlight: "সমাধান এক জায়গায়",
    subtitle: "১০,০০০+ অরিজিনাল প্রোডাক্ট | এক্সপার্ট সার্ভিস | সারাদেশে ডেলিভারি",
    cta1: { label: "শপ করুন", href: "/shop" },
    cta2: { label: "সার্ভিস বুক করুন", href: "/services" },
    bg: "from-sky-500 via-sky-600 to-sky-900",
  },
  {
    badge: "🔥 মেগা ফ্ল্যাশ সেল",
    title: "সব প্রোডাক্টে",
    highlight: "৫০% পর্যন্ত ছাড়!",
    subtitle: "সীমিত সময়ের অফার — এখনই অর্ডার করুন",
    cta1: { label: "ডিল দেখুন", href: "/deals" },
    cta2: { label: "সব প্রোডাক্ট", href: "/shop" },
    bg: "from-orange-500 via-orange-600 to-rose-700",
  },
  {
    badge: "🔧 এক্সপার্ট সার্ভিস",
    title: "প্রফেশনাল",
    highlight: "ইলেকট্রিশিয়ান খুঁজুন",
    subtitle: "ভেরিফাইড এক্সপার্ট | ওয়ারেন্টি সহ সার্ভিস | ২৪/৭ সাপোর্ট",
    cta1: { label: "ইলেকট্রিশিয়ান খুঁজুন", href: "/electricians" },
    cta2: { label: "সার্ভিস দেখুন", href: "/services" },
    bg: "from-slate-900 via-sky-900 to-sky-700",
  },
];

const float = { duration: 4, repeat: Infinity, ease: "easeInOut" } as const;

export default function HeroBanner() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setCurrent((p) => (p + 1) % slides.length), 5000);
    return () => clearInterval(t);
  }, []);

  const slide = slides[current];

  return (
    <section className="relative overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className={`bg-gradient-to-br ${slide.bg} text-white`}
        >
          <div className="max-w-[1400px] mx-auto px-4 sm:px-12 py-16 md:py-24 flex flex-col lg:flex-row items-center gap-12">
            {/* Left copy */}
            <div className="flex-1 max-w-xl space-y-5">
              <motion.span
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                className="inline-block bg-white/20 ring-1 ring-white/30 backdrop-blur-sm text-sm font-semibold px-4 py-1.5 rounded-full"
              >
                {slide.badge}
              </motion.span>
              <motion.h1
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
                className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight"
              >
                {slide.title}
                <br />
                <span className="text-amber-300">{slide.highlight}</span>
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
                className="text-white/85 text-base md:text-lg"
              >
                {slide.subtitle}
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
                className="flex flex-wrap gap-3 pt-2"
              >
                <Link
                  href={slide.cta1.href}
                  className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-slate-900 px-7 py-3 rounded-xl font-bold transition shadow-lg shadow-black/10"
                >
                  {slide.cta1.label} <ArrowRight className="w-5 h-5" />
                </Link>
                <Link
                  href={slide.cta2.href}
                  className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 ring-1 ring-white/40 px-7 py-3 rounded-xl font-bold transition"
                >
                  <Wrench className="w-5 h-5" /> {slide.cta2.label}
                </Link>
              </motion.div>
            </div>

            {/* Right visual */}
            <div className="hidden lg:block flex-1 w-full">
              <div className="relative mx-auto w-full max-w-md aspect-square">
                <div className="absolute -top-6 -right-6 w-44 h-44 bg-amber-400/30 rounded-full blur-3xl" />
                <div className="absolute bottom-0 -left-8 w-52 h-52 bg-sky-300/30 rounded-full blur-3xl" />
                <div className="absolute inset-8 rounded-[2rem] bg-white/10 backdrop-blur-md ring-1 ring-white/20 shadow-2xl flex items-center justify-center">
                  <Zap className="w-28 h-28 text-white/80" strokeWidth={1} />
                </div>
                <motion.div
                  animate={{ y: [0, -10, 0] }} transition={float}
                  className="absolute -left-4 top-12 bg-white rounded-2xl shadow-xl p-3 w-48"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center">
                      <Lightbulb className="w-6 h-6 text-amber-500" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-700">Philips LED 20W</p>
                      <p className="text-sm font-bold text-slate-900">৳৩২০</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 mt-2">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-3 h-3 text-amber-400 fill-amber-400" />
                    ))}
                    <span className="text-[10px] text-slate-400 ml-1">(45)</span>
                  </div>
                </motion.div>
                <motion.div
                  animate={{ y: [0, 8, 0] }} transition={{ ...float, duration: 5 }}
                  className="absolute -right-3 top-2 bg-white rounded-xl shadow-lg px-3 py-2 flex items-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-semibold text-slate-700">১০০% অরিজিনাল</span>
                </motion.div>
                <motion.div
                  animate={{ y: [0, -8, 0] }} transition={{ ...float, duration: 4.5 }}
                  className="absolute -right-5 bottom-12 bg-white rounded-xl shadow-lg px-3 py-2 flex items-center gap-2"
                >
                  <Truck className="w-4 h-4 text-sky-500" />
                  <span className="text-xs font-semibold text-slate-700">ফ্রি ডেলিভারি</span>
                </motion.div>
                <div className="absolute left-3 -bottom-2 bg-amber-400 text-slate-900 rounded-xl shadow-lg px-3 py-2 flex items-center gap-1.5 font-bold text-sm">
                  <Star className="w-4 h-4 fill-slate-900" /> ৪.৯
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Slide dots */}
      <div className="absolute bottom-20 lg:bottom-24 left-1/2 -translate-x-1/2 flex gap-2">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`h-2 rounded-full transition-all ${i === current ? "w-8 bg-white" : "w-2 bg-white/40"}`}
            aria-label={`slide ${i + 1}`}
          />
        ))}
      </div>

      {/* Trust strip */}
      <div className="bg-white border-b border-slate-200/70">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-12 py-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: Truck, text: "ফ্রি ডেলিভারি", sub: "৫০০৳+ অর্ডারে" },
            { icon: ShieldCheck, text: "অরিজিনাল প্রোডাক্ট", sub: "১০০% গ্যারান্টি" },
            { icon: Wrench, text: "এক্সপার্ট সার্ভিস", sub: "ওয়ারেন্টি সহ" },
            { icon: Headphones, text: "২৪/৭ সাপোর্ট", sub: "যেকোনো সময়" },
          ].map((it) => (
            <div key={it.text} className="flex items-center gap-3">
              <div className="w-11 h-11 bg-sky-50 rounded-xl flex items-center justify-center shrink-0">
                <it.icon className="w-5 h-5 text-sky-500" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">{it.text}</p>
                <p className="text-xs text-slate-400">{it.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
