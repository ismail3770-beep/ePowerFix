"use client";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Cpu } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { FadeInStagger, FadeInItem } from "@/components/epf/FadeIn";

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
    <section id="projects" className="ff bg-white mt-[50px]">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
        {/* ── Section Header ── */}
        <div className="flex items-end justify-between border-b border-[#e5e5e5] pb-4 mb-6">
          <div>
            <h3 className="ff-section-title !text-[20px] !pb-0">Our Projects</h3>
            <p className="text-[14px] text-[#6e6e6e] mt-2">
              সারাদেশে সম্পন্ন করা বাস্তব ইলেকট্রিক্যাল ইনস্টলেশন
            </p>
          </div>
          <a
            href="/projects"
            className="hidden sm:inline-flex items-center gap-1 text-[14px] text-[#0068e1] hover:underline group"
          >
            সব দেখুন
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
          </a>
        </div>

        {/* ── Project Grid ── */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-xl border border-slate-200 overflow-hidden animate-pulse"
              >
                <div className="aspect-[4/3] bg-slate-100" />
                <div className="p-4 space-y-2">
                  <div className="h-3 bg-slate-100 rounded w-3/4" />
                  <div className="h-3 bg-slate-100 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 py-16 px-6 text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center mb-4">
              <Cpu className="h-8 w-8 text-slate-300" strokeWidth={1.5} />
            </div>
            <h3 className="text-[18px] font-medium text-slate-700">No projects available</h3>
            <p className="text-[14px] text-slate-400 mt-1.5">
              Project case studies will appear here once published.
            </p>
          </div>
        ) : (
          <FadeInStagger className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-5">
            {projects.map((proj) => {
              const cover = proj.coverImage || proj.images?.[0];
              return (
                <FadeInItem key={proj.id}>
                  <a
                    href={`/projects/${proj.slug}`}
                    className="group relative block bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer"
                  >
                    {/* Image — landscape proportion */}
                    <div className="relative aspect-[4/3] bg-slate-100 overflow-hidden">
                      {cover ? (
                        <img
                          src={cover}
                          alt={proj.title}
                          className="w-full h-full object-cover group-hover:scale-[1.05] transition-transform duration-500 ease-out"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
                          <Cpu className="h-10 w-10 text-slate-300" strokeWidth={1.5} />
                        </div>
                      )}
                      {/* Gradient overlay for legibility on hover */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      {/* Category badge */}
                      <span className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm text-slate-800 text-[11px] font-bold px-2.5 py-1 rounded-full leading-none tracking-wide shadow-sm">
                        {proj.category || "Project"}
                      </span>
                    </div>

                    {/* Content — project name only */}
                    <div className="px-4 py-3.5">
                      <h4 className="text-[14px] font-semibold text-slate-800 line-clamp-2 leading-snug group-hover:text-epf-600 transition-colors">
                        {proj.title}
                      </h4>
                    </div>
                  </a>
                </FadeInItem>
              );
            })}
          </FadeInStagger>
        )}

        {/* ── Mobile "View All" ── */}
        {projects.length > 0 && (
          <div className="sm:hidden mt-8 text-center">
            <a
              href="/projects"
              className="inline-flex items-center justify-center gap-1.5 text-[14px] font-semibold text-white bg-epf-500 hover:bg-epf-600 h-11 px-6 rounded-lg transition-colors"
            >
              View All Projects
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        )}
      </div>
    </section>
  );
}
