"use client";
import { useState, useEffect, useCallback } from "react";
import { ArrowLeft, ArrowRight, Flame, Calculator, Timer, Zap } from "lucide-react";

const slides = [
  {
    title: "Professional Electrical Services You Can Trust",
    subtitle: "Licensed electricians for home wiring, industrial installation & solar panel setup.",
    button: "Book Now",
    link: "/services",
    badge: "Featured Services",
    bg: "from-[#111827] to-[#1E293B]",
  },
  {
    title: "Quality Components & Digital Guides",
    subtitle: "Cables, breakers, safety equipment and comprehensive PDF guides at best prices.",
    button: "Shop Now",
    link: "/shop",
    badge: "New Arrivals",
    bg: "from-[#111827] to-[#374151]",
  },
  {
    title: "Student Engineering Projects",
    subtitle: "Arduino, IoT & PLC project kits with code, diagrams and hardware delivered nationwide.",
    button: "Explore Projects",
    link: "/projects",
    badge: "For Students",
    bg: "from-[#0F172A] to-[#334155]",
  },
];

export default function HeroBanner() {
  const [current, setCurrent] = useState(0);

  const next = useCallback(() => setCurrent((c) => (c + 1) % slides.length), []);
  const prev = useCallback(() => setCurrent((c) => (c - 1 + slides.length) % slides.length), []);

  useEffect(() => {
    const id = setInterval(next, 6000);
    return () => clearInterval(id);
  }, [next]);

  return (
    <section className="bg-white">
      <div className="mx-auto max-w-[1920px] px-4 sm:px-12 py-4">
        <div className="flex gap-3 h-[350px] sm:h-[420px] lg:h-[500px]">
          {/* Main Slider */}
          <div className="flex-1 relative overflow-hidden bg-[#111827] rounded">
            {slides.map((slide, i) => (
              <div
                key={i}
                className={`absolute inset-0 transition-opacity duration-500 ${i === current ? "opacity-100" : "opacity-0"}`}
              >
                <div className={`absolute inset-0 bg-gradient-to-r ${slide.bg}`} />
              </div>
            ))}

            {slides.map((slide, i) => (
              <div
                key={`content-${i}`}
                className={`relative z-10 flex items-center h-full p-8 lg:p-12 transition-opacity duration-500 ${i === current ? "opacity-100" : "opacity-0 pointer-events-none"}`}
              >
                <div className="max-w-xl">
                  <span className="inline-block bg-[#0EA5E9] text-white text-[13px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-sm mb-5">
                    {slide.badge}
                  </span>
                  <h1 className="text-2xl sm:text-3xl lg:text-[2.75rem] xl:text-[3rem] font-bold text-white leading-[1.15] tracking-tight">{slide.title}</h1>
                  <p className="mt-4 text-sm sm:text-[16px] text-white/60 leading-relaxed max-w-md">{slide.subtitle}</p>
                  <a
                    href={slide.link}
                    className="inline-flex items-center gap-1.5 mt-7 bg-[#0EA5E9] hover:bg-[#0284C7] text-white font-semibold h-[44px] px-7 text-[15px] transition-colors rounded"
                  >
                    {slide.button}
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </a>
                </div>
              </div>
            ))}

            {/* Arrows */}
            <button
              onClick={() => { prev(); }}
              className="absolute left-4 top-1/2 -translate-y-1/2 h-10 w-10 bg-black/30 hover:bg-black/50 text-white flex items-center justify-center rounded-full transition-colors z-20"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => { next(); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 h-10 w-10 bg-black/30 hover:bg-black/50 text-white flex items-center justify-center rounded-full transition-colors z-20"
            >
              <ArrowRight className="h-4 w-4" />
            </button>

            {/* Dots */}
            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2 z-20">
              {slides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  className={`h-2 rounded-full transition-all ${i === current ? "bg-[#0EA5E9] w-7" : "bg-white/30 w-2"}`}
                />
              ))}
            </div>
          </div>

          {/* Right: Promotional Banners */}
          <div className="hidden md:flex flex-col gap-3 w-[260px] lg:w-[300px] xl:w-[340px] shrink-0">
            <a
              href="/deals"
              className="relative overflow-hidden bg-[#0EA5E9] cursor-pointer group hover:bg-[#0284C7] transition-colors rounded"
              style={{ flex: "2 1 0%" }}
            >
              <div className="p-5 flex flex-col h-full justify-center">
                <span className="text-[13px] font-bold uppercase tracking-widest text-[#F8FAFC] mb-1.5 flex items-center gap-1.5">
                  <Flame className="h-3.5 w-3.5" /> Flash Deals
                </span>
                <p className="text-xl lg:text-[22px] font-bold text-white leading-tight">Up to 40% OFF</p>
                <p className="text-[14px] text-white/50 mt-1.5">Circuit Breakers & Safety Gear</p>
                <span className="mt-4 text-[14px] font-semibold text-white inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                  Shop Now <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </div>
              <div className="absolute bottom-2 right-2 text-white/5"><Timer className="h-16 w-16" /></div>
            </a>

            <a
              href="/tools"
              className="relative overflow-hidden bg-[#111827] cursor-pointer group hover:bg-[#1E293B] transition-colors rounded"
              style={{ flex: "3 1 0%" }}
            >
              <div className="p-5 flex flex-col h-full justify-center">
                <span className="text-[13px] font-bold uppercase tracking-widest text-[#0EA5E9] mb-1.5 flex items-center gap-1.5">
                  <Calculator className="h-3.5 w-3.5" /> Free Online
                </span>
                <p className="text-xl lg:text-[22px] font-bold text-white leading-tight">8 Pro Calculators</p>
                <p className="text-[14px] text-white/50 mt-1.5">Cable size, voltage drop & more</p>
                <span className="mt-4 text-[14px] font-semibold text-[#0EA5E9] inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                  Use Free <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </div>
              <div className="absolute bottom-2 right-2 text-white/5"><Zap className="h-16 w-16" /></div>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}