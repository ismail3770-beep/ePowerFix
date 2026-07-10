"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import {
  ChevronRight,
  Home,
  ArrowLeft,
  ArrowRight,
  Phone,
  MessageCircle,
  Star,
  Check,
  Clock,
  FolderOpen,
  Calendar,
  Zap,
  Sun,
  Wrench,
  Shield,
  Building2,
  Bot,
  Sparkles,
  Loader2,
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
  nameBn?: string;
  description: string;
  slug: string;
  basePrice: number;
  priceUnit: string;
  shortDesc?: string | null;
  images: string[];
  features: string;
  isFeatured: boolean;
  rating: number;
  reviewCount: number;
  category: { id: string; name: string; nameBn: string; slug: string } | null;
}

interface ServiceItem {
  id: string;
  name: string;
  slug: string;
  description: string;
  images: string[];
  rating: number;
  reviewCount: number;
  isFeatured: boolean;
  category: { id: string; name: string; slug: string } | null;
}

function parseJsonArray(val: unknown): string[] {
  if (Array.isArray(val)) return val;
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

/* Module-scope wrapper so we don't create components during render */
function CatIcon({ name, className }: { name?: string; className?: string }) {
  const key = name?.toLowerCase() || "";
  if (key.includes("solar")) return <Sun className={className} />;
  if (key.includes("industrial")) return <Building2 className={className} />;
  if (key.includes("repair") || key.includes("wrench")) return <Wrench className={className} />;
  if (key.includes("inspection") || key.includes("shield")) return <Shield className={className} />;
  if (key.includes("automation") || key.includes("bot")) return <Bot className={className} />;
  return <Zap className={className} />;
}

export default function ServiceDetailPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;
  const { setServiceBookingOpen, setBookingServiceId } = useUIStore();
  const [heroError, setHeroError] = useState(false);

  const { data: apiRes, isLoading } = useQuery<{ success: boolean; data: ServiceDetail }>({
    queryKey: ["service-detail", slug],
    queryFn: () => apiFetch(`/api/services/${slug}`),
    enabled: !!slug,
  });

  const service = apiRes?.data;

  // Fetch other services for sidebar
  const { data: listRes } = useQuery<{ success: boolean; data: { services: ServiceItem[] } }>({
    queryKey: ["services-sidebar", slug],
    queryFn: () => apiFetch("/api/services"),
    enabled: !!slug,
  });

  const otherServices = (listRes?.data?.services ?? [])
    .filter((s) => s.slug !== slug)
    .slice(0, 5);

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

  if (!service) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <FolderOpen className="h-16 w-16 text-slate-300 mx-auto mb-4" />
            <h1 className="text-[24px] font-bold text-slate-900 mb-2">Service not found</h1>
            <p className="text-[14px] text-slate-500 mb-5">
              The service you're looking for doesn't exist or has been removed.
            </p>
            <button
              onClick={() => router.push("/services")}
              className="h-10 px-6 bg-epf-500 text-white rounded-lg hover:bg-epf-600 transition-colors"
            >
              Back to Services
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const features = parseJsonArray(service.features);
  const duration = service.shortDesc || "1-3 days";

  const openBooking = () => {
    setBookingServiceId(service.id);
    setServiceBookingOpen(true);
  };

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
              <a href="/" className="flex items-center gap-1 text-slate-500 hover:text-epf-600 transition-colors">
                <Home className="h-3.5 w-3.5" />
                <span>Home</span>
              </a>
              <ChevronRight className="h-3 w-3 text-slate-300" />
              <a href="/services" className="text-slate-500 hover:text-epf-600 transition-colors">
                Services
              </a>
              <ChevronRight className="h-3 w-3 text-slate-300" />
              <span className="text-slate-900 font-medium truncate max-w-[260px]">
                {service.name}
              </span>
            </nav>
          </div>
        </div>

        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 py-6">
          <button
            onClick={() => router.push("/services")}
            className="inline-flex items-center gap-1.5 text-[14px] font-medium text-epf-500 hover:underline mb-5"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Services
          </button>

          <div className="flex flex-col lg:flex-row gap-6">
            {/* Main content */}
            <div className="flex-1 min-w-0 lg:w-[70%]">
              <article className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                {/* Hero image */}
                <div className="relative w-full h-64 sm:h-80 bg-slate-100 overflow-hidden">
                  {!heroError && service.images?.[0] ? (
                    <Image
                      src={service.images[0]}
                      alt={service.name}
                      fill
                      className="object-cover"
                      unoptimized
                      onError={() => setHeroError(true)}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <CatIcon name={service.category?.name} className="w-16 h-16 text-slate-300" />
                    </div>
                  )}
                  {service.isFeatured && (
                    <span className="absolute top-4 left-4 z-10 inline-flex items-center gap-1 h-7 px-3 rounded-full text-[12px] font-semibold bg-epf-500 text-white shadow-sm">
                      <Sparkles className="h-3.5 w-3.5" /> Popular
                    </span>
                  )}
                </div>

                <div className="p-6 sm:p-8">
                  {/* Category badge */}
                  <span className="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium bg-epf-50 text-epf-600 mb-3">
                    {service.category?.name || "General"}
                  </span>

                  {/* Title */}
                  <h1 className="text-[28px] font-bold text-slate-900 leading-tight mb-3">
                    {service.name}
                  </h1>

                  {/* Meta row */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px] text-slate-500 mb-6 pb-6 border-b border-slate-100">
                    <span className="inline-flex items-center gap-1.5">
                      <Clock className="h-4 w-4 text-slate-400" />
                      {duration}
                    </span>
                    {Number(service.rating || 0) > 0 && (
                      <span className="inline-flex items-center gap-1.5">
                        <Star className="h-4 w-4 text-amber-400" />
                        <span className="font-medium text-slate-700">
                          {Number(service.rating || 0).toFixed(1)}
                        </span>
                        <span className="text-slate-400">
                          ({service.reviewCount} review{service.reviewCount === 1 ? "" : "s"})
                        </span>
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1.5 text-emerald-600">
                      <Shield className="h-4 w-4" />
                      Available
                    </span>
                  </div>

                  {/* Description */}
                  <div className="prose prose-slate max-w-none mb-6">
                    <h2 className="text-[18px] font-semibold text-slate-900 mb-3">
                      Service Overview
                    </h2>
                    <p className="text-[15px] leading-7 text-slate-700 whitespace-pre-line">
                      {service.description}
                    </p>
                  </div>

                  {/* Features */}
                  {features.length > 0 && (
                    <div className="mb-6">
                      <h2 className="text-[18px] font-semibold text-slate-900 mb-4">
                        What's Included
                      </h2>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                        {features.map((feat, i) => (
                          <div
                            key={i}
                            className="flex items-start gap-3 text-[14px] text-slate-700"
                          >
                            <span className="shrink-0 mt-0.5 w-5 h-5 rounded-full bg-epf-50 flex items-center justify-center">
                              <Check className="w-3.5 h-3.5 text-epf-600" />
                            </span>
                            <span className="leading-snug">{feat}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Pricing CTA */}
                  <div className="bg-epf-50 rounded-xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <p className="text-[13px] text-slate-500 uppercase tracking-wide font-medium">
                        Pricing
                      </p>
                      <p className="text-[22px] font-bold text-slate-900 mt-0.5">
                        Price on request
                      </p>
                      <p className="text-[13px] text-slate-500 mt-1">
                        Contact us for a custom quote based on your needs.
                      </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                      <button
                        onClick={openBooking}
                        className="h-11 px-6 bg-epf-500 hover:bg-epf-600 text-white font-semibold text-[14px] rounded-lg transition-all flex items-center justify-center gap-2 shadow-sm"
                      >
                        <Calendar className="w-4 h-4" />
                        Request Quote
                      </button>
                      <a
                        href="https://wa.me/8801700000000"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="h-11 px-6 bg-white border border-epf-500 text-epf-600 hover:bg-epf-50 font-semibold text-[14px] rounded-lg transition-all flex items-center justify-center gap-2"
                      >
                        <Phone className="w-4 h-4" />
                        Contact Us
                      </a>
                    </div>
                  </div>
                </div>
              </article>
            </div>

            {/* Sidebar */}
            <aside className="w-full lg:w-[30%] shrink-0">
              <div className="lg:sticky lg:top-[88px] space-y-6">
                {/* Other Services */}
                <section className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                  <div className="px-5 py-4 border-b border-slate-100">
                    <h3 className="text-[16px] font-semibold text-slate-900">
                      Other Services
                    </h3>
                  </div>
                  <div className="p-2 space-y-1">
                    {otherServices.length === 0 ? (
                      <p className="p-3 text-[13px] text-slate-400">No other services.</p>
                    ) : (
                      otherServices.map((svc) => {
                        return (
                          <button
                            key={svc.id}
                            onClick={() => router.push(`/services/${svc.slug || svc.id}`)}
                            className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors text-left group"
                          >
                            <div className="relative shrink-0 w-14 h-14 rounded-lg overflow-hidden bg-slate-100 border border-slate-200">
                              {svc.images?.[0] ? (
                                <Image
                                  src={svc.images[0]}
                                  alt={svc.name}
                                  fill
                                  className="object-cover group-hover:scale-105 transition-transform"
                                  unoptimized
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <CatIcon name={svc.category?.name} className="w-5 h-5 text-slate-300" />
                                </div>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <h4 className="text-[13px] font-medium text-slate-800 leading-snug line-clamp-1 group-hover:text-epf-600 transition-colors">
                                {svc.name}
                              </h4>
                              <div className="mt-0.5 flex items-center gap-1 text-[11px] text-slate-400">
                                <Star className="h-3 w-3 text-amber-400" />
                                {Number(svc.rating || 0).toFixed(1)} ·{" "}
                                {svc.category?.name || "Service"}
                              </div>
                            </div>
                            <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-epf-500 transition-colors shrink-0" />
                          </button>
                        );
                      })
                    )}
                  </div>
                  <div className="px-3 pb-3">
                    <a
                      href="/services"
                      className="block text-center w-full py-2 text-[13px] font-medium text-epf-600 hover:bg-epf-50 rounded-lg transition-colors"
                    >
                      View All Services
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
                        <p className="text-[13px] font-medium text-slate-800">Call Us</p>
                        <p className="text-[12px] text-slate-400">+880 1700-000000</p>
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
                        <p className="text-[13px] font-medium text-slate-800">WhatsApp</p>
                        <p className="text-[12px] text-slate-400">Chat with us</p>
                      </div>
                    </a>
                    <a
                      href="/contact"
                      className="block text-center w-full py-2.5 px-4 border border-dashed border-epf-500 text-epf-500 text-[13px] font-medium rounded-lg hover:bg-epf-500 hover:text-white transition-all duration-200"
                    >
                      Request a Callback
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

      <ServiceBookingDialog />
      <ChatWidget />
      <BackToTopButton />
    </div>
  );
}
