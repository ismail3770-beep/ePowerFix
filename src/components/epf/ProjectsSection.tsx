"use client";
import { useQuery } from "@tanstack/react-query";
import { EPFCpu } from "@/components/epf/icons/EPFIcons";
import { apiFetch } from "@/lib/api";

interface Project {
  id: string;
  title: string;
  titleBn?: string | null;
  slug: string;
  description: string;
  coverImage?: string | null;
  images?: string[];
  client?: string | null;
  location?: string | null;
  status: string;
  category?: string;
}

export default function ProjectsSection() {
  const { data: projectsData, isLoading } = useQuery<{ data: Project[] }>({
    queryKey: ["projects-home"],
    queryFn: () => apiFetch("/api/projects"),
  });

  const projects = (projectsData?.data ?? []).slice(0, 4);

  return (
    <section id="projects" className="bg-white py-10 sm:py-14">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-12">
        {/* ── Section Header ── */}
        <div className="flex items-end justify-between mb-6 sm:mb-8">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Engineering Projects
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Real-world installations delivered across Bangladesh
            </p>
          </div>
          <a
            href="/projects"
            className="hidden sm:inline-flex items-center gap-1.5 text-sm font-medium text-epf-500 hover:text-epf-600 transition-colors border border-epf-500 hover:border-epf-600 rounded-md px-4 py-2"
          >
            View All
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </a>
        </div>

        {/* ── Project Grid ── */}
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-lg border border-slate-200 overflow-hidden animate-pulse"
              >
                <div className="aspect-[4/3] bg-slate-100" />
                <div className="p-3 space-y-2">
                  <div className="h-4 bg-slate-100 w-3/4 rounded" />
                  <div className="h-3 bg-slate-100 w-full rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="bg-white rounded-lg border border-slate-200 p-10 text-center">
            <EPFCpu size={40} className="text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-slate-500">No projects available</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-5">
            {projects.map((proj) => {
              const cover = proj.coverImage || proj.images?.[0];
              return (
                <a
                  key={proj.id}
                  href={`/projects/${proj.slug}`}
                  className="group block bg-white rounded-lg border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 overflow-hidden transition-all duration-200 cursor-pointer"
                >
                  {/* Image */}
                  <div className="relative aspect-[4/3] bg-slate-50 overflow-hidden">
                    {cover ? (
                      <img
                        src={cover}
                        alt={proj.title}
                        className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500 ease-out"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <EPFCpu size={32} className="text-slate-300" />
                      </div>
                    )}
                    <span className="absolute top-2 left-2 bg-white/95 text-slate-700 text-[10px] font-semibold px-1.5 py-0.5 rounded leading-none tracking-wide uppercase shadow-sm">
                      {proj.category || "Project"}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="p-3 flex flex-col gap-1.5">
                    <h4 className="text-[13px] font-semibold text-slate-800 line-clamp-2 leading-snug group-hover:text-epf-600 transition-colors min-h-[2.4rem]">
                      {proj.title}
                    </h4>
                    <p className="text-[12px] text-slate-500 line-clamp-2 leading-relaxed">
                      {proj.description}
                    </p>
                    <span className="text-[12px] font-semibold text-epf-600 group-hover:text-epf-700 transition-colors mt-auto pt-1">
                      View Details →
                    </span>
                  </div>
                </a>
              );
            })}
          </div>
        )}

        {/* ── Mobile "View All" ── */}
        <div className="sm:hidden mt-6 text-center">
          <a
            href="/projects"
            className="inline-flex items-center justify-center gap-1.5 w-full text-sm font-medium text-white bg-epf-500 hover:bg-epf-600 rounded-md px-4 py-3 transition-colors"
          >
            View All Projects
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
}
