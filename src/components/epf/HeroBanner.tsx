"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { EPFArrowLeft, EPFArrowRight } from "@/components/epf/icons/EPFIcons";
import { apiFetch } from "@/lib/api";

interface BannerSlide {
  id: string;
  title: string;
  subtitle: string | null;
  image: string;
  link: string | null;
}

const fallbackSlides: BannerSlide[] = [];

export default function HeroBanner() {
  const [slides, setSlides] = useState<BannerSlide[]>(fallbackSlides);
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const sliderRef = useRef<HTMLDivElement>(null);

  /* ── Fetch banners from API ─────────────────────────────── */
  useEffect(() => {
    (async () => {
      try {
        const res: any = await apiFetch("/api/banners");
        const banners = res.data;
        if (Array.isArray(banners) && banners.length > 0) {
          setSlides(banners);
        }
      } catch {
        // no banners available
      }
    })();
  }, []);

  /* ── Navigation helpers ─────────────────────────────────── */
  const next = useCallback(
    () => setCurrent((c) => (c + 1) % slides.length),
    [slides.length]
  );
  const prev = useCallback(
    () => setCurrent((c) => (c - 1 + slides.length) % slides.length),
    [slides.length]
  );

  /* ── Auto-slide every 5 s (pausable, only when slides exist) */
  useEffect(() => {
    if (paused || slides.length === 0) return;
    const id = setInterval(next, 5000);
    return () => clearInterval(id);
  }, [next, paused, slides.length]);

  /* ── Touch swipe (50 px threshold, 3 s resume) ─────────── */
  const handleTouchStart = (e: React.TouchEvent) => {
    setPaused(true);
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) next();
      else prev();
    }
    touchStartX.current = null;
    setTimeout(() => setPaused(false), 3000);
  };

  /* ── Render ─────────────────────────────────────────────── */
  return (
    <section className="bg-[#f8f9fa]">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-12 py-6 sm:py-10">
        {/* ── Slider wrapper ──────────────────────────────── */}
        <div
          ref={sliderRef}
          className="relative overflow-hidden rounded-lg group min-h-[280px] sm:min-h-[350px] lg:min-h-[420px]"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {slides.length === 0 ? (
            /* ── Empty state — no banners configured yet ── */
            <div className="absolute inset-0 bg-gradient-to-br from-epf-500/10 via-white to-epf-500/5 flex items-center justify-center">
              <div className="text-center px-6">
                <h2 className="text-xl sm:text-2xl font-bold text-dark-900 tracking-tight">
                  Welcome to ePowerFix
                </h2>
                <p className="text-sm text-dark-500 mt-2">
                  Your trusted electrical marketplace. Add banners from the
                  admin panel to showcase promotions here.
                </p>
              </div>
            </div>
          ) : (
            <>
          {/* ── Slide backgrounds (stacked, cross-fade) ──── */}
          {slides.map((slide, i) => (
            <div
              key={slide.id}
              className={`absolute inset-0 transition-opacity duration-500 ${
                i === current ? "opacity-100" : "opacity-0"
              }`}
            >
              {slide.image ? (
                <>
                  <img
                    src={slide.image}
                    alt={slide.title}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  {/* Dark overlay for image slides */}
                  <div className="absolute inset-0 bg-black/50" />
                </>
              ) : (
                /* Light gradient for non-image slides */
                <div className="absolute inset-0 bg-gradient-to-br from-epf-500/10 via-white to-epf-500/5" />
              )}
            </div>
          ))}

          {/* ── Slide content (stacked, cross-fade) ──────── */}
          {slides.map((slide, i) => {
            const hasImage = Boolean(slide.image);
            const titleParts = slide.title.split("\n");
            return (
              <div
                key={`content-${slide.id}`}
                className={`absolute inset-0 z-10 flex items-center px-6 sm:px-10 lg:px-14 transition-opacity duration-500 ${
                  i === current
                    ? "opacity-100"
                    : "opacity-0 pointer-events-none"
                }`}
              >
                <div className="max-w-md lg:max-w-lg">
                  {/* Title */}
                  <h1
                    className={`text-[22px] sm:text-[28px] lg:text-[36px] font-bold leading-[1.25] tracking-tight ${
                      hasImage ? "text-white" : "text-dark-900"
                    }`}
                  >
                    {titleParts.map((part, idx) => (
                      <span key={idx}>
                        {idx > 0 && <br />}
                        {part}
                      </span>
                    ))}
                  </h1>

                  {/* Subtitle */}
                  {slide.subtitle && (
                    <p
                      className={`text-[14px] sm:text-[15px] mt-2 max-w-md leading-relaxed ${
                        hasImage ? "text-white/70" : "text-dark-500"
                      }`}
                    >
                      {slide.subtitle}
                    </p>
                  )}

                  {/* CTA */}
                  {slide.link && (
                    <a
                      href={slide.link}
                      className="inline-flex items-center gap-2 mt-4 bg-epf-500 hover:bg-epf-600 text-white font-semibold h-10 px-6 text-[14px] rounded-md transition-colors"
                    >
                      Explore Now
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M5 12h14" />
                        <path d="m12 5 7 7-7 7" />
                      </svg>
                    </a>
                  )}
                </div>
              </div>
            );
          })}

          {/* ── Arrow buttons (visible on hover only) ────── */}
          <button
            onClick={prev}
            className="absolute left-3 top-1/2 -translate-y-1/2 z-20 h-9 w-9 bg-white shadow-md hover:shadow-lg rounded-full flex items-center justify-center text-dark-700 transition-all opacity-0 group-hover:opacity-100"
            aria-label="Previous slide"
          >
            <EPFArrowLeft size={16} />
          </button>
          <button
            onClick={next}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-20 h-9 w-9 bg-white shadow-md hover:shadow-lg rounded-full flex items-center justify-center text-dark-700 transition-all opacity-0 group-hover:opacity-100"
            aria-label="Next slide"
          >
            <EPFArrowRight size={16} />
          </button>

          {/* ── Dot indicators (dark, bottom-4) ─────────── */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`h-2 rounded-full transition-all ${
                  i === current ? "bg-dark-900 w-7" : "bg-dark-400 w-2"
                }`}
                aria-label={`Slide ${i + 1}`}
              />
            ))}
          </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
