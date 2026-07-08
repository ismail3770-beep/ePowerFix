"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { EPFArrowLeft, EPFArrowRight } from "@/components/epf/icons/EPFIcons";

const banglaDigits = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
function toBangla(n: number): string {
  return String(n)
    .split("")
    .map((c) => (/\d/.test(c) ? banglaDigits[parseInt(c)] : c))
    .join("");
}

interface ImageGalleryProps {
  images: string[];
  autoPlay?: boolean;
  interval?: number;
  showCounter?: boolean;
  aspectRatio?: string;
}

export default function ImageGallery({
  images,
  autoPlay = true,
  interval = 4000,
  showCounter = true,
  aspectRatio = "aspect-video",
}: ImageGalleryProps) {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStartX = useRef(0);
  const touchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const total = images.length;

  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: "start" });

  // Sync current index from Embla
  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => {
      setCurrent(emblaApi.selectedScrollSnap());
    };
    emblaApi.on("select", onSelect);
    onSelect();
    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi]);

  const next = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  const prev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollTo = useCallback(
    (index: number) => {
      if (emblaApi) emblaApi.scrollTo(index);
    },
    [emblaApi]
  );

  // Autoplay
  useEffect(() => {
    if (!autoPlay || paused || total <= 1) return;
    const id = setInterval(next, interval);
    return () => clearInterval(id);
  }, [autoPlay, paused, interval, next, total]);

  // Touch handlers with 30px threshold and 3s resume delay
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    setPaused(true);
    if (touchTimerRef.current) clearTimeout(touchTimerRef.current);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 30) {
      if (diff > 0) next();
      else prev();
    }
    // Resume autoplay 3s after touch ends
    if (touchTimerRef.current) clearTimeout(touchTimerRef.current);
    touchTimerRef.current = setTimeout(() => setPaused(false), 3000);
  };

  // Cleanup touch timer on unmount
  useEffect(() => {
    return () => {
      if (touchTimerRef.current) clearTimeout(touchTimerRef.current);
    };
  }, []);

  if (total === 0) {
    return (
      <div
        className={`${aspectRatio} bg-dark-100 flex items-center justify-center rounded-lg`}
      >
        <span className="text-[13px] text-dark-400">কোনো ছবি নেই</span>
      </div>
    );
  }

  if (total === 1) {
    return (
      <div className={`${aspectRatio} bg-dark-100 rounded-lg overflow-hidden`}>
        <img src={images[0]} alt="" className="w-full h-full object-cover" />
      </div>
    );
  }

  return (
    <div>
      {/* Main Image */}
      <div
        className={`relative ${aspectRatio} bg-dark-100 rounded-lg overflow-hidden group cursor-zoom-in`}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div ref={emblaRef} className="h-full overflow-hidden">
          <div
            className="flex h-full"
            style={{
              transition:
                "transform 0.4s cubic-bezier(0.25, 0.1, 0.25, 1)",
            }}
          >
            {images.map((img, i) => (
              <div key={i} className="flex-none w-full h-full relative">
                <img
                  src={img}
                  alt=""
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-150"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Left Arrow */}
        <button
          onClick={prev}
          className="absolute left-3 top-1/2 -translate-y-1/2 h-9 w-9 bg-black/40 hover:bg-black/60 text-white flex items-center justify-center rounded-full transition-colors z-10"
          aria-label="আগের ছবি"
        >
          <EPFArrowLeft className="h-4 w-4" />
        </button>

        {/* Right Arrow */}
        <button
          onClick={next}
          className="absolute right-3 top-1/2 -translate-y-1/2 h-9 w-9 bg-black/40 hover:bg-black/60 text-white flex items-center justify-center rounded-full transition-colors z-10"
          aria-label="পরের ছবি"
        >
          <EPFArrowRight className="h-4 w-4" />
        </button>

        {/* Counter */}
        {showCounter && (
          <span className="absolute bottom-3 right-3 bg-black/50 text-white text-[12px] font-semibold px-2.5 py-1 rounded-full z-10">
            {toBangla(current + 1)} / {toBangla(total)}
          </span>
        )}
      </div>

      {/* Thumbnail Strip */}
      {total > 1 && (
        <div
          className="flex gap-2 mt-3 overflow-x-auto pb-1"
          style={{ scrollbarWidth: "none" }}
        >
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => scrollTo(i)}
              className={`shrink-0 h-14 w-20 rounded overflow-hidden border-2 transition-all ${
                i === current
                  ? "border-epf-500 scale-105"
                  : "border-transparent opacity-50 hover:opacity-80"
              }`}
            >
              <img src={img} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}