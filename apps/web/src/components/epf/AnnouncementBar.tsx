"use client";

import { useState } from "react";
import { X, Zap, Truck, Tag } from "lucide-react";

const announcements = [
  {
    icon: Truck,
    text: "৫০০৳+ অর্ডারে ফ্রি ডেলিভারি — সারাদেশে!",
    highlight: null,
    subtext: null,
  },
  {
    icon: Zap,
    text: "ফ্ল্যাশ সেল চলছে — সীমিত সময়ের অফার!",
    highlight: null,
    subtext: null,
  },
  {
    icon: Tag,
    text: "কুপন ব্যবহার করুন:",
    highlight: "POWER10",
    subtext: "— ১০% ছাড়!",
  },
];

export default function AnnouncementBar() {
  const [visible, setVisible] = useState(true);
  const [current, setCurrent] = useState(0);

  if (!visible) return null;

  const item = announcements[current];
  const Icon = item.icon;

  return (
    <div className="bg-[#0F172A] text-white text-xs sm:text-sm relative">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-12 py-2 flex items-center justify-center gap-2 text-center">
        <Icon className="w-4 h-4 text-[#0EA5E9] shrink-0" />
        <span>
          {item.text}
          {item.highlight && (
            <span className="font-bold text-[#F59E0B] mx-1 bg-white/10 px-2 py-0.5 rounded">
              {item.highlight}
            </span>
          )}
          {item.subtext && <span>{item.subtext}</span>}
        </span>
      </div>

      {/* Dots */}
      <div className="absolute left-1/2 -translate-x-1/2 bottom-0.5 flex gap-1">
        {announcements.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`w-1.5 h-1.5 rounded-full transition ${
              i === current ? "bg-[#0EA5E9]" : "bg-white/30"
            }`}
          />
        ))}
      </div>

      {/* Close */}
      <button
        onClick={() => setVisible(false)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
