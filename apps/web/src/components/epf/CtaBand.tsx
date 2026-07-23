"use client";

import Link from "next/link";
import { Zap, ArrowRight, PhoneCall } from "lucide-react";

export default function CtaBand() {
  return (
    <section className="py-16">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-12">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-sky-500 via-sky-600 to-sky-800 px-8 py-12 md:py-16 text-white">
          <div className="absolute -top-16 -right-10 w-72 h-72 bg-white/10 rounded-full blur-3xl" />
          <Zap className="absolute -right-6 -bottom-8 w-56 h-56 text-white/10" strokeWidth={1} />
          <div className="relative flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="max-w-xl">
              <h2 className="text-2xl md:text-3xl font-bold leading-tight">
                প্রফেশনাল ইলেকট্রিক্যাল সার্ভিস দরকার?
              </h2>
              <p className="text-white/85 mt-3">
                ফ্রি কোটেশন নিন অথবা আপনার এলাকার ভেরিফাইড ইলেকট্রিশিয়ান খুঁজুন — সবকিছু এক ক্লিকে।
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 shrink-0">
              <Link
                href="/get-quote"
                className="inline-flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-slate-900 px-7 py-3 rounded-xl font-bold transition shadow-lg shadow-black/10"
              >
                ফ্রি কোটেশন নিন <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/electricians"
                className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 ring-1 ring-white/40 px-7 py-3 rounded-xl font-bold transition"
              >
                <PhoneCall className="w-5 h-5" /> ইলেকট্রিশিয়ান খুঁজুন
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
