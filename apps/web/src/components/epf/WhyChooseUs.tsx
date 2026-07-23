"use client";

import { ShieldCheck, Truck, Wrench, CreditCard } from "lucide-react";

const features = [
  { icon: ShieldCheck, title: "১০০% অরিজিনাল", desc: "সরাসরি ব্র্যান্ড ও অনুমোদিত ডিলার থেকে সংগ্রহ" },
  { icon: Truck, title: "দ্রুত ডেলিভারি", desc: "ঢাকায় ২৪ ঘণ্টায় এবং সারাদেশে ২-৩ দিনে" },
  { icon: Wrench, title: "এক্সপার্ট সার্ভিস", desc: "ভেরিফাইড টেকনিশিয়ান ও ওয়ারেন্টি সাপোর্ট" },
  { icon: CreditCard, title: "নিরাপদ পেমেন্ট", desc: "bKash, Nagad, কার্ড ও ক্যাশ অন ডেলিভারি" },
];

export default function WhyChooseUs() {
  return (
    <section className="py-16">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-12">
        <div className="bg-white rounded-3xl border border-slate-200/70 shadow-sm p-8 md:p-10">
          <div className="text-center mb-8">
            <p className="text-sky-600 font-semibold text-sm mb-1">কেন ePowerFix?</p>
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900">আমরা যা অফার করি</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:divide-x lg:divide-slate-200/70">
            {features.map((f) => (
              <div key={f.title} className="flex flex-col items-center text-center lg:px-4">
                <div className="w-14 h-14 bg-sky-50 rounded-2xl flex items-center justify-center mb-4">
                  <f.icon className="w-7 h-7 text-sky-500" />
                </div>
                <h3 className="font-bold text-slate-800 mb-1">{f.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
