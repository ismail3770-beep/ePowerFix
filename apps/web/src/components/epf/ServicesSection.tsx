"use client";
import { useState, useRef, useCallback, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ChevronRight,
  ChevronLeft,
  Zap,
  Factory,
  Sun,
  Shield,
  Wrench,
  Plug,
  Lightbulb,
  Clock,
  CheckCircle,
  ArrowRight,
} from "lucide-react";
import { useUIStore } from "@/store";

interface Service {
  id: string;
  name: string;
  nameBn: string;
  description: string;
  descriptionBn: string;
  basePrice: number;
  priceUnit: string;
  priceLabel: string;
  duration: string;
  popular: boolean;
  icon: string;
  category: { id: string; name: string; icon: string } | null;
  features: string;
}

const iconMap: Record<string, React.ElementType> = {
  zap: Zap, factory: Factory, sun: Sun, shield: Shield,
  wrench: Wrench, plug: Plug, lightbulb: Lightbulb,
  Home: Zap, Factory: Factory, Shield: Shield, Sun: Sun,
};

function getCardsPerView(width: number): number {
  if (width >= 1024) return 3;
  if (width >= 640) return 2;
  return 1;
}

export default function ServicesSection() {
  const { setServiceBookingOpen, setBookingServiceId } = useUIStore();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [cardsPerView, setCardsPerView] = useState(3);
  const scrollRef = useRef<HTMLDivElement>(null);
  const resizeRef = useRef<HTMLDivElement>(null);

  // Responsive: detect container width
  useEffect(() => {
    const el = resizeRef.current;
    if (!el) return;
    const update = () => {
      const w = el.getBoundingClientRect().width;
      setCardsPerView(getCardsPerView(w));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const { data: servicesData, isLoading } = useQuery<{ data: { services: Service[] } }>({
    queryKey: ["services-home"],
    queryFn: () => fetch("/api/services").then((r) => r.json()),
  });

  const allServices = servicesData?.data?.services ?? [];
  const maxSlide = Math.max(0, allServices.length - cardsPerView);
  const effectiveSlide = Math.min(currentSlide, maxSlide);

  const goPrev = useCallback(() => setCurrentSlide((s) => Math.max(0, s - 1)), []);
  const goNext = useCallback(() => setCurrentSlide((s) => Math.min(s + 1, maxSlide)), [maxSlide]);

  const handleBook = (svc: Service) => {
    setBookingServiceId(svc.id);
    setServiceBookingOpen(true);
  };

  const parseFeatures = (f: unknown): string[] => {
    if (Array.isArray(f)) return f;
    if (typeof f === 'string') {
      try { const p = JSON.parse(f); return Array.isArray(p) ? p : []; }
      catch { return f.split(",").map((s) => s.trim()).filter(Boolean); }
    }
    return [];
  };

  const slidePercent = (currentSlide / allServices.length) * 100;

  return (
    <section id="services" className="bg-white" ref={resizeRef}>
      <div className="mx-auto max-w-[1920px] px-4 sm:px-12 pt-6 pb-6">
        {/* Section Header */}
        <div className="mf-section-header">
          <h3>Our Services</h3>
          <a
            href="/services"
            className="hidden sm:flex items-center gap-1 text-[14px] font-medium text-[#6B7280] hover:text-[#111827]"
          >
            View All <ChevronRight className="h-3.5 w-3.5" />
          </a>
        </div>

        {isLoading ? (
          <div className="border border-[#E2E8F0] border-t-0 p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="border border-[#E2E8F0] rounded-[8px] p-5 animate-pulse">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-11 w-11 bg-[#E2E8F0] rounded-full" />
                    <div className="flex-1">
                      <div className="h-4 bg-[#E2E8F0] rounded w-2/3 mb-2" />
                      <div className="h-3 bg-[#E2E8F0] rounded w-1/2" />
                    </div>
                  </div>
                  <div className="space-y-2 mb-4">
                    <div className="h-3 bg-[#E2E8F0] rounded" />
                    <div className="h-3 bg-[#E2E8F0] rounded w-4/5" />
                  </div>
                  <div className="h-10 bg-[#E2E8F0] rounded" />
                </div>
              ))}
            </div>
          </div>
        ) : allServices.length === 0 ? null : (
          <div className="border border-[#E2E8F0] border-t-0 relative">
            {/* Carousel */}
            <div className="overflow-hidden" ref={scrollRef}>
              <div
                className="flex transition-transform duration-500 ease-in-out"
                style={{ transform: `translateX(-${effectiveSlide * (100 / cardsPerView)}%)` }}
              >
                {allServices.map((svc) => {
                  const Icon = iconMap[svc.category?.icon || ""] || Zap;
                  const features = parseFeatures(svc.features);
                  return (
                    <div
                      key={svc.id}
                      className="w-full sm:w-1/2 lg:w-1/3 shrink-0 p-4"
                    >
                      <div
                        onClick={() => handleBook(svc)}
                        className="h-full border border-[#E2E8F0] rounded-[8px] overflow-hidden hover:shadow-lg hover:border-[#94A3B8] transition-all duration-200 cursor-pointer group flex flex-col"
                      >
                        <div className="h-1 bg-gradient-to-r from-[#0EA5E9] to-[#0284C7]" />
                        <div className="p-5 flex flex-col flex-1">
                          {/* Icon + Title */}
                          <div className="flex items-start gap-3 mb-3">
                            <div className="h-11 w-11 shrink-0 bg-[#F1F5F9] group-hover:bg-[#E0F2FE] rounded-full flex items-center justify-center transition-colors">
                              <Icon className="h-5 w-5 text-[#6B7280] group-hover:text-[#0EA5E9] transition-colors" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="text-[15px] font-bold text-[#111827] leading-snug">
                                  {svc.name}
                                </h4>
                                {svc.popular && (
                                  <span className="bg-[#0EA5E9] text-white text-[11px] font-bold px-1.5 py-0.5 rounded-[3px] leading-none">
                                    HOT
                                  </span>
                                )}
                              </div>
                              {svc.category && (
                                <p className="text-[13px] text-[#6B7280] mt-0.5">
                                  {svc.category.name}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Description */}
                          <p className="text-[14px] text-[#374151] leading-relaxed mb-3 line-clamp-2">
                            {svc.description}
                          </p>

                          {/* Features (max 3) */}
                          {features.length > 0 && (
                            <ul className="space-y-1.5 mb-3">
                              {features.slice(0, 3).map((feat, idx) => (
                                <li key={idx} className="flex items-center gap-2 text-[13px] text-[#374151]">
                                  <div className="h-4 w-4 shrink-0 rounded-full bg-[#E8F5E9] flex items-center justify-center">
                                    <CheckCircle className="h-2.5 w-2.5 text-[#2E7D32]" />
                                  </div>
                                  <span className="line-clamp-1">{feat}</span>
                                </li>
                              ))}
                            </ul>
                          )}

                          <div className="flex-1" />

                          {/* Price + Book */}
                          <div className="flex items-end justify-between pt-3 border-t border-[#E2E8F0] mt-auto">
                            <div>
                              <p className="text-[17px] font-bold text-[#111827]">
                                ৳{(svc.basePrice ?? 0).toLocaleString()}
                              </p>
                              {svc.duration && (
                                <div className="flex items-center gap-1 mt-0.5 text-[13px] text-[#6B7280]">
                                  <Clock className="h-3.5 w-3.5" />
                                  {svc.duration}
                                </div>
                              )}
                            </div>
                            <span className="text-[13px] font-semibold text-[#0EA5E9] group-hover:text-[#0284C7] flex items-center gap-1 transition-colors">
                              Book Now <ArrowRight className="h-3.5 w-3.5" />
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Left/Right Arrow Buttons */}
            {maxSlide > 0 && (
              <>
                <button
                  onClick={goPrev}
                  disabled={effectiveSlide === 0}
                  className={`absolute left-2 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full border border-[#CBD5E1] bg-white shadow-md flex items-center justify-center transition-all ${
                    effectiveSlide === 0
                      ? "opacity-30 cursor-not-allowed"
                      : "hover:bg-[#0EA5E9] hover:border-[#0EA5E9] hover:text-white opacity-100 active:scale-95"
                  }`}
                  aria-label="Previous services"
                >
                  <ChevronLeft className="h-5 w-5 text-[#374151]" />
                </button>
                <button
                  onClick={goNext}
                  disabled={effectiveSlide >= maxSlide}
                  className={`absolute right-2 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full border border-[#CBD5E1] bg-white shadow-md flex items-center justify-center transition-all ${
                    effectiveSlide >= maxSlide
                      ? "opacity-30 cursor-not-allowed"
                      : "hover:bg-[#0EA5E9] hover:border-[#0EA5E9] hover:text-white opacity-100 active:scale-95"
                  }`}
                  aria-label="Next services"
                >
                  <ChevronRight className="h-5 w-5 text-[#374151]" />
                </button>
              </>
            )}

            {/* Dot Indicators */}
            {maxSlide > 0 && (
              <div className="flex items-center justify-center gap-2 py-3">
                {Array.from({ length: maxSlide + 1 }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentSlide(i)}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      i === effectiveSlide
                        ? "w-6 bg-[#0EA5E9]"
                        : "w-2 bg-[#94A3B8] hover:bg-[#6B7280]"
                    }`}
                    aria-label={`Go to slide ${i + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* CTA Banner */}
        {!isLoading && allServices.length > 0 && (
          <div className="mt-5 bg-[#111827] p-5 flex flex-col sm:flex-row items-center justify-between gap-3 rounded-[8px]">
            <div>
              <p className="text-white font-bold text-[16px]">
                Need a custom electrical solution?
              </p>
              <p className="text-white/40 text-[14px] mt-0.5">
                Get a free consultation and quotation today.
              </p>
            </div>
            <button
              onClick={() => {
                if (allServices.length > 0) {
                  setBookingServiceId(allServices[0].id);
                  setServiceBookingOpen(true);
                }
              }}
              className="bg-[#0EA5E9] hover:bg-[#0284C7] text-white font-bold text-[15px] h-[42px] px-6 shrink-0 flex items-center gap-2 transition-colors rounded-[6px]"
            >
              Get Free Quote <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </section>
  );
}