"use client";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import {
  Home, ChevronRight, FolderOpen, Search, ChevronLeft, ChevronRight as ArrowRight,
  Clock, Calendar,
} from "lucide-react";
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
  status: string;
  createdAt: string;
}

const STATUS_FILTERS = [
  { key: "all", label: "All Projects" },
  { key: "COMPLETED", label: "Completed" },
  { key: "IN_PROGRESS", label: "In Progress" },
  { key: "PLANNED", label: "Planned" },
];
const PAGE_SIZE = 6;

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function parseImages(val: unknown): string[] {
  if (Array.isArray(val)) return val as string[];
  if (typeof val === "string") {
    try { const p = JSON.parse(val); if (Array.isArray(p)) return p; } catch { /* ignore */ }
  }
  return [];
}

function ProjectCard({ project, onNavigate }: {
  project: ProjectItem; onNavigate: (slug: string) => void;
}) {
  const [imgError, setImgError] = useState(false);
  const images = project.images ? (Array.isArray(project.images) ? project.images : parseImages(project.images)) : [];
  const cover = project.coverImage || images[0];
  const handleClick = () => onNavigate(project.slug);

  return (
    <div onClick={handleClick} className="flex gap-4 p-4 bg-white border border-[#e0e0e0] rounded-lg cursor-pointer transition-all duration-200 hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)] hover:scale-[1.01] group">
      <div className="relative shrink-0 w-[180px] h-[120px] rounded-lg overflow-hidden bg-[#f5f5f5] border border-[#e0e0e0] max-sm:w-[100px] max-sm:h-[80px]">
        {!imgError && cover ? (
          <Image src={cover} alt={project.title} fill className="object-cover group-hover:scale-105 transition-transform" onError={() => setImgError(true)} unoptimized />
        ) : (<div className="w-full h-full flex items-center justify-center"><FolderOpen className="w-10 h-10 text-[#ccc]" /></div>)}
      </div>
      <div className="flex-1 min-w-0 flex flex-col justify-between">
        <div>
          <h3 className="text-[16px] font-semibold text-[#333] leading-snug line-clamp-1 group-hover:text-[#0EA5E9] transition-colors mb-2">{project.title}</h3>
          <p className="text-[14px] text-[#666] leading-relaxed line-clamp-2 mb-3">{project.description}</p>
          <div className="flex items-center gap-3 text-[12px] text-[#999] mb-3 flex-wrap">
            <span className="flex items-center gap-1"><FolderOpen className="w-3 h-3" />{project.status.replace(/_/g, " ")}</span>
            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{formatDate(project.createdAt)}</span>
            {project.client && <span className="text-[#666]">· {project.client}</span>}
          </div>
        </div>
        <div className="flex items-end justify-between">
          <span className="text-[12px] text-[#666] bg-[#f0f0f0] px-2 py-[2px] rounded-full">{project.location || "—"}</span>
          <span className="text-[13px] font-medium text-[#0EA5E9]">View Details →</span>
        </div>
      </div>
    </div>
  );
}

function Sidebar({ projects, onNavigate }: {
  projects: ProjectItem[]; onNavigate: (slug: string) => void;
}) {
  const recent = useMemo(() => [...projects].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5), [projects]);
  return (
    <aside className="w-full lg:w-[30%] shrink-0">
      <div className="bg-[#f8f9fa] rounded-lg p-5">
        <h3 className="text-[14px] font-semibold text-[#333] mb-3 flex items-center gap-2"><Clock className="w-4 h-4 text-[#0EA5E9]" />Recent Projects</h3>
        <div className="space-y-2">
          {recent.map((proj) => {
            const images = proj.images ? (Array.isArray(proj.images) ? proj.images : parseImages(proj.images)) : [];
            const cover = proj.coverImage || images[0];
            return (
              <div key={proj.id} onClick={() => onNavigate(proj.slug)} className="flex items-start gap-3 p-2 rounded-md cursor-pointer hover:bg-white transition-all duration-200 group">
                <div className="relative shrink-0 w-14 h-12 rounded-md overflow-hidden bg-[#f0f0f0] border border-[#e0e0e0]">
                  {cover ? (
                    <Image src={cover} alt={proj.title} fill className="object-cover group-hover:scale-105 transition-transform" unoptimized />
                  ) : (<div className="w-full h-full flex items-center justify-center"><FolderOpen className="w-4 h-4 text-[#ccc]" /></div>)}
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-[13px] font-medium text-[#333] leading-snug line-clamp-1 group-hover:text-[#0EA5E9] transition-colors">{proj.title}</h4>
                  <span className="text-[11px] text-[#999]">{formatDate(proj.createdAt)}</span>
                </div>
              </div>
            );
          })}
          {recent.length === 0 && <p className="text-[13px] text-[#999]">No projects yet.</p>}
        </div>
      </div>
    </aside>
  );
}

function Pagination({ current, total, onChange }: { current: number; total: number; onChange: (page: number) => void }) {
  if (total <= 1) return null;
  const pages: (number | "...")[] = [];
  for (let i = 1; i <= total; i++) {
    if (i === 1 || i === total || (i >= current - 1 && i <= current + 1)) pages.push(i);
    else if (pages[pages.length - 1] !== "...") pages.push("...");
  }
  return (
    <div className="flex items-center justify-center gap-2 mt-8">
      <button onClick={() => onChange(current - 1)} disabled={current <= 1} className="w-9 h-9 rounded-lg flex items-center justify-center text-[#666] hover:text-[#0EA5E9] disabled:opacity-30 disabled:cursor-not-allowed transition-colors border border-[#e0e0e0] bg-white"><ChevronLeft className="w-4 h-4" /></button>
      {pages.map((page, idx) => page === "..." ? <span key={`e-${idx}`} className="w-9 h-9 flex items-center justify-center text-[#999] text-[14px]">...</span> : (
        <button key={page} onClick={() => onChange(page as number)} className={`w-9 h-9 rounded-lg text-[14px] font-medium transition-all duration-200 ${current === page ? "bg-[#0EA5E9] text-white shadow-sm" : "bg-[#f0f0f0] text-[#666] hover:bg-[#e0e0e0]"}`}>{page}</button>
      ))}
      <button onClick={() => onChange(current + 1)} disabled={current >= total} className="w-9 h-9 rounded-lg flex items-center justify-center text-[#666] hover:text-[#0EA5E9] disabled:opacity-30 disabled:cursor-not-allowed transition-colors border border-[#e0e0e0] bg-white"><ChevronRight className="w-4 h-4" /></button>
    </div>
  );
}

export default function ProjectsPage() {
  const router = useRouter();
  const [activeStatus, setActiveStatus] = useState("all");
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
    if (activeStatus !== "all") {
      list = list.filter((p) => p.status === activeStatus);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((p) => p.title.toLowerCase().includes(q) || p.description.toLowerCase().includes(q));
    }
    return list;
  }, [allProjects, activeStatus, searchQuery]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = useMemo(() => filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE), [filtered, currentPage]);

  const handleStatusChange = (key: string) => { setActiveStatus(key); setCurrentPage(1); };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      <CartDrawer />
      <CheckoutDialog />
      <main className="flex-1 mx-auto w-full max-w-[1400px] px-4 sm:px-12 py-8">
        <nav className="flex items-center gap-1.5 mb-6">
          <a href="/" className="flex items-center gap-1 text-[13px] text-[#666] hover:text-[#111827] transition-colors"><Home className="h-3.5 w-3.5" />Home</a>
          <ChevronRight className="h-3 w-3 text-[#999]" /><span className="text-[13px] font-medium text-[#111827]">Projects</span>
        </nav>

        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
          <div><h1 className="text-[24px] font-bold text-[#111827]">Projects</h1><p className="text-[14px] text-[#666] mt-1.5">Explore our portfolio of electrical, solar, automation &amp; IoT projects</p></div>
          <div className="relative w-full sm:w-[280px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#999]" />
            <input type="text" placeholder="Search projects..." value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="w-full h-10 pl-10 pr-4 text-[14px] text-[#333] bg-white border border-[#e0e0e0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]/30 focus:border-[#0EA5E9] placeholder:text-[#999] transition-all" />
          </div>
        </div>

        {/* Status filter pills */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-none">
          {STATUS_FILTERS.map((f) => {
            const isActive = activeStatus === f.key;
            return (
              <button key={f.key} onClick={() => handleStatusChange(f.key)}
                className={`shrink-0 h-9 px-4 text-[13px] font-medium rounded-lg flex items-center gap-1.5 transition-all duration-200 ${isActive ? "bg-[#0EA5E9] text-white shadow-sm" : "bg-[#f8f9fa] text-[#666] border border-[#e0e0e0] hover:border-[#0EA5E9] hover:text-[#0EA5E9]"}`}>
                {f.label}
              </button>
            );
          })}
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1 min-w-0 lg:w-[70%]">
            <p className="text-[13px] text-[#999] mb-5">Showing <span className="font-semibold text-[#333]">{filtered.length}</span> {filtered.length === 1 ? "project" : "projects"}</p>

            {isLoading ? (
              <div className="flex flex-col gap-6">{Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex gap-4 p-4 bg-white border border-[#e0e0e0] rounded-lg animate-pulse">
                  <div className="shrink-0 w-[180px] h-[120px] rounded-lg bg-[#f0f0f0] max-sm:w-[100px] max-sm:h-[80px]" />
                  <div className="flex-1 space-y-3"><div className="h-4 bg-[#f0f0f0] rounded w-3/4" /><div className="h-3 bg-[#f0f0f0] rounded w-full" /><div className="h-3 bg-[#f0f0f0] rounded w-2/3" /></div>
                </div>
              ))}</div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="w-16 h-16 rounded-full bg-[#f8f9fa] flex items-center justify-center mb-4"><FolderOpen className="w-7 h-7 text-[#ccc]" /></div>
                <h3 className="text-[16px] font-medium text-[#333] mb-1">No projects found</h3>
                <p className="text-[14px] text-[#666] mb-5">{searchQuery ? "Try a different search term." : "No projects match this filter yet."}</p>
                {searchQuery && <button onClick={() => setSearchQuery("")} className="h-9 px-5 text-[14px] font-medium bg-[#0EA5E9] text-white rounded-lg hover:bg-[#0284C7] transition-colors">Clear Search</button>}
              </div>
            ) : (
              <>
                <div className="flex flex-col gap-6">{paginated.map((proj) => <ProjectCard key={proj.id} project={proj} onNavigate={navigate} />)}</div>
                <Pagination current={currentPage} total={totalPages} onChange={setCurrentPage} />
              </>
            )}

            {filtered.length > 0 && (
              <div className="mt-10 bg-[#111827] p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-lg">
                <div><p className="text-white font-semibold text-[18px]">Have a project idea in mind?</p><p className="text-white/50 text-[14px] mt-1">We can help you build custom electrical, solar or IoT projects.</p></div>
                <a href="/services" className="bg-[#0EA5E9] hover:bg-[#0284C7] text-white font-semibold text-[15px] h-11 px-6 shrink-0 flex items-center gap-2 transition-colors rounded-lg">Browse Services <ArrowRight className="w-4 h-4" /></a>
              </div>
            )}
          </div>

          <Sidebar projects={filtered} onNavigate={navigate} />
        </div>
      </main>
      <ChatWidget />
      <BackToTopButton />
      <Footer />
    </div>
  );
}
