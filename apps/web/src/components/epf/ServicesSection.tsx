"use client";

import Link from "next/link";
import { ArrowRight, Wrench, Plug, Sun, ShieldCheck, Lightbulb, Fan } from "lucide-react";
import { motion } from "framer-motion";

const services = [
  { icon: Plug, title: "ইলেকট্রিক্যাল ইনস্টলেশন", desc: "নতুন বাসা, অফিস, ফ্যাক্টরির সম্পূর্ণ ওয়্যারিং", price: "৫০০৳ থেকে" },
  { icon: Wrench, title: "রিপেয়ার ও মেইনটেন্যান্স", desc: "যেকোনো ইলেকট্রিক্যাল সমস্যার সমাধান", price: "৩০০৳ থেকে" },
  { icon: Sun, title: "সোলার ইনস্টলেশন", desc: "সোলার প্যানেল সেটআপ ও মেইনটেন্যান্স", price: "৫,০০০৳ থেকে" },
  { icon: ShieldCheck, title: "সেফটি অডিট", desc: "ইলেকট্রিক্যাল সেফটি ইন্সপেকশন ও রিপোর্ট", price: "১,০০০৳ থেকে" },
  { icon: Lightbulb, title: "লাইটিং ডিজাইন", desc: "ইন্টেরিয়র ও এক্সটেরিয়র লাইটিং সলিউশন", price: "২,০০০৳ থেকে" },
  { icon: Fan, title: "ফ্যান ও AC সার্ভিস", desc: "ফ্যান, AC ইনস্টলেশন ও সার্ভিসিং", price: "৪০০৳ থেকে" },
];

export default function ServicesSection() {
  return (
    <section className="max-w-[1400px] mx-auto px-4 sm:px-12 py-14">
      <div className="text-center mb-10">
        <span className="text-[#0EA5E9] font-semibold text-sm">আমাদের সার্ভিস</span>
        <h2 className="text-2xl md:text-3xl font-bold text-[#0F172A] mt-1">প্রফেশনাল ইলেকট্রিক্যাল সার্ভিস</h2>
        <p className="text-[#94A3B8] mt-2">এক্সপার্ট টেকনিশিয়ান | ওয়ারেন্টি সহ | ২৪/৭ সাপোর্ট</p>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {services.map((service, i) => (
          <motion.div
            key={service.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08 }}
            className="group bg-white border border-[#E2E8F0] rounded-2xl p-6 hover:shadow-lg hover:border-[#0EA5E9]/30 transition-all duration-300"
          >
            <div className="w-14 h-14 bg-[#F0F9FF] rounded-xl flex items-center justify-center mb-4 group-hover:bg-[#0EA5E9] transition-colors">
              <service.icon className="w-7 h-7 text-[#0EA5E9] group-hover:text-white transition-colors" />
            </div>
            <h3 className="text-lg font-bold text-[#0F172A] mb-2">{service.title}</h3>
            <p className="text-sm text-[#94A3B8] mb-3">{service.desc}</p>
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-[#4D7300]">{service.price}</span>
              <Link href="/services" className="flex items-center gap-1 text-sm font-semibold text-[#0EA5E9] hover:text-[#0284C7] transition">
                বুক করুন <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
