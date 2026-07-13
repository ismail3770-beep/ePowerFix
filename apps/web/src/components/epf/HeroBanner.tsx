"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
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

const EASE_OUT = [0.22, 0.61, 0.36, 1] as const;

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

    container.style.transition = "transform 0.6s cubic-bezier(0.22, 0.61, 0.36, 1)";

    const handler = () => {
      container.style.transition =
        "transform 0.6s cubic-bezier(0.22, 0.61, 0.36, 1)";
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
    <section className="bg-gradient-to-b from-epf-50 via-white to-white">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE_OUT }}
          className="relative overflow-hidden rounded-2xl group min-h-[300px] sm:min-h-[380px] lg:min-h-[440px] shadow-sm"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {slides.length === 0 ? (
            /* ── Empty state — no banners configured yet ── */
            <div className="absolute inset-0 bg-gradient-to-br from-epf-50 via-white to-epf-100/60 flex items-center justify-center">
              <div className="text-center px-6 max-w-xl">
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1, duration: 0.5 }}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-epf-500/10 text-epf-600 text-[12px] font-semibold mb-4"
                >
                  Premium Electrical Marketplace
                </motion.span>
                <motion.h2
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15, duration: 0.5, ease: EASE_OUT }}
                  className="text-[28px] sm:text-[40px] lg:text-[48px] font-bold text-slate-900 tracking-tight leading-[1.1]"
                >
                  Welcome to ePowerFix
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25, duration: 0.5, ease: EASE_OUT }}
                  className="text-[14px] sm:text-[15px] text-slate-500 mt-3 max-w-md mx-auto leading-relaxed"
                >
                  Your trusted electrical marketplace. Add banners from the
                  admin panel to showcase promotions here.
                </motion.p>
              </div>
            </div>
          ) : (
            <>
              {/* ── Embla root ──────────────────────────────── */}
              <div ref={emblaRef} className="overflow-hidden h-full">
                <div
                  data-embla-container
                  className="flex h-full"
                  style={{
                    transition:
                      "transform 0.6s cubic-bezier(0.22, 0.61, 0.36, 1)",
                  }}
                >
                  {slides.map((slide, idx) => {
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
                            <div className="absolute inset-0 bg-gradient-to-r from-black/65 via-black/40 to-transparent" />
                          </>
                        ) : (
                          <div className="absolute inset-0 bg-gradient-to-br from-epf-50 via-white to-epf-100/60" />
                        )}

                        {/* Content */}
                        <div className="absolute inset-0 z-10 flex items-center px-6 sm:px-10 lg:px-14">
                          <div className="max-w-md lg:max-w-xl">
                            <motion.h1
                              key={`title-${idx}-${selectedIndex}`}
                              initial={{ opacity: 0, y: 14 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{
                                duration: 0.55,
                                ease: EASE_OUT,
                                delay: 0.05,
                              }}
                              className={`text-[26px] sm:text-[34px] lg:text-[44px] font-bold leading-[1.15] tracking-tight ${
                                hasImage
                                  ? "text-white"
                                  : "text-slate-900"
                              }`}
                            >
                              {titleParts.map((part, i) => (
                                <span key={i}>
                                  {i > 0 && <br />}
                                  {part}
                                </span>
                              ))}
                            </motion.h1>

                            {slide.subtitle && (
                              <motion.p
                                key={`sub-${idx}-${selectedIndex}`}
                                initial={{ opacity: 0, y: 14 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{
                                  duration: 0.55,
                                  ease: EASE_OUT,
                                  delay: 0.15,
                                }}
                                className={`text-[14px] sm:text-[16px] mt-3 max-w-md leading-relaxed ${
                                  hasImage
                                    ? "text-white/85"
                                    : "text-slate-500"
                                }`}
                              >
                                {slide.subtitle}
                              </motion.p>
                            )}

                            {slide.link && (
                              <motion.a
                                href={slide.link}
                                initial={{ opacity: 0, y: 14 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{
                                  duration: 0.55,
                                  ease: EASE_OUT,
                                  delay: 0.25,
                                }}
                                className="inline-flex items-center gap-2 mt-6 bg-epf-500 hover:bg-epf-600 text-white font-semibold h-11 px-7 text-[14px] rounded-lg transition-colors shadow-sm"
                              >
                                Explore Now
                                <ArrowRight className="h-4 w-4" />
                              </motion.a>
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
                className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 z-20 h-10 w-10 bg-white shadow-md hover:shadow-lg rounded-full flex items-center justify-center text-slate-700 hover:text-epf-600 transition-all opacity-100 lg:opacity-0 lg:group-hover:opacity-100"
                aria-label="Previous slide"
              >
                <EPFArrowLeft size={18} />
              </button>
              <button
                onClick={scrollNext}
                className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 z-20 h-10 w-10 bg-white shadow-md hover:shadow-lg rounded-full flex items-center justify-center text-slate-700 hover:text-epf-600 transition-all opacity-100 lg:opacity-0 lg:group-hover:opacity-100"
                aria-label="Next slide"
              >
                <EPFArrowRight size={18} />
              </button>

              {/* ── Progress bar ────────────────────────────── */}
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/30 z-20">
                <div
                  className="h-full bg-epf-500 transition-[width] duration-100 ease-linear"
                  style={{ width: `${progress}%` }}
                />
              </div>

              {/* ── Dot indicators ──────────────────────────── */}
              <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2 z-20">
                {slides.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => scrollTo(i)}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      i === selectedIndex
                        ? "bg-white w-8"
                        : "bg-white/50 hover:bg-white/70 w-2"
                    }`}
                    aria-label={`Slide ${i + 1}`}
                  />
                ))}
              </div>
            </>
          )}
        </motion.div>
      </div>
    </section>
  );
}
