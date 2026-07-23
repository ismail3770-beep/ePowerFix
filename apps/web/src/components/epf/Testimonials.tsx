"use client";

import { Star, Quote } from "lucide-react";

const reviews = [
  {
    quote: "প্রোডাক্ট একদম অরিজিনাল আর ডেলিভারি অনেক ফাস্ট ছিল। Schneider MCB কিনেছি, প্যাকেজিংও চমৎকার।",
    name: "রহিম উদ্দিন",
    role: "ইলেকট্রিক্যাল কন্ট্রাক্টর, ঢাকা",
    color: "bg-sky-500",
  },
  {
    quote: "সোলার প্যানেল ইনস্টলেশনের সার্ভিস নিয়েছি — টেকনিশিয়ান প্রফেশনাল এবং কাজ সময়মতো শেষ হয়েছে।",
    name: "সাবরিনা আক্তার",
    role: "বাড়ির মালিক, চট্টগ্রাম",
    color: "bg-amber-500",
  },
  {
    quote: "দাম বাজারের চেয়ে কম আর কাস্টমার সাপোর্ট ২৪/৭ রেসপন্স করে। বারবার অর্ডার করছি, বিশ্বস্ত সাইট।",
    name: "কামরুল হাসান",
    role: "ফ্যাক্টরি ম্যানেজার, গাজীপুর",
    color: "bg-emerald-500",
  },
];

export default function Testimonials() {
  return (
    <section className="py-16">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-12">
        <div className="text-center mb-10">
          <p className="text-sky-600 font-semibold text-sm mb-1">গ্রাহক মতামত</p>
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900">আমাদের গ্রাহকরা কী বলেন</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {reviews.map((r) => (
            <div key={r.name} className="bg-white rounded-2xl border border-slate-200/70 shadow-sm p-6 flex flex-col">
              <Quote className="w-8 h-8 text-sky-100 mb-3" />
              <div className="flex gap-0.5 mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />
                ))}
              </div>
              <p className="text-slate-600 text-sm leading-relaxed flex-1">{r.quote}</p>
              <div className="flex items-center gap-3 mt-5 pt-5 border-t border-slate-100">
                <div className={`w-10 h-10 rounded-full ${r.color} text-white flex items-center justify-center font-bold`}>
                  {r.name.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">{r.name}</p>
                  <p className="text-xs text-slate-400">{r.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
