"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ChevronRight,
  Home,
  Cpu,
  Eye,
  Check,
  ExternalLink,
  Github,
  FolderGit2,
  Zap,
  Sun,
  Bot,
  Wifi,
  ArrowRight,
  List,
} from "lucide-react";
import { useUIStore } from "@/store";
import { apiFetch } from "@/lib/api";
import Header from "@/components/epf/Header";
import Footer from "@/components/epf/Footer";
import CartDrawer from "@/components/epf/CartDrawer";
import CheckoutDialog from "@/components/epf/CheckoutDialog";
import ProductDetailDialog from "@/components/epf/ProductDetailDialog";
import ServiceBookingDialog from "@/components/epf/ServiceBookingDialog";
import ProjectDetailDialog from "@/components/epf/ProjectDetailDialog";
import ChatWidget from "@/components/epf/ChatWidget";
import BackToTopButton from "@/components/epf/BackToTopButton";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
interface Project {
  id: string;
  title: string;
  titleBn: string;
  slug: string;
  description: string;
  descriptionBn: string;
  category: string;
  techStack: string;
  image: string;
  images: string;
  price: number | null;
  githubUrl: string | null;
  liveUrl: string | null;
  features: string;
  featured: boolean;
  active: boolean;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */
const CATEGORY_TABS = [
  { key: "all", label: "All Projects", icon: List },
  { key: "electrical", label: "Electrical", icon: Zap },
  { key: "solar", label: "Solar", icon: Sun },
  { key: "automation", label: "Automation", icon: Bot },
  { key: "iot", label: "IoT", icon: Wifi },
] as const;

const categoryLabel: Record<string, string> = {
  electrical: "Electrical",
  solar: "Solar",
  automation: "Automation",
  iot: "IoT",
};

const difficultyFromCategory: Record<string, string> = {
  electrical: "Intermediate",
  solar: "Advanced",
  automation: "Advanced",
  iot: "Beginner",
};

const difficultyColor: Record<string, string> = {
  Beginner: "bg-[#4D7300]",
  Intermediate: "bg-[#0EA5E9] text-white",
  Advanced: "bg-[#0EA5E9]",
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */
function parseJsonArray(val: unknown): string[] {
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') {
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) return parsed;
      return [];
    } catch {
      return val
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }
  }
  return [];
}

/* ------------------------------------------------------------------ */
/*  Skeleton components                                                */
/* ------------------------------------------------------------------ */
function TabSkeleton() {
  return <div className="animate-pulse h-9 w-28 rounded bg-[#F1F5F9]" />;
}

function ProjectCardSkeleton() {
  return (
    <div className="border border-[#E2E8F0] rounded bg-white animate-pulse">
      {/* Image placeholder */}
      <div className="aspect-[16/10] bg-[#F1F5F9] rounded-t relative">
        <div className="absolute top-3 left-3 h-5 w-16 bg-[#E2E8F0] rounded" />
        <div className="absolute top-3 right-3 h-5 w-20 bg-[#E2E8F0] rounded" />
      </div>
      {/* Content */}
      <div className="p-4">
        <div className="h-4 bg-[#F1F5F9] rounded w-3/4 mb-2" />
        <div className="h-4 bg-[#F1F5F9] rounded w-1/2 mb-3" />
        <div className="space-y-1.5 mb-4">
          <div className="h-3 bg-[#F1F5F9] rounded w-full" />
          <div className="h-3 bg-[#F1F5F9] rounded w-full" />
          <div className="h-3 bg-[#F1F5F9] rounded w-4/5" />
        </div>
        <div className="space-y-1.5 mb-4">
          <div className="h-3 bg-[#F1F5F9] rounded w-2/3" />
          <div className="h-3 bg-[#F1F5F9] rounded w-1/2" />
          <div className="h-3 bg-[#F1F5F9] rounded w-3/5" />
        </div>
        <div className="flex gap-1.5 mb-4">
          <div className="h-6 w-14 bg-[#F1F5F9] rounded" />
          <div className="h-6 w-16 bg-[#F1F5F9] rounded" />
          <div className="h-6 w-12 bg-[#F1F5F9] rounded" />
        </div>
        <div className="flex items-center justify-between pt-3 border-t border-[#E2E8F0]">
          <div className="h-5 w-20 bg-[#F1F5F9] rounded" />
          <div className="h-9 w-28 bg-[#F1F5F9] rounded" />
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Page                                                          */
/* ------------------------------------------------------------------ */
export default function ProjectsPage() {
  const { setSelectedProjectId, setProjectDetailOpen } = useUIStore();
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const { data, isLoading, isError } = useQuery<{ success: boolean; data: Project[]; message?: string }>({
    queryKey: ["projects-page"],
    queryFn: () => apiFetch("/api/projects"),
  });

  const allProjects = data?.data ?? [];

  const filteredProjects = useMemo(() => {
    if (activeCategory === "all") return allProjects;
    return allProjects.filter((p) => p.category === activeCategory);
  }, [allProjects, activeCategory]);

  const handleViewDetails = (proj: Project) => {
    setSelectedProjectId(proj.id);
    setProjectDetailOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      <Header />
      <CartDrawer />
      <CheckoutDialog />
      <ProductDetailDialog />
      <ServiceBookingDialog />
      <ProjectDetailDialog />

      {/* Main content */}
      <main className="flex-1">
        <div className="mx-auto max-w-[1920px] px-4 sm:px-12 py-5">
          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 mb-5">
            <a
              href="/"
              className="flex items-center gap-1 text-[13px] text-[#6B7280] hover:text-[#111827] transition-colors"
            >
              <Home className="h-3.5 w-3.5" />
              Home
            </a>
            <ChevronRight className="h-3 w-3 text-[#94A3B8]" />
            <span className="text-[13px] font-medium text-[#111827]">
              Projects
            </span>
          </nav>

          {/* Page header */}
          <div className="mb-5">
            <h1 className="text-[20px] font-semibold text-[#111827]">
              Student Projects
            </h1>
            <p className="text-[14px] text-[#6B7280] mt-1">
              Browse all electrical, solar, automation & IoT projects with
              source code and documentation
            </p>
          </div>

          {/* Category filter tabs */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-1 scrollbar-none">
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => <TabSkeleton key={i} />)
              : CATEGORY_TABS.map((tab) => {
                  const TabIcon = tab.icon;
                  return (
                    <button
                      key={tab.key}
                      onClick={() => setActiveCategory(tab.key)}
                      className={`shrink-0 h-9 px-4 text-[14px] font-medium rounded flex items-center gap-1.5 transition-colors ${
                        activeCategory === tab.key
                          ? "bg-[#111827] text-[#F8FAFC]"
                          : "bg-white text-[#374151] border border-[#E2E8F0] hover:border-[#111827]"
                      }`}
                    >
                      <TabIcon className="h-4 w-4" />
                      {tab.label}
                    </button>
                  );
                })}
          </div>

          {/* Results count */}
          {!isLoading && !isError && (
            <p className="text-[13px] text-[#6B7280] mb-4">
              Showing{" "}
              {activeCategory === "all"
                ? allProjects.length
                : filteredProjects.length}{" "}
              {filteredProjects.length === 1 ? "project" : "projects"}
              {activeCategory !== "all" && (
                <span>
                  {" "}
                  in{" "}
                  <span className="text-[#111827] font-medium">
                    {categoryLabel[activeCategory] || activeCategory}
                  </span>
                </span>
              )}
            </p>
          )}

          {/* Project cards grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <ProjectCardSkeleton key={i} />
              ))}
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 rounded-full bg-[#F1F5F9] flex items-center justify-center mb-4">
                <FolderGit2 className="h-7 w-7 text-[#94A3B8]" />
              </div>
              <h3 className="text-[16px] font-medium text-[#111827] mb-1">
                Failed to load projects
              </h3>
              <p className="text-[14px] text-[#6B7280]">
                Something went wrong. Please try again later.
              </p>
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 rounded-full bg-[#F1F5F9] flex items-center justify-center mb-4">
                <FolderGit2 className="h-7 w-7 text-[#94A3B8]" />
              </div>
              <h3 className="text-[16px] font-medium text-[#111827] mb-1">
                No projects found
              </h3>
              <p className="text-[14px] text-[#6B7280] mb-4">
                No projects available in this category.
              </p>
              {activeCategory !== "all" && (
                <button
                  onClick={() => setActiveCategory("all")}
                  className="h-9 px-5 text-[14px] font-medium bg-[#111827] text-[#F8FAFC] rounded hover:bg-[#1E293B] transition-colors"
                >
                  View All Projects
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProjects.map((proj) => {
                const difficulty =
                  difficultyFromCategory[proj.category] || "Intermediate";
                const techStack = parseJsonArray(proj.techStack);
                const features = parseJsonArray(proj.features);
                const isFree = !proj.price || proj.price === 0;

                return (
                  <div
                    key={proj.id}
                    className="bg-white border border-[#E2E8F0] rounded flex flex-col"
                  >
                    {/* Image area */}
                    <div className="aspect-[16/10] bg-[#F1F5F9] rounded-t relative overflow-hidden">
                      <Cpu className="h-10 w-10 text-[#CBD5E1] absolute inset-0 m-auto" />
                      {/* Category badge */}
                      <span className="absolute top-3 right-3 bg-white text-[#374151] text-[13px] font-medium px-2 py-0.5 rounded-sm border border-[#E2E8F0]">
                        {categoryLabel[proj.category] || proj.category}
                      </span>
                      {/* Difficulty badge */}
                      <span
                        className={`absolute top-3 left-3 text-white text-[12px] font-bold px-1.5 py-0.5 rounded-sm ${
                          difficultyColor[difficulty] || "bg-[#111827]"
                        }`}
                      >
                        {difficulty}
                      </span>
                      {/* FREE badge */}
                      {isFree && (
                        <span className="absolute bottom-3 right-3 bg-[#4D7300] text-white text-[12px] font-bold px-1.5 py-0.5 rounded-sm">
                          FREE
                        </span>
                      )}
                      {/* Featured badge */}
                      {proj.featured && (
                        <span className="absolute bottom-3 left-3 bg-[#0EA5E9] text-white text-[12px] font-bold px-1.5 py-0.5 rounded-sm">
                          FEATURED
                        </span>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-4 flex flex-col flex-1">
                      {/* Title */}
                      <h3 className="text-[16px] font-semibold text-[#111827] leading-snug mb-2">
                        {proj.title}
                      </h3>

                      {/* Full description */}
                      <p className="text-[14px] text-[#374151] leading-relaxed mb-4">
                        {proj.description}
                      </p>

                      {/* Features list */}
                      {features.length > 0 && (
                        <ul className="space-y-1.5 mb-4">
                          {features.slice(0, 5).map((feat, idx) => (
                            <li
                              key={idx}
                              className="flex items-start gap-2 text-[14px] text-[#374151]"
                            >
                              <Check className="h-3.5 w-3.5 text-[#4D7300] shrink-0 mt-0.5" />
                              <span className="line-clamp-1">{feat}</span>
                            </li>
                          ))}
                          {features.length > 5 && (
                            <li className="text-[13px] text-[#6B7280] pl-5">
                              +{features.length - 5} more features
                            </li>
                          )}
                        </ul>
                      )}

                      {/* Spacer */}
                      <div className="flex-1" />

                      {/* Tech stack tags */}
                      {techStack.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-4">
                          {techStack.slice(0, 4).map((tech, idx) => (
                            <span
                              key={idx}
                              className="text-[12px] font-medium text-[#374151] bg-[#F1F5F9] px-2 py-1 rounded"
                            >
                              {tech}
                            </span>
                          ))}
                          {techStack.length > 4 && (
                            <span className="text-[12px] font-medium text-[#6B7280] bg-[#F1F5F9] px-2 py-1 rounded">
                              +{techStack.length - 4}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Footer: price + links + button */}
                      <div className="flex items-center justify-between pt-3 mt-1 border-t border-[#E2E8F0]">
                        {/* Price */}
                        <div className="min-w-0">
                          <span className="text-[15px] font-semibold text-[#111827]">
                            {isFree
                              ? "Free"
                              : `৳${proj.price!.toLocaleString()}`}
                          </span>
                          <div className="flex items-center gap-2 mt-1">
                            {proj.githubUrl && (
                              <a
                                href={proj.githubUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[#6B7280] hover:text-[#111827] transition-colors"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Github className="h-4 w-4" />
                              </a>
                            )}
                            {proj.liveUrl && (
                              <a
                                href={proj.liveUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[#6B7280] hover:text-[#111827] transition-colors"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            )}
                          </div>
                        </div>

                        {/* View Details button */}
                        <button
                          onClick={() => handleViewDetails(proj)}
                          className="shrink-0 h-9 px-5 text-[14px] font-medium bg-[#0EA5E9] text-white rounded hover:bg-[#0284C7] transition-colors flex items-center gap-1.5"
                        >
                          <Eye className="h-4 w-4" />
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* CTA Banner */}
          {!isLoading && !isError && allProjects.length > 0 && (
            <div className="mt-8 bg-[#111827] p-5 flex flex-col sm:flex-row items-center justify-between gap-3 rounded">
              <div>
                <p className="text-white font-semibold text-[16px]">
                  Have a project idea in mind?
                </p>
                <p className="text-white/40 text-[14px] mt-0.5">
                  We can help you build custom electrical, solar or IoT
                  projects.
                </p>
              </div>
              <a
                href="/services"
                className="bg-[#0EA5E9] hover:bg-[#0284C7] text-white font-semibold text-[15px] h-[40px] px-6 shrink-0 flex items-center gap-1.5 transition-colors rounded"
              >
                Browse Services <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          )}
        </div>
      </main>

      <ChatWidget />
      <BackToTopButton />
      <Footer />
    </div>
  );
}