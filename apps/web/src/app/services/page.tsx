"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, Search, Wrench, User, CalendarDays } from "lucide-react";
import Header from "@/components/epf/Header";
import Footer from "@/components/epf/Footer";
import ServiceBookingDialog from "@/components/epf/ServiceBookingDialog";
import CartDrawer from "@/components/epf/CartDrawer";
import CheckoutDialog from "@/components/epf/CheckoutDialog";
import ChatWidget from "@/components/epf/ChatWidget";
import BackToTopButton from "@/components/epf/BackToTopButton";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";

interface Service {
  id: string;
  name: string;
  slug: string;
  description: string;
  shortDesc?: string | null;
  basePrice: number;
  priceUnit: string;
  images?: string[];
  isFeatured?: boolean;
  rating?: number;
  reviewCount?: number;
  category?: { name: string; slug: string } | null;
}

interface ServiceResponse {
  data?: { services: Service[] };
  services?: Service[];
}

const pageSize = 9;

function formatPrice(price: number) {
  return "৳" + new Intl.NumberFormat("en-BD").format(Math.round(price));
}

function formatDate(dateStr?: string) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function Pagination({ page, totalPages, onChange }: { page: number; totalPages: number; onChange: (p: number) => void }) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-end gap-1 mt-8">
      <button
        onClick={() => onChange(Math.max(1, page - 1))}
        disabled={page === 1}
        className="w-9 h-9 border border-gray-200 rounded flex items-center justify-center text-gray-500 hover:border-[#1a3c6e] hover:text-[#1a3c6e] disabled:opacity-30 transition-colors bg-white"
      >
        <ChevronLeft size={14} />
      </button>
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
        <button
          key={n}
          onClick={() => onChange(n)}
          className={cn(
            "w-9 h-9 border rounded text-sm font-medium transition-colors",
            page === n
              ? "bg-[#1a3c6e] text-white border-[#1a3c6e]"
              : "border-gray-200 text-gray-600 hover:border-[#1a3c6e] hover:text-[#1a3c6e] bg-white"
          )}
        >
          {n}
        </button>
      ))}
      <button
        onClick={() => onChange(Math.min(totalPages, page + 1))}
        disabled={page === totalPages}
        className="w-9 h-9 border border-gray-200 rounded flex items-center justify-center text-gray-500 hover:border-[#1a3c6e] hover:text-[#1a3c6e] disabled:opacity-30 transition-colors bg-white"
      >
        <ChevronRight size={14} />
      </button>
    </div>
  );
}

function ServiceCard({ service }: { service: Service }) {
  const image = service.images?.[0];
  return (
    <div className="bg-white rounded-lg overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col w-full h-[313px]">
      {/* Image */}
      <Link href={`/services/${service.slug}`} className="block h-[180px] overflow-hidden bg-gray-100 shrink-0">
        {image ? (
          <img
            src={image}
            alt={service.name}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
            <Wrench size={36} className="text-gray-300" />
          </div>
        )}
      </Link>

      {/* Body */}
      <div className="p-4 flex flex-col flex-1">
        {/* Meta row */}
        <div className="flex items-center gap-4 text-[12px] text-gray-500 mb-2">
          <span className="flex items-center gap-1">
            <User size={12} className="text-gray-400" />
            ePowerFix
          </span>
          <span className="flex items-center gap-1">
            <CalendarDays size={12} className="text-gray-400" />
            {formatDate((service as any).createdAt) || "Available"}
          </span>
        </div>

        {/* Title */}
        <Link href={`/services/${service.slug}`}>
          <h3 className="font-bold text-[15px] text-gray-900 leading-snug mb-2 hover:text-[#1a3c6e] transition-colors line-clamp-2">
            {service.name}
          </h3>
        </Link>

        {/* Price + Link */}
        <div className="mt-auto flex items-center justify-between pt-3">
          <span className="text-[13px] font-semibold text-gray-900">{formatPrice(service.basePrice)}</span>
          <Link href={`/services/${service.slug}`} className="text-[13px] text-gray-500 hover:text-[#1a3c6e] transition-colors">
            View Service
          </Link>
        </div>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-lg overflow-hidden border border-gray-100 animate-pulse w-full h-[313px]">
      <div className="h-[180px] bg-gray-100" />
      <div className="p-4 space-y-3">
        <div className="h-3 bg-gray-100 rounded w-1/2" />
        <div className="h-4 bg-gray-100 rounded w-3/4" />
        <div className="h-3 bg-gray-100 rounded w-1/3" />
      </div>
    </div>
  );
}

function ServicesContent() {
  const params = useSearchParams();
  const [searchInput, setSearchInput] = useState(params.get("search") || "");
  const [search, setSearch] = useState(params.get("search") || "");
  const [selectedCat, setSelectedCat] = useState(params.get("category") || "");
  const [page, setPage] = useState(1);

  const catalogQuery = useQuery<ServiceResponse>({
    queryKey: ["services-catalog"],
    queryFn: () => apiFetch<ServiceResponse>("/api/services"),
    staleTime: 5 * 60 * 1000,
  });
  const servicesQuery = useQuery<ServiceResponse>({
    queryKey: ["services-list", { search, selectedCat }],
    queryFn: () => {
      const q = new URLSearchParams();
      if (search) q.set("search", search);
      if (selectedCat) q.set("category", selectedCat);
      return apiFetch<ServiceResponse>(`/api/services?${q.toString()}`);
    },
  });

  const allServices = catalogQuery.data?.data?.services ?? catalogQuery.data?.services ?? [];
  const services = servicesQuery.data?.data?.services ?? servicesQuery.data?.services ?? [];
  const categories = useMemo(() => {
    const seen = new Map<string, { name: string; slug: string; count: number }>();
    allServices.forEach((s) => {
      if (s.category) {
        const existing = seen.get(s.category.slug);
        if (existing) existing.count++;
        else seen.set(s.category.slug, { ...s.category, count: 1 });
      }
    });
    return Array.from(seen.values());
  }, [allServices]);

  const recentServices = allServices.slice(0, 5);
  const totalPages = Math.max(1, Math.ceil(services.length / pageSize));
  const visible = services.slice((page - 1) * pageSize, page * pageSize);
  const apply = (fn: () => void) => { fn(); setPage(1); };

  return (
    <>
      <Header />

      <main className="bg-gray-50 min-h-screen">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-12 py-10">
          <div className="flex gap-8 items-start">

            {/* ── Services grid (left) ── */}
            <div className="flex-1 min-w-0">
              {servicesQuery.isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Array.from({ length: 9 }).map((_, i) => <SkeletonCard key={i} />)}
                </div>
              ) : visible.length === 0 ? (
                <div className="text-center py-24 bg-white rounded-lg border border-gray-100">
                  <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                    <Wrench size={28} className="text-gray-400" />
                  </div>
                  <p className="font-semibold text-gray-900 mb-1">No services found</p>
                  <p className="text-sm text-gray-500">Try a different search or category.</p>
                  <button
                    onClick={() => { apply(() => { setSearch(""); setSearchInput(""); setSelectedCat(""); }); }}
                    className="mt-5 text-sm font-semibold text-[#1a3c6e] hover:underline"
                  >
                    Clear filters
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {visible.map((service) => <ServiceCard key={service.id} service={service} />)}
                </div>
              )}

              <Pagination page={page} totalPages={totalPages} onChange={setPage} />
            </div>

            {/* ── Sidebar (right) ── */}
            <aside className="hidden lg:flex flex-col gap-6 w-[280px] shrink-0">

              {/* Search */}
              <form
                onSubmit={(e) => { e.preventDefault(); apply(() => setSearch(searchInput.trim())); }}
                className="flex"
              >
                <input
                  type="text"
                  placeholder="Search services"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="flex-1 px-4 py-2.5 text-sm border border-gray-200 rounded-l bg-gray-50 outline-none focus:border-[#1a3c6e] transition-colors"
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-[#1a3c6e] text-white rounded-r hover:bg-[#15325c] transition-colors"
                >
                  <Search size={15} />
                </button>
              </form>

              {/* Categories */}
              <div className="bg-white border border-gray-100 rounded-lg p-5">
                <h3 className="font-bold text-[15px] text-gray-900 pb-3 border-b-2 border-gray-900 mb-3">Categories</h3>
                <div className="space-y-0">
                  <button
                    onClick={() => apply(() => setSelectedCat(""))}
                    className={cn(
                      "w-full flex items-center justify-between py-2.5 text-[14px] border-b border-gray-100 transition-colors",
                      !selectedCat ? "text-[#1a3c6e] font-semibold" : "text-gray-700 hover:text-[#1a3c6e]"
                    )}
                  >
                    <span>All Services</span>
                    <span className="w-6 h-6 rounded-full bg-gray-100 text-[11px] font-bold flex items-center justify-center text-gray-600">{allServices.length}</span>
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat.slug}
                      onClick={() => apply(() => setSelectedCat(selectedCat === cat.slug ? "" : cat.slug))}
                      className={cn(
                        "w-full flex items-center justify-between py-2.5 text-[14px] border-b border-gray-100 last:border-0 transition-colors",
                        selectedCat === cat.slug ? "text-[#1a3c6e] font-semibold" : "text-gray-700 hover:text-[#1a3c6e]"
                      )}
                    >
                      <span>{cat.name}</span>
                      <span className="w-6 h-6 rounded-full bg-gray-100 text-[11px] font-bold flex items-center justify-center text-gray-600">{cat.count}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Recent Services */}
              {recentServices.length > 0 && (
                <div className="bg-white border border-gray-100 rounded-lg p-5">
                  <h3 className="font-bold text-[15px] text-gray-900 pb-3 border-b-2 border-gray-900 mb-4">Recent Services</h3>
                  <div className="space-y-4">
                    {recentServices.map((service) => (
                      <Link key={service.id} href={`/services/${service.slug}`} className="flex gap-3 group">
                        <div className="w-16 h-14 rounded overflow-hidden shrink-0 bg-gray-100">
                          {service.images?.[0] ? (
                            <img src={service.images[0]} alt={service.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Wrench size={16} className="text-gray-300" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-[13px] font-bold text-gray-900 line-clamp-2 group-hover:text-[#1a3c6e] transition-colors leading-snug">
                            {service.name}
                          </h4>
                          <p className="text-[11px] text-gray-500 mt-1 flex items-center gap-1">
                            <CalendarDays size={10} />
                            {formatDate((service as any).createdAt) || "Available"}
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
      <ServiceBookingDialog />
      <CartDrawer />
      <CheckoutDialog />
      <ChatWidget />
      <BackToTopButton />
    </>
  );
}

function LoadingPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[hsl(var(--background))]">
      <Wrench className="h-6 w-6 animate-pulse text-[#1a3c6e]" />
    </div>
  );
}

export default function ServicesPage() {
  return <Suspense fallback={<LoadingPage />}><ServicesContent /></Suspense>;
}
