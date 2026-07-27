"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

/**
 * FleetCart-exact hero: a large slider (≈70%) + two stacked promo
 * banners (≈30%). Mirrors modules/Storefront/.../home/sections/hero.blade.php
 * and _home-section.scss (520px height, 8px radius, parallax captions).
 * Banners hide below 1200px and the slider goes full width, like FleetCart.
 */

type Slide = {
  href: string;
  image: string;
  align: "left" | "right";
  caption1: string;
  caption2: string;
};

const slides: Slide[] = [
  {
    href: "/deals",
    image: "https://placehold.co/900x520/eef4fb/0068e1?text=Flash+Sale",
    align: "left",
    caption1: "মেগা ফ্ল্যাশ সেল",
    caption2: "নির্বাচিত ইলেকট্রিক্যাল প্রোডাক্টে ৫০% পর্যন্ত ছাড়",
  },
  {
    href: "/shop",
    image: "https://placehold.co/900x520/f3f0ff/6d28d9?text=New+Arrivals",
    align: "right",
    caption1: "নতুন কালেকশন",
    caption2: "লেটেস্ট এলইডি লাইটিং ও স্মার্ট সুইচ এখন স্টকে",
  },
  {
    href: "/services",
    image: "https://placehold.co/900x520/fff7ed/ea580c?text=Expert+Service",
    align: "left",
    caption1: "এক্সপার্ট সার্ভিস",
    caption2: "ভেরিফাইড ইলেকট্রিশিয়ান, ওয়ারেন্টি সহ, ২৪/৭ সাপোর্ট",
  },
];

const promos = [
  { href: "/shop", image: "https://placehold.co/420x250/e0f2fe/0068e1?text=Cables+%26+Wires" },
  { href: "/deals", image: "https://placehold.co/420x250/fef3c7/b45309?text=Best+Deals" },
];

export default function HeroBanner() {
  const [current, setCurrent] = useState(0);
  const count = slides.length;

  const go = useCallback((i: number) => setCurrent((i + count) % count), [count]);

  useEffect(() => {
    const t = setInterval(() => setCurrent((p) => (p + 1) % count), 5000);
    return () => clearInterval(t);
  }, [count]);

  return (
    <section className="ff bg-white pt-6">
      <div className="max-w-[1400px] mx-auto px-3 sm:px-6">
        <div className="flex gap-0 -mx-3">
          {/* Slider — 70% */}
          <div className="w-full lg:w-[70%] px-3">
            <div className="relative h-[240px] sm:h-[320px] lg:h-[420px] overflow-hidden rounded-[8px] group">
              {slides.map((slide, i) => (
                <Link
                  key={i}
                  href={slide.href}
                  className={`absolute inset-0 transition-opacity duration-700 ${
                    i === current ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
                  }`}
                >
                  <div
                    className="absolute inset-0 bg-cover bg-center bg-[rgba(0,0,0,0.04)]"
                    style={{ backgroundImage: `url(${slide.image})` }}
                  />
                  <div
                    className={`absolute inset-0 flex items-center ${
                      slide.align === "left" ? "justify-start" : "justify-end"
                    }`}
                  >
                    <div
                      className={`w-[460px] max-w-[70%] ${
                        slide.align === "left"
                          ? "ml-[40px] sm:ml-[60px] text-left"
                          : "mr-[40px] sm:mr-[60px] text-right"
                      }`}
                    >
                      <span className="block text-[28px] sm:text-[38px] lg:text-[48px] font-light leading-[1.05] text-[#191919]">
                        {slide.caption1}
                      </span>
                      <span className="block mt-3 sm:mt-5 text-[14px] sm:text-[16px] leading-[26px] text-[#6e6e6e]">
                        {slide.caption2}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}

              {/* Arrows */}
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); go(current - 1); }}
                aria-label="previous"
                className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-[30px] h-[30px] rounded-full bg-[var(--ff-primary-a30)] hover:bg-[var(--ff-primary)] text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); go(current + 1); }}
                aria-label="next"
                className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-[30px] h-[30px] rounded-full bg-[var(--ff-primary-a30)] hover:bg-[var(--ff-primary)] text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>

              {/* Pagination bullets */}
              <div className="absolute bottom-6 right-6 z-20 flex items-center gap-2">
                {slides.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={(e) => { e.preventDefault(); go(i); }}
                    aria-label={`slide ${i + 1}`}
                    className={`h-2 rounded-full transition-all ${
                      i === current ? "w-[25px] bg-[var(--ff-primary)]" : "w-2 bg-[var(--ff-primary-a30)]"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Promo banners — 30%, hidden on mobile like FleetCart */}
          <div className="hidden lg:flex lg:w-[30%] px-3 flex-col h-[420px]">
            {promos.map((p, i) => (
              <Link
                key={i}
                href={p.href}
                className={`block overflow-hidden rounded-[8px] bg-[rgba(0,0,0,0.04)] ${
                  i === 1 ? "mt-6" : ""
                }`}
                style={{ height: "calc(50% - 12px)" }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.image} alt="Banner" className="w-full h-full object-cover" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
