"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  ChevronRight,
  Copy,
  FolderOpen,
  Home,
  MapPin,
  MessageCircle,
  Phone,
  Share2,
  User,
} from "lucide-react";
import Header from "@/components/epf/Header";
import Footer from "@/components/epf/Footer";
import CartDrawer from "@/components/epf/CartDrawer";
import CheckoutDialog from "@/components/epf/CheckoutDialog";
import ChatWidget from "@/components/epf/ChatWidget";
import BackToTopButton from "@/components/epf/BackToTopButton";
import { apiFetch } from "@/lib/api";

interface ProjectDetail {
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
  createdAt: string;
}

interface ProjectListItem extends ProjectDetail {}

function parseImages(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === "string");
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed.filter((item): item is string => typeof item === "string");
    } catch {
      return [];
    }
  }
  return [];
}

function formatDate(value?: string | null) {
  return value ? new Date(value).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—";
}

function ShareRow({ title }: { title: string }) {
  const copyLink = async () => { await navigator.clipboard?.writeText(window.location.href); };
  return <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4 text-[11px] text-slate-500"><span className="mr-2 font-semibold text-slate-800">Social Share</span><button type="button" onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`, "_blank", "noopener,noreferrer")} className="flex h-7 w-7 items-center justify-center border border-slate-200 text-[11px] font-bold hover:border-epf-500 hover:text-epf-600" aria-label={`Share ${title} on Facebook`}>f</button><button type="button" onClick={() => window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(title)}`, "_blank", "noopener,noreferrer")} className="flex h-7 w-7 items-center justify-center border border-slate-200 text-[11px] font-bold hover:border-epf-500 hover:text-epf-600" aria-label="Share on X">𝕏</button><button type="button" onClick={() => window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`, "_blank", "noopener,noreferrer")} className="flex h-7 w-7 items-center justify-center border border-slate-200 text-[11px] font-bold hover:border-epf-500 hover:text-epf-600" aria-label="Share on LinkedIn">in</button><button type="button" onClick={copyLink} className="flex h-7 w-7 items-center justify-center border border-slate-200 hover:border-epf-500 hover:text-epf-600" aria-label="Copy link"><Copy className="h-3 w-3" /></button></div>;
}

function RelatedProject({ project, onOpen }: { project: ProjectListItem; onOpen: (slug: string) => void }) {
  const image = project.coverImage || parseImages(project.images)[0];
  return <button type="button" onClick={() => onOpen(project.slug)} className="group flex w-full items-center gap-2.5 border-b border-slate-100 py-2.5 text-left last:border-b-0"><div className="h-11 w-14 shrink-0 overflow-hidden bg-slate-100">{image ? <img src={image} alt="" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy" /> : <div className="flex h-full items-center justify-center"><FolderOpen className="h-5 w-5 text-slate-300" /></div>}</div><div className="min-w-0 flex-1"><p className="line-clamp-2 text-[11px] font-medium leading-4 text-slate-700 group-hover:text-epf-600">{project.title}</p><p className="mt-1 text-[10px] text-slate-400">{project.location || project.status}</p></div><ArrowRight className="h-3 w-3 shrink-0 text-slate-300 group-hover:text-epf-500" /></button>;
}

export default function ProjectDetailPage() {
  const router = useRouter();
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const [activeImage, setActiveImage] = useState(0);
  const detailQuery = useQuery<{ data: ProjectDetail }>({ queryKey: ["project-detail", slug], queryFn: () => apiFetch(`/api/projects/${slug}`), enabled: Boolean(slug) });
  const listQuery = useQuery<{ data: ProjectListItem[] }>({ queryKey: ["projects-detail-related"], queryFn: () => apiFetch("/api/projects"), staleTime: 60 * 1000 });
  const project = detailQuery.data?.data;
  const related = useMemo(() => (listQuery.data?.data ?? []).filter((item) => item.slug !== slug).slice(0, 5), [listQuery.data, slug]);

  if (detailQuery.isLoading) return <LoadingPage />;
  if (!project) return <NotFoundPage onBack={() => router.push("/projects")} />;

  const images = project.coverImage ? [project.coverImage, ...parseImages(project.images)] : parseImages(project.images);
  const hero = images[activeImage] || "";
  const title = project.titleBn || project.title;

  return <div className="min-h-screen bg-white text-slate-900"><Header /><main><div className="mx-auto max-w-[1400px] px-4 py-5 sm:px-12 sm:py-7"><nav className="mb-5 flex items-center gap-2 text-xs text-slate-400"><a href="/" className="hover:text-epf-600">Home</a><ChevronRight className="h-3 w-3" /><a href="/projects" className="hover:text-epf-600">Projects</a><ChevronRight className="h-3 w-3" /><span className="truncate text-slate-700">{project.title}</span></nav><button type="button" onClick={() => router.push("/projects")} className="mb-5 inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-epf-600"><ArrowLeft className="h-3.5 w-3.5" /> Back to Projects</button>

<div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_205px]"><article className="min-w-0"><div className="relative h-[250px] overflow-hidden bg-slate-100 sm:h-[390px]">{hero ? <img src={hero} alt={project.title} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center"><FolderOpen className="h-14 w-14 text-slate-300" /></div>}<span className="absolute left-3 top-3 bg-white/95 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-700">{project.status || "Project"}</span></div>{images.length > 1 && <div className="flex gap-2 overflow-x-auto border-b border-slate-100 py-3">{images.map((image, index) => <button type="button" key={`${image}-${index}`} onClick={() => setActiveImage(index)} className={`h-12 w-16 shrink-0 overflow-hidden border-2 bg-slate-100 ${activeImage === index ? "border-epf-500" : "border-transparent opacity-70"}`}><img src={image} alt={`${project.title} ${index + 1}`} className="h-full w-full object-cover" loading="lazy" /></button>)}</div>}
<div className="pt-5"><div className="mb-2 flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-wide text-epf-600"><span>Project Case Study</span><span className="text-slate-300">•</span><span>{project.status || "Completed"}</span></div><h1 className="text-2xl font-semibold leading-tight text-slate-900 sm:text-[30px]">{title}</h1><div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 border-b border-slate-200 pb-4 text-[11px] text-slate-400">{project.client && <span className="inline-flex items-center gap-1"><User className="h-3.5 w-3.5" /> {project.client}</span>}{project.location && <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {project.location}</span>}<span className="inline-flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> {formatDate(project.createdAt)}</span></div><div className="mt-5 text-[12px] leading-6 text-slate-600"><h2 className="mb-2 text-base font-semibold text-slate-900">Project Overview</h2><p className="whitespace-pre-line">{project.description}</p></div><div className="mt-7 flex flex-col items-start justify-between gap-4 border-y border-slate-100 py-5 sm:flex-row sm:items-center"><div><p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Want a similar solution?</p><p className="mt-1 text-sm font-semibold text-slate-900">Let&apos;s discuss your next project.</p></div><div className="flex flex-wrap gap-2"><a href="/get-quote" className="inline-flex h-9 items-center gap-1.5 bg-epf-500 px-4 text-xs font-semibold text-white hover:bg-epf-600">Get Quote <ArrowRight className="h-3.5 w-3.5" /></a><a href="https://wa.me/8801700000000" target="_blank" rel="noopener noreferrer" className="inline-flex h-9 items-center gap-1.5 border border-slate-200 px-4 text-xs font-semibold text-slate-700 hover:border-epf-500 hover:text-epf-600"><MessageCircle className="h-3.5 w-3.5" /> Discuss</a></div></div><ShareRow title={title} /><div className="mt-4 flex flex-wrap items-center gap-2 text-[10px] text-slate-400"><span className="font-semibold text-slate-700">Tags</span><span className="border border-slate-200 px-2 py-1">{project.status || "Project"}</span>{project.location && <span className="border border-slate-200 px-2 py-1">{project.location}</span>}<span className="border border-slate-200 px-2 py-1">ePowerFix</span></div></div></article>

<aside className="h-fit lg:sticky lg:top-[92px]"><div className="border-b border-slate-200 pb-3"><h2 className="text-[16px] font-semibold text-slate-900">Other Projects</h2><div className="mt-2 h-0.5 w-8 bg-epf-500" /></div><div>{related.length > 0 ? related.map((item) => <RelatedProject key={item.id} project={item} onOpen={(next) => router.push(`/projects/${next}`)} />) : <p className="py-4 text-xs text-slate-400">No other projects.</p>}</div><a href="/projects" className="mt-3 block border border-slate-200 py-2 text-center text-[11px] font-semibold text-epf-600 hover:bg-epf-50">View All Projects</a><div className="mt-7 border-b border-slate-200 pb-3"><h2 className="text-[16px] font-semibold text-slate-900">Project Info</h2><div className="mt-2 h-0.5 w-8 bg-epf-500" /></div><div className="space-y-2.5 py-3 text-[11px] text-slate-500">{project.client && <p className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2"><span>Client</span><strong className="text-right text-slate-800">{project.client}</strong></p>}{project.location && <p className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2"><span>Location</span><strong className="text-right text-slate-800">{project.location}</strong></p>}<p className="flex items-center justify-between gap-2"><span>Published</span><strong className="text-right text-slate-800">{formatDate(project.createdAt)}</strong></p></div></aside></div></div></main><Footer /><CartDrawer /><CheckoutDialog /><ChatWidget /><BackToTopButton /></div>;
}

function LoadingPage() { return <div className="flex min-h-screen items-center justify-center bg-white"><FolderOpen className="h-6 w-6 animate-pulse text-epf-500" /></div>; }
function NotFoundPage({ onBack }: { onBack: () => void }) { return <div className="flex min-h-screen flex-col bg-white"><Header /><div className="flex flex-1 items-center justify-center px-4 py-20 text-center"><div><FolderOpen className="mx-auto h-10 w-10 text-slate-300" /><h1 className="mt-3 text-xl font-semibold text-slate-900">Project not found</h1><p className="mt-1 text-sm text-slate-500">This project may have been removed.</p><button type="button" onClick={onBack} className="mt-5 bg-epf-500 px-4 py-2 text-sm font-semibold text-white">Back to Projects</button></div></div><Footer /></div>; }
