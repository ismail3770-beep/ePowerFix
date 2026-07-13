"use client";
import { useState } from "react";
import { X, Zap, Percent, Gift, ShieldCheck, Headphones } from "lucide-react";

const messages = [
  { icon: Zap, text: <>Free Delivery on orders over ৳5,000 — Nationwide</> },
  { icon: Percent, text: <>Flash Sale: Up to 40% OFF on Circuit Breakers — Limited time!</> },
  { icon: Gift, text: <>Use code <span className="font-semibold text-slate-300">EPOWER10</span> for 10% extra discount</> },
  { icon: ShieldCheck, text: <>100% Authentic Products — Official Warranty</> },
  { icon: Headphones, text: <>24/7 Expert Support: Call +880 1XXX-XXXXXX</> },
];

export default function AnnouncementBar() {
  const [closed, setClosed] = useState(false);
  if (closed) {return null;}

  return (
    <div className="bg-slate-900 text-slate-400 text-[14px] relative overflow-hidden">
      <style jsx>{`
        @keyframes epf-marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .epf-marquee-track {
          animation: epf-marquee 40s linear infinite;
          will-change: transform;
        }
        .epf-marquee-track:hover {
          animation-play-state: paused;
        }
      `}</style>
      <div className="mx-auto max-w-[1400px] px-4 sm:px-12 flex items-center h-[36px]">
        <div className="flex-1 overflow-hidden">
          <div className="epf-marquee-track flex whitespace-nowrap gap-12 w-max">
            {messages.map((m, i) => (
              <span key={i} className="flex items-center gap-2">
                <m.icon className="h-3 w-3 text-slate-600" />
                {m.text}
              </span>
            ))}
            {messages.map((m, i) => (
              <span key={`dup-${i}`} className="flex items-center gap-2">
                <m.icon className="h-3 w-3 text-slate-600" />
                {m.text}
              </span>
            ))}
          </div>
        </div>
        <button
          onClick={() => setClosed(true)}
          className="ml-4 shrink-0 text-slate-600 hover:text-slate-400 transition-colors"
          aria-label="Close announcement"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}