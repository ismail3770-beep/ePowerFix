"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, Clock, Package, Search, User, Zap } from "lucide-react";
import Header from "@/components/epf/Header";
import Footer from "@/components/epf/Footer";
import CartDrawer from "@/components/epf/CartDrawer";
import CheckoutDialog from "@/components/epf/CheckoutDialog";
import ChatWidget from "@/components/epf/ChatWidget";
import BackToTopButton from "@/components/epf/BackToTopButton";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";

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
  startDate?: string | null;
  endDate?: string | null;
  tags?: string[];
  category?: string | null;
}

const pageSize = 6;

const PROJECT_CATEGORIES = ["Solar", "EV Charging", "Wiring", "Smart Home", "Panel", "Lighting", "Generator", "Outdoor"];

function Pagination({ page, totalPages, onChange }: { page: number; totalPages: number; onChange: (p: number) => void }) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-1.5 mt-8">
      <button onClick={() => onChange(Math.max(1, page - 1))} disabled={page === 1}
        className="w-8 h-8 border border-gray-300 rounded flex items-center justify-center text-gray-400 hover:border-[#0EA5E9] hover:text-[#0EA5E9] disabled:opacity-30 transition-colors bg-white">
        <ChevronLeft size={14} />
      </button>
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
        <button key={n} onClick={() => onChange(n)}
          className={cn("w-8 h-8 border rounded text-sm font-medium transition-colors",
            page === n ? "bg-[#0EA5E9] text-white border-[#0EA5E9]" : "border-gray-300 text-gray-600 hover:border-[#0EA5E9] hover:text-[#0EA5E9] bg-white")}>
          {n}
        </button>
      ))}
      <button onClick={() => onChange(Math.min(totalPages, page + 1))} disabled={page === totalPages}
        className="w-8 h-8 border border-gray-300 rounded flex items-center justify-center text-gray-400 hover:border-[#0EA5E9] hover:text-[#0EA5E9] disabled:opacity-30 transition-colors bg-white">
        <ChevronRight size={14} />
      </button>
    </div>
  );
}

function ProjectsContent() {
  const params = useSearchParams();
  const [searchInput, setSearchInput] = useState(params.get("search") || "");
  const [search, setSearch] = useState(params.get("search") || "");
  const [selectedCat, setSelectedCat] = useState("");
  const [page, setPage] = useState(1);

  const projectsQuery = useQuery<{ data: Project[] }>({
    queryKey: ["projects-list", { search }],
    queryFn: () => apiFetch<{ data: Project[] }>(`/api/projects${search ? `?search=${encodeURIComponent(search)}` : ""}`),
    staleTime: 60 * 1000,
  });

  const allProjects = projectsQuery.data?.data ?? [];
  const filtered = selectedCat
    ? allProjects.filter((p) => (p.category || p.status || "").toLowerCase().includes(selectedCat.toLowerCase()))
    : allProjects;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const visible = filtered.slice((page - 1) * pageSize, page * pageSize);
  const apply = (fn: () => void) => { fn(); setPage(1); };

  return (
    <>
      <Header />
      <main className="bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 py-8">

          {/* Top bar */}
          <div className="flex items-center justify-between mb-8 gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
                <Link href="/" className="hover:text-[#0EA5E9]">Home</Link>
                <ChevronRight size={11} />
                <span className="text-gray-700 font-medium">Projects</span>
              </div>
              <h1 className="font-black text-3xl tracking-tight text-gray-900">Projects</h1>
            </div>
            <form
              onSubmit={(e) => { e.preventDefault(); apply(() => setSearch(searchInput.trim())); }}
              className="flex items-center border border-gray-300 rounded overflow-hidden bg-white shadow-sm"
            >
              <input
                type="text"
                placeholder="Search projects..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="px-3 py-2 text-sm outline-none text-gray-700 w-56 bg-white"
              />
              <button type="submit" className="bg-[#0EA5E9] px-3 py-2.5 text-white hover:bg-sky-600 transition-colors">
                <Search size={15} />
              </button>
            </form>
          </div>

          <div className="flex gap-8">
            {/* Main grid */}
            <div className="flex-1 min-w-0">
              {projectsQuery.isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="bg-white rounded-lg overflow-hidden animate-pulse border border-gray-100">
                      <div className="aspect-[16/10] bg-gray-100" />
                      <div className="p-4 space-y-2">
                        <div className="h-4 bg-gray-100 rounded w-3/4" />
                        <div className="h-3 bg-gray-100 rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : visible.length === 0 ? (
                <div className="text-center py-20">
                  <Package size={48} className="mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500 text-sm">No projects found.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
                  {visible.map((project) => {
                    const image = project.coverImage || project.images?.[0];
                    const tags = project.tags ?? [];
                    return (
                      <Link
                        key={project.id}
                        href={`/projects/${project.slug}`}
                        className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer group border border-gray-100"
                      >
                        <div className="aspect-[16/10] overflow-hidden bg-gray-100 relative">
                          {image ? (
                            <img src={image} alt={project.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#0d1a2d] to-slate-700">
                              <Zap size={36} className="text-slate-600" />
                            </div>
                          )}
                          {project.status && (
                            <div className="absolute top-2.5 left-2.5">
                              <span className="bg-[#0EA5E9] text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                                {project.status}
                              </span>
                            </div>
                          )}
                          <div className="absolute bottom-2.5 right-2.5 bg-white/95 rounded-md px-2.5 py-1 text-[10px] font-semibold text-gray-600 shadow-sm flex items-center gap-1">
                            <Clock size={9} /> {project.endDate ? new Date(project.endDate).getFullYear() : "Completed"}
                          </div>
                        </div>
                        <div className="p-4">
                          <div className="flex items-center gap-2 mb-1.5 text-xs text-gray-400">
                            <User size={10} />
                            <span className="font-medium text-gray-500">{project.client || "ePowerFix"}</span>
                            {project.location && (
                              <>
                                <span className="text-gray-200">|</span>
                                <span>{project.location}</span>
                              </>
                            )}
                          </div>
                          <h3 className="font-semibold text-sm text-gray-800 line-clamp-2 mb-2 group-hover:text-[#0EA5E9] transition-colors leading-snug">
                            {project.titleBn || project.title}
                          </h3>
                          {tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-3">
                              {tags.slice(0, 3).map((tag) => (
                                <span key={tag} className="text-[9px] font-semibold bg-sky-50 text-[#0EA5E9] border border-sky-100 px-1.5 py-0.5 rounded">{tag}</span>
                              ))}
                            </div>
                          )}
                          <button className="text-xs font-semibold text-gray-500 hover:text-[#0EA5E9] transition-colors flex items-center gap-0.5 group/btn">
                            View Project <ChevronRight size={12} className="group-hover/btn:translate-x-0.5 transition-transform" />
                          </button>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}

              <Pagination page={page} totalPages={totalPages} onChange={setPage} />
            </div>

            {/* Sidebar */}
            <aside className="hidden lg:block w-60 shrink-0 space-y-5">
              {/* Categories */}
              <div className="bg-white border border-gray-100 rounded-lg p-5 shadow-sm">
                <h3 className="font-bold text-sm text-gray-800 mb-4 pb-2 border-b border-gray-100">Categories</h3>
                <div className="space-y-0">
                  <button
                    onClick={() => apply(() => setSelectedCat(""))}
                    className={cn("w-full flex items-center justify-between py-2.5 text-sm border-b border-gray-50 group transition-colors",
                      !selectedCat ? "text-[#0EA5E9]" : "text-gray-600 hover:text-[#0EA5E9]")}
                  >
                    <span>All Projects</span>
                    <ChevronRight size={14} className={cn("transition-colors shrink-0", !selectedCat ? "text-[#0EA5E9]" : "text-gray-300 group-hover:text-[#0EA5E9]")} />
                  </button>
                  {PROJECT_CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => apply(() => setSelectedCat(selectedCat === cat ? "" : cat))}
                      className={cn("w-full flex items-center justify-between py-2.5 text-sm border-b border-gray-50 group transition-colors",
                        selectedCat === cat ? "text-[#0EA5E9]" : "text-gray-600 hover:text-[#0EA5E9]")}
                    >
                      <span>{cat}</span>
                      <ChevronRight size={14} className={cn("transition-colors shrink-0", selectedCat === cat ? "text-[#0EA5E9]" : "text-gray-300 group-hover:text-[#0EA5E9]")} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Recent Projects */}
              {allProjects.length > 0 && (
                <div className="bg-white border border-gray-100 rounded-lg p-5 shadow-sm">
                  <h3 className="font-bold text-sm text-gray-800 mb-4 pb-2 border-b border-gray-100">Recent Projects</h3>
                  <div className="space-y-4">
                    {allProjects.slice(0, 4).map((project) => (
                      <Link key={project.id} href={`/projects/${project.slug}`} className="flex gap-3 cursor-pointer group">
                        <div className="w-14 h-14 rounded-md overflow-hidden shrink-0 bg-gray-100">
                          {project.coverImage || project.images?.[0] ? (
                            <img src={project.coverImage || project.images?.[0]} alt={project.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center"><Zap size={16} className="text-gray-300" /></div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-medium text-gray-700 line-clamp-2 group-hover:text-[#0EA5E9] transition-colors leading-snug">{project.title}</h4>
                          <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                            <Clock size={9} /> {project.status}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </aside>
          </div>
        </div>
      </main>
      <Footer />
      <CartDrawer />
      <CheckoutDialog />
      <ChatWidget />
      <BackToTopButton />
    </>
  );
}

function LoadingPage() {
  return <div className="flex min-h-screen items-center justify-center bg-gray-50"><Zap className="h-6 w-6 animate-pulse text-[#0EA5E9]" /></div>;
}

export default function ProjectsPage() {
  return <Suspense fallback={<LoadingPage />}><ProjectsContent /></Suspense>;
}
