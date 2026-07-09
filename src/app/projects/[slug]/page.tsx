"use client";
import { useRouter, useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  ChevronRight, Calendar, Clock, FolderOpen, ArrowLeft, BookOpen,
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

function formatDate(d: string) { return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }); }
function parseImages(val: unknown): string[] {
  if (Array.isArray(val)) return val as string[];
  if (typeof val === "string") {
    try { const p = JSON.parse(val); if (Array.isArray(p)) return p; } catch { /* ignore */ }
  }
  return [];
}

export default function ProjectDetailPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;

  const { data: apiRes, isLoading } = useQuery<{ data: ProjectDetail }>({
    queryKey: ["project-detail", slug],
    queryFn: () => apiFetch(`/api/projects/${slug}`),
    enabled: !!slug,
  });

  const p = apiRes?.data;

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <Header /><div className="flex-1 flex items-center justify-center"><div className="animate-pulse text-slate-400">Loading...</div></div><Footer />
      </div>
    );
  }

  if (!p) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <Header />
        <div className="flex-1 flex items-center justify-center"><div className="text-center"><h1 className="text-[24px] font-bold text-slate-900 mb-2">Project not found</h1><button onClick={() => router.push("/projects")} className="h-10 px-6 bg-epf-500 text-white rounded-lg hover:bg-epf-600 transition-colors mt-5">Back to Projects</button></div></div>
        <Footer />
      </div>
    );
  }

  const statusLabel = p.status.replace(/_/g, " ");
  const images = p.images ? (Array.isArray(p.images) ? p.images : parseImages(p.images)) : [];
  const thumb = p.coverImage || images[0] || "";

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      <CartDrawer />
      <CheckoutDialog />
      <main className="flex-1 mx-auto w-full max-w-[1400px] px-4 sm:px-12 py-8">
        <div className="flex items-center justify-between flex-wrap gap-2 bg-slate-50 px-4 py-2.5 rounded-lg mb-6">
          <nav className="flex items-center gap-1.5 text-[13px] text-slate-500 flex-wrap">
            <a href="/" className="hover:text-epf-500 hover:underline">Home</a>
            <ChevronRight className="w-3 h-3 shrink-0" />
            <a href="/projects" className="hover:text-epf-500 hover:underline">Projects</a>
            <ChevronRight className="w-3 h-3 shrink-0" />
            <span className="text-slate-700 font-medium truncate max-w-[200px]">{p.title}</span>
          </nav>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1 min-w-0 lg:w-[70%]">
            <div className="relative w-full max-w-[600px] h-[300px] rounded-lg overflow-hidden bg-gradient-to-br from-epf-500/20 via-epf-600/10 to-slate-900 shadow-[0_4px_6px_rgba(0,0,0,0.1)] mb-6">
              {thumb ? <img src={thumb} alt={p.title} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><BookOpen className="w-16 h-16 text-white/40 mx-auto" /></div>}
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none" />
            </div>

            <h1 className="text-[28px] font-bold text-slate-900 leading-tight mb-3">{p.title}</h1>
            <div className="flex flex-wrap items-center gap-3 text-[14px] text-slate-500 mb-4">
              <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" />{formatDate(p.createdAt)}</span>
              <span className="w-1 h-1 rounded-full bg-slate-300" />
              <span className="flex items-center gap-1.5"><FolderOpen className="w-4 h-4" />{statusLabel}</span>
              {p.client && (<><span className="w-1 h-1 rounded-full bg-slate-300" /><span>Client: {p.client}</span></>)}
            </div>

            <div className="mb-6">
              <p className="text-[16px] leading-relaxed text-slate-700 mb-4">{p.description}</p>
            </div>

            {images.length > 1 && (
              <div className="mb-6">
                <h3 className="text-[18px] font-semibold text-slate-900 mb-3">Gallery</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {images.map((img, i) => (
                    <div key={i} className="relative aspect-[4/3] rounded-lg overflow-hidden bg-slate-100">
                      <img src={img} alt={`${p.title} ${i + 1}`} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <aside className="w-full lg:w-[30%] shrink-0 space-y-6">
            <a href="/projects" className="inline-flex items-center gap-1.5 text-[14px] font-medium text-epf-500 hover:underline"><ArrowLeft className="w-4 h-4" />Back to Projects</a>
            <div className="bg-white border border-slate-200 rounded-lg p-5">
              <h3 className="text-[15px] font-semibold text-slate-900 mb-3">Project Info</h3>
              <div className="space-y-2.5">
                <div className="flex justify-between text-[14px]"><span className="text-slate-500">Status</span><span className="text-epf-500 font-medium">{statusLabel}</span></div>
                <div className="flex justify-between text-[14px]"><span className="text-slate-500">Published</span><span className="text-slate-700">{formatDate(p.createdAt)}</span></div>
                {p.client && <div className="flex justify-between text-[14px]"><span className="text-slate-500">Client</span><span className="text-slate-700">{p.client}</span></div>}
                {p.location && <div className="flex justify-between text-[14px]"><span className="text-slate-500">Location</span><span className="text-slate-700">{p.location}</span></div>}
                {p.startDate && <div className="flex justify-between text-[14px]"><span className="text-slate-500">Start Date</span><span className="text-slate-700">{formatDate(p.startDate)}</span></div>}
                {p.endDate && <div className="flex justify-between text-[14px]"><span className="text-slate-500">End Date</span><span className="text-slate-700">{formatDate(p.endDate)}</span></div>}
              </div>
            </div>
            <div className="bg-slate-50 rounded-lg p-5">
              <h3 className="text-[15px] font-semibold text-slate-900 mb-3">Need a similar project?</h3>
              <p className="text-[13px] text-slate-500 mb-3">We can build custom electrical, solar, or IoT projects tailored to your needs.</p>
              <a href="/get-quote" className="block text-center bg-epf-500 hover:bg-epf-600 text-white text-[14px] font-medium py-2.5 rounded-lg transition-colors">Request a Quote</a>
            </div>
          </aside>
        </div>
      </main>
      <ChatWidget /><BackToTopButton /><Footer />
    </div>
  );
}
