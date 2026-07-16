"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  Check,
  ChevronRight,
  Clock3,
  Copy,
  FolderOpen,
  Home,
  MessageCircle,
  Phone,
  Share2,
  ShieldCheck,
  Star,
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

function dateLabel(value: string) {
  return new Date(value).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function ShareRow({ title }: { title: string }) {
  const copyLink = async () => {
    await navigator.clipboard?.writeText(window.location.href);
  };

  return (
    <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4 text-[11px] text-slate-500">
      <span className="mr-2 font-semibold text-slate-800">Social Share</span>
      <button type="button" onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`, "_blank", "noopener,noreferrer")} className="flex h-7 w-7 items-center justify-center border border-slate-200 text-[11px] font-bold text-slate-500 hover:border-epf-500 hover:text-epf-600" aria-label={`Share ${title} on Facebook`}>f</button>
      <button type="button" onClick={() => window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(title)}`, "_blank", "noopener,noreferrer")} className="flex h-7 w-7 items-center justify-center border border-slate-200 text-[11px] font-bold text-slate-500 hover:border-epf-500 hover:text-epf-600" aria-label="Share on X">𝕏</button>
      <button type="button" onClick={() => window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`, "_blank", "noopener,noreferrer")} className="flex h-7 w-7 items-center justify-center border border-slate-200 text-[11px] font-bold text-slate-500 hover:border-epf-500 hover:text-epf-600" aria-label="Share on LinkedIn">in</button>
      <button type="button" onClick={copyLink} className="flex h-7 w-7 items-center justify-center border border-slate-200 text-slate-500 hover:border-epf-500 hover:text-epf-600" aria-label="Copy link"><Copy className="h-3 w-3" /></button>
    </div>
  );
}

function RelatedService({ service, onOpen }: { service: ServiceItem; onOpen: (slug: string) => void }) {
  return (
    <button type="button" onClick={() => onOpen(service.slug)} className="group flex w-full items-center gap-2.5 border-b border-slate-100 py-2.5 text-left last:border-b-0">
      <div className="h-11 w-14 shrink-0 overflow-hidden bg-slate-100">
        {service.images?.[0] ? <img src={service.images[0]} alt="" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy" /> : <div className="flex h-full items-center justify-center"><Wrench className="h-5 w-5 text-slate-300" /></div>}
      </div>
      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 text-[11px] font-medium leading-4 text-slate-700 group-hover:text-epf-600">{service.name}</p>
        <p className="mt-1 text-[10px] text-slate-400">{service.category?.name || "Electrical service"}</p>
      </div>
      <ArrowRight className="h-3 w-3 shrink-0 text-slate-300 group-hover:text-epf-500" />
    </button>
  );
}

export default function ServiceDetailPage() {
  const router = useRouter();
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const { setServiceBookingOpen, setBookingServiceId } = useUIStore();
  const [heroError, setHeroError] = useState(false);
  const serviceQuery = useQuery<{ success: boolean; data: ServiceDetail }>({ queryKey: ["service-detail", slug], queryFn: () => apiFetch(`/api/services/${slug}`), enabled: Boolean(slug) });
  const listQuery = useQuery<{ success: boolean; data: { services: ServiceItem[] } }>({ queryKey: ["services-detail-related"], queryFn: () => apiFetch("/api/services"), staleTime: 60 * 1000 });
  const service = serviceQuery.data?.data;
  const related = (listQuery.data?.data?.services ?? []).filter((item) => item.slug !== slug).slice(0, 5);

  if (serviceQuery.isLoading) return <LoadingPage />;
  if (!service) return <NotFoundPage onBack={() => router.push("/services")} />;

  const features = parseList(service.features);
  const shareTitle = service.nameBn || service.name;
  const openBooking = () => { setBookingServiceId(service.id); setServiceBookingOpen(true); };

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <Header />
      <main>
        <div className="mx-auto max-w-[1400px] px-4 py-5 sm:px-12 sm:py-7">
          <nav className="mb-5 flex items-center gap-2 text-xs text-slate-400"><a href="/" className="hover:text-epf-600">Home</a><ChevronRight className="h-3 w-3" /><a href="/services" className="hover:text-epf-600">Services</a><ChevronRight className="h-3 w-3" /><span className="truncate text-slate-700">{service.name}</span></nav>
          <button type="button" onClick={() => router.push("/services")} className="mb-5 inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-epf-600"><ArrowLeft className="h-3.5 w-3.5" /> Back to Services</button>

          <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_205px]">
            <article className="min-w-0">
              <div className="relative h-[250px] overflow-hidden bg-slate-100 sm:h-[390px]">
                {!heroError && service.images?.[0] ? <img src={service.images[0]} alt={service.name} className="h-full w-full object-cover" onError={() => setHeroError(true)} /> : <div className="flex h-full items-center justify-center"><Wrench className="h-14 w-14 text-slate-300" /></div>}
                {service.isFeatured && <span className="absolute left-3 top-3 bg-epf-500 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white">Featured Service</span>}
              </div>
              <div className="pt-5">
                <div className="mb-2 flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-wide text-epf-600"><span>{service.category?.name || "Electrical service"}</span><span className="text-slate-300">•</span><span>{service.priceUnit || "Professional support"}</span></div>
                <h1 className="text-2xl font-semibold leading-tight text-slate-900 sm:text-[30px]">{shareTitle}</h1>
                <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 border-b border-slate-200 pb-4 text-[11px] text-slate-400"><span className="inline-flex items-center gap-1"><Clock3 className="h-3.5 w-3.5" /> {service.shortDesc || "Flexible scheduling"}</span>{Number(service.rating || 0) > 0 && <span className="inline-flex items-center gap-1"><Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> {Number(service.rating).toFixed(1)} ({service.reviewCount || 0})</span>}<span className="inline-flex items-center gap-1 text-emerald-600"><ShieldCheck className="h-3.5 w-3.5" /> Available</span></div>

                <div className="mt-5 text-[12px] leading-6 text-slate-600"><h2 className="mb-2 text-base font-semibold text-slate-900">Service Overview</h2><p className="whitespace-pre-line">{service.description}</p></div>
                {features.length > 0 && <div className="mt-6"><h2 className="mb-3 text-base font-semibold text-slate-900">What&apos;s Included</h2><div className="grid gap-x-6 gap-y-2 sm:grid-cols-2">{features.map((feature) => <div key={feature} className="flex items-start gap-2 text-[12px] leading-5 text-slate-600"><Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-epf-500" />{feature}</div>)}</div></div>}
                <div className="mt-7 flex flex-col items-start justify-between gap-4 border-y border-slate-100 py-5 sm:flex-row sm:items-center"><div><p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Starting price</p><p className="mt-1 text-xl font-bold text-slate-900">{service.basePrice > 0 ? `৳${Number(service.basePrice).toLocaleString()}` : "Price on request"}</p></div><div className="flex flex-wrap gap-2"><button type="button" onClick={openBooking} className="inline-flex h-9 items-center gap-1.5 bg-epf-500 px-4 text-xs font-semibold text-white hover:bg-epf-600"><Calendar className="h-3.5 w-3.5" /> Request Quote</button><a href="tel:+8801700000000" className="inline-flex h-9 items-center gap-1.5 border border-slate-200 px-4 text-xs font-semibold text-slate-700 hover:border-epf-500 hover:text-epf-600"><Phone className="h-3.5 w-3.5" /> Contact</a></div></div>
                <ShareRow title={shareTitle} />
                <div className="mt-4 flex flex-wrap items-center gap-2 text-[10px] text-slate-400"><span className="font-semibold text-slate-700">Tags</span><span className="border border-slate-200 px-2 py-1">{service.category?.name || "Electrical"}</span><span className="border border-slate-200 px-2 py-1">Professional Service</span></div>
              </div>
            </article>

            <aside className="h-fit lg:sticky lg:top-[92px]"><div className="border-b border-slate-200 pb-3"><h2 className="text-[16px] font-semibold text-slate-900">Other Services</h2><div className="mt-2 h-0.5 w-8 bg-epf-500" /></div><div>{related.length > 0 ? related.map((item) => <RelatedService key={item.id} service={item} onOpen={(next) => router.push(`/services/${next}`)} />) : <p className="py-4 text-xs text-slate-400">No other services.</p>}</div><a href="/services" className="mt-3 block border border-slate-200 py-2 text-center text-[11px] font-semibold text-epf-600 hover:bg-epf-50">View All Services</a><div className="mt-7 border-b border-slate-200 pb-3"><h2 className="text-[16px] font-semibold text-slate-900">Quick Contact</h2><div className="mt-2 h-0.5 w-8 bg-epf-500" /></div><div className="space-y-2.5 py-3"><a href="tel:+8801700000000" className="flex items-center gap-2 border-b border-slate-100 pb-2.5 text-[11px] text-slate-600"><Phone className="h-4 w-4 text-epf-500" /> +880 1700-000000</a><a href="https://wa.me/8801700000000" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 border-b border-slate-100 pb-2.5 text-[11px] text-slate-600"><MessageCircle className="h-4 w-4 text-green-500" /> Chat on WhatsApp</a><a href="/contact" className="inline-flex items-center gap-1 text-[11px] font-semibold text-epf-600">Request a callback <ArrowRight className="h-3 w-3" /></a></div></aside>
          </div>
        </div>
      </main>
      <Footer /><CartDrawer /><CheckoutDialog /><ServiceBookingDialog /><ChatWidget /><BackToTopButton />
    </div>
  );
}

function LoadingPage() { return <div className="flex min-h-screen items-center justify-center bg-white"><Wrench className="h-6 w-6 animate-pulse text-epf-500" /></div>; }
function NotFoundPage({ onBack }: { onBack: () => void }) { return <div className="flex min-h-screen flex-col bg-white"><Header /><div className="flex flex-1 items-center justify-center px-4 py-20 text-center"><div><FolderOpen className="mx-auto h-10 w-10 text-slate-300" /><h1 className="mt-3 text-xl font-semibold text-slate-900">Service not found</h1><p className="mt-1 text-sm text-slate-500">This service may have been removed.</p><button type="button" onClick={onBack} className="mt-5 bg-epf-500 px-4 py-2 text-sm font-semibold text-white">Back to Services</button></div></div><Footer /></div>; }
