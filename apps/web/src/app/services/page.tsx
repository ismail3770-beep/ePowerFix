"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ChevronRight,
  Home,
  Zap,
  Factory,
  Sun,
  ClipboardCheck,
  BatteryCharging,
  Clock,
  Check,
  ArrowRight,
  Wrench,
  Shield,
  CircuitBoard,
  Lightbulb,
  Plug,
  HomeIcon,
} from "lucide-react";
import { useUIStore } from "@/store";
import { apiFetch } from "@/lib/api";
import Header from "@/components/epf/Header";
import Footer from "@/components/epf/Footer";
import CartDrawer from "@/components/epf/CartDrawer";
import CheckoutDialog from "@/components/epf/CheckoutDialog";
import ProductDetailDialog from "@/components/epf/ProductDetailDialog";
import ServiceBookingDialog from "@/components/epf/ServiceBookingDialog";
import ProjectDetailDialog from "@/components/epf/ProjectDetailDialog";
import ChatWidget from "@/components/epf/ChatWidget";
import BackToTopButton from "@/components/epf/BackToTopButton";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
interface ServiceCategory {
  id: string;
  name: string;
  nameBn?: string;
  icon: string;
  sortOrder: number;
}

interface Service {
  id: string;
  name: string;
  nameBn: string;
  description: string;
  descriptionBn: string;
  slug: string;
  basePrice: number;
  priceUnit: string;
  priceLabel: string;
  duration: string;
  image: string;
  features: string;
  popular: boolean;
  active: boolean;
  category: {
    id: string;
    name: string;
    icon: string;
  } | null;
}

/* ------------------------------------------------------------------ */
/*  Icon mapping                                                       */
/* ------------------------------------------------------------------ */
const iconMap: Record<string, React.ElementType> = {
  zap: Zap,
  factory: Factory,
  sun: Sun,
  "clipboard-check": ClipboardCheck,
  "battery-charging": BatteryCharging,
  wrench: Wrench,
  shield: Shield,
  "circuit-board": CircuitBoard,
  lightbulb: Lightbulb,
  plug: Plug,
  home: HomeIcon,
  Home: HomeIcon,
  Sun: Sun,
  Factory: Factory,
  Shield: Shield,
};

/* ------------------------------------------------------------------ */
/*  Skeleton components                                                */
/* ------------------------------------------------------------------ */
function CategoryTabSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-10 w-32 rounded-[6px] bg-[#E2E8F0]" />
    </div>
  );
}

function ServiceBannerSkeleton() {
  return (
    <div className="bg-white border border-[#E2E8F0] rounded-[8px] overflow-hidden animate-pulse">
      <div className="p-6">
        <div className="flex items-start gap-4 mb-4">
          <div className="h-14 w-14 shrink-0 rounded-full bg-[#E2E8F0]" />
          <div className="flex-1 min-w-0">
            <div className="h-5 bg-[#E2E8F0] rounded w-2/3 mb-2" />
            <div className="h-4 bg-[#E2E8F0] rounded w-1/3" />
          </div>
        </div>
        <div className="space-y-2 mb-4">
          <div className="h-4 bg-[#E2E8F0] rounded w-full" />
          <div className="h-4 bg-[#E2E8F0] rounded w-full" />
          <div className="h-4 bg-[#E2E8F0] rounded w-4/5" />
        </div>
        <div className="space-y-2 mb-5">
          <div className="h-4 bg-[#E2E8F0] rounded w-3/4" />
          <div className="h-4 bg-[#E2E8F0] rounded w-2/3" />
          <div className="h-4 bg-[#E2E8F0] rounded w-1/2" />
        </div>
        <div className="flex items-center justify-between pt-5 border-t border-[#E2E8F0]">
          <div>
            <div className="h-5 bg-[#E2E8F0] rounded w-28 mb-1" />
            <div className="h-4 bg-[#E2E8F0] rounded w-20" />
          </div>
          <div className="h-11 w-28 rounded-[6px] bg-[#E2E8F0]" />
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Page                                                          */
/* ------------------------------------------------------------------ */
export default function ServicesPage() {
  const { setServiceBookingOpen, setBookingServiceId } = useUIStore();
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const { data, isLoading, isError } = useQuery<{
    success: boolean;
    data: { categories: ServiceCategory[]; services: Service[] };
    message?: string;
  }>({
    queryKey: ["services-page"],
    queryFn: () => apiFetch("/api/services"),
  });

  const categories = data?.data?.categories ?? [];
  const allServices = data?.data?.services ?? [];

  const filteredServices = useMemo(() => {
    if (activeCategory === "all") return allServices;
    return allServices.filter((s) => s.category?.id === activeCategory);
  }, [allServices, activeCategory]);

  const handleBookNow = (service: Service) => {
    setBookingServiceId(service.id);
    setServiceBookingOpen(true);
  };

  const handleGetQuote = () => {
    if (allServices.length > 0) {
      setBookingServiceId(allServices[0].id);
      setServiceBookingOpen(true);
    }
  };

  const parseFeatures = (features: unknown): string[] => {
    if (Array.isArray(features)) return features;
    if (typeof features === 'string') {
      try {
        const parsed = JSON.parse(features);
        if (Array.isArray(parsed)) return parsed;
        return [];
      } catch {
        return features
          .split(",")
          .map((f) => f.trim())
          .filter(Boolean);
      }
    }
    return [];
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      <Header />
      <CartDrawer />
      <CheckoutDialog />
      <ProductDetailDialog />
      <ServiceBookingDialog />
      <ProjectDetailDialog />

      {/* Main content */}
      <main className="flex-1">
        <div className="mx-auto max-w-[1920px] px-4 sm:px-12 py-6">

          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 mb-4">
            <a
              href="/"
              className="flex items-center gap-1 text-[14px] text-[#6B7280] hover:text-[#111827] transition-colors"
            >
              <Home className="h-4 w-4" />
              Home
            </a>
            <ChevronRight className="h-3.5 w-3.5 text-[#94A3B8]" />
            <span className="text-[14px] font-medium text-[#111827]">
              Services
            </span>
          </nav>

          {/* Page header */}
          <div className="mb-6">
            <h1 className="text-[24px] font-bold text-[#111827]">
              Our Services
            </h1>
            <p className="text-[15px] text-[#6B7280] mt-1">
              Professional electrical services by licensed technicians.
            </p>
          </div>

          {/* Category filter tabs */}
          {isLoading ? (
            <div className="flex gap-2 mb-7 overflow-x-auto pb-1 scrollbar-none">
              <CategoryTabSkeleton />
              <CategoryTabSkeleton />
              <CategoryTabSkeleton />
              <CategoryTabSkeleton />
            </div>
          ) : categories.length > 0 ? (
            <div className="flex gap-2 mb-7 overflow-x-auto pb-1 scrollbar-none">
              <button
                onClick={() => setActiveCategory("all")}
                className={`shrink-0 h-10 px-5 text-[15px] font-semibold rounded-[6px] transition-colors ${
                  activeCategory === "all"
                    ? "bg-[#111827] text-[#F8FAFC]"
                    : "bg-white text-[#374151] border border-[#CBD5E1] hover:border-[#111827]"
                }`}
              >
                All Services
              </button>
              {categories.map((cat) => {
                const CatIcon = iconMap[cat.icon] || Zap;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`shrink-0 h-10 px-5 text-[15px] font-semibold rounded-[6px] flex items-center gap-2 transition-colors ${
                      activeCategory === cat.id
                        ? "bg-[#111827] text-[#F8FAFC]"
                        : "bg-white text-[#374151] border border-[#CBD5E1] hover:border-[#111827]"
                    }`}
                  >
                    <CatIcon className="h-4 w-4" />
                    {cat.name}
                  </button>
                );
              })}
            </div>
          ) : null}

          {/* Results count */}
          {!isLoading && !isError && (
            <p className="text-[14px] text-[#6B7280] mb-5">
              Showing {filteredServices.length}{" "}
              {filteredServices.length === 1 ? "service" : "services"}
              {activeCategory !== "all" && (
                <span>
                  {" "}
                  in{" "}
                  <span className="text-[#111827] font-medium">
                    {categories.find((c) => c.id === activeCategory)?.name ||
                      ""}
                  </span>
                </span>
              )}
            </p>
          )}

          {/* Service Banner Cards */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <ServiceBannerSkeleton key={i} />
              ))}
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-20 h-20 rounded-full bg-[#E2E8F0] flex items-center justify-center mb-5">
                <Zap className="h-9 w-9 text-[#94A3B8]" />
              </div>
              <h3 className="text-[18px] font-semibold text-[#111827] mb-2">
                Failed to load services
              </h3>
              <p className="text-[15px] text-[#6B7280]">
                Something went wrong. Please try again.
              </p>
            </div>
          ) : filteredServices.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-20 h-20 rounded-full bg-[#E2E8F0] flex items-center justify-center mb-5">
                <Wrench className="h-9 w-9 text-[#94A3B8]" />
              </div>
              <h3 className="text-[18px] font-semibold text-[#111827] mb-2">
                No services found
              </h3>
              <p className="text-[15px] text-[#6B7280] mb-5">
                No services available in this category.
              </p>
              {activeCategory !== "all" && (
                <button
                  onClick={() => setActiveCategory("all")}
                  className="h-10 px-6 text-[15px] font-semibold bg-[#111827] text-[#F8FAFC] rounded-[6px] hover:bg-[#1E293B] transition-colors"
                >
                  View All Services
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredServices.map((svc) => {
                const Icon = iconMap[svc.category?.icon || ""] || Zap;
                const features = parseFeatures(svc.features);

                return (
                  <div
                    key={svc.id}
                    className="bg-white border border-[#E2E8F0] rounded-[8px] overflow-hidden hover:shadow-lg hover:border-[#94A3B8] transition-all duration-200 flex flex-col group"
                  >
                    {/* Top accent bar */}
                    <div className="h-1 bg-gradient-to-r from-[#0EA5E9] to-[#0284C7]" />

                    <div className="p-6 flex flex-col flex-1">
                      {/* Header: icon + name + badge */}
                      <div className="flex items-start gap-4 mb-4">
                        <div className="h-14 w-14 shrink-0 bg-[#F1F5F9] group-hover:bg-[#E0F2FE] rounded-full flex items-center justify-center transition-colors">
                          <Icon className="h-6 w-6 text-[#6B7280] group-hover:text-[#0EA5E9] transition-colors" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-[17px] font-bold text-[#111827] leading-snug">
                              {svc.name}
                            </h3>
                            {svc.popular && (
                              <span className="shrink-0 bg-[#0EA5E9] text-white text-[12px] font-bold px-2 py-0.5 rounded-[4px] leading-none">
                                POPULAR
                              </span>
                            )}
                          </div>
                          {svc.category && (
                            <p className="text-[14px] text-[#6B7280] mt-1">
                              {svc.category.name}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Description */}
                      <p className="text-[15px] text-[#374151] leading-relaxed mb-4">
                        {svc.description}
                      </p>

                      {/* Features list */}
                      {features.length > 0 && (
                        <ul className="space-y-2 mb-5">
                          {features.map((feat, idx) => (
                            <li
                              key={idx}
                              className="flex items-start gap-2.5 text-[14px] text-[#374151]"
                            >
                              <div className="h-5 w-5 shrink-0 rounded-full bg-[#E8F5E9] flex items-center justify-center mt-0.5">
                                <Check className="h-3 w-3 text-[#2E7D32]" />
                              </div>
                              <span className="leading-snug">{feat}</span>
                            </li>
                          ))}
                        </ul>
                      )}

                      {/* Spacer */}
                      <div className="flex-1" />

                      {/* Footer: price/duration + Book Now */}
                      <div className="flex items-end justify-between pt-5 mt-5 border-t border-[#E2E8F0]">
                        <div>
                          <p className="text-[20px] font-bold text-[#111827]">
                            ৳{(svc.basePrice ?? 0).toLocaleString()}
                          </p>
                          {svc.priceLabel && svc.priceLabel !== "Fixed" && (
                            <p className="text-[13px] text-[#6B7280] mt-0.5">
                              {svc.priceLabel}
                            </p>
                          )}
                          {svc.duration && (
                            <div className="flex items-center gap-1.5 mt-1.5 text-[14px] text-[#6B7280]">
                              <Clock className="h-4 w-4" />
                              {svc.duration}
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => handleBookNow(svc)}
                          className="shrink-0 h-11 px-6 text-[15px] font-bold bg-[#0EA5E9] text-white rounded-[6px] hover:bg-[#0284C7] active:scale-[0.97] transition-all"
                        >
                          Book Now
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* CTA Banner */}
          {!isLoading && !isError && allServices.length > 0 && (
            <div className="mt-10 bg-[#111827] p-6 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-[8px]">
              <div>
                <p className="text-white font-bold text-[18px]">
                  Need a custom electrical solution?
                </p>
                <p className="text-white/50 text-[15px] mt-1">
                  Get a free consultation and quotation today.
                </p>
              </div>
              <button
                onClick={handleGetQuote}
                className="bg-[#0EA5E9] hover:bg-[#0284C7] text-white font-bold text-[15px] h-[44px] px-7 shrink-0 flex items-center gap-2 transition-colors rounded-[6px]"
              >
                Get Free Quote <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </main>

      <ChatWidget />
      <BackToTopButton />
      <Footer />
    </div>
  );
}