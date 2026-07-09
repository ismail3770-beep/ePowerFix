"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import {
  Home,
  ChevronRight,
  ChevronLeft,
  ChevronRight as ArrowRight,
  Search,
  FolderOpen,
  MapPin,
  Calendar,
  X,
  LayoutGrid,
} from "lucide-react";
import Header from "@/components/epf/Header";
import Footer from "@/components/epf/Footer";
import CartDrawer from "@/components/epf/CartDrawer";
import CheckoutDialog from "@/components/epf/CheckoutDialog";
import ChatWidget from "@/components/epf/ChatWidget";
import BackToTopButton from "@/components/epf/BackToTopButton";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Types & Constants                                                  */
/* ------------------------------------------------------------------ */
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
  status: string;
  createdAt: string;
}

const STATUS_FILTERS = [
  { key: "all", label: "All Projects" },
  { key: "COMPLETED", label: "Completed" },
  { key: "IN_PROGRESS", label: "In Progress" },
  { key: "PLANNED", label: "Planned" },
] as const;

const PAGE_SIZE = 9;

const STATUS_META: Record<
  string,
  { label: string; badgeCls: string; dotCls: string }
> = {
  COMPLETED: {
    label: "Completed",
    badgeCls: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    dotCls: "bg-emerald-500",
  },
  IN_PROGRESS: {
    label: "In Progress",
    badgeCls: "bg-amber-50 text-amber-700 border border-amber-200",
    dotCls: "bg-amber-500",
  },
  PLANNED: {
    label: "Planned",
    badgeCls: "bg-slate-100 text-slate-600 border border-slate-200",
    dotCls: "bg-slate-400",
  },
};

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
/*  Status Filter Pills                                                */
/* ------------------------------------------------------------------ */
function StatusPills({
  active,
  onChange,
  counts,
  variant = "stack",
}: {
  active: string;
  onChange: (key: string) => void;
  counts: Record<string, number>;
  variant?: "stack" | "row";
}) {
  return (
    <div
      className={cn(
        "flex gap-2",
        variant === "row"
          ? "flex-row overflow-x-auto pb-1 scrollbar-none"
          : "flex-col"
      )}
    >
      {STATUS_FILTERS.map((f) => {
        const isActive = active === f.key;
        const count = counts[f.key] ?? 0;
        return (
          <button
            key={f.key}
            onClick={() => onChange(f.key)}
            className={cn(
              "shrink-0 h-9 px-4 text-[13px] font-medium rounded-lg flex items-center gap-2 transition-all duration-200",
              variant === "stack" && "w-full justify-between",
              isActive
                ? "bg-epf-500 text-white shadow-sm"
                : "bg-white text-slate-600 border border-slate-200 hover:border-epf-300 hover:text-epf-600"
            )}
          >
            <span className="whitespace-nowrap">{f.label}</span>
            <span
              className={cn(
                "min-w-5 h-5 px-1.5 rounded-full text-[11px] font-semibold flex items-center justify-center",
                isActive
                  ? "bg-white/20 text-white"
                  : "bg-slate-100 text-slate-500"
              )}
            >
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
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
  const statusMeta =
    STATUS_META[project.status] ?? STATUS_META.PLANNED;

  return (
    <article
      onClick={handleClick}
      className="group flex flex-col bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 overflow-hidden cursor-pointer"
    >
      {/* Cover Image — aspect-[4/3] */}
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
        {/* Status badge overlay */}
        <div className="absolute top-3 left-3 z-10">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 h-6 px-2.5 rounded-full text-[11px] font-semibold leading-none backdrop-blur-sm shadow-sm",
              statusMeta.badgeCls
            )}
          >
            <span className={cn("h-1.5 w-1.5 rounded-full", statusMeta.dotCls)} />
            {statusMeta.label}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-col flex-1 p-4">
        <h3
          className="text-[15px] font-semibold text-slate-900 line-clamp-1 leading-snug group-hover:text-epf-600 transition-colors"
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
          <span className="inline-flex items-center gap-1 text-[13px] font-semibold text-epf-600 group-hover:gap-2 transition-all">
            View Details
            <ArrowRight className="h-3.5 w-3.5" />
          </span>
        </div>
      </div>
    </article>
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
function EmptyState({
  hasSearch,
  onClear,
}: {
  hasSearch: boolean;
  onClear: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 bg-white rounded-xl border border-slate-200">
      <FolderOpen className="h-16 w-16 text-slate-200 mb-4" />
      <h3 className="text-[18px] font-medium text-slate-900 mb-1.5">
        No projects found
      </h3>
      <p className="text-[14px] text-slate-500 mb-6 text-center max-w-md">
        {hasSearch
          ? "Try a different search term or filter to find what you're looking for."
          : "No projects match this filter yet. Check back soon!"}
      </p>
      <button
        onClick={onClear}
        className="h-10 px-6 bg-epf-500 hover:bg-epf-600 text-white text-[13px] font-semibold rounded-lg transition-colors shadow-sm"
      >
        Clear All Filters
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Page                                                          */
/* ------------------------------------------------------------------ */
export default function ProjectsPage() {
  const router = useRouter();
  const [activeStatus, setActiveStatus] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");

  const navigate = (slug: string) => router.push(`/projects/${slug}`);

  const { data: apiData, isLoading } = useQuery<{ data: ProjectItem[] }>({
    queryKey: ["projects-page-live"],
    queryFn: () => apiFetch("/api/projects"),
  });

  const allProjects = apiData?.data ?? [];

  /* Count per status (from full list, not filtered) */
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: allProjects.length };
    for (const p of allProjects) {
      counts[p.status] = (counts[p.status] ?? 0) + 1;
    }
    return counts;
  }, [allProjects]);

  const filtered = useMemo(() => {
    let list = allProjects;
    if (activeStatus !== "all") {
      list = list.filter((p) => p.status === activeStatus);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q)
      );
    }
    return list;
  }, [allProjects, activeStatus, searchQuery]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = useMemo(
    () =>
      filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [filtered, currentPage]
  );

  const handleStatusChange = (key: string) => {
    setActiveStatus(key);
    setCurrentPage(1);
  };

  const handleClearAll = () => {
    setActiveStatus("all");
    setSearchQuery("");
    setCurrentPage(1);
  };

  const hasActiveFilters = activeStatus !== "all" || searchQuery.trim() !== "";

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      <CartDrawer />
      <CheckoutDialog />

      <main className="flex-1">
        {/* ── Top Bar: Breadcrumb + Title + Search ──────────────── */}
        <div className="border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-1.5 h-11 text-[13px]">
              <a
                href="/"
                className="flex items-center gap-1 text-slate-500 hover:text-epf-600 transition-colors"
              >
                <Home className="h-3.5 w-3.5" />
                <span>Home</span>
              </a>
              <ChevronRight className="h-3 w-3 text-slate-300" />
              <span className="text-slate-900 font-medium">Projects</span>
            </nav>

            {/* Title + count + search */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 pt-1">
              <div className="flex items-center gap-3 min-w-0">
                <h1 className="text-[24px] font-bold text-slate-900 tracking-tight">
                  Projects
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

              {/* Search */}
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
                  className="w-full h-9 pl-10 pr-9 text-[13px] text-slate-700 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-epf-500/20 focus:border-epf-500 placeholder:text-slate-400 transition-all"
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

        {/* ── Main Content: Sidebar + Grid ──────────────────────── */}
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 py-6">
          {/* Mobile status pills (horizontal scroll) */}
          <div className="lg:hidden mb-5">
            <StatusPills
              active={activeStatus}
              onChange={handleStatusChange}
              counts={statusCounts}
              variant="row"
            />
          </div>

          <div className="flex gap-6">
            {/* Desktop Sidebar */}
            <aside className="hidden lg:block w-[260px] shrink-0">
              <div className="sticky top-[88px]">
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                  <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-200">
                    <LayoutGrid className="h-4 w-4 text-slate-700" />
                    <h2 className="text-[14px] font-semibold text-slate-900">
                      Status
                    </h2>
                  </div>
                  <div className="p-3">
                    <StatusPills
                      active={activeStatus}
                      onChange={handleStatusChange}
                      counts={statusCounts}
                      variant="stack"
                    />
                  </div>
                </div>
              </div>
            </aside>

            {/* Content Area */}
            <div className="flex-1 min-w-0">
              {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
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
                <EmptyState
                  hasSearch={!!searchQuery.trim()}
                  onClear={handleClearAll}
                />
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
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
