"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import useEmblaCarousel from "embla-carousel-react";
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
  const [paused, setPaused] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const touchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoplayRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const progressRafRef = useRef<number | null>(null);
  const progressStartRef = useRef<number>(0);

  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true, align: "start" },
    []
  );

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

  /* ── Sync Embla onSelect with state ─────────────────────── */
  const onSelect = useCallback(() => {
    if (!emblaApi) {return;}
    setSelectedIndex(emblaApi.selectedScrollSnap());
    setProgress(0);
    progressStartRef.current = Date.now();
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) {return;}
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi, onSelect]);

  /* ── Smooth Embla transition ────────────────────────────── */
  useEffect(() => {
    if (!emblaApi) {return;}
    const root = emblaApi.rootNode();
    const container = root.querySelector(
      "[data-embla-container]"
    ) as HTMLElement | null;
    if (!container) {return;}

    container.style.transition = "transform 0.5s cubic-bezier(0.25, 0.1, 0.25, 1)";

    const handler = () => {
      container.style.transition =
        "transform 0.5s cubic-bezier(0.25, 0.1, 0.25, 1)";
    };

    emblaApi.on("settle", handler);
    return () => {
      emblaApi.off("settle", handler);
    };
  }, [emblaApi]);

  /* ── Autoplay (setInterval 5s) ──────────────────────────── */
  const scrollNext = useCallback(() => {
    emblaApi?.scrollNext();
  }, [emblaApi]);

  const scrollPrev = useCallback(() => {
    emblaApi?.scrollPrev();
  }, [emblaApi]);

  useEffect(() => {
    if (paused || slides.length === 0 || !emblaApi) {return;}
    progressStartRef.current = Date.now();
    autoplayRef.current = setInterval(() => {
      scrollNext();
    }, 5000);
    return () => {
      if (autoplayRef.current) {clearInterval(autoplayRef.current);}
    };
  }, [paused, slides.length, emblaApi, scrollNext]);

  /* ── Progress bar animation (RAF) ───────────────────────── */
  useEffect(() => {
    if (paused || slides.length === 0) {
      setProgress(0);
      return;
    }

    progressStartRef.current = Date.now();

    const tick = () => {
      const elapsed = Date.now() - progressStartRef.current;
      const pct = Math.min((elapsed / 5000) * 100, 100);
      setProgress(pct);
      progressRafRef.current = requestAnimationFrame(tick);
    };

    progressRafRef.current = requestAnimationFrame(tick);
    return () => {
      if (progressRafRef.current) {cancelAnimationFrame(progressRafRef.current);}
    };
  }, [paused, slides.length, selectedIndex]);

  /* ── Pause / Resume handlers ────────────────────────────── */
  const handleMouseEnter = useCallback(() => setPaused(true), []);
  const handleMouseLeave = useCallback(() => {
    setPaused(false);
    progressStartRef.current = Date.now();
  }, []);

  const handleTouchStart = useCallback(() => {
    setPaused(true);
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (touchTimerRef.current) {clearTimeout(touchTimerRef.current);}
    touchTimerRef.current = setTimeout(() => {
      setPaused(false);
      progressStartRef.current = Date.now();
    }, 3000);
  }, []);

  /* ── Dot click ──────────────────────────────────────────── */
  const scrollTo = useCallback(
    (index: number) => {
      emblaApi?.scrollTo(index);
    },
    [emblaApi]
  );

  /* ── Cleanup ────────────────────────────────────────────── */
  useEffect(() => {
    return () => {
      if (touchTimerRef.current) {clearTimeout(touchTimerRef.current);}
      if (autoplayRef.current) {clearInterval(autoplayRef.current);}
      if (progressRafRef.current) {cancelAnimationFrame(progressRafRef.current);}
    };
  }, []);

  /* ── Render ─────────────────────────────────────────────── */
  return (
    <section className="bg-slate-50">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-12 py-6 sm:py-10">
        <div
          className="relative overflow-hidden rounded-lg group min-h-[280px] sm:min-h-[350px] lg:min-h-[420px]"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {slides.length === 0 ? (
            /* ── Empty state — no banners configured yet ── */
            <div className="absolute inset-0 bg-gradient-to-br from-epf-500/10 via-white to-epf-500/5 flex items-center justify-center">
              <div className="text-center px-6">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  Welcome to ePowerFix
                </h2>
                <p className="text-sm text-slate-500 mt-2">
                  Your trusted electrical marketplace. Add banners from the
                  admin panel to showcase promotions here.
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* ── Embla root ──────────────────────────────── */}
              <div ref={emblaRef} className="overflow-hidden h-full">
                <div
                  className="flex h-full"
                  style={{
                    transition:
                      "transform 0.5s cubic-bezier(0.25, 0.1, 0.25, 1)",
                  }}
                >
                  {slides.map((slide) => {
                    const hasImage = Boolean(slide.image);
                    const titleParts = slide.title.split("\n");
                    return (
                      <div
                        key={slide.id}
                        className="min-w-0 flex-[0_0_100%] h-full relative"
                      >
                        {/* Background */}
                        {hasImage ? (
                          <>
                            <img
                              src={slide.image}
                              alt={slide.title}
                              className="absolute inset-0 w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/50" />
                          </>
                        ) : (
                          <div className="absolute inset-0 bg-gradient-to-br from-epf-500/10 via-white to-epf-500/5" />
                        )}

                        {/* Content */}
                        <div className="absolute inset-0 z-10 flex items-center px-6 sm:px-10 lg:px-14">
                          <div className="max-w-md lg:max-w-lg">
                            <h1
                              className={`text-[22px] sm:text-[28px] lg:text-[36px] font-bold leading-[1.25] tracking-tight ${
                                hasImage
                                  ? "text-white"
                                  : "text-slate-900"
                              }`}
                            >
                              {titleParts.map((part, idx) => (
                                <span key={idx}>
                                  {idx > 0 && <br />}
                                  {part}
                                </span>
                              ))}
                            </h1>

                            {slide.subtitle && (
                              <p
                                className={`text-[14px] sm:text-[15px] mt-2 max-w-md leading-relaxed ${
                                  hasImage
                                    ? "text-white/70"
                                    : "text-slate-500"
                                }`}
                              >
                                {slide.subtitle}
                              </p>
                            )}

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
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ── Arrow buttons ───────────────────────────── */}
              <button
                onClick={scrollPrev}
                className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 z-20 h-9 w-9 bg-white shadow-md hover:shadow-lg rounded-full flex items-center justify-center text-slate-700 transition-all opacity-100 lg:opacity-0 lg:group-hover:opacity-100"
                aria-label="Previous slide"
              >
                <EPFArrowLeft size={16} />
              </button>
              <button
                onClick={scrollNext}
                className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 z-20 h-9 w-9 bg-white shadow-md hover:shadow-lg rounded-full flex items-center justify-center text-slate-700 transition-all opacity-100 lg:opacity-0 lg:group-hover:opacity-100"
                aria-label="Next slide"
              >
                <EPFArrowRight size={16} />
              </button>

              {/* ── Progress bar ────────────────────────────── */}
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-200 z-20">
                <div
                  className="h-full bg-epf-500 transition-[width] duration-100 ease-linear"
                  style={{ width: `${progress}%` }}
                />
              </div>

              {/* ── Dot indicators ──────────────────────────── */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
                {slides.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => scrollTo(i)}
                    className={`h-2 rounded-full transition-all ${
                      i === selectedIndex
                        ? "bg-slate-900 w-7"
                        : "bg-slate-400 w-2"
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