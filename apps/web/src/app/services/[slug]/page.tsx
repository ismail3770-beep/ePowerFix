"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  CalendarDays,
  Check,
  Copy,
  FolderOpen,
  Search,
  User,
  Wrench,
} from "lucide-react";
import Header from "@/components/epf/Header";
import Footer from "@/components/epf/Footer";
import CartDrawer from "@/components/epf/CartDrawer";
import CheckoutDialog from "@/components/epf/CheckoutDialog";
import ServiceBookingDialog from "@/components/epf/ServiceBookingDialog";
import ChatWidget from "@/components/epf/ChatWidget";
import BackToTopButton from "@/components/epf/BackToTopButton";
import { apiFetch } from "@/lib/api";
import { useUIStore } from "@/store";

interface ServiceDetail {
  id: string;
  name: string;
  nameBn?: string | null;
  description: string;
  slug: string;
  basePrice: number;
  priceUnit: string;
  shortDesc?: string | null;
  images: string[];
  features?: string | string[] | null;
  isFeatured: boolean;
  rating: number;
  reviewCount: number;
  category: { id: string; name: string; nameBn?: string | null; slug: string } | null;
}

interface ServiceItem {
  id: string;
  name: string;
  slug: string;
  description: string;
  images: string[];
  rating: number;
  reviewCount: number;
  category: { id: string; name: string; slug: string } | null;
}

function parseList(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === "string");
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed.filter((item): item is string => typeof item === "string");
    } catch {
      return value.split(/[\n,]+/).map((item) => item.trim()).filter(Boolean);
    }
  }
  return [];
}

function formatDate(dateStr?: string) {
  if (!dateStr) return "Available";
  return new Date(dateStr).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function ShareRow({ title }: { title: string }) {
  const copyLink = async () => {
    await navigator.clipboard?.writeText(window.location.href);
  };

  return (
    <div className="mt-8">
      <p className="text-[13px] font-bold text-gray-900 mb-3">Social Share</p>
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`, "_blank", "noopener,noreferrer")} className="flex h-9 w-9 items-center justify-center rounded bg-gray-100 text-[13px] font-bold text-gray-700 hover:bg-gray-200 transition-colors" aria-label="Share on Facebook">f</button>
        <button type="button" onClick={() => window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(title)}`, "_blank", "noopener,noreferrer")} className="flex h-9 w-9 items-center justify-center rounded bg-gray-100 text-[13px] font-bold text-gray-700 hover:bg-gray-200 transition-colors" aria-label="Share on X">𝕏</button>
        <button type="button" onClick={() => window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`, "_blank", "noopener,noreferrer")} className="flex h-9 w-9 items-center justify-center rounded bg-gray-100 text-[13px] font-bold text-gray-700 hover:bg-gray-200 transition-colors" aria-label="Share on LinkedIn">in</button>
        <button type="button" onClick={copyLink} className="flex h-9 w-9 items-center justify-center rounded bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors" aria-label="Copy link"><Copy className="h-4 w-4" /></button>
      </div>
    </div>
  );
}

export default function ServiceDetailPage() {
  const router = useRouter();
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const { setServiceBookingOpen, setBookingServiceId } = useUIStore();
  const [heroError, setHeroError] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const serviceQuery = useQuery<{ success: boolean; data: ServiceDetail }>({ queryKey: ["service-detail", slug], queryFn: () => apiFetch(`/api/services/${slug}`), enabled: Boolean(slug) });
  const listQuery = useQuery<{ success: boolean; data: { services: ServiceItem[] } }>({ queryKey: ["services-detail-related"], queryFn: () => apiFetch("/api/services"), staleTime: 60 * 1000 });
  const service = serviceQuery.data?.data;
  const allServices = listQuery.data?.data?.services ?? [];
  const related = allServices.filter((item) => item.slug !== slug).slice(0, 5);

  // Build categories with counts
  const categories = (() => {
    const seen = new Map<string, { name: string; slug: string; count: number }>();
    allServices.forEach((s) => {
      if (s.category) {
        const existing = seen.get(s.category.slug);
        if (existing) existing.count++;
        else seen.set(s.category.slug, { ...s.category, count: 1 });
      }
    });
    return Array.from(seen.values());
  })();

  if (serviceQuery.isLoading) return <LoadingPage />;
  if (!service) return <NotFoundPage onBack={() => router.push("/services")} />;

  const features = parseList(service.features);
  const shareTitle = service.nameBn || service.name;
  const openBooking = () => { setBookingServiceId(service.id); setServiceBookingOpen(true); };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <Header />
      <main>
        <div className="mx-auto max-w-[1400px] px-4 sm:px-12 py-10">
          <div className="flex gap-8 items-start">

            {/* ── Main content (left) ── */}
            <article className="flex-1 min-w-0 bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden">
              {/* Hero image */}
              <div className="relative h-[280px] sm:h-[400px] overflow-hidden bg-gray-100">
                {!heroError && service.images?.[0] ? (
                  <img src={service.images[0]} alt={service.name} className="h-full w-full object-cover" onError={() => setHeroError(true)} />
                ) : (
                  <div className="flex h-full items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
                    <Wrench className="h-16 w-16 text-gray-300" />
                  </div>
                )}
              </div>

              <div className="p-6 sm:p-8">
                {/* Meta row */}
                <div className="flex items-center gap-5 text-[13px] text-gray-500 mb-4">
                  <span className="flex items-center gap-1.5">
                    <User size={14} className="text-gray-400" />
                    ePowerFix
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CalendarDays size={14} className="text-gray-400" />
                    {formatDate((service as any).createdAt)}
                  </span>
                </div>

                {/* Title */}
                <h1 className="text-2xl sm:text-[28px] font-bold text-gray-900 leading-tight mb-5">
                  {shareTitle}
                </h1>

                {/* Description */}
                <div className="text-[15px] leading-7 text-gray-600 whitespace-pre-line">
                  {service.description}
                </div>

                {/* Features / What's Included */}
                {features.length > 0 && (
                  <div className="mt-7">
                    <h2 className="text-lg font-bold text-gray-900 mb-3">What&apos;s Included</h2>
                    <div className="grid gap-x-6 gap-y-2.5 sm:grid-cols-2">
                      {features.map((feature) => (
                        <div key={feature} className="flex items-start gap-2 text-[14px] leading-6 text-gray-600">
                          <Check className="mt-1 h-4 w-4 shrink-0 text-[#1a3c6e]" />
                          {feature}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Price + Booking */}
                <div className="mt-8 flex flex-col items-start justify-between gap-4 border-t border-gray-100 pt-6 sm:flex-row sm:items-center">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Starting price</p>
                    <p className="mt-1 text-2xl font-bold text-gray-900">
                      {service.basePrice > 0 ? `৳${Number(service.basePrice).toLocaleString()}` : "Price on request"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={openBooking}
                    className="inline-flex h-11 items-center gap-2 rounded bg-[#1a3c6e] px-6 text-sm font-semibold text-white hover:bg-[#15325c] transition-colors"
                  >
                    <CalendarDays className="h-4 w-4" /> Book This Service
                  </button>
                </div>

                {/* Social Share */}
                <ShareRow title={shareTitle} />

                {/* Tags */}
                <div className="mt-6">
                  <p className="text-[13px] font-bold text-gray-900 mb-3">Tags</p>
                  <div className="flex flex-wrap gap-2">
                    {[service.category?.name || "Electrical", "Professional Service", service.priceUnit || "Home Service", "Certified", "ePowerFix"].map((tag) => (
                      <span key={tag} className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 px-3.5 py-1.5 text-[12px] text-gray-600">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#1a3c6e]" />
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </article>

            {/* ── Sidebar (right) ── */}
            <aside className="hidden lg:flex flex-col gap-6 w-[280px] shrink-0">

              {/* Search */}
              <form
                onSubmit={(e) => { e.preventDefault(); if (searchInput.trim()) router.push(`/services?search=${encodeURIComponent(searchInput.trim())}`); }}
                className="flex"
              >
                <input
                  type="text"
                  placeholder="Search services"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="flex-1 px-4 py-2.5 text-sm border border-gray-200 rounded-l bg-gray-50 outline-none focus:border-[#1a3c6e] transition-colors"
                />
                <button type="submit" className="px-4 py-2.5 bg-[#1a3c6e] text-white rounded-r hover:bg-[#15325c] transition-colors">
                  <Search size={15} />
                </button>
              </form>

              {/* Categories */}
              <div className="bg-white border border-gray-100 rounded-lg p-5">
                <h3 className="font-bold text-[15px] text-gray-900 pb-3 border-b-2 border-gray-900 mb-3">Categories</h3>
                <div className="space-y-0">
                  <button
                    onClick={() => router.push("/services")}
                    className="w-full flex items-center justify-between py-2.5 text-[14px] border-b border-gray-100 text-gray-700 hover:text-[#1a3c6e] transition-colors"
                  >
                    <span>All Services</span>
                    <span className="w-6 h-6 rounded-full bg-gray-100 text-[11px] font-bold flex items-center justify-center text-gray-600">{allServices.length}</span>
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat.slug}
                      onClick={() => router.push(`/services?category=${cat.slug}`)}
                      className="w-full flex items-center justify-between py-2.5 text-[14px] border-b border-gray-100 last:border-0 text-gray-700 hover:text-[#1a3c6e] transition-colors"
                    >
                      <span>{cat.name}</span>
                      <span className="w-6 h-6 rounded-full bg-gray-100 text-[11px] font-bold flex items-center justify-center text-gray-600">{cat.count}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Recent Services */}
              {related.length > 0 && (
                <div className="bg-white border border-gray-100 rounded-lg p-5">
                  <h3 className="font-bold text-[15px] text-gray-900 pb-3 border-b-2 border-gray-900 mb-4">Recent Services</h3>
                  <div className="space-y-4">
                    {related.map((item) => (
                      <button key={item.id} type="button" onClick={() => router.push(`/services/${item.slug}`)} className="flex gap-3 group w-full text-left">
                        <div className="w-16 h-14 rounded overflow-hidden shrink-0 bg-gray-100">
                          {item.images?.[0] ? (
                            <img src={item.images[0]} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Wrench size={16} className="text-gray-300" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-[13px] font-bold text-gray-900 line-clamp-2 group-hover:text-[#1a3c6e] transition-colors leading-snug">
                            {item.name}
                          </h4>
                          <p className="text-[11px] text-gray-500 mt-1 flex items-center gap-1">
                            <CalendarDays size={10} />
                            {item.category?.name || "Available"}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

            </aside>
          </div>
        </div>
      </main>
      <Footer /><CartDrawer /><CheckoutDialog /><ServiceBookingDialog /><ChatWidget /><BackToTopButton />
    </div>
  );
}

function LoadingPage() { return <div className="flex min-h-screen items-center justify-center bg-gray-50"><Wrench className="h-6 w-6 animate-pulse text-[#1a3c6e]" /></div>; }
function NotFoundPage({ onBack }: { onBack: () => void }) { return <div className="flex min-h-screen flex-col bg-gray-50"><Header /><div className="flex flex-1 items-center justify-center px-4 py-20 text-center"><div><FolderOpen className="mx-auto h-10 w-10 text-gray-300" /><h1 className="mt-3 text-xl font-semibold text-gray-900">Service not found</h1><p className="mt-1 text-sm text-gray-500">This service may have been removed.</p><button type="button" onClick={onBack} className="mt-5 rounded bg-[#1a3c6e] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#15325c] transition-colors">Back to Services</button></div></div><Footer /></div>; }
