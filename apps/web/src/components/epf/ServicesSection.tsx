"use client";

import Link from "next/link";
import { ArrowRight, Plug, Wrench, Sun, ShieldCheck, Lightbulb, Fan } from "lucide-react";

/**
 * FleetCart-style services section — clean bordered cards in a balanced grid,
 * using the .ff design tokens. Each card shows the service icon, name, short
 * description and starting price, keeping visual weight consistent with the
 * rest of the FleetCart-styled home page.
 */

const services = [
  { icon: Plug, title: "ইলেকট্রিক্যাল ইনস্টলেশন", desc: "নতুন বাসা, অফিস ও ফ্যাক্টরির সম্পূর্ণ ওয়্যারিং", price: "৫০০৳", tint: "bg-sky-50 text-sky-600" },
  { icon: Wrench, title: "রিপেয়ার ও মেইনটেন্যান্স", desc: "যেকোনো ইলেকট্রিক্যাল সমস্যার দ্রুত সমাধান", price: "৩০০৳", tint: "bg-amber-50 text-amber-600" },
  { icon: Sun, title: "সোলার ইনস্টলেশন", desc: "সোলার প্যানেল সেটআপ ও মেইনটেন্যান্স", price: "৫,০০০৳", tint: "bg-orange-50 text-orange-600" },
  { icon: ShieldCheck, title: "সেফটি অডিট", desc: "ইলেকট্রিক্যাল সেফটি ইন্সপেকশন ও রিপোর্ট", price: "১,০০০৳", tint: "bg-emerald-50 text-emerald-600" },
  { icon: Lightbulb, title: "লাইটিং ডিজাইন", desc: "ইন্টেরিয়র ও এক্সটেরিয়র লাইটিং সলিউশন", price: "২,০০০৳", tint: "bg-violet-50 text-violet-600" },
  { icon: Fan, title: "ফ্যান ও AC সার্ভিস", desc: "ফ্যান, AC ইনস্টলেশন ও সার্ভিসিং", price: "৪০০৳", tint: "bg-cyan-50 text-cyan-600" },
];

export default function ServicesSection() {
  return (
    <section id="services" className="ff bg-white mt-[50px]">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="flex items-end justify-between border-b border-[#e5e5e5] pb-4 mb-6">
          <div>
            <h3 className="ff-section-title !text-[20px] !pb-0">Our Services</h3>
            <p className="text-[14px] text-[#6e6e6e] mt-2">এক্সপার্ট টেকনিশিয়ান · ওয়ারেন্টি সহ · ২৪/৭ সাপোর্ট</p>
          </div>
          <Link href="/services" className="hidden sm:inline-flex items-center gap-1 text-[14px] text-[#0068e1] hover:underline">
            সব দেখুন <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Service cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map((s) => (
            <Link
              key={s.title}
              href="/services"
              className="group flex items-start gap-4 bg-white border border-[#e8e7eb] rounded-[8px] p-5 hover:border-[var(--ff-primary-a80)] hover:shadow-[0_4px_20px_rgba(0,0,0,0.06)] transition-all"
            >
              <div className={`w-12 h-12 rounded-[8px] flex items-center justify-center shrink-0 ${s.tint}`}>
                <s.icon className="w-6 h-6" strokeWidth={1.6} />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-[15px] font-semibold text-[#191919] group-hover:text-[#0068e1] transition-colors">
                  {s.title}
                </h4>
                <p className="text-[13px] text-[#6e6e6e] mt-1 leading-5 line-clamp-2">{s.desc}</p>
                <div className="flex items-center gap-1 mt-2 text-[13px]">
                  <span className="text-[#6e6e6e]">শুরু</span>
                  <span className="font-semibold text-[#0068e1]">{s.price} থেকে</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
