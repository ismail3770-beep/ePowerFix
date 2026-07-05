"use client";
import { useQuery } from "@tanstack/react-query";
import { EPFCpu } from "@/components/epf/icons/EPFIcons";
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
  coverImage?: string;
  images?: string[];
  description: string;
  featured: boolean;
}

const categoryLabel: Record<string, string> = {
  electrical: "ইলেকট্রিক্যাল",
  solar: "সোলার",
  automation: "অটোমেশন",
  iot: "আইওটি",
};

const categoryBadgeColor: Record<string, string> = {
  electrical: "bg-epf-50 text-epf-600",
  solar: "bg-warning/10 text-warning",
  automation: "bg-epf-50 text-epf-600",
  iot: "bg-success/10 text-success",
};

export default function ProjectsSection() {
  const { setSelectedProjectId, setProjectDetailOpen } = useUIStore();

  const { data: projectsData, isLoading } = useQuery<{ data: Project[] }>({
    queryKey: ["projects-home"],
    queryFn: () => apiFetch("/api/projects"),
  });

  const projects = (projectsData?.data ?? []).slice(0, 4);

  const openProjectDetail = (projectId: string) => {
    setSelectedProjectId(projectId);
    setProjectDetailOpen(true);
  };

  return (
    <section id="projects" className="bg-[#f8f9fa] py-10 sm:py-14">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-12">
        {/* ── Section Header ── */}
        <div className="flex items-center justify-between mb-6 sm:mb-8">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-dark-900">
              Engineering Projects
            </h2>
            <p className="text-sm text-dark-500 mt-1">
              ইঞ্জিনিয়ারিং প্রজেক্ট কিট
            </p>
          </div>
          <a
            href="/projects"
            className="hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold text-epf-500 border border-epf-500/40 rounded-full px-4 py-1.5 hover:bg-epf-500 hover:text-white transition-colors"
          >
            View All
          </a>
        </div>

        {/* ── Mobile "View All" link ── */}
        <div className="sm:hidden mb-4">
          <a
            href="/projects"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-epf-500 border border-epf-500/40 rounded-full px-4 py-1.5 hover:bg-epf-500 hover:text-white transition-colors"
          >
            View All
          </a>
        </div>

        {/* ── Project Grid ── */}
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-lg border border-dark-200/80 overflow-hidden animate-pulse"
              >
                <div className="aspect-[4/3] bg-dark-100" />
                <div className="p-3 space-y-2">
                  <div className="h-4 bg-dark-100 w-3/4 rounded" />
                  <div className="h-3 bg-dark-100 w-1/4 rounded" />
                  <div className="h-3 bg-dark-100 w-full rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="bg-white rounded-lg border border-dark-200/80 p-10 text-center">
            <EPFCpu size={40} className="text-dark-300 mx-auto mb-3" />
            <p className="text-sm text-dark-500">No projects available</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-5">
            {projects.map((proj) => (
              <div
                key={proj.id}
                className="bg-white rounded-lg border border-dark-200/80 shadow-sm hover:shadow-md hover:-translate-y-0.5 overflow-hidden transition-all duration-300 cursor-pointer group"
                onClick={() => openProjectDetail(proj.id)}
              >
                {/* Image */}
                <div className="relative aspect-[4/3] bg-dark-100 overflow-hidden">
                  {proj.coverImage ? (
                    <img
                      src={proj.coverImage}
                      alt={proj.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                  ) : proj.image ? (
                    <img
                      src={proj.image}
                      alt={proj.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <EPFCpu size={32} className="text-dark-300" />
                    </div>
                  )}
                  {(!proj.price || proj.price === 0) && (
                    <span className="absolute top-2 left-2 bg-success text-white text-[11px] font-bold px-1.5 py-0.5 rounded">
                      Free
                    </span>
                  )}
                </div>

                {/* Content */}
                <div className="p-3 flex flex-col gap-1.5">
                  {/* Category Badge */}
                  <span
                    className={`inline-flex w-fit text-[11px] font-semibold px-1.5 py-0.5 rounded ${
                      categoryBadgeColor[proj.category] ||
                      "bg-dark-100 text-dark-700"
                    }`}
                  >
                    {categoryLabel[proj.category] || proj.category}
                  </span>

                  {/* Title */}
                  <h4 className="text-[14px] font-semibold text-dark-900 line-clamp-2 leading-snug">
                    {proj.title}
                  </h4>

                  {/* Description */}
                  <p className="text-[12px] text-dark-500 line-clamp-1 leading-relaxed">
                    {proj.description}
                  </p>

                  {/* View Details Link */}
                  <a
                    href="#"
                    onClick={(e) => {
                      e.stopPropagation();
                      openProjectDetail(proj.id);
                    }}
                    className="text-[12px] font-semibold text-epf-500 hover:text-epf-600 transition-colors mt-auto pt-1"
                  >
                    View Details →
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
