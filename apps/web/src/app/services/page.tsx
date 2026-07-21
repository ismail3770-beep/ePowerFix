"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, ChevronRight as ChevRight, Clock, Search, Wrench, Zap } from "lucide-react";
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

const pageSize = 6;

function formatPrice(price: number) {
  return "৳" + new Intl.NumberFormat("en-BD").format(Math.round(price));
}

function Pagination({ page, totalPages, onChange }: { page: number; totalPages: number; onChange: (p: number) => void }) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-1.5 mt-8">
      <button
        onClick={() => onChange(Math.max(1, page - 1))}
        disabled={page === 1}
        className="w-8 h-8 border border-gray-300 rounded flex items-center justify-center text-gray-400 hover:border-[#0EA5E9] hover:text-[#0EA5E9] disabled:opacity-30 transition-colors bg-white"
      >
        <ChevronLeft size={14} />
      </button>
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
        <button
          key={n}
          onClick={() => onChange(n)}
          className={cn(
            "w-8 h-8 border rounded text-sm font-medium transition-colors",
            page === n ? "bg-[#0EA5E9] text-white border-[#0EA5E9]" : "border-gray-300 text-gray-600 hover:border-[#0EA5E9] hover:text-[#0EA5E9] bg-white"
          )}
        >
          {n}
        </button>
      ))}
      <button
        onClick={() => onChange(Math.min(totalPages, page + 1))}
        disabled={page === totalPages}
        className="w-8 h-8 border border-gray-300 rounded flex items-center justify-center text-gray-400 hover:border-[#0EA5E9] hover:text-[#0EA5E9] disabled:opacity-30 transition-colors bg-white"
      >
        <ChevronRight size={14} />
      </button>
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
    const seen = new Set<string>();
    return allServices.reduce<Array<{ name: string; slug: string }>>((acc, s) => {
      if (s.category && !seen.has(s.category.slug)) { seen.add(s.category.slug); acc.push(s.category); }
      return acc;
    }, []);
  }, [allServices]);

  const featured = allServices.filter((s) => s.isFeatured).slice(0, 4);
  const totalPages = Math.max(1, Math.ceil(services.length / pageSize));
  const visible = services.slice((page - 1) * pageSize, page * pageSize);
  const apply = (fn: () => void) => { fn(); setPage(1); };

  return (
    <>
      <Header />
      <main className="bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 py-8">

          {/* Top bar */}
          <div className="flex items-center justify-between mb-8 gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
                <Link href="/" className="hover:text-[#0EA5E9]">Home</Link>
                <ChevRight size={11} />
                <span className="text-gray-700 font-medium">Services</span>
              </div>
              <h1 className="font-black text-3xl tracking-tight text-gray-900">Services</h1>
            </div>
            <form
              onSubmit={(e) => { e.preventDefault(); apply(() => setSearch(searchInput.trim())); }}
              className="flex items-center border border-gray-300 rounded overflow-hidden bg-white shadow-sm"
            >
              <input
                type="text"
                placeholder="Search services..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="px-3 py-2 text-sm outline-none text-gray-700 w-56 bg-white"
              />
              <button type="submit" className="bg-[#0EA5E9] px-3 py-2.5 text-white hover:bg-sky-600 transition-colors">
                <Search size={15} />
              </button>
            </form>
          </div>

          <div className="flex gap-8">
            {/* Main grid */}
            <div className="flex-1 min-w-0">
              {servicesQuery.isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="bg-white rounded-lg overflow-hidden animate-pulse border border-gray-100">
                      <div className="aspect-[16/10] bg-gray-100" />
                      <div className="p-4 space-y-2">
                        <div className="h-4 bg-gray-100 rounded w-3/4" />
                        <div className="h-3 bg-gray-100 rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : visible.length === 0 ? (
                <div className="text-center py-20">
                  <Zap size={48} className="mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500 text-sm">No services found. Try a different search or category.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
                  {visible.map((service) => {
                    const image = service.images?.[0];
                    return (
                      <Link
                        key={service.id}
                        href={`/services/${service.slug}`}
                        className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer group border border-gray-100"
                      >
                        <div className="aspect-[16/10] overflow-hidden bg-gray-100 relative">
                          {image ? (
                            <img src={image} alt={service.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#0d1a2d] to-[#0EA5E9]/30">
                              <Wrench size={36} className="text-white/40" />
                            </div>
                          )}
                          {service.category?.name && (
                            <div className="absolute top-2.5 left-2.5">
                              <span className="bg-[#0EA5E9] text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                                {service.category.name}
                              </span>
                            </div>
                          )}
                          <div className="absolute bottom-2.5 right-2.5 bg-white/95 rounded-md px-2.5 py-1 text-xs font-bold text-[#0d1a2d] shadow-sm">
                            From {formatPrice(service.basePrice)}
                          </div>
                        </div>
                        <div className="p-4">
                          <div className="flex items-center gap-2 mb-1.5 text-xs text-gray-400">
                            <Wrench size={10} />
                            <span className="font-medium text-gray-600">{service.name}</span>
                          </div>
                          <h3 className="font-semibold text-sm text-gray-800 line-clamp-2 mb-3 group-hover:text-[#0EA5E9] transition-colors leading-snug">
                            {service.shortDesc || service.description}
                          </h3>
                          <span className="text-xs font-semibold text-gray-500 hover:text-[#0EA5E9] transition-colors flex items-center gap-0.5">
                            Book Now <ChevRight size={12} />
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}

              <Pagination page={page} totalPages={totalPages} onChange={setPage} />
            </div>

            {/* Sidebar */}
            <aside className="hidden lg:block w-60 shrink-0 space-y-5">
              {/* Categories */}
              <div className="bg-white border border-gray-100 rounded-lg p-5 shadow-sm">
                <h3 className="font-bold text-sm text-gray-800 mb-4 pb-2 border-b border-gray-100">Categories</h3>
                <div className="space-y-0">
                  <button
                    onClick={() => apply(() => setSelectedCat(""))}
                    className={cn(
                      "w-full flex items-center justify-between py-2.5 text-sm border-b border-gray-50 group transition-colors",
                      !selectedCat ? "text-[#0EA5E9]" : "text-gray-600 hover:text-[#0EA5E9]"
                    )}
                  >
                    <span>All Services</span>
                    <ChevRight size={14} className={cn("transition-colors shrink-0", !selectedCat ? "text-[#0EA5E9]" : "text-gray-300 group-hover:text-[#0EA5E9]")} />
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat.slug}
                      onClick={() => apply(() => setSelectedCat(selectedCat === cat.slug ? "" : cat.slug))}
                      className={cn(
                        "w-full flex items-center justify-between py-2.5 text-sm border-b border-gray-50 group transition-colors",
                        selectedCat === cat.slug ? "text-[#0EA5E9]" : "text-gray-600 hover:text-[#0EA5E9]"
                      )}
                    >
                      <span>{cat.name}</span>
                      <ChevRight size={14} className={cn("transition-colors shrink-0", selectedCat === cat.slug ? "text-[#0EA5E9]" : "text-gray-300 group-hover:text-[#0EA5E9]")} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Featured Services */}
              {featured.length > 0 && (
                <div className="bg-white border border-gray-100 rounded-lg p-5 shadow-sm">
                  <h3 className="font-bold text-sm text-gray-800 mb-4 pb-2 border-b border-gray-100">Featured Services</h3>
                  <div className="space-y-4">
                    {featured.map((service) => (
                      <Link key={service.id} href={`/services/${service.slug}`} className="flex gap-3 cursor-pointer group">
                        <div className="w-14 h-14 rounded-md overflow-hidden shrink-0 bg-gray-100">
                          {service.images?.[0] ? (
                            <img src={service.images[0]} alt={service.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Wrench size={20} className="text-gray-300" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-medium text-gray-700 line-clamp-2 group-hover:text-[#0EA5E9] transition-colors leading-snug">
                            {service.name}
                          </h4>
                          <p className="text-[11px] font-bold text-[#0EA5E9] mt-1">From {formatPrice(service.basePrice)}</p>
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
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <Zap className="h-6 w-6 animate-pulse text-[#0EA5E9]" />
    </div>
  );
}

export default function ServicesPage() {
  return <Suspense fallback={<LoadingPage />}><ServicesContent /></Suspense>;
}
