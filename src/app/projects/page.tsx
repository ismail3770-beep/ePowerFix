"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import {
  ChevronLeft,
  ChevronRight,
  FolderOpen,
  Search,
  X,
  ArrowRight,
  MapPin,
  Calendar,
  GraduationCap,
  ShoppingCart,
  Lightbulb,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { EPFHome, EPFChevronRight } from "@/components/epf/icons/EPFIcons";
import Header from "@/components/epf/Header";
import Footer from "@/components/epf/Footer";
import CartDrawer from "@/components/epf/CartDrawer";
import CheckoutDialog from "@/components/epf/CheckoutDialog";
import ChatWidget from "@/components/epf/ChatWidget";
import BackToTopButton from "@/components/epf/BackToTopButton";
import { apiFetch } from "@/lib/api";

interface ProjectItem {
  id: string;
  title: string;
  titleBn?: string | null;
  slug: string;
  description: string;
  coverImage?: string | null;
  images?: string[];
  client?: string | null;
  location?: string | null;
  createdAt: string;
}

const PAGE_SIZE = 9;

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */
function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function parseImages(val: unknown): string[] {
  if (Array.isArray(val)) return val as string[];
  if (typeof val === "string") {
    try {
      const p = JSON.parse(val);
      if (Array.isArray(p)) return p;
    } catch {
      /* ignore */
    }
  }
  return [];
}

function getCover(project: ProjectItem): string | null {
  if (project.coverImage) return project.coverImage;
  const imgs = project.images
    ? Array.isArray(project.images)
      ? project.images
      : parseImages(project.images)
    : [];
  return imgs[0] ?? null;
}

/* ------------------------------------------------------------------ */
/*  Project Card                                                       */
/* ------------------------------------------------------------------ */
function ProjectCard({
  project,
  onNavigate,
}: {
  project: ProjectItem;
  onNavigate: (slug: string) => void;
}) {
  const [imgError, setImgError] = useState(false);
  const cover = getCover(project);
  const handleClick = () => onNavigate(project.slug);

  return (
    <article
      onClick={handleClick}
      className="group flex flex-col bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 overflow-hidden cursor-pointer"
    >
      {/* Cover image */}
      <div className="relative aspect-[4/3] bg-slate-100 overflow-hidden">
        {!imgError && cover ? (
          <Image
            src={cover}
            alt={project.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
            onError={() => setImgError(true)}
            unoptimized
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center">
              <FolderOpen className="h-6 w-6 text-slate-300" />
            </div>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-col flex-1 p-4">
        <h3
          className="text-[16px] font-semibold text-slate-900 line-clamp-1 leading-snug group-hover:text-epf-600 transition-colors"
          title={project.title}
        >
          {project.title}
        </h3>

        <p className="mt-1.5 text-[13px] text-slate-500 line-clamp-2 leading-relaxed">
          {project.description}
        </p>

        {/* Meta row: location + date */}
        <div className="mt-3 flex items-center gap-3 text-[12px] text-slate-400 flex-wrap">
          {project.location && (
            <span className="inline-flex items-center gap-1 min-w-0">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{project.location}</span>
            </span>
          )}
          <span className="inline-flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            {formatDate(project.createdAt)}
          </span>
        </div>

        {/* Footer: View Details */}
        <div className="mt-4 pt-3 border-t border-slate-100">
          <span className="inline-flex items-center gap-1 text-[13px] font-medium text-epf-500 group-hover:gap-2 transition-all">
            View Details
            <ArrowRight className="h-3.5 w-3.5" />
          </span>
        </div>
      </div>
    </article>
  );
}

/* ------------------------------------------------------------------ */
/*  Sidebar — Recent Projects (mini list)                              */
/* ------------------------------------------------------------------ */
function RecentProjectItem({
  project,
  onNavigate,
}: {
  project: ProjectItem;
  onNavigate: (slug: string) => void;
}) {
  const [imgError, setImgError] = useState(false);
  const cover = getCover(project);
  return (
    <button
      onClick={() => onNavigate(project.slug)}
      className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors text-left group"
    >
      <div className="relative shrink-0 w-14 h-14 rounded-lg overflow-hidden bg-slate-100 border border-slate-200">
        {!imgError && cover ? (
          <Image
            src={cover}
            alt={project.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform"
            onError={() => setImgError(true)}
            unoptimized
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <FolderOpen className="h-5 w-5 text-slate-300" />
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <h4 className="text-[13px] font-medium text-slate-800 leading-snug line-clamp-1 group-hover:text-epf-600 transition-colors">
          {project.title}
        </h4>
        <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-slate-400">
          {project.location && (
            <>
              <MapPin className="h-3 w-3" />
              <span className="truncate">{project.location}</span>
            </>
          )}
        </div>
      </div>
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Pagination                                                         */
/* ------------------------------------------------------------------ */
function Pagination({
  current,
  total,
  onChange,
}: {
  current: number;
  total: number;
  onChange: (page: number) => void;
}) {
  if (total <= 1) return null;

  const pages: (number | "...")[] = [];
  if (total <= 7) {
    for (let i = 1; i <= total; i++) pages.push(i);
  } else {
    pages.push(1);
    if (current > 3) pages.push("...");
    for (
      let i = Math.max(2, current - 1);
      i <= Math.min(total - 1, current + 1);
      i++
    ) {
      pages.push(i);
    }
    if (current < total - 2) pages.push("...");
    pages.push(total);
  }

  return (
    <div className="flex items-center justify-center gap-1.5 mt-8">
      <button
        onClick={() => onChange(current - 1)}
        disabled={current <= 1}
        className="h-9 w-9 flex items-center justify-center border border-slate-200 rounded-lg text-slate-700 bg-white hover:bg-slate-50 hover:border-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        aria-label="Previous page"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      {pages.map((p, i) =>
        p === "..." ? (
          <span
            key={`e-${i}`}
            className="h-9 w-9 flex items-center justify-center text-slate-500 text-[13px]"
          >
            ...
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onChange(p as number)}
            className={cn(
              "h-9 min-w-9 px-2 flex items-center justify-center rounded-lg text-[13px] font-semibold transition-colors",
              current === p
                ? "bg-epf-500 text-white shadow-sm hover:bg-epf-600"
                : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300"
            )}
          >
            {p}
          </button>
        )
      )}
      <button
        onClick={() => onChange(current + 1)}
        disabled={current >= total}
        className="h-9 w-9 flex items-center justify-center border border-slate-200 rounded-lg text-slate-700 bg-white hover:bg-slate-50 hover:border-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        aria-label="Next page"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Empty State                                                        */
/* ------------------------------------------------------------------ */
function EmptyState({ onClear }: { onClear: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 bg-white rounded-xl border border-slate-200">
      <FolderOpen className="h-16 w-16 text-slate-200 mb-4" />
      <h3 className="text-[18px] font-medium text-slate-900 mb-1.5">
        No projects found
      </h3>
      <p className="text-[14px] text-slate-500 mb-6 text-center max-w-md">
        Try a different search term, or check back soon — new projects are
        added regularly.
      </p>
      <button
        onClick={onClear}
        className="h-10 px-6 bg-epf-500 hover:bg-epf-600 text-white text-[13px] font-semibold rounded-lg transition-colors shadow-sm"
      >
        Clear Search
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Page                                                          */
/* ------------------------------------------------------------------ */
export default function ProjectsPage() {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");

  const navigate = (slug: string) => router.push(`/projects/${slug}`);

  const { data: apiData, isLoading } = useQuery<{ data: ProjectItem[] }>({
    queryKey: ["projects-page-live"],
    queryFn: () => apiFetch("/api/projects"),
  });

  const allProjects = apiData?.data ?? [];

  const filtered = useMemo(() => {
    let list = allProjects;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q)
      );
    }
    return list;
  }, [allProjects, searchQuery]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = useMemo(
    () =>
      filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [filtered, currentPage]
  );

  // Recent projects for sidebar (latest first, top 5)
  const recentProjects = useMemo(() => {
    return [...allProjects]
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      .slice(0, 5);
  }, [allProjects]);

  const handleClearAll = () => {
    setSearchQuery("");
    setCurrentPage(1);
  };

  const hasActiveFilters = searchQuery.trim() !== "";

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />
      <CartDrawer />
      <CheckoutDialog />

      <main className="flex-1">
        {/* Top Bar: Breadcrumb + Title + Search */}
        <div className="bg-white border-b border-slate-200">
          <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
            <nav className="flex items-center gap-1.5 h-11 text-[13px]">
              <a
                href="/"
                className="flex items-center gap-1 text-slate-500 hover:text-epf-600 transition-colors"
              >
                <EPFHome size={14} />
                <span>Home</span>
              </a>
              <EPFChevronRight size={12} className="text-slate-400" />
              <span className="text-slate-900 font-medium">Projects</span>
            </nav>

            {/* Title + count + search */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 pt-1">
              <div className="flex items-center gap-3 min-w-0">
                <h1 className="text-[24px] font-bold text-slate-900 tracking-tight">
                  Engineering Projects
                </h1>
                <span className="text-[13px] text-slate-500">
                  {isLoading ? (
                    <span className="inline-block w-20 h-4 bg-slate-100 rounded animate-pulse align-middle" />
                  ) : (
                    <>
                      <span className="text-slate-900 font-semibold">
                        {filtered.length}
                      </span>{" "}
                      {filtered.length === 1 ? "project" : "projects"}
                    </>
                  )}
                </span>
                {hasActiveFilters && (
                  <button
                    onClick={handleClearAll}
                    className="hidden sm:inline-flex items-center gap-1 text-[12px] text-slate-500 hover:text-epf-600 font-medium transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                    Clear
                  </button>
                )}
              </div>

              <div className="relative w-full sm:w-[300px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search projects..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full h-10 pl-10 pr-9 text-[14px] text-slate-700 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-epf-500/20 focus:border-epf-500 placeholder:text-slate-400 transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    aria-label="Clear search"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Intro banner — Learn & Build EEE Projects */}
        <div className="bg-gradient-to-r from-epf-50 to-slate-50 border-b border-slate-200">
          <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 py-5">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-epf-500/10 flex items-center justify-center shrink-0">
                  <Lightbulb className="h-5 w-5 text-epf-500" />
                </div>
                <div>
                  <p className="text-[14px] font-semibold text-slate-900">
                    Learn &amp; Build Electrical Engineering Projects
                  </p>
                  <p className="text-[12px] text-slate-500 mt-0.5">
                    Explore real-world automation, IoT, solar &amp; wiring
                    projects — learn how they work or order a custom build.
                  </p>
                </div>
              </div>
              <div className="hidden sm:flex items-center gap-4 ml-auto text-[12px]">
                <span className="inline-flex items-center gap-1.5 text-slate-600">
                  <GraduationCap className="h-4 w-4 text-epf-500" />
                  Learn
                </span>
                <span className="text-slate-300">|</span>
                <span className="inline-flex items-center gap-1.5 text-slate-600">
                  <ShoppingCart className="h-4 w-4 text-epf-500" />
                  Order Custom
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Main content + Sidebar */}
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Main grid */}
            <div className="flex-1 min-w-0 lg:w-[70%]">
              {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div
                      key={i}
                      className="bg-white border border-slate-200 rounded-xl overflow-hidden animate-pulse"
                    >
                      <div className="aspect-[4/3] bg-slate-100" />
                      <div className="p-4 space-y-3">
                        <div className="h-4 bg-slate-100 rounded w-3/4" />
                        <div className="h-3 bg-slate-100 rounded w-full" />
                        <div className="h-3 bg-slate-100 rounded w-2/3" />
                        <div className="h-3 bg-slate-100 rounded w-1/3 mt-3" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                <EmptyState onClear={handleClearAll} />
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {paginated.map((proj) => (
                      <ProjectCard
                        key={proj.id}
                        project={proj}
                        onNavigate={navigate}
                      />
                    ))}
                  </div>
                  <Pagination
                    current={currentPage}
                    total={totalPages}
                    onChange={setCurrentPage}
                  />
                </>
              )}
            </div>

            {/* Sidebar */}
            <aside className="w-full lg:w-[30%] shrink-0">
              <div className="lg:sticky lg:top-[88px] space-y-6">
                {/* Recent Projects */}
                <section className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                  <div className="px-5 py-4 border-b border-slate-100">
                    <h3 className="text-[16px] font-semibold text-slate-900">
                      Recent Projects
                    </h3>
                  </div>
                  <div className="p-2 space-y-1">
                    {recentProjects.length === 0 ? (
                      <p className="p-3 text-[13px] text-slate-400">
                        No projects yet.
                      </p>
                    ) : (
                      recentProjects.map((proj) => (
                        <RecentProjectItem
                          key={proj.id}
                          project={proj}
                          onNavigate={navigate}
                        />
                      ))
                    )}
                  </div>
                  <div className="px-3 pb-3">
                    <a
                      href="/projects"
                      className="block text-center w-full py-2 text-[13px] font-medium text-epf-600 hover:bg-epf-50 rounded-lg transition-colors"
                    >
                      View All Projects
                    </a>
                  </div>
                </section>

                {/* CTA — custom order */}
                <section className="bg-slate-900 rounded-xl p-6 text-center">
                  <h3 className="text-[16px] font-semibold text-white mb-2">
                    Have a project in mind?
                  </h3>
                  <p className="text-[13px] text-white/60 mb-4 leading-relaxed">
                    Tell us about your electrical, solar, or automation project
                    and get a custom quote.
                  </p>
                  <a
                    href="/get-quote"
                    className="inline-flex items-center justify-center gap-2 h-10 px-5 bg-epf-500 hover:bg-epf-600 text-white text-[13px] font-semibold rounded-lg transition-colors"
                  >
                    Request a Quote
                    <ArrowRight className="h-4 w-4" />
                  </a>
                </section>
              </div>
            </aside>
          </div>
        </div>
      </main>

      <div className="mt-auto">
        <Footer />
      </div>

      <ChatWidget />
      <BackToTopButton />
    </div>
  );
}
