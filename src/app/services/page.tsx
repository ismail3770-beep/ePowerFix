"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  ChevronLeft, ChevronRight, Clock, FolderOpen, Bookmark,
  Search, Zap, Sun, Wrench, Shield, Lightbulb, Plug, ArrowRight,
  Phone, Star, MessageCircle, Sparkles, Wifi, Bot, Smartphone, Building2, CheckCircle2,
} from "lucide-react";
import Image from "next/image";
import { EPFHome, EPFChevronRight } from "@/components/epf/icons/EPFIcons";
import Header from "@/components/epf/Header";
import Footer from "@/components/epf/Footer";
import CartDrawer from "@/components/epf/CartDrawer";
import CheckoutDialog from "@/components/epf/CheckoutDialog";
import ChatWidget from "@/components/epf/ChatWidget";
import BackToTopButton from "@/components/epf/BackToTopButton";
import { apiFetch } from '@/lib/api';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
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

const categoryIconMap: Record<string, React.ElementType> = {
  zap: Zap, sun: Sun, wrench: Wrench, shield: Shield,
  lightbulb: Lightbulb, plug: Plug, building: Building2, bot: Bot,
};

function getCatIcon(name?: string) {
  const key = name?.toLowerCase() || "";
  if (key.includes("solar")) return Sun;
  if (key.includes("industrial")) return Building2;
  if (key.includes("repair") || key.includes("wrench")) return Wrench;
  if (key.includes("inspection") || key.includes("shield")) return Shield;
  if (key.includes("automation") || key.includes("bot")) return Bot;
  return Zap;
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

const PAGE_SIZE = 6;

/* ------------------------------------------------------------------ */
/*  Components                                                         */
/* ------------------------------------------------------------------ */

function ServiceCard({ service, isSidebar, onNavigate }: {
  service: ServiceItem; isSidebar?: boolean; onNavigate: (id: string) => void;
}) {
  const [imgError, setImgError] = useState(false);
  const CatIcon = getCatIcon(service.category?.name);

  const handleClick = () => onNavigate(service.slug || service.id);

  if (isSidebar) {
    return (
      <div onClick={handleClick} className="flex items-start gap-3 p-3 rounded-lg cursor-pointer hover:bg-white transition-all group">
        <div className="relative shrink-0 w-16 h-14 rounded-md overflow-hidden bg-slate-100 border border-slate-200">
          {!imgError && service.images?.[0] ? (
            <Image src={service.images[0]} alt={service.name} fill className="object-cover group-hover:scale-105 transition-transform" onError={() => setImgError(true)} unoptimized />
          ) : (
            <div className="w-full h-full flex items-center justify-center"><CatIcon className="w-5 h-5 text-slate-300" /></div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="text-[13px] font-medium text-slate-700 leading-snug line-clamp-1 group-hover:text-epf-500 transition-colors">{service.name}</h4>
          <span className="text-[11px] text-slate-400">{service.category?.name || "Service"}</span>
        </div>
      </div>
    );
  }

  return (
    <div onClick={handleClick} className="flex gap-4 p-4 bg-white border border-slate-200 rounded-lg cursor-pointer transition-all duration-200 hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)] hover:scale-[1.02] group">
      <div className="relative shrink-0 w-[180px] h-[120px] rounded-lg overflow-hidden bg-slate-100 border border-slate-200 max-sm:w-[100px] max-sm:h-[80px]">
        {!imgError && service.images?.[0] ? (
          <Image src={service.images?.[0]} alt={service.name} fill className="object-cover group-hover:scale-105 transition-transform" onError={() => setImgError(true)} unoptimized />
        ) : (
          <div className="w-full h-full flex items-center justify-center"><CatIcon className="w-10 h-10 text-slate-300" /></div>
        )}
        {service.isFeatured && (
          <span className="absolute top-2 left-2 bg-epf-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-sm flex items-center gap-0.5">
            <Sparkles className="w-3 h-3" />POPULAR
          </span>
        )}
      </div>
      <div className="flex-1 min-w-0 flex flex-col justify-between">
        <div>
          <h3 className="text-[16px] font-semibold text-slate-700 leading-snug line-clamp-1 group-hover:text-epf-500 transition-colors mb-2">{service.name}</h3>
          <p className="text-[14px] text-slate-500 leading-relaxed line-clamp-2 mb-3">{service.description}</p>
          <div className="flex items-center gap-3 text-[12px] text-slate-400 mb-3">
            <span className="flex items-center gap-1"><FolderOpen className="w-3 h-3" />{service.category?.name || "Service"}</span>
            <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-green-700" />Available</span>
            <span className="flex items-center gap-1"><Star className="w-3 h-3 text-amber-400" />{Number(service.rating || 0).toFixed(1)}</span>
          </div>
        </div>
        <div className="flex items-end justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2 min-w-0">
            <span className="text-[12px] text-slate-500 bg-slate-100 px-2 py-[2px] rounded-full">{service.category?.name || "General"}</span>
            <span className="text-[12px] text-slate-500 bg-slate-100 px-2 py-[2px] rounded-full">{service.priceUnit || "fixed"}</span>
          </div>
          <div className="shrink-0 text-right">
            <span className="text-[13px] font-semibold text-epf-500 inline-flex items-center gap-1">
              Get Quote <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function Sidebar({ services, activeCategory, onCategoryChange, onNavigate }: {
  services: ServiceItem[]; activeCategory: string; onCategoryChange: (key: string) => void; onNavigate: (id: string) => void;
}) {
  const popular = useMemo(() => [...services].sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0)).slice(0, 4), [services]);
  return (
    <aside className="w-full lg:w-[30%] shrink-0 space-y-6">
      <div className="bg-slate-50 rounded-lg p-5">
        <h3 className="text-[14px] font-semibold text-slate-700 mb-3 flex items-center gap-2"><FolderOpen className="w-4 h-4 text-epf-500" />Service Categories</h3>
        <nav className="space-y-1">
          {CATEGORY_TABS.map((cat) => {
            const Icon = cat.icon; const isActive = activeCategory === cat.key;
            return (
              <button key={cat.key} onClick={() => onCategoryChange(cat.key)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-[14px] font-medium transition-all duration-200 ${isActive ? "bg-epf-500 text-white shadow-sm" : "text-slate-500 hover:bg-white hover:text-slate-700"}`}>
                <Icon className="w-4 h-4" />{cat.label}
              </button>
            );
          })}
        </nav>
      </div>
      <div className="bg-slate-50 rounded-lg p-5">
        <h3 className="text-[14px] font-semibold text-slate-700 mb-3 flex items-center gap-2"><Star className="w-4 h-4 text-epf-500" />Popular Services</h3>
        <div className="space-y-1">{popular.map((svc) => <ServiceCard key={svc.id} service={svc} isSidebar onNavigate={onNavigate} />)}</div>
      </div>
      <div className="bg-slate-50 rounded-lg p-5">
        <h3 className="text-[14px] font-semibold text-slate-700 mb-3 flex items-center gap-2"><Phone className="w-4 h-4 text-epf-500" />Quick Contact</h3>
        <div className="space-y-3">
          <a href="tel:+8801700000000" className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-lg hover:shadow-sm transition-shadow">
            <div className="w-10 h-10 rounded-full bg-epf-500/10 flex items-center justify-center"><Phone className="w-5 h-5 text-epf-500" /></div>
            <div><p className="text-[13px] font-medium text-slate-700">Call Us</p><p className="text-[12px] text-slate-400">+880 1700-000000</p></div>
          </a>
          <a href="https://wa.me/8801700000000" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-lg hover:shadow-sm transition-shadow">
            <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center"><MessageCircle className="w-5 h-5 text-green-500" /></div>
            <div><p className="text-[13px] font-medium text-slate-700">WhatsApp</p><p className="text-[12px] text-slate-400">Chat with us</p></div>
          </a>
          <button className="w-full py-2.5 px-4 border border-dashed border-epf-500 text-epf-500 text-[13px] font-medium rounded-lg hover:bg-epf-500 hover:text-white transition-all duration-200">Request a Callback</button>
        </div>
      </div>
    </aside>
  );
}

function Pagination({ current, total, onChange }: { current: number; total: number; onChange: (page: number) => void }) {
  if (total <= 1) return null;
  const pages: (number | "...")[] = [];
  for (let i = 1; i <= total; i++) {
    if (i === 1 || i === total || (i >= current - 1 && i <= current + 1)) pages.push(i);
    else if (pages[pages.length - 1] !== "...") pages.push("...");
  }
  return (
    <div className="flex items-center justify-center gap-2 mt-8">
      <button onClick={() => onChange(current - 1)} disabled={current <= 1} className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-500 hover:text-epf-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors border border-slate-200 bg-white"><ChevronLeft className="w-4 h-4" /></button>
      {pages.map((page, idx) => page === "..." ? <span key={`e-${idx}`} className="w-9 h-9 flex items-center justify-center text-slate-400 text-[14px]">...</span> : (
        <button key={page} onClick={() => onChange(page as number)} className={`w-9 h-9 rounded-lg text-[14px] font-medium transition-all duration-200 ${current === page ? "bg-epf-500 text-white shadow-sm" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}>{page}</button>
      ))}
      <button onClick={() => onChange(current + 1)} disabled={current >= total} className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-500 hover:text-epf-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors border border-slate-200 bg-white"><ChevronRight className="w-4 h-4" /></button>
    </div>
  );
}

function FeaturedCard({ service, onNavigate }: { service: ServiceItem; onNavigate: (id: string) => void }) {
  const [imgError, setImgError] = useState(false);
  const CatIcon = getCatIcon(service.category?.name);
  return (
    <div onClick={() => onNavigate(service.slug || service.id)} className="relative bg-white border border-slate-200 rounded-xl overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)] hover:scale-[1.02] group">
      <div className="relative w-full h-[200px] bg-slate-100 overflow-hidden">
        {!imgError && service.images?.[0] ? <Image src={service.images?.[0]} alt={service.name} fill className="object-cover group-hover:scale-105 transition-transform" onError={() => setImgError(true)} unoptimized /> : <div className="w-full h-full flex items-center justify-center"><CatIcon className="w-12 h-12 text-slate-300" /></div>}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        <span className="absolute top-3 left-3 bg-epf-500 text-white text-[11px] font-bold px-2.5 py-1 rounded-md flex items-center gap-1 shadow-sm"><Sparkles className="w-3 h-3" />Popular</span>
        <div className="absolute bottom-3 left-3 right-3 z-10"><h3 className="text-[18px] font-semibold text-white leading-snug drop-shadow-sm">{service.name}</h3></div>
      </div>
      <div className="p-4">
        <p className="text-[14px] text-slate-500 leading-relaxed line-clamp-2 mb-3">{service.description}</p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-[12px] text-slate-400">
            <span className="flex items-center gap-1"><FolderOpen className="w-3 h-3" />{service.category?.name || "Service"}</span>
            <span className="flex items-center gap-1"><Star className="w-3 h-3 text-amber-400" />{Number(service.rating || 0).toFixed(1)}</span>
          </div>
          <div className="text-right">
            <span className="text-[13px] font-semibold text-epf-500 inline-flex items-center gap-1">
              Get Quote <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>
      </div>
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

  const { data: apiData, isLoading } = useQuery<{ success: boolean; data: { services: ServiceItem[] } }>({
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
      list = list.filter((s) => s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q));
    }
    return list;
  }, [allServices, activeCategory, searchQuery]);

  const featured = useMemo(() => filtered.filter((s) => s.isFeatured), [filtered]);
  const nonFeatured = useMemo(() => filtered.filter((s) => !s.isFeatured), [filtered]);
  const totalPages = Math.ceil(nonFeatured.length / PAGE_SIZE);
  const paginated = useMemo(() => nonFeatured.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE), [nonFeatured, currentPage]);

  const handleCategoryChange = (key: string) => { setActiveCategory(key); setCurrentPage(1); };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      <CartDrawer />
      <CheckoutDialog />
      <main className="flex-1 mx-auto w-full max-w-[1400px] px-4 sm:px-12 py-8">
        <nav className="flex items-center gap-1.5 mb-6">
          <a href="/" className="flex items-center gap-1 text-[13px] text-slate-500 hover:text-slate-900 transition-colors"><EPFHome size={14} />Home</a>
          <EPFChevronRight size={12} className="text-slate-400" />
          <span className="text-[13px] font-medium text-slate-900">Services</span>
        </nav>

        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-[24px] font-bold text-slate-900">Electrical Services</h1>
            <p className="text-[14px] text-slate-500 mt-1.5">Professional electrical services — wiring, solar, automation, repair &amp; more</p>
          </div>
          <div className="relative w-full sm:w-[280px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" placeholder="Search services..." value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="w-full h-10 pl-10 pr-4 text-[14px] text-slate-700 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-epf-500/30 focus:border-epf-500 placeholder:text-slate-400 transition-all" />
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 mb-6 lg:hidden scrollbar-none">
          {CATEGORY_TABS.map((tab) => {
            const Icon = tab.icon; const isActive = activeCategory === tab.key;
            return (
              <button key={tab.key} onClick={() => handleCategoryChange(tab.key)}
                className={`shrink-0 h-9 px-4 text-[13px] font-medium rounded-lg flex items-center gap-1.5 transition-all duration-200 ${isActive ? "bg-epf-500 text-white shadow-sm" : "bg-slate-50 text-slate-500 border border-slate-200 hover:border-epf-500 hover:text-epf-500"}`}>
                <Icon className="w-4 h-4" />{tab.label}
              </button>
            );
          })}
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1 min-w-0 lg:w-[70%]">
            <p className="text-[13px] text-slate-400 mb-5">
              Showing <span className="font-semibold text-slate-700">{filtered.length}</span> {filtered.length === 1 ? "service" : "services"}
            </p>

            {isLoading ? (
              <div className="flex flex-col gap-6">{Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex gap-4 p-4 bg-white border border-slate-200 rounded-lg animate-pulse">
                  <div className="shrink-0 w-[180px] h-[120px] rounded-lg bg-slate-100 max-sm:w-[100px] max-sm:h-[80px]" />
                  <div className="flex-1 space-y-3"><div className="h-4 bg-slate-100 rounded w-3/4" /><div className="h-3 bg-slate-100 rounded w-full" /><div className="h-3 bg-slate-100 rounded w-2/3" /></div>
                </div>
              ))}</div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-4"><FolderOpen className="w-7 h-7 text-slate-300" /></div>
                <h3 className="text-[16px] font-medium text-slate-700 mb-1">No services found</h3>
                <p className="text-[14px] text-slate-500 mb-5">{searchQuery ? "Try a different search term." : "No services in this category yet."}</p>
                {searchQuery && <button onClick={() => setSearchQuery("")} className="h-9 px-5 text-[14px] font-medium bg-epf-500 text-white rounded-lg hover:bg-epf-600 transition-colors">Clear Search</button>}
              </div>
            ) : (
              <>
                {featured.length > 0 && currentPage === 1 && (
                  <div className="mb-10">
                    <h2 className="text-[18px] font-semibold text-slate-900 mb-4 flex items-center gap-2"><Sparkles className="w-5 h-5 text-epf-500" />Popular Services</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">{featured.slice(0, 3).map((svc) => <FeaturedCard key={svc.id} service={svc} onNavigate={navigate} />)}</div>
                  </div>
                )}
                {paginated.length > 0 && (
                  <><div className="flex flex-col gap-6">{paginated.map((svc) => <ServiceCard key={svc.id} service={svc} onNavigate={navigate} />)}</div>
                    <Pagination current={currentPage} total={totalPages} onChange={setCurrentPage} />
                  </>
                )}
              </>
            )}

            {filtered.length > 0 && (
              <div className="mt-10 bg-slate-900 p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-lg">
                <div><p className="text-white font-semibold text-[18px]">Need a custom electrical solution?</p><p className="text-white/50 text-[14px] mt-1">Contact our team for a free site assessment and quote.</p></div>
                <a href="tel:+8801700000000" className="bg-epf-500 hover:bg-epf-600 text-white font-semibold text-[15px] h-11 px-6 shrink-0 flex items-center gap-2 transition-colors rounded-lg"><Phone className="w-4 h-4" />Call Now</a>
              </div>
            )}
          </div>

          <Sidebar services={filtered} activeCategory={activeCategory} onCategoryChange={handleCategoryChange} onNavigate={navigate} />
        </div>
      </main>
      <ChatWidget />
      <BackToTopButton />
      <Footer />
    </div>
  );
}