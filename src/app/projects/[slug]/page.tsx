"use client";

import { useState, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import {
  ChevronRight,
  Home,
  ArrowLeft,
  ArrowRight,
  Calendar,
  FolderOpen,
  BookOpen,
  MapPin,
  User,
  Phone,
  MessageCircle,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import Header from "@/components/epf/Header";
import Footer from "@/components/epf/Footer";
import CartDrawer from "@/components/epf/CartDrawer";
import CheckoutDialog from "@/components/epf/CheckoutDialog";
import ChatWidget from "@/components/epf/ChatWidget";
import BackToTopButton from "@/components/epf/BackToTopButton";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";

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

interface ProjectListItem {
  id: string;
  title: string;
  slug: string;
  description: string;
  coverImage?: string | null;
  images?: string[];
  location?: string | null;
  status: string;
  createdAt: string;
}

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

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatDateShort(d: string) {
  return new Date(d).toLocaleDateString("en-US", {
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

export default function ProjectDetailPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;
  const [activeImage, setActiveImage] = useState(0);

  const { data: apiRes, isLoading } = useQuery<{ data: ProjectDetail }>({
    queryKey: ["project-detail", slug],
    queryFn: () => apiFetch(`/api/projects/${slug}`),
    enabled: !!slug,
  });

  const { data: listRes } = useQuery<{ data: ProjectListItem[] }>({
    queryKey: ["projects-sidebar", slug],
    queryFn: () => apiFetch("/api/projects"),
    enabled: !!slug,
  });

  const p = apiRes?.data;

  const otherProjects = useMemo(() => {
    const all = listRes?.data ?? [];
    return all.filter((x) => x.slug !== slug).slice(0, 5);
  }, [listRes, slug]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 text-epf-500 animate-spin" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!p) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <BookOpen className="h-16 w-16 text-slate-300 mx-auto mb-4" />
            <h1 className="text-[24px] font-bold text-slate-900 mb-2">
              Project not found
            </h1>
            <p className="text-[14px] text-slate-500 mb-5">
              The project you're looking for doesn't exist or has been removed.
            </p>
            <button
              onClick={() => router.push("/projects")}
              className="h-10 px-6 bg-epf-500 text-white rounded-lg hover:bg-epf-600 transition-colors"
            >
              Back to Projects
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const statusMeta = STATUS_META[p.status] ?? STATUS_META.PLANNED;
  const images = p.images
    ? Array.isArray(p.images)
      ? p.images
      : parseImages(p.images)
    : [];
  const allImages = p.coverImage ? [p.coverImage, ...images] : images;
  const thumb = allImages[activeImage] || p.coverImage || allImages[0] || "";

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />
      <CartDrawer />
      <CheckoutDialog />

      <main className="flex-1">
        {/* Breadcrumb */}
        <div className="bg-white border-b border-slate-200">
          <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
            <nav className="flex items-center gap-1.5 h-11 text-[13px]">
              <a
                href="/"
                className="flex items-center gap-1 text-slate-500 hover:text-epf-600 transition-colors"
              >
                <Home className="h-3.5 w-3.5" />
                <span>Home</span>
              </a>
              <ChevronRight className="h-3 w-3 text-slate-300" />
              <a
                href="/projects"
                className="text-slate-500 hover:text-epf-600 transition-colors"
              >
                Projects
              </a>
              <ChevronRight className="h-3 w-3 text-slate-300" />
              <span className="text-slate-900 font-medium truncate max-w-[260px]">
                {p.title}
              </span>
            </nav>
          </div>
        </div>

        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 py-6">
          <button
            onClick={() => router.push("/projects")}
            className="inline-flex items-center gap-1.5 text-[14px] font-medium text-epf-500 hover:underline mb-5"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Projects
          </button>

          <div className="flex flex-col lg:flex-row gap-6">
            {/* Main content */}
            <div className="flex-1 min-w-0 lg:w-[70%]">
              <article className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                {/* Hero image */}
                <div className="relative w-full h-64 sm:h-80 bg-slate-100 overflow-hidden">
                  {thumb ? (
                    <Image
                      src={thumb}
                      alt={p.title}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <BookOpen className="w-16 h-16 text-slate-300" />
                    </div>
                  )}
                  {/* Status badge overlay */}
                  <div className="absolute top-4 left-4 z-10">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 h-7 px-3 rounded-full text-[12px] font-semibold leading-none backdrop-blur-sm shadow-sm",
                        statusMeta.badgeCls
                      )}
                    >
                      <span
                        className={cn(
                          "h-1.5 w-1.5 rounded-full",
                          statusMeta.dotCls
                        )}
                      />
                      {statusMeta.label}
                    </span>
                  </div>
                </div>

                {/* Image thumbnails */}
                {allImages.length > 1 && (
                  <div className="px-6 sm:px-8 pt-4">
                    <div className="flex gap-2 overflow-x-auto scrollbar-none">
                      {allImages.map((img, i) => (
                        <button
                          key={i}
                          onClick={() => setActiveImage(i)}
                          className={cn(
                            "relative shrink-0 w-20 h-16 rounded-lg overflow-hidden bg-slate-100 border-2 transition-all",
                            activeImage === i
                              ? "border-epf-500"
                              : "border-transparent opacity-70 hover:opacity-100"
                          )}
                        >
                          <Image
                            src={img}
                            alt={`${p.title} ${i + 1}`}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="p-6 sm:p-8">
                  {/* Title */}
                  <h1 className="text-[28px] font-bold text-slate-900 leading-tight mb-4">
                    {p.title}
                  </h1>

                  {/* Metadata */}
                  <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] text-slate-500 mb-6 pb-6 border-b border-slate-100">
                    {p.client && (
                      <span className="inline-flex items-center gap-1.5">
                        <User className="h-4 w-4 text-slate-400" />
                        <span className="text-slate-700 font-medium">
                          {p.client}
                        </span>
                      </span>
                    )}
                    {p.location && (
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin className="h-4 w-4 text-slate-400" />
                        {p.location}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar className="h-4 w-4 text-slate-400" />
                      {formatDate(p.createdAt)}
                    </span>
                  </div>

                  {/* Description */}
                  <div className="prose prose-slate max-w-none mb-6">
                    <h2 className="text-[18px] font-semibold text-slate-900 mb-3">
                      Project Overview
                    </h2>
                    <p className="text-[15px] leading-7 text-slate-700 whitespace-pre-line">
                      {p.description}
                    </p>
                  </div>

                  {/* Project details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                    {p.startDate && (
                      <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg border border-slate-100">
                        <Calendar className="h-5 w-5 text-epf-500 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-[12px] text-slate-400 uppercase tracking-wide">
                            Start Date
                          </p>
                          <p className="text-[14px] font-medium text-slate-800">
                            {formatDate(p.startDate)}
                          </p>
                        </div>
                      </div>
                    )}
                    {p.endDate && (
                      <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg border border-slate-100">
                        <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-[12px] text-slate-400 uppercase tracking-wide">
                            End Date
                          </p>
                          <p className="text-[14px] font-medium text-slate-800">
                            {formatDate(p.endDate)}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* CTA */}
                  <div className="bg-epf-50 rounded-xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <p className="text-[14px] font-semibold text-slate-900">
                        Need a similar project?
                      </p>
                      <p className="text-[13px] text-slate-500 mt-1">
                        We can build custom electrical, solar, or IoT projects
                        tailored to your needs.
                      </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                      <a
                        href="/get-quote"
                        className="h-11 px-6 bg-epf-500 hover:bg-epf-600 text-white font-semibold text-[14px] rounded-lg transition-all flex items-center justify-center gap-2 shadow-sm"
                      >
                        Get Quote
                        <ArrowRight className="w-4 h-4" />
                      </a>
                      <a
                        href="https://wa.me/8801700000000"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="h-11 px-6 bg-white border border-epf-500 text-epf-600 hover:bg-epf-50 font-semibold text-[14px] rounded-lg transition-all flex items-center justify-center gap-2"
                      >
                        <MessageCircle className="w-4 h-4" />
                        Discuss
                      </a>
                    </div>
                  </div>
                </div>
              </article>
            </div>

            {/* Sidebar */}
            <aside className="w-full lg:w-[30%] shrink-0">
              <div className="lg:sticky lg:top-[88px] space-y-6">
                {/* Project Info */}
                <section className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                  <div className="px-5 py-4 border-b border-slate-100">
                    <h3 className="text-[16px] font-semibold text-slate-900">
                      Project Info
                    </h3>
                  </div>
                  <div className="p-5 space-y-3">
                    <div className="flex items-center justify-between text-[14px]">
                      <span className="text-slate-500 inline-flex items-center gap-1.5">
                        <span
                          className={cn(
                            "h-2 w-2 rounded-full",
                            statusMeta.dotCls
                          )}
                        />
                        Status
                      </span>
                      <span className="text-slate-900 font-medium">
                        {statusMeta.label}
                      </span>
                    </div>
                    {p.client && (
                      <div className="flex items-center justify-between text-[14px]">
                        <span className="text-slate-500 inline-flex items-center gap-1.5">
                          <User className="h-3.5 w-3.5" />
                          Client
                        </span>
                        <span className="text-slate-900 font-medium">
                          {p.client}
                        </span>
                      </div>
                    )}
                    {p.location && (
                      <div className="flex items-center justify-between text-[14px]">
                        <span className="text-slate-500 inline-flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5" />
                          Location
                        </span>
                        <span className="text-slate-900 font-medium text-right">
                          {p.location}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-[14px]">
                      <span className="text-slate-500 inline-flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" />
                        Published
                      </span>
                      <span className="text-slate-900 font-medium">
                        {formatDateShort(p.createdAt)}
                      </span>
                    </div>
                    {p.startDate && (
                      <div className="flex items-center justify-between text-[14px]">
                        <span className="text-slate-500">Start Date</span>
                        <span className="text-slate-900 font-medium">
                          {formatDateShort(p.startDate)}
                        </span>
                      </div>
                    )}
                    {p.endDate && (
                      <div className="flex items-center justify-between text-[14px]">
                        <span className="text-slate-500">End Date</span>
                        <span className="text-slate-900 font-medium">
                          {formatDateShort(p.endDate)}
                        </span>
                      </div>
                    )}
                  </div>
                </section>

                {/* Other Projects */}
                <section className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                  <div className="px-5 py-4 border-b border-slate-100">
                    <h3 className="text-[16px] font-semibold text-slate-900">
                      Other Projects
                    </h3>
                  </div>
                  <div className="p-2 space-y-1">
                    {otherProjects.length === 0 ? (
                      <p className="p-3 text-[13px] text-slate-400">
                        No other projects.
                      </p>
                    ) : (
                      otherProjects.map((proj) => {
                        const projImages = proj.images
                          ? Array.isArray(proj.images)
                            ? proj.images
                            : parseImages(proj.images)
                          : [];
                        const cover =
                          proj.coverImage || projImages[0] || "";
                        const meta =
                          STATUS_META[proj.status] ?? STATUS_META.PLANNED;
                        return (
                          <button
                            key={proj.id}
                            onClick={() => router.push(`/projects/${proj.slug}`)}
                            className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors text-left group"
                          >
                            <div className="relative shrink-0 w-14 h-14 rounded-lg overflow-hidden bg-slate-100 border border-slate-200">
                              {cover ? (
                                <Image
                                  src={cover}
                                  alt={proj.title}
                                  fill
                                  className="object-cover group-hover:scale-105 transition-transform"
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
                                {proj.title}
                              </h4>
                              <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-slate-400">
                                <span
                                  className={cn(
                                    "h-1.5 w-1.5 rounded-full",
                                    meta.dotCls
                                  )}
                                />
                                <span className="truncate">{meta.label}</span>
                                {proj.location && (
                                  <>
                                    <span className="text-slate-300">·</span>
                                    <span className="truncate">
                                      {proj.location}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          </button>
                        );
                      })
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

                {/* Quick Contact */}
                <section className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                  <div className="px-5 py-4 border-b border-slate-100">
                    <h3 className="text-[16px] font-semibold text-slate-900">
                      Quick Contact
                    </h3>
                  </div>
                  <div className="p-4 space-y-3">
                    <a
                      href="tel:+8801700000000"
                      className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg hover:bg-white hover:shadow-sm transition-all"
                    >
                      <div className="w-10 h-10 rounded-full bg-epf-500/10 flex items-center justify-center shrink-0">
                        <Phone className="w-5 h-5 text-epf-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[13px] font-medium text-slate-800">
                          Call Us
                        </p>
                        <p className="text-[12px] text-slate-400">
                          +880 1700-000000
                        </p>
                      </div>
                    </a>
                    <a
                      href="https://wa.me/8801700000000"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg hover:bg-white hover:shadow-sm transition-all"
                    >
                      <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
                        <MessageCircle className="w-5 h-5 text-green-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[13px] font-medium text-slate-800">
                          WhatsApp
                        </p>
                        <p className="text-[12px] text-slate-400">
                          Chat with us
                        </p>
                      </div>
                    </a>
                  </div>
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
