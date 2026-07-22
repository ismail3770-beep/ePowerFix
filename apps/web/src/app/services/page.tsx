"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, Search, Wrench, Zap, Star, ArrowRight, CheckCircle2 } from "lucide-react";
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

function StarRating({ rating = 4.5, count = 0 }: { rating?: number; count?: number }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={11}
          className={i <= Math.round(rating) ? "fill-amber-400 text-amber-400" : "fill-gray-200 text-gray-200"}
        />
      ))}
      {count > 0 && <span className="text-[10px] text-gray-400 ml-1">({count})</span>}
    </div>
  );
}

function Pagination({ page, totalPages, onChange }: { page: number; totalPages: number; onChange: (p: number) => void }) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-1.5 mt-10">
      <button
        onClick={() => onChange(Math.max(1, page - 1))}
        disabled={page === 1}
        className="w-9 h-9 border border-[hsl(var(--border))] rounded-[var(--radius)] flex items-center justify-center text-[hsl(var(--muted-foreground))] hover:border-[hsl(var(--primary))] hover:text-[hsl(var(--primary))] disabled:opacity-30 transition-colors bg-[hsl(var(--card))]"
      >
        <ChevronLeft size={14} />
      </button>
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
        <button
          key={n}
          onClick={() => onChange(n)}
          className={cn(
            "w-9 h-9 border rounded-[var(--radius)] text-sm font-medium transition-colors",
            page === n
              ? "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] border-[hsl(var(--primary))]"
              : "border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] hover:border-[hsl(var(--primary))] hover:text-[hsl(var(--primary))] bg-[hsl(var(--card))]"
          )}
        >
          {n}
        </button>
      ))}
      <button
        onClick={() => onChange(Math.min(totalPages, page + 1))}
        disabled={page === totalPages}
        className="w-9 h-9 border border-[hsl(var(--border))] rounded-[var(--radius)] flex items-center justify-center text-[hsl(var(--muted-foreground))] hover:border-[hsl(var(--primary))] hover:text-[hsl(var(--primary))] disabled:opacity-30 transition-colors bg-[hsl(var(--card))]"
      >
        <ChevronRight size={14} />
      </button>
    </div>
  );
}

function ServiceCard({ service }: { service: Service }) {
  const image = service.images?.[0];
  return (
    <Link
      href={`/services/${service.slug}`}
      className="group bg-[hsl(var(--card))] rounded-[var(--radius)] overflow-hidden border border-[hsl(var(--border))] hover:border-[hsl(var(--primary))/40%] hover:shadow-lg transition-all duration-250 flex flex-col"
    >
      {/* Image */}
      <div className="aspect-[4/3] overflow-hidden bg-[hsl(var(--muted))] relative">
        {image ? (
          <img
            src={image}
            alt={service.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2" style={{ background: "linear-gradient(135deg, #0d1a2d 0%, #0EA5E9 100%)" }}>
            <Wrench size={32} className="text-white/40" />
          </div>
        )}
        {service.category?.name && (
          <span className="absolute top-3 left-3 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full" style={{ background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}>
            {service.category.name}
          </span>
        )}
      </div>

      {/* Body */}
      <div className="p-5 flex flex-col flex-1">
        <h3 className="font-semibold text-[hsl(var(--card-foreground))] leading-snug mb-2 group-hover:text-[hsl(var(--primary))] transition-colors line-clamp-2">
          {service.name}
        </h3>
        <p className="text-sm text-[hsl(var(--muted-foreground))] line-clamp-2 mb-3 leading-relaxed flex-1">
          {service.shortDesc || service.description}
        </p>
        {(service.rating || service.reviewCount) && (
          <div className="mb-3">
            <StarRating rating={service.rating} count={service.reviewCount} />
          </div>
        )}
        <div className="flex items-center justify-between pt-3 border-t border-[hsl(var(--border))]">
          <div>
            <p className="text-[10px] text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Starting from</p>
            <p className="font-bold text-[hsl(var(--card-foreground))]">{formatPrice(service.basePrice)}</p>
          </div>
          <span className="flex items-center gap-1 text-sm font-semibold text-[hsl(var(--primary))] group-hover:gap-2 transition-all">
            Book Now <ArrowRight size={14} />
          </span>
        </div>
      </div>
    </Link>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-[hsl(var(--card))] rounded-[var(--radius)] overflow-hidden border border-[hsl(var(--border))] animate-pulse">
      <div className="aspect-[4/3] bg-[hsl(var(--muted))]" />
      <div className="p-5 space-y-3">
        <div className="h-4 bg-[hsl(var(--muted))] rounded w-3/4" />
        <div className="h-3 bg-[hsl(var(--muted))] rounded" />
        <div className="h-3 bg-[hsl(var(--muted))] rounded w-2/3" />
        <div className="h-3 bg-[hsl(var(--muted))] rounded w-1/2" />
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

      <main className="bg-[hsl(var(--background))] min-h-screen">

        {/* ── Hero banner ── */}
        <section style={{ background: "linear-gradient(135deg, #0d1a2d 0%, #0a2540 60%, #0d1a2d 100%)" }} className="text-white">
          <div className="max-w-7xl mx-auto px-4 py-14">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-xs text-white/40 mb-6">
              <Link href="/" className="hover:text-white transition-colors">Home</Link>
              <ChevronRight size={10} />
              <span className="text-white/80 font-medium">Services</span>
            </nav>

            <div className="flex flex-col md:flex-row md:items-end gap-6 justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-[hsl(var(--primary))] mb-3">Professional Electrical Services</p>
                <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-3 leading-tight">
                  Expert Solutions for<br />Every Electrical Need
                </h1>
                <p className="text-sm text-white/50 max-w-md leading-relaxed">
                  Certified electricians, guaranteed workmanship, transparent pricing — book in minutes.
                </p>
              </div>

              {/* Search */}
              <form
                onSubmit={(e) => { e.preventDefault(); apply(() => setSearch(searchInput.trim())); }}
                className="flex items-center bg-white/10 border border-white/20 rounded-[var(--radius)] overflow-hidden backdrop-blur-sm w-full md:w-72"
              >
                <input
                  type="text"
                  placeholder="Search services..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="px-4 py-3 text-sm outline-none bg-transparent text-white placeholder-white/40 flex-1"
                />
                <button
                  type="submit"
                  className="px-4 py-3 text-white/70 hover:text-white transition-colors"
                  style={{ background: "hsl(var(--primary))" }}
                >
                  <Search size={15} />
                </button>
              </form>
            </div>

            {/* Trust strip */}
            <div className="flex flex-wrap gap-6 mt-10 pt-8 border-t border-white/10">
              {[
                { icon: CheckCircle2, label: "Certified Electricians" },
                { icon: Zap, label: "Same-Day Booking" },
                { icon: Star, label: "4.8★ Avg Rating" },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-2 text-sm text-white/60">
                  <Icon size={15} style={{ color: "hsl(var(--primary))" }} />
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Category filter pills ── */}
        <div className="bg-[hsl(var(--card))] border-b border-[hsl(var(--border))] sticky top-0 z-20">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center gap-2 overflow-x-auto py-3 scrollbar-hide">
              <button
                onClick={() => apply(() => setSelectedCat(""))}
                className={cn(
                  "shrink-0 px-4 py-1.5 rounded-full text-sm font-medium border transition-all",
                  !selectedCat
                    ? "border-[hsl(var(--primary))] text-[hsl(var(--primary))] bg-[hsl(var(--primary))/8%]"
                    : "border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] hover:border-[hsl(var(--primary))/50%] hover:text-[hsl(var(--primary))]"
                )}
              >
                All Services
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.slug}
                  onClick={() => apply(() => setSelectedCat(selectedCat === cat.slug ? "" : cat.slug))}
                  className={cn(
                    "shrink-0 px-4 py-1.5 rounded-full text-sm font-medium border transition-all",
                    selectedCat === cat.slug
                      ? "border-[hsl(var(--primary))] text-[hsl(var(--primary))] bg-[hsl(var(--primary))/8%]"
                      : "border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] hover:border-[hsl(var(--primary))/50%] hover:text-[hsl(var(--primary))]"
                  )}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Main content ── */}
        <div className="max-w-7xl mx-auto px-4 py-10">
          <div className="flex gap-8 items-start">

            {/* Services grid */}
            <div className="flex-1 min-w-0">
              {/* Section heading */}
              <div className="flex items-center justify-between mb-7">
                <div>
                  <h2 className="font-bold text-[hsl(var(--foreground))]">
                    {selectedCat
                      ? categories.find((c) => c.slug === selectedCat)?.name ?? "Services"
                      : "Our Services"}
                  </h2>
                  {!servicesQuery.isLoading && (
                    <p className="text-sm text-[hsl(var(--muted-foreground))] mt-0.5">
                      {services.length} service{services.length !== 1 ? "s" : ""} available
                    </p>
                  )}
                </div>
              </div>

              {/* Grid */}
              {servicesQuery.isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
                </div>
              ) : visible.length === 0 ? (
                <div className="text-center py-24 bg-[hsl(var(--card))] rounded-[var(--radius)] border border-[hsl(var(--border))]">
                  <div className="w-16 h-16 rounded-full bg-[hsl(var(--muted))] flex items-center justify-center mx-auto mb-4">
                    <Zap size={28} className="text-[hsl(var(--muted-foreground))]" />
                  </div>
                  <p className="font-semibold text-[hsl(var(--foreground))] mb-1">No services found</p>
                  <p className="text-sm text-[hsl(var(--muted-foreground))]">Try a different search or category.</p>
                  <button
                    onClick={() => { apply(() => { setSearch(""); setSearchInput(""); setSelectedCat(""); }); }}
                    className="mt-5 text-sm font-semibold text-[hsl(var(--primary))] hover:underline"
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

            {/* Sidebar */}
            <aside className="hidden lg:flex flex-col gap-5 w-60 shrink-0">

              {/* Categories */}
              <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-[var(--radius)] overflow-hidden">
                <div className="px-5 py-4 border-b border-[hsl(var(--border))]">
                  <h3 className="font-bold text-sm text-[hsl(var(--foreground))]">Categories</h3>
                </div>
                <div className="px-5 py-2">
                  <button
                    onClick={() => apply(() => setSelectedCat(""))}
                    className={cn(
                      "w-full flex items-center justify-between py-2.5 text-sm border-b border-[hsl(var(--border))] group transition-colors",
                      !selectedCat ? "text-[hsl(var(--primary))] font-medium" : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--primary))]"
                    )}
                  >
                    <span>All Services</span>
                    <ChevronRight size={13} className={cn(!selectedCat ? "text-[hsl(var(--primary))]" : "text-[hsl(var(--border))] group-hover:text-[hsl(var(--primary))]")} />
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat.slug}
                      onClick={() => apply(() => setSelectedCat(selectedCat === cat.slug ? "" : cat.slug))}
                      className={cn(
                        "w-full flex items-center justify-between py-2.5 text-sm border-b border-[hsl(var(--border))] last:border-0 group transition-colors",
                        selectedCat === cat.slug ? "text-[hsl(var(--primary))] font-medium" : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--primary))]"
                      )}
                    >
                      <span>{cat.name}</span>
                      <ChevronRight size={13} className={cn(selectedCat === cat.slug ? "text-[hsl(var(--primary))]" : "text-[hsl(var(--border))] group-hover:text-[hsl(var(--primary))]")} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Featured */}
              {featured.length > 0 && (
                <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-[var(--radius)] overflow-hidden">
                  <div className="px-5 py-4 border-b border-[hsl(var(--border))]">
                    <h3 className="font-bold text-sm text-[hsl(var(--foreground))]">Featured Services</h3>
                  </div>
                  <div className="px-5 py-3 space-y-4">
                    {featured.map((service) => (
                      <Link key={service.id} href={`/services/${service.slug}`} className="flex gap-3 cursor-pointer group">
                        <div className="w-14 h-14 rounded-[var(--radius-sm)] overflow-hidden shrink-0 bg-[hsl(var(--muted))]">
                          {service.images?.[0] ? (
                            <img src={service.images[0]} alt={service.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Wrench size={18} className="text-[hsl(var(--muted-foreground))]" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-medium text-[hsl(var(--card-foreground))] line-clamp-2 group-hover:text-[hsl(var(--primary))] transition-colors leading-snug">
                            {service.name}
                          </h4>
                          <p className="text-xs font-bold mt-1" style={{ color: "hsl(var(--primary))" }}>
                            From {formatPrice(service.basePrice)}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick booking CTA */}
              <div
                className="rounded-[var(--radius)] p-5 text-white"
                style={{ background: "linear-gradient(135deg, #0d1a2d 0%, hsl(var(--primary)) 100%)" }}
              >
                <Zap size={22} className="text-white/70 mb-3" />
                <h4 className="font-bold text-sm mb-1 leading-snug">Need an Urgent Fix?</h4>
                <p className="text-xs text-white/60 mb-4 leading-relaxed">Our team is available 7 days a week for emergency bookings.</p>
                <Link
                  href="/book-service"
                  className="block text-center text-xs font-bold py-2.5 rounded-[var(--radius-sm)] bg-white/15 hover:bg-white/25 transition-colors border border-white/20"
                >
                  Book Now
                </Link>
              </div>

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
      <Zap className="h-6 w-6 animate-pulse" style={{ color: "hsl(var(--primary))" }} />
    </div>
  );
}

export default function ServicesPage() {
  return <Suspense fallback={<LoadingPage />}><ServicesContent /></Suspense>;
}
