"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import {
  ChevronRight,
  ChevronLeft,
  ArrowRight,
  Search,
  FolderOpen,
  Zap,
  Sun,
  Wrench,
  Shield,
  Lightbulb,
  Plug,
  Building2,
  Bot,
  Phone,
  MessageCircle,
  Star,
  Sparkles,
  X,
} from "lucide-react";
import { EPFHome, EPFChevronRight } from "@/components/epf/icons/EPFIcons";
import Header from "@/components/epf/Header";
import Footer from "@/components/epf/Footer";
import CartDrawer from "@/components/epf/CartDrawer";
import CheckoutDialog from "@/components/epf/CheckoutDialog";
import ChatWidget from "@/components/epf/ChatWidget";
import BackToTopButton from "@/components/epf/BackToTopButton";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Types & Constants                                                  */
/* ------------------------------------------------------------------ */
interface ServiceItem {
  id: string;
  name: string;
  nameBn: string;
  description: string;
  slug: string;
  basePrice: number;
  priceUnit: string;
  shortDesc?: string | null;
  images: string[];
  features: string;
  isFeatured: boolean;
  isActive: boolean;
  rating: number;
  reviewCount: number;
  category: { id: string; name: string; nameBn: string; slug: string } | null;
}

const CATEGORY_TABS = [
  { key: "all", label: "All Services", icon: FolderOpen },
  { key: "Wiring", label: "Home Wiring", icon: Zap },
  { key: "Industrial", label: "Industrial", icon: Building2 },
  { key: "Solar", label: "Solar", icon: Sun },
  { key: "Repair", label: "Repair", icon: Wrench },
  { key: "Inspection", label: "Inspection", icon: Shield },
  { key: "Automation", label: "Automation", icon: Bot },
];

const PAGE_SIZE = 9;

/* Module-scope wrapper so we don't create components during render */
function CatIcon({ name, className }: { name?: string; className?: string }) {
  const key = name?.toLowerCase() || "";
  if (key.includes("solar")) {return <Sun className={className} />;}
  if (key.includes("industrial")) {return <Building2 className={className} />;}
  if (key.includes("repair") || key.includes("wrench")) {return <Wrench className={className} />;}
  if (key.includes("inspection") || key.includes("shield")) {return <Shield className={className} />;}
  if (key.includes("automation") || key.includes("bot")) {return <Bot className={className} />;}
  if (key.includes("light")) {return <Lightbulb className={className} />;}
  if (key.includes("plug")) {return <Plug className={className} />;}
  return <Zap className={className} />;
}

/* ------------------------------------------------------------------ */
/*  Service Card (grid)                                                */
/* ------------------------------------------------------------------ */
function ServiceCard({
  service,
  onNavigate,
}: {
  service: ServiceItem;
  onNavigate: (id: string) => void;
}) {
  const [imgError, setImgError] = useState(false);
  const handleClick = () => onNavigate(service.slug || service.id);

  return (
    <article
      onClick={handleClick}
      className="group flex flex-col bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 overflow-hidden cursor-pointer"
    >
      {/* Cover image */}
      <div className="relative h-48 bg-slate-100 overflow-hidden">
        {!imgError && service.images?.[0] ? (
          <Image
            src={service.images[0]}
            alt={service.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
            onError={() => setImgError(true)}
            unoptimized
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center">
              <CatIcon name={service.category?.name} className="h-6 w-6 text-slate-300" />
            </div>
          </div>
        )}
        {service.isFeatured && (
          <span className="absolute top-3 right-3 z-10 inline-flex items-center gap-1 h-6 px-2 rounded-full text-[11px] font-semibold bg-epf-500 text-white shadow-sm">
            <Sparkles className="h-3 w-3" /> Popular
          </span>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-col flex-1 p-4">
        {/* Category badge */}
        <span className="self-start inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium bg-epf-50 text-epf-600 mb-2">
          {service.category?.name || "General"}
        </span>

        <h3
          className="text-[16px] font-semibold text-slate-900 leading-snug line-clamp-1 group-hover:text-epf-600 transition-colors"
          title={service.name}
        >
          {service.name}
        </h3>

        <p className="mt-1.5 text-[13px] text-slate-500 line-clamp-2 leading-relaxed">
          {service.shortDesc || service.description}
        </p>

        {/* Rating */}
        <div className="mt-3 flex items-center gap-3 text-[12px] text-slate-400">
          <span className="inline-flex items-center gap-1">
            <Star className="h-3.5 w-3.5 text-amber-400" />
            {Number(service.rating || 0).toFixed(1)}
            {service.reviewCount > 0 && (
              <span className="text-slate-300">({service.reviewCount})</span>
            )}
          </span>
          <span className="inline-flex items-center gap-1">
            <Shield className="h-3.5 w-3.5 text-emerald-500" />
            Available
          </span>
        </div>

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-slate-100">
          <span className="inline-flex items-center gap-1 text-[13px] font-medium text-epf-500 group-hover:gap-2 transition-all">
            Get Quote
            <ArrowRight className="h-3.5 w-3.5" />
          </span>
        </div>
      </div>
    </article>
  );
}

/* ------------------------------------------------------------------ */
/*  Sidebar Popular Service (mini list)                                */
/* ------------------------------------------------------------------ */
function PopularServiceItem({
  service,
  onNavigate,
}: {
  service: ServiceItem;
  onNavigate: (id: string) => void;
}) {
  const [imgError, setImgError] = useState(false);
  return (
    <button
      onClick={() => onNavigate(service.slug || service.id)}
      className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors text-left group"
    >
      <div className="relative shrink-0 w-14 h-14 rounded-lg overflow-hidden bg-slate-100 border border-slate-200">
        {!imgError && service.images?.[0] ? (
          <Image
            src={service.images[0]}
            alt={service.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform"
            onError={() => setImgError(true)}
            unoptimized
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <CatIcon name={service.category?.name} className="w-5 h-5 text-slate-300" />
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <h4 className="text-[13px] font-medium text-slate-800 leading-snug line-clamp-1 group-hover:text-epf-600 transition-colors">
          {service.name}
        </h4>
        <div className="mt-0.5 flex items-center gap-1 text-[11px] text-slate-400">
          <Star className="h-3 w-3 text-amber-400" />
          {Number(service.rating || 0).toFixed(1)} · {service.category?.name || "Service"}
        </div>
      </div>
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Sidebar                                                            */
/* ------------------------------------------------------------------ */
function Sidebar({
  services,
  activeCategory,
  onCategoryChange,
  onNavigate,
}: {
  services: ServiceItem[];
  activeCategory: string;
  onCategoryChange: (key: string) => void;
  onNavigate: (id: string) => void;
}) {
  const popular = useMemo(
    () =>
      [...services]
        .sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0))
        .slice(0, 5),
    [services]
  );

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: services.length };
    for (const s of services) {
      const k = s.category?.name || "Other";
      counts[k] = (counts[k] ?? 0) + 1;
    }
    return counts;
  }, [services]);

  return (
    <aside className="w-full lg:w-[30%] shrink-0">
      <div className="lg:sticky lg:top-[88px] space-y-6">
        {/* Service Categories */}
        <section className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="text-[16px] font-semibold text-slate-900">Service Categories</h3>
          </div>
          <nav className="p-3">
            {CATEGORY_TABS.map((cat) => {
              const Icon = cat.icon;
              const isActive = activeCategory === cat.key;
              const count =
                cat.key === "all"
                  ? categoryCounts.all
                  : categoryCounts[cat.key] ?? 0;
              return (
                <button
                  key={cat.key}
                  onClick={() => onCategoryChange(cat.key)}
                  className={cn(
                    "w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg text-[14px] font-medium transition-all duration-200",
                    isActive
                      ? "bg-epf-50 text-epf-600"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  )}
                >
                  <span className="inline-flex items-center gap-2.5">
                    <Icon className="h-4 w-4" />
                    {cat.label}
                  </span>
                  <span
                    className={cn(
                      "min-w-5 h-5 px-1.5 rounded-full text-[11px] font-semibold flex items-center justify-center",
                      isActive
                        ? "bg-epf-500 text-white"
                        : "bg-slate-100 text-slate-500"
                    )}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </nav>
        </section>

        {/* Popular Services */}
        <section className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="text-[16px] font-semibold text-slate-900 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-epf-500" />
              Popular Services
            </h3>
          </div>
          <div className="p-2 space-y-1">
            {popular.length === 0 ? (
              <p className="p-3 text-[13px] text-slate-400">No services yet.</p>
            ) : (
              popular.map((svc) => (
                <PopularServiceItem
                  key={svc.id}
                  service={svc}
                  onNavigate={onNavigate}
                />
              ))
            )}
          </div>
        </section>

        {/* Quick Contact */}
        <section className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="text-[16px] font-semibold text-slate-900">Quick Contact</h3>
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
  );
}

/* ------------------------------------------------------------------ */
/*  Pagination                                                         */
/* ------------------------------------------------------------------ */
function Pagination({
  current,
  total,
  onChange,
}: {
  current: number;
  total: number;
  onChange: (page: number) => void;
}) {
  if (total <= 1) {return null;}

  const pages: (number | "...")[] = [];
  if (total <= 7) {
    for (let i = 1; i <= total; i++) {pages.push(i);}
  } else {
    pages.push(1);
    if (current > 3) {pages.push("...");}
    for (
      let i = Math.max(2, current - 1);
      i <= Math.min(total - 1, current + 1);
      i++
    ) {
      pages.push(i);
    }
    if (current < total - 2) {pages.push("...");}
    pages.push(total);
  }

  return (
    <div className="flex items-center justify-center gap-1.5 mt-8">
      <button
        onClick={() => onChange(current - 1)}
        disabled={current <= 1}
        className="h-9 w-9 flex items-center justify-center border border-slate-200 rounded-lg text-slate-700 bg-white hover:bg-slate-50 hover:border-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        aria-label="Previous page"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      {pages.map((p, i) =>
        p === "..." ? (
          <span
            key={`e-${i}`}
            className="h-9 w-9 flex items-center justify-center text-slate-500 text-[13px]"
          >
            ...
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onChange(p as number)}
            className={cn(
              "h-9 min-w-9 px-2 flex items-center justify-center rounded-lg text-[13px] font-semibold transition-colors",
              current === p
                ? "bg-epf-500 text-white shadow-sm hover:bg-epf-600"
                : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300"
            )}
          >
            {p}
          </button>
        )
      )}
      <button
        onClick={() => onChange(current + 1)}
        disabled={current >= total}
        className="h-9 w-9 flex items-center justify-center border border-slate-200 rounded-lg text-slate-700 bg-white hover:bg-slate-50 hover:border-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        aria-label="Next page"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Page                                                          */
/* ------------------------------------------------------------------ */
export default function ServicesPage() {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");

  const navigate = (id: string) => router.push(`/services/${id}`);

  const { data: apiData, isLoading } = useQuery<{
    success: boolean;
    data: { services: ServiceItem[] };
  }>({
    queryKey: ["services-page-live"],
    queryFn: () => apiFetch("/api/services"),
  });

  const allServices = apiData?.data?.services ?? [];

  const filtered = useMemo(() => {
    let list = allServices;
    if (activeCategory !== "all") {
      list = list.filter((s) => s.category?.name === activeCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q)
      );
    }
    return list;
  }, [allServices, activeCategory, searchQuery]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = useMemo(
    () =>
      filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [filtered, currentPage]
  );

  const handleCategoryChange = (key: string) => {
    setActiveCategory(key);
    setCurrentPage(1);
  };

  const handleClearAll = () => {
    setActiveCategory("all");
    setSearchQuery("");
    setCurrentPage(1);
  };

  const hasActiveFilters = activeCategory !== "all" || searchQuery.trim() !== "";

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />
      <CartDrawer />
      <CheckoutDialog />

      <main className="flex-1">
        {/* Top Bar: Breadcrumb */}
        <div className="bg-white border-b border-slate-200">
          <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
            <nav className="flex items-center gap-1.5 h-11 text-[13px]">
              <a
                href="/"
                className="flex items-center gap-1 text-slate-500 hover:text-epf-600 transition-colors"
              >
                <EPFHome size={14} />
                <span>Home</span>
              </a>
              <EPFChevronRight size={12} className="text-slate-400" />
              <span className="text-slate-900 font-medium">Services</span>
            </nav>

            {/* Title + Search */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 pt-1">
              <div className="flex items-center gap-3 min-w-0">
                <h1 className="text-[24px] font-bold text-slate-900 tracking-tight">
                  Services
                </h1>
                <span className="text-[13px] text-slate-500">
                  {isLoading ? (
                    <span className="inline-block w-20 h-4 bg-slate-100 rounded animate-pulse align-middle" />
                  ) : (
                    <>
                      <span className="text-slate-900 font-semibold">
                        {filtered.length}
                      </span>{" "}
                      {filtered.length === 1 ? "service" : "services"}
                    </>
                  )}
                </span>
                {hasActiveFilters && (
                  <button
                    onClick={handleClearAll}
                    className="hidden sm:inline-flex items-center gap-1 text-[12px] text-slate-500 hover:text-epf-600 font-medium transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                    Clear
                  </button>
                )}
              </div>

              <div className="relative w-full sm:w-[300px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search services..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full h-10 pl-10 pr-9 text-[14px] text-slate-700 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-epf-500/20 focus:border-epf-500 placeholder:text-slate-400 transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    aria-label="Clear search"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Mobile category pills */}
        <div className="lg:hidden bg-white border-b border-slate-200">
          <div className="mx-auto max-w-[1400px] px-4 sm:px-6 py-3">
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              {CATEGORY_TABS.map((cat) => {
                const Icon = cat.icon;
                const isActive = activeCategory === cat.key;
                return (
                  <button
                    key={cat.key}
                    onClick={() => handleCategoryChange(cat.key)}
                    className={cn(
                      "shrink-0 h-9 px-4 text-[13px] font-medium rounded-lg flex items-center gap-1.5 transition-all",
                      isActive
                        ? "bg-epf-500 text-white shadow-sm"
                        : "bg-slate-50 text-slate-600 border border-slate-200 hover:border-epf-300 hover:text-epf-600"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {cat.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Main content + Sidebar */}
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Main grid */}
            <div className="flex-1 min-w-0 lg:w-[70%]">
              {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div
                      key={i}
                      className="bg-white border border-slate-200 rounded-xl overflow-hidden animate-pulse"
                    >
                      <div className="h-48 bg-slate-100" />
                      <div className="p-4 space-y-3">
                        <div className="h-5 bg-slate-100 rounded w-1/3" />
                        <div className="h-4 bg-slate-100 rounded w-3/4" />
                        <div className="h-3 bg-slate-100 rounded w-full" />
                        <div className="h-3 bg-slate-100 rounded w-2/3" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 px-4 bg-white rounded-xl border border-slate-200">
                  <FolderOpen className="h-16 w-16 text-slate-200 mb-4" />
                  <h3 className="text-[18px] font-medium text-slate-900 mb-1.5">
                    No services found
                  </h3>
                  <p className="text-[14px] text-slate-500 mb-6 text-center max-w-md">
                    {searchQuery
                      ? "Try a different search term or filter."
                      : "No services in this category yet."}
                  </p>
                  <button
                    onClick={handleClearAll}
                    className="h-10 px-6 bg-epf-500 hover:bg-epf-600 text-white text-[13px] font-semibold rounded-lg transition-colors shadow-sm"
                  >
                    Clear All Filters
                  </button>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {paginated.map((svc) => (
                      <ServiceCard
                        key={svc.id}
                        service={svc}
                        onNavigate={navigate}
                      />
                    ))}
                  </div>
                  <Pagination
                    current={currentPage}
                    total={totalPages}
                    onChange={setCurrentPage}
                  />
                </>
              )}
            </div>

            {/* Sidebar */}
            <Sidebar
              services={allServices}
              activeCategory={activeCategory}
              onCategoryChange={handleCategoryChange}
              onNavigate={navigate}
            />
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
