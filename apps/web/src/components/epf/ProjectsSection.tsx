"use client";
import { useRef, useState, useCallback, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, ChevronLeft, Cpu, Eye, Clock } from "lucide-react";
import { useUIStore } from "@/store";
import { apiFetch } from "@/lib/api";

interface Project {
  id: string;
  title: string;
  titleBn: string;
  price: number | null;
  category: string;
  techStack: string;
  image: string;
  description: string;
  featured: boolean;
}

const categoryLabel: Record<string, string> = { electrical: "Electrical", solar: "Solar", automation: "Automation", iot: "IoT" };
const difficultyFromCategory: Record<string, string> = { electrical: "intermediate", solar: "advanced", automation: "advanced", iot: "beginner" };
const difficultyColor: Record<string, string> = { beginner: "bg-[#4D7300]", intermediate: "bg-[#0EA5E9] text-white", advanced: "bg-[#0EA5E9]" };

function getCardsPerView(width: number): number {
  if (width >= 1280) return 6;
  if (width >= 1024) return 5;
  if (width >= 768) return 4;
  if (width >= 640) return 3;
  return 2;
}

export default function ProjectsSection() {
  const { setSelectedProjectId, setProjectDetailOpen } = useUIStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const [cardsPerView, setCardsPerView] = useState(6);
  const [currentSlide, setCurrentSlide] = useState(0);

  const { data: projectsData, isLoading } = useQuery<{ data: Project[] }>({
    queryKey: ["projects-home"],
    queryFn: () => apiFetch("/api/projects"),
  });

  const projects = projectsData?.data ?? [];
  const maxSlide = Math.max(0, projects.length - cardsPerView);

  useEffect(() => {
    const updateCards = () => setCardsPerView(getCardsPerView(window.innerWidth));
    updateCards();
    const ro = new ResizeObserver(updateCards);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  const scrollToIndex = useCallback((index: number) => {
    const clamped = Math.max(0, Math.min(index, maxSlide));
    setCurrentSlide(clamped);
    containerRef.current?.scrollTo({
      left: clamped * (containerRef.current.scrollWidth / projects.length || 1),
      behavior: "smooth",
    });
  }, [maxSlide, projects.length]);

  return (
    <section id="projects" className="bg-white">
      <div className="mx-auto max-w-[1920px] px-4 sm:px-12 pt-6">
        {/* Header */}
        <div className="mf-section-header rounded-t">
          <h3>Projects</h3>
          <a href="/projects" className="hidden sm:flex items-center gap-1 text-[14px] font-medium text-[#6B7280] hover:text-[#111827]">
            View All <ChevronRight className="h-3.5 w-3.5" />
          </a>
        </div>

        {/* Slider */}
        <div className="bg-white border border-[#E2E8F0] border-t-0 relative">
          <div
            ref={containerRef}
            className="flex overflow-x-auto scroll-smooth snap-x snap-mandatory"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {isLoading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="min-w-[calc(50%-0px)] sm:min-w-[calc(33.333%-0px)] md:min-w-[calc(25%-0px)] lg:min-w-[calc(20%-0px)] xl:min-w-[calc(16.666%-0px)] snap-start border-r border-b border-[#E2E8F0] animate-pulse shrink-0">
                    <div className="aspect-[4/3] bg-[#F1F5F9]" />
                    <div className="p-4 space-y-2">
                      <div className="h-3 bg-[#F1F5F9] rounded w-3/4" />
                      <div className="h-3 bg-[#F1F5F9] rounded w-1/2" />
                      <div className="h-4 bg-[#F1F5F9] rounded w-16" />
                    </div>
                  </div>
                ))
              : projects.map((proj) => {
                  const difficulty = difficultyFromCategory[proj.category] || "intermediate";
                  return (
                    <div
                      key={proj.id}
                      onClick={() => { setSelectedProjectId(proj.id); setProjectDetailOpen(true); }}
                      className="relative min-w-[calc(50%-0px)] sm:min-w-[calc(33.333%-0px)] md:min-w-[calc(25%-0px)] lg:min-w-[calc(20%-0px)] xl:min-w-[calc(16.666%-0px)] snap-start border-r border-b border-[#E2E8F0] shrink-0 p-4 hover:bg-[#F8FAFC] transition-colors cursor-pointer group"
                    >
                      <div className="aspect-[4/3] bg-[#F1F5F9] flex items-center justify-center mb-3 relative rounded overflow-hidden">
                        <Cpu className="h-10 w-10 text-[#CBD5E1]" />
                        <span className={`absolute top-2 left-2 text-white text-[12px] font-bold px-1.5 py-0.5 rounded-sm ${difficultyColor[difficulty] || "bg-[#111827]"}`}>{difficulty}</span>
                        <span className="absolute top-2 right-2 bg-white text-[#374151] text-[13px] font-medium px-1.5 py-0.5 rounded-sm border border-[#E2E8F0] capitalize">{categoryLabel[proj.category] || proj.category}</span>
                        {(!proj.price || proj.price === 0) && <span className="absolute bottom-2 right-2 bg-[#4D7300] text-white text-[12px] font-bold px-1.5 py-0.5 rounded-sm">FREE</span>}
                      </div>
                      <p className="block text-[14px] text-[#374151] line-clamp-2 leading-snug mb-2 group-hover:text-[#111827] transition-colors">{proj.title}</p>
                      <div className="flex items-center gap-3 text-[13px] text-[#6B7280] mb-2">
                        <span className="flex items-center gap-0.5"><Eye className="h-3 w-3" /> {Math.floor(Math.random() * 800 + 200)}</span>
                        <span className="flex items-center gap-0.5"><Clock className="h-3 w-3" /> Instant</span>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-[#E2E8F0]">
                        <span className="text-[15px] font-semibold text-[#111827]">
                          {(!proj.price || proj.price === 0) ? "Free" : `৳${proj.price.toLocaleString()}`}
                        </span>
                      </div>
                    </div>
                  );
                })}
          </div>

          {/* Navigation Arrows */}
          {projects.length > cardsPerView && (
            <>
              <button
                onClick={() => scrollToIndex(currentSlide - cardsPerView)}
                disabled={currentSlide === 0}
                className="absolute left-2 top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full bg-white border border-[#E2E8F0] shadow-sm flex items-center justify-center text-[#374151] hover:bg-[#0EA5E9] hover:text-white hover:border-[#0EA5E9] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => scrollToIndex(currentSlide + cardsPerView)}
                disabled={currentSlide >= maxSlide}
                className="absolute right-2 top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full bg-white border border-[#E2E8F0] shadow-sm flex items-center justify-center text-[#374151] hover:bg-[#0EA5E9] hover:text-white hover:border-[#0EA5E9] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      </div>
    </section>
  );
}