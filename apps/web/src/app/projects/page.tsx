"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { ArrowRight, ChevronLeft, ChevronRight, Cpu, Mail, MapPin, Search } from "lucide-react";
import Header from "@/components/epf/Header";
import Footer from "@/components/epf/Footer";
import CartDrawer from "@/components/epf/CartDrawer";
import CheckoutDialog from "@/components/epf/CheckoutDialog";
import ChatWidget from "@/components/epf/ChatWidget";
import BackToTopButton from "@/components/epf/BackToTopButton";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";

interface Project { id: string; title: string; titleBn?: string | null; slug: string; description: string; coverImage?: string | null; images?: string[]; client?: string | null; location?: string | null; status: string }
const pageSize = 6;

function ProjectsContent() {
  const params = useSearchParams();
  const initialSearch = params.get("search") || "";
  const [searchInput, setSearchInput] = useState(initialSearch);
  const [search, setSearch] = useState(initialSearch);
  const [page, setPage] = useState(1);

  const projectsQuery = useQuery<{ data: Project[] }>({ queryKey: ["projects-list", { search }], queryFn: () => apiFetch<{ data: Project[] }>(`/api/projects${search ? `?search=${encodeURIComponent(search)}` : ""}`), staleTime: 60 * 1000 });
  const allProjects = projectsQuery.data?.data ?? [];
  const projects = allProjects;
  const totalPages = Math.max(1, Math.ceil(projects.length / pageSize));
  const visible = projects.slice((page - 1) * pageSize, page * pageSize);
  const apply = (action: () => void) => { action(); setPage(1); };

  return (
    <>
      <Header />
      <main className="min-h-screen bg-white">
        <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-12 sm:py-8">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4"><div><div className="mb-2 flex items-center gap-2 text-xs text-slate-400"><Link href="/" className="hover:text-epf-600">Home</Link><span>/</span><span className="text-slate-700">Projects</span></div><h1 className="text-xl font-semibold text-slate-900">Projects</h1></div><form onSubmit={(event) => { event.preventDefault(); apply(() => setSearch(searchInput.trim())); }} className="flex h-9 w-full sm:w-[250px]"><input value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Search projects" aria-label="Search projects" className="min-w-0 flex-1 border border-slate-200 bg-slate-50 px-3 text-xs outline-none focus:border-epf-500" /><button type="submit" className="flex w-10 items-center justify-center bg-slate-900 text-white hover:bg-epf-500" aria-label="Search"><Search className="h-4 w-4" /></button></form></div>

          <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_205px]">
            <section>
              {projectsQuery.isLoading ? <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 6 }).map((_, index) => <div key={index} className="h-[318px] animate-pulse border border-slate-200 bg-slate-50" />)}</div> : projectsQuery.isError ? <div className="border border-red-100 bg-slate-50 px-6 py-16 text-center"><p className="font-semibold text-slate-800">Projects could not be loaded.</p><button type="button" onClick={() => projectsQuery.refetch()} className="mt-4 bg-epf-500 px-4 py-2 text-sm font-semibold text-white">Try again</button></div> : visible.length > 0 ? <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{visible.map((project) => { const image = project.coverImage || project.images?.[0]; return <Link key={project.id} href={`/projects/${project.slug}`} className="group flex min-h-[318px] flex-col overflow-hidden rounded-md border border-slate-200 bg-white transition-shadow hover:border-slate-300 hover:shadow-lg"><div className="relative h-[158px] shrink-0 overflow-hidden bg-slate-100">{image ? <img src={image} alt={project.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" /> : <div className="flex h-full items-center justify-center bg-slate-50"><Cpu className="h-9 w-9 text-slate-300" /></div>}<span className="absolute left-3 top-3 bg-white/95 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-700">{project.status || "Project"}</span></div><div className="flex flex-1 flex-col p-3.5"><div className="flex items-center gap-2 text-[10px] text-slate-400"><span>{project.client || "ePowerFix project"}</span>{project.location && <><span>•</span><span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{project.location}</span></>}</div><h2 className="mt-2 line-clamp-2 text-[14px] font-semibold leading-5 text-slate-800 group-hover:text-epf-600">{project.titleBn || project.title}</h2><p className="mt-2 line-clamp-2 text-[12px] leading-5 text-slate-500">{project.description}</p><span className="mt-auto inline-flex items-center gap-1 pt-3 text-[11px] font-semibold text-epf-600">View Project <ArrowRight className="h-3 w-3" /></span></div></Link>; })}</div> : <div className="border border-slate-200 bg-slate-50 px-6 py-20 text-center"><Cpu className="mx-auto h-9 w-9 text-slate-300" /><h2 className="mt-3 text-lg font-semibold text-slate-800">No projects found</h2><p className="mt-1 text-sm text-slate-500">Try another search.</p></div>}

              {projects.length > 0 && <div className="mt-7 flex items-center justify-center gap-1 border-t border-slate-100 pt-5"><button type="button" disabled={page <= 1} onClick={() => setPage((value) => value - 1)} className="flex h-8 w-8 items-center justify-center rounded border border-slate-200 text-slate-500 disabled:opacity-40" aria-label="Previous page"><ChevronLeft className="h-4 w-4" /></button>{Array.from({ length: totalPages }).map((_, index) => <button key={index} type="button" onClick={() => setPage(index + 1)} className={cn("flex h-8 w-8 items-center justify-center rounded text-xs font-semibold", page === index + 1 ? "bg-slate-900 text-white" : "border border-slate-200 text-slate-600")}>{index + 1}</button>)}<button type="button" disabled={page >= totalPages} onClick={() => setPage((value) => value + 1)} className="flex h-8 w-8 items-center justify-center rounded border border-slate-200 text-slate-500 disabled:opacity-40" aria-label="Next page"><ChevronRight className="h-4 w-4" /></button></div>}
            </section>

            <aside className="h-fit"><div className="border-b border-slate-200 pb-4"><h2 className="text-[16px] font-semibold text-slate-900">Recent Projects</h2><div className="mt-2 h-0.5 w-8 bg-epf-500" /></div><div>{allProjects.slice(0, 4).map((project) => <Link key={project.id} href={`/projects/${project.slug}`} className="group flex items-center gap-2.5 border-b border-slate-100 py-2.5"><div className="h-11 w-14 shrink-0 overflow-hidden bg-slate-100">{project.coverImage || project.images?.[0] ? <img src={project.coverImage || project.images?.[0]} alt="" className="h-full w-full object-cover" loading="lazy" /> : <Cpu className="m-3 h-5 w-5 text-slate-300" />}</div><div className="min-w-0"><p className="line-clamp-2 text-[11px] font-medium leading-4 text-slate-700 group-hover:text-epf-600">{project.title}</p><p className="mt-1 text-[10px] text-slate-400">{project.status}</p></div></Link>)}</div></aside>
          </div>
        </div>
        <section className="bg-slate-900 py-7"><div className="mx-auto flex max-w-[1400px] flex-col items-start justify-between gap-4 px-4 sm:flex-row sm:items-center sm:px-12"><div><h2 className="text-lg font-semibold text-white">Have a project in mind?</h2><p className="mt-1 text-xs text-white/60">Share your requirements and let our engineering team help.</p></div><Link href="/get-quote" className="inline-flex h-9 items-center gap-1 rounded-full bg-epf-500 px-5 text-xs font-semibold text-white hover:bg-epf-600">Request a quote <ArrowRight className="h-3.5 w-3.5" /></Link></div></section>
      </main>
      <Footer /><CartDrawer /><CheckoutDialog /><ChatWidget /><BackToTopButton />
    </>
  );
}

function LoadingPage() { return <div className="flex min-h-screen items-center justify-center bg-white"><Cpu className="h-6 w-6 animate-pulse text-epf-500" /></div>; }
export default function ProjectsPage() { return <Suspense fallback={<LoadingPage />}><ProjectsContent /></Suspense>; }
