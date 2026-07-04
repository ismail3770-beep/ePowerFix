"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  ChevronRight, ChevronDown, Calendar, Clock, FolderOpen, ExternalLink,
  Check, Download, MessageCircle, Send, Facebook, Twitter, ImageIcon,
  BookOpen, ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";
import Header from "@/components/epf/Header";
import Footer from "@/components/epf/Footer";
import ChatWidget from "@/components/epf/ChatWidget";
import BackToTopButton from "@/components/epf/BackToTopButton";
import { apiFetch } from "@/lib/api";

interface ProjectDetail {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  coverImage?: string;
  images: string[];
  price?: number | null;
  salePrice?: number | null;
  githubUrl?: string | null;
  liveUrl?: string | null;
  features?: string;
  isSellable?: boolean;
  createdAt: string;
}

const CATEGORIES: Record<string, string> = { electrical: "Electrical", solar: "Solar", automation: "Automation", iot: "IoT" };

function formatDate(d: string) { return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }); }

export default function ProjectDetailPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;

  const { data: apiRes, isLoading } = useQuery<{ success: boolean; data: ProjectDetail }>({
    queryKey: ["project-detail", slug],
    queryFn: () => apiFetch(`/api/projects/${slug}`),
    enabled: !!slug,
  });

  const p = apiRes?.data;

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <Header /><div className="flex-1 flex items-center justify-center"><div className="animate-pulse text-[#999]">Loading...</div></div><Footer />
      </div>
    );
  }

  if (!p) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <Header />
        <div className="flex-1 flex items-center justify-center"><div className="text-center"><h1 className="text-[24px] font-bold text-[#111827] mb-2">Project not found</h1><button onClick={() => router.push("/projects")} className="h-10 px-6 bg-[#0EA5E9] text-white rounded-lg hover:bg-[#0284C7] transition-colors mt-5">Back to Projects</button></div></div>
        <Footer />
      </div>
    );
  }

  const categoryName = CATEGORIES[p.category?.toLowerCase()] || p.category || "General";
  const readTime = "15 min read";
  const thumb = p.coverImage || p.images?.[0] || "";
  const features: string[] = [];

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      <main className="flex-1 mx-auto w-full max-w-[1400px] px-4 sm:px-12 py-8">
        <div className="flex items-center justify-between flex-wrap gap-2 bg-[#F9FAFB] px-4 py-2.5 rounded-lg mb-6">
          <nav className="flex items-center gap-1.5 text-[13px] text-[#6B7280] flex-wrap">
            <a href="/" className="hover:text-[#0EA5E9] hover:underline">Home</a>
            <ChevronRight className="w-3 h-3 shrink-0" />
            <a href="/projects" className="hover:text-[#0EA5E9] hover:underline">Projects</a>
            <ChevronRight className="w-3 h-3 shrink-0" />
            <a href={`/projects?category=${p.category}`} className="hover:text-[#0EA5E9] hover:underline">{categoryName}</a>
            <ChevronRight className="w-3 h-3 shrink-0" />
            <span className="text-[#374151] font-medium truncate max-w-[200px]">{p.title}</span>
          </nav>
          <div className="flex items-center gap-2">
            <span className="text-[12px] text-[#6B7280] hidden sm:inline">Share:</span>
            {[Facebook, Twitter, ImageIcon].map((Icon, i) => (
              <button key={i} className="w-7 h-7 rounded-full bg-white border border-[#E5E7EB] flex items-center justify-center text-[#6B7280] hover:text-[#0EA5E9] hover:border-[#0EA5E9] transition-all"><Icon className="w-3.5 h-3.5" /></button>
            ))}
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1 min-w-0 lg:w-[70%]">
            <div className="relative w-full max-w-[600px] h-[300px] rounded-lg overflow-hidden bg-gradient-to-br from-[#0EA5E9]/20 via-[#0284C7]/10 to-[#111827] shadow-[0_4px_6px_rgba(0,0,0,0.1)] mb-6">
              {thumb ? <img src={thumb} alt={p.title} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><BookOpen className="w-16 h-16 text-white/40 mx-auto" /></div>}
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none" />
            </div>

            <h1 className="text-[28px] font-bold text-[#111827] leading-tight mb-3">{p.title}</h1>
            <div className="flex flex-wrap items-center gap-3 text-[14px] text-[#6B7280] mb-4">
              <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" />{formatDate(p.createdAt)}</span>
              <span className="w-1 h-1 rounded-full bg-[#D1D5DB]" />
              <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" />{readTime}</span>
              <span className="w-1 h-1 rounded-full bg-[#D1D5DB]" />
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-[#0EA5E9]/10 text-[#0EA5E9] text-[12px] font-medium rounded-full"><FolderOpen className="w-3 h-3" />{categoryName}</span>
            </div>

            <div className="mb-6">
              <p className="text-[16px] leading-relaxed text-[#374151] mb-4">{p.description}</p>
              <div className="flex flex-wrap items-center gap-3 mt-5">
                {p.liveUrl && <a href={p.liveUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-[#0EA5E9] hover:bg-[#0284C7] text-white text-[15px] font-medium px-6 py-3 rounded-[4px] transition-all"><ExternalLink className="w-4 h-4" />Live Demo</a>}
                {p.githubUrl && <a href={p.githubUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 border border-[#E5E7EB] text-[#374151] hover:text-[#0EA5E9] hover:border-[#0EA5E9] text-[15px] font-medium px-6 py-3 rounded-[4px] transition-all">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>View Source</a>}
                {p.isSellable && p.price != null && (
                  <div className="ml-auto text-right">
                    <p className="text-[14px] text-[#6B7280]">Price</p>
                    <p className="text-[24px] font-bold text-[#111827]">৳{Number(p.salePrice || p.price).toLocaleString()}<span className="text-[14px] font-normal text-[#6B7280]"> BDT</span></p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <aside className="w-full lg:w-[30%] shrink-0 space-y-6">
            <a href="/projects" className="inline-flex items-center gap-1.5 text-[14px] font-medium text-[#0EA5E9] hover:underline"><ArrowLeft className="w-4 h-4" />Back to Projects</a>
            <div className="bg-white border border-[#E5E7EB] rounded-lg p-5">
              <h3 className="text-[15px] font-semibold text-[#111827] mb-3">Project Info</h3>
              <div className="space-y-2.5">
                <div className="flex justify-between text-[14px]"><span className="text-[#6B7280]">Category</span><span className="text-[#0EA5E9] font-medium">{categoryName}</span></div>
                <div className="flex justify-between text-[14px]"><span className="text-[#6B7280]">Published</span><span className="text-[#374151]">{formatDate(p.createdAt)}</span></div>
                <div className="flex justify-between text-[14px]"><span className="text-[#6B7280]">Read Time</span><span className="text-[#374151]">{readTime}</span></div>
                {p.isSellable && p.price != null && <div className="flex justify-between text-[14px] pt-2.5 border-t border-[#E5E7EB]"><span className="text-[#6B7280] font-medium">Price</span><span className="text-[#111827] font-bold">৳{Number(p.salePrice || p.price).toLocaleString()}</span></div>}
              </div>
            </div>
          </aside>
        </div>
      </main>
      <ChatWidget /><BackToTopButton /><Footer />
    </div>
  );
}
