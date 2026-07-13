"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { apiFetch } from "@/lib/api";

interface Banner {
  id: string;
  title: string;
  subtitle: string | null;
  image: string;
  link: string | null;
  type: string;
  position: number;
}

const fallbackBanners: Banner[] = [];

export default function ServicesBanner() {
  const [banners, setBanners] = useState<Banner[]>(fallbackBanners);
  const [offset, setOffset] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      try {
        const res: any = await apiFetch("/api/banners?type=services");
        const data = res.data;
        if (Array.isArray(data) && data.length > 0) {setBanners(data);}
      } catch {}
    })();
  }, []);

  const maxOffset = banners.length <= 3 ? 0 : banners.length - 3;
  const slidePercent = banners.length > 0 ? 100 / banners.length : 0;

  const slideNext = useCallback(() => {
    if (isPaused) {return;}
    setOffset((prev) => (prev >= maxOffset ? 0 : prev + 1));
  }, [isPaused, maxOffset]);

  useEffect(() => {
    if (banners.length <= 3) {return;}
    const timer = setInterval(slideNext, 5000);
    return () => clearInterval(timer);
  }, [slideNext, banners.length]);

  if (banners.length === 0) {return null;}

  return (
    <section className="py-10 sm:py-14 bg-white">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-12">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Our Services
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Professional electrical solutions for home & industry
            </p>
          </div>
          <a
            href="/services"
            className="hidden sm:inline-flex items-center gap-1.5 text-sm font-medium text-epf-500 hover:text-epf-600 transition-colors border border-epf-500 hover:border-epf-600 rounded-md px-4 py-2"
          >
            View All
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </a>
        </div>

        {/* Slider */}
        <div className="relative overflow-hidden" ref={containerRef}>
          <div
            className="flex transition-transform duration-700 ease-in-out"
            style={{
              width: `${(banners.length / 3) * 100}%`,
              transform: `translateX(-${offset * slidePercent}%)`,
            }}
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            {banners.map((banner) => (
              <a
                key={banner.id}
                href={banner.link || "/services"}
                className="flex-shrink-0 relative group block px-1.5 sm:px-2"
                style={{ width: `${slidePercent}%` }}
              >
                <div className="h-[220px] sm:h-[280px] lg:h-[320px] relative overflow-hidden rounded-lg">
                  <img
                    src={banner.image}
                    alt={banner.title}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent rounded-lg" />
                  <div className="relative z-10 h-full flex flex-col justify-end p-5 sm:p-6 lg:p-8">
                    <h3 className="text-white text-[16px] sm:text-[20px] lg:text-[24px] font-bold leading-tight">
                      {banner.title}
                    </h3>
                    {banner.subtitle && (
                      <p className="text-white/70 text-[12px] sm:text-[13px] lg:text-[14px] mt-1.5 line-clamp-2 leading-relaxed">
                        {banner.subtitle}
                      </p>
                    )}
                  </div>
                </div>
              </a>
            ))}
          </div>

          {/* Dots */}
          {banners.length > 3 && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex gap-2">
              {Array.from({ length: maxOffset + 1 }).map((_, i) => (
                <span
                  key={i}
                  className={`rounded-full transition-all duration-300 block ${
                    i === offset
                      ? "w-6 h-2 bg-epf-500"
                      : "w-2 h-2 bg-slate-300"
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
