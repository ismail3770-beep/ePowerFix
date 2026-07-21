"use client";
import type * as React from "react";
import { useState, useEffect, useRef, useCallback } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { useCartStore, useUIStore } from "@/store";
import { useAuthStore } from "@/store/auth-store";
import { apiFetch } from "@/lib/api";
import {
  EPFIcons as I,
  EPFCable,
  EPFSafetyShield,
  EPFLightbulb,
  EPFCpu,
  EPFWrench,
  EPFHardHat,
  EPFPlug,
  EPFSolar,
  EPFBookOpen,
  EPFSmartphone,
  EPFTag,
  EPFAccountIcon,
  EPFHeartFilled,
  EPFCartFilled,
} from "@/components/epf/icons/EPFIcons";

interface ApiCategory {
  id: string
  name: string
  nameBn: string | null
  slug: string
  icon: string | null
  image: string | null
  sortOrder: number
  _count?: { products: number }
}

interface MegaCategory extends ApiCategory {
  iconComponent: React.ElementType
  dbSlug: string
}

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/electrician", label: "Call Electrician" },
  { href: "/services", label: "Services" },
  { href: "/shop", label: "Shop" },
  { href: "/projects", label: "Projects" },
  { href: "/project-kits", label: "Project Kits" },
  { href: "/blog", label: "Blog" },
];

const subcategories = [
  "PVC Cables", "XLPE Cables", "Armoured Cables", "Bare Conductors", "Coaxial Cables",
  "Flexible Cables", "Control Cables", "HT Cables", "Fire Resistant", "LSZH Cables",
];

// Map slug to icon component
const iconMap: Record<string, React.ElementType> = {
  "cables-wires": EPFCable,
  "circuit-breakers": EPFSafetyShield,
  "led-lighting": EPFLightbulb,
  "switches-sockets": EPFCpu,
  "testing-tools": EPFWrench,
  "safety-equipment": EPFHardHat,
  "motors-drives": EPFPlug,
  "solar-equipment": EPFSolar,
  "digital-guides": EPFBookOpen,
  "smart-home": EPFSmartphone,
};

function formatCount(count: number): string {
  if (count >= 1000) {return `${(count / 1000).toFixed(1)}k`;}
  return String(count);
}

interface SearchResult {
  id: string;
  name: string;
  price?: number;
  image?: string;
  category?: { name: string } | null;
}

export default function Header() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [megaOpen, setMegaOpen] = useState(false);
  const [headerShadow, setHeaderShadow] = useState(false);
  const [localSearch, setLocalSearch] = useState("");
  const [searchResults, setSearchResults] = useState<{
    products: SearchResult[];
    services: SearchResult[];
    projects: SearchResult[];
  }>({ products: [], services: [], projects: [] });
  const [showDropdown, setShowDropdown] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [megaCategories, setMegaCategories] = useState<MegaCategory[]>([]);
  const megaTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const { setSearchQuery, setCartOpen } = useUIStore();
  const { getTotal, getItemCount } = useCartStore();
  const { user, logout } = useAuthStore();
  const total = getTotal();
  const count = getItemCount();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  // Fetch categories from API on mount
  useEffect(() => {
    (async () => {
      try {
        const data = await apiFetch<{ categories: ApiCategory[] }>("/api/categories?counts=true");
        const categoriesWithIcons = (data.categories ?? []).map((cat) => ({
          ...cat,
          iconComponent: iconMap[cat.slug] || EPFTag,
          // Map API slugs to legacy dbSlugs for backwards compatibility
          dbSlug: cat.slug === "wires-cables" ? "wires-cables" :
                  cat.slug === "led-lights" ? "led-lights" :
                  cat.slug === "switches-sockets" ? "switches-sockets" :
                  cat.slug === "tools-accessories" ? "tools-accessories" :
                  cat.slug === "solar-equipment" ? "solar-equipment" : "",
        }));
        setMegaCategories(categoriesWithIcons);
      } catch {
        // Fallback to minimal default if API fails
        setMegaCategories([
          { iconComponent: EPFCable, id: "fallback-1", name: "Cables & Wires", nameBn: null, slug: "cables-wires", icon: null, image: null, sortOrder: 0, _count: { products: 0 }, dbSlug: "wires-cables" },
          { iconComponent: EPFSafetyShield, id: "fallback-2", name: "Circuit Breakers", nameBn: null, slug: "circuit-breakers", icon: null, image: null, sortOrder: 1, _count: { products: 0 }, dbSlug: "circuit-breakers" },
          { iconComponent: EPFLightbulb, id: "fallback-3", name: "LED & Lighting", nameBn: null, slug: "led-lighting", icon: null, image: null, sortOrder: 2, _count: { products: 0 }, dbSlug: "led-lights" },
          { iconComponent: EPFCpu, id: "fallback-4", name: "Switches & Sockets", nameBn: null, slug: "switches-sockets", icon: null, image: null, sortOrder: 3, _count: { products: 0 }, dbSlug: "switches-sockets" },
          { iconComponent: EPFWrench, id: "fallback-5", name: "Testing Tools", nameBn: null, slug: "testing-tools", icon: null, image: null, sortOrder: 4, _count: { products: 0 }, dbSlug: "tools-accessories" },
          { iconComponent: EPFHardHat, id: "fallback-6", name: "Safety Equipment", nameBn: null, slug: "safety-equipment", icon: null, image: null, sortOrder: 5, _count: { products: 0 }, dbSlug: "" },
          { iconComponent: EPFPlug, id: "fallback-7", name: "Motors & Drives", nameBn: null, slug: "motors-drives", icon: null, image: null, sortOrder: 6, _count: { products: 0 }, dbSlug: "" },
          { iconComponent: EPFSolar, id: "fallback-8", name: "Solar Equipment", nameBn: null, slug: "solar-equipment", icon: null, image: null, sortOrder: 7, _count: { products: 0 }, dbSlug: "solar-equipment" },
          { iconComponent: EPFBookOpen, id: "fallback-9", name: "Digital Guides", nameBn: null, slug: "digital-guides", icon: null, image: null, sortOrder: 8, _count: { products: 0 }, dbSlug: "" },
          { iconComponent: EPFSmartphone, id: "fallback-10", name: "Smart Home", nameBn: null, slug: "smart-home", icon: null, image: null, sortOrder: 9, _count: { products: 0 }, dbSlug: "" },
        ]);
      }
    })();
  }, []);

  const getCategoryCount = (cat: MegaCategory): string => {
    const cnt = cat._count?.products ?? 0;
    return formatCount(cnt);
  };

  useEffect(() => {
    const onScroll = () => setHeaderShadow(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!mobileOpen) {return;}
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  // Close user menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Live search
  const doSearch = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSearchResults({ products: [], services: [], projects: [] });
      setShowDropdown(false);
      return;
    }
    try {
      const res = await apiFetch<{
        products: SearchResult[];
        services: SearchResult[];
        projects: SearchResult[];
      }>(`/api/search?q=${encodeURIComponent(query)}&productLimit=3&serviceLimit=2&projectLimit=2`);
      const products = res.products ?? [];
      const services = res.services ?? [];
      const projects = res.projects ?? [];
      setSearchResults({ products, services, projects });
      setShowDropdown(true);
    } catch {
      setShowDropdown(false);
    }
  }, []);

  const handleSearchChange = (val: string) => {
    setLocalSearch(val);
    if (searchTimeout.current) {clearTimeout(searchTimeout.current);}
    searchTimeout.current = setTimeout(() => doSearch(val), 300);
  };

  const handleSearch = () => {
    if (searchTimeout.current) {clearTimeout(searchTimeout.current);}
    setShowDropdown(false);
    setSearchQuery(localSearch);
    window.location.href = '/shop?search=' + encodeURIComponent(localSearch);
  };

  const handleLogout = async () => {
    await logout();
    setUserMenuOpen(false);
  };

  const hasResults = searchResults.products.length > 0 || searchResults.services.length > 0 || searchResults.projects.length > 0;

  return (
    <>
    <style>{`
      @keyframes slideInRight {
        from { transform: translateX(100%); }
        to { transform: translateX(0); }
      }
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
    `}</style>
    <header
      data-customer-shell={pathname === "/" ? "home" : "page"}
      className={`sticky top-0 z-50 bg-white transition-shadow duration-300 ${headerShadow ? "shadow-[var(--epf-shadow-md)]" : ""}`}
    >
      {/* ROW 1 */}
      <div className="border-b border-slate-200">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-12">
          <div className="flex items-center h-[70px] gap-6">
            {/* Logo - first focusable element */}
            <Link href="/" className="flex flex-col shrink-0 group focus:outline-none focus-visible:ring-2 focus-visible:ring-epf-500 rounded" tabIndex={0}>
              <span className="text-[26px] font-extrabold tracking-tight text-slate-900 leading-none group-hover:text-epf-500 transition-colors">
                e<span className="text-epf-500">Power</span>Fix
              </span>
              <span className="text-[12px] text-slate-500 font-semibold tracking-[0.2em] uppercase leading-none mt-1">ELECTRICAL MARKETPLACE</span>
            </Link>

            {/* Search Bar - Desktop */}
            <div className="hidden md:flex flex-1 justify-center relative" ref={searchRef}>
              <div className="flex w-full max-w-[700px] h-[42px] rounded border border-slate-200 relative transition-all duration-200 focus-within:border-epf-500 focus-within:shadow-[var(--epf-ring-brand)]">
                <I.Search className="h-[18px] w-[18px] text-slate-400 my-auto ml-3 shrink-0" />
                <input
                  type="text"
                  placeholder="Search products, services or projects..."
                  value={localSearch}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  onFocus={() => localSearch.length >= 2 && setShowDropdown(true)}
                  onKeyDown={(e) => { if (e.key === "Enter") {handleSearch();} if (e.key === "Escape") {setShowDropdown(false);} }}
                  className="flex-1 h-full px-3 text-[15px] bg-white focus:outline-none text-slate-900 placeholder:text-slate-400"
                  aria-label="Search"
                />
                <button
                  onClick={handleSearch}
                  className="bg-epf-500 text-white h-full px-5 flex items-center hover:bg-epf-600 active:scale-[0.98] transition-all text-[14px] font-semibold"
                >
                  Search
                </button>

                {/* Search Dropdown */}
                {showDropdown && localSearch.length >= 2 && (
                  <div className="absolute top-full left-0 right-0 bg-white border border-slate-200 rounded-b shadow-md z-50 max-h-[400px] overflow-y-auto search-dropdown">
                    {!hasResults && (
                      <div className="p-6 text-center">
                        <p className="text-[14px] text-slate-500">No results found</p>
                        <p className="text-[13px] text-slate-400 mt-1">Browse <a href="/shop" className="text-epf-500 hover:underline">Shop</a> for categories</p>
                      </div>
                    )}
                    {searchResults.products.length > 0 && (
                      <div>
                        <p className="px-4 py-2 text-[12px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50">Products</p>
                        {searchResults.products.map((p) => (
                          <button key={p.id} onClick={() => { setShowDropdown(false); window.location.href = `/shop?search=${encodeURIComponent(localSearch)}`; }} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 border-b border-slate-200 last:border-0 text-left transition-colors">
                            <div className="h-9 w-9 bg-slate-100 rounded flex items-center justify-center shrink-0">
                              {p.image ? <img src={p.image} alt="" className="h-7 w-7 object-contain" /> : <I.Package className="h-4 w-4 text-slate-400" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[13px] text-slate-900 truncate">{p.name}</p>
                            </div>
                            <span className="text-[13px] font-semibold text-epf-500 shrink-0">৳{p.price?.toLocaleString()}</span>
                          </button>
                        ))}
                      </div>
                    )}
                    {searchResults.services.length > 0 && (
                      <div>
                        <p className="px-4 py-2 text-[12px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50">Services</p>
                        {searchResults.services.map((s) => (
                          <button key={s.id} onClick={() => { setShowDropdown(false); window.location.href = `/services/${(s as any).slug || s.id}`; }} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 border-b border-slate-200 last:border-0 text-left transition-colors">
                            <div className="h-9 w-9 bg-epf-50 rounded-full flex items-center justify-center shrink-0">
                              <I.Wrench className="h-4 w-4 text-epf-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[13px] text-slate-900 truncate">{s.name}</p>
                            </div>
                            {s.price !== undefined && <span className="text-[12px] text-slate-500 shrink-0">From ৳{s.price}</span>}
                          </button>
                        ))}
                      </div>
                    )}
                    {searchResults.projects.length > 0 && (
                      <div>
                        <p className="px-4 py-2 text-[12px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50">Projects</p>
                        {searchResults.projects.map((p) => (
                          <button key={p.id} onClick={() => { setShowDropdown(false); window.location.href = `/projects/${(p as any).slug || p.id}`; }} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 border-b border-slate-200 last:border-0 text-left transition-colors">
                            <div className="h-9 w-9 bg-slate-100 rounded flex items-center justify-center shrink-0">
                              {p.image ? <img src={p.image} alt="" className="h-7 w-7 object-cover rounded" /> : <I.Cpu className="h-4 w-4 text-slate-400" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[13px] text-slate-900 truncate">{p.name}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                    {hasResults && (
                      <a href={`/shop?search=${encodeURIComponent(localSearch)}`} className="block px-4 py-3 text-center text-[13px] font-semibold text-epf-500 hover:bg-epf-50 border-t border-slate-200 transition-colors">
                        View All Results →
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Right Icons */}
            <div className="flex items-center gap-1 ml-auto shrink-0">
              {/* Account / User Menu */}
              <div className="relative" ref={userMenuRef}>
                {user ? (
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="hidden lg:flex items-center gap-2 px-2 py-1 rounded hover:bg-slate-50 transition-colors"
                  >
                    <EPFAccountIcon className="h-[26px] w-[26px] text-slate-700 shrink-0" />
                    <div className="flex flex-col leading-tight text-left">
                      <span className="text-[13px] font-medium text-slate-900 truncate max-w-[140px]">
                        {user.name}
                      </span>
                      <span className="text-[12px] text-slate-500 truncate max-w-[140px]">
                        {user.phone || user.email}
                      </span>
                    </div>
                  </button>
                ) : (
                  <div className="hidden lg:flex items-center gap-2 px-2 py-1 rounded hover:bg-slate-50 transition-colors">
                    <EPFAccountIcon className="h-[26px] w-[26px] text-slate-700 shrink-0" />
                    <div className="flex flex-col leading-tight">
                      <a
                        href="/login"
                        className="text-[14px] font-medium text-slate-900 hover:text-epf-500 transition-colors leading-tight"
                      >
                        Login
                      </a>
                      <a
                        href="/register"
                        className="text-[12px] text-slate-500 hover:text-epf-500 transition-colors leading-tight"
                      >
                        Register
                      </a>
                    </div>
                  </div>
                )}

                {/* User Dropdown Menu (when logged in) */}
                {user && userMenuOpen && (
                  <div className="absolute right-0 top-full mt-1 w-[220px] bg-white border border-slate-200 rounded-lg shadow-md py-1 z-50">
                    <div className="px-4 py-3 border-b border-slate-200">
                      <p className="text-[14px] font-semibold text-slate-900">{user.name}</p>
                      <p className="text-[12px] text-slate-500">{user.email}</p>
                      {user.phone && (
                        <p className="text-[12px] text-slate-500 mt-0.5">{user.phone}</p>
                      )}
                    </div>
                    <a href="/order-track" className="flex items-center gap-2.5 px-4 py-2.5 text-[14px] text-slate-700 hover:bg-slate-50 hover:text-epf-500 transition-colors">
                      <I.Truck className="h-4 w-4" /> Track Order
                    </a>
                    <a href="/profile" className="flex items-center gap-2.5 px-4 py-2.5 text-[14px] text-slate-700 hover:bg-slate-50 hover:text-epf-500 transition-colors">
                      <I.User className="h-4 w-4" /> My Profile
                    </a>
                    <a href="/electrician" className="flex items-center gap-2.5 px-4 py-2.5 text-[14px] text-slate-700 hover:bg-slate-50 hover:text-epf-500 transition-colors">
                      <EPFWrench className="h-4 w-4" /> Call Electrician
                    </a>
                    <a href="/wishlist" className="flex items-center gap-2.5 px-4 py-2.5 text-[14px] text-slate-700 hover:bg-slate-50 hover:text-epf-500 transition-colors">
                      <I.Heart className="h-4 w-4" /> Wishlist
                    </a>
                    <div className="border-t border-slate-200 my-1" />
                    <button onClick={handleLogout} className="flex items-center gap-2.5 px-4 py-2.5 text-[14px] text-danger hover:bg-slate-50 transition-colors w-full text-left">
                      Logout
                    </button>
                  </div>
                )}
              </div>

              {/* Wishlist */}
              <a href="/wishlist" className="hidden lg:flex flex-col items-center px-2 py-1 rounded hover:bg-slate-50 transition-colors group">
                <EPFHeartFilled className="h-[22px] w-[22px] text-slate-700 group-hover:text-epf-500 group-hover:scale-110 transition-all" />
                <span className="text-[13px] text-slate-700 mt-0.5 group-hover:text-epf-500 transition-colors">Wishlist</span>
              </a>

              {/* Cart */}
              <button
                onClick={() => setCartOpen(true)}
                className="flex items-center gap-2 px-3 py-2 rounded border border-slate-200 hover:border-epf-500 hover:bg-slate-50 hover:-translate-y-0.5 transition-all relative"
              >
                <div className="relative">
                  <EPFCartFilled className="h-[22px] w-[22px] text-slate-700" />
                  {mounted && count > 0 && (
                    <span className="absolute -top-2 -right-2 h-[15px] min-w-[15px] rounded-full bg-epf-500 text-white text-[12px] font-bold flex items-center justify-center px-0.5">
                      {formatCount(count)}
                    </span>
                  )}
                </div>
                <div className="hidden sm:flex flex-col leading-tight text-left">
                  <span className="text-[13px] text-slate-500">Cart</span>
                  <span className="text-[14px] font-semibold text-slate-900">{mounted ? `৳${total.toLocaleString()}` : ""}</span>
                </div>
              </button>

              {/* Mobile menu trigger */}
              <button
                className="md:hidden flex items-center justify-center text-slate-900 ml-1"
                onClick={() => setMobileOpen(true)}
              >
                <I.Menu className="h-[22px] w-[22px]" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ROW 2 */}
      <div id="header-row-2" className={`bg-slate-900 transition-shadow duration-200 ${headerShadow ? "shadow-md" : ""}`}>
        <div className="mx-auto max-w-[1400px] px-4 sm:px-12">
          <div className="flex items-center h-[44px]">
            {/* Shop By Category + Mega Menu */}
            <div
              className="relative hidden lg:block"
              onMouseEnter={() => { clearTimeout(megaTimeout.current!); setMegaOpen(true); }}
              onMouseLeave={() => { megaTimeout.current = setTimeout(() => setMegaOpen(false), 200); }}
            >
              <button className="flex items-center gap-2 h-[44px] px-5 bg-slate-900 text-white hover:bg-slate-950 transition-colors">
                <I.Menu className="h-[18px] w-[18px]" />
                <span className="text-[15px] font-bold">Categories</span>
                <ChevronDown className={`h-3.5 w-3.5 text-epf-500 transition-transform duration-200 ${megaOpen ? "rotate-180" : ""}`} />
              </button>

              {megaOpen && (
                <div
                  className="absolute top-[44px] left-0 w-[750px] bg-white border border-slate-200 z-[60] flex rounded-b shadow-[var(--epf-shadow-lg)]"
                  onMouseEnter={() => { clearTimeout(megaTimeout.current!); setMegaOpen(true); }}
                  onMouseLeave={() => { megaTimeout.current = setTimeout(() => setMegaOpen(false), 200); }}
                >
                  <div className="w-[260px] border-r border-slate-200 py-1 bg-slate-50">
                    {megaCategories.map((cat, i) => {
                      const Icon = iconMap[cat.slug] || EPFTag;
                      return (
                        <a
                          key={cat.slug}
                          href={`/shop?category=${cat.dbSlug || cat.slug}`}
                          onClick={(e) => { e.preventDefault(); setMegaOpen(false); window.location.href = `/shop?category=${cat.dbSlug || cat.slug}`; }}
                          className={`w-full flex items-center gap-3 px-4 py-2.5 text-left text-[14px] transition-all border-l-[3px] ${
                            i === 0
                              ? "bg-white text-epf-500 font-semibold border-epf-500"
                              : "text-slate-700 hover:bg-white hover:text-slate-900 border-transparent hover:border-epf-500"
                          }`}
                        >
                          <span className={i === 0 ? "text-epf-500" : "text-slate-500"}>
                            <Icon className="h-4 w-4" />
                          </span>
                          <span className="flex-1 truncate">{cat.name}</span>
                          <span className="text-[13px] text-slate-500 bg-slate-200 px-1.5 py-0.5 rounded">{getCategoryCount(cat)}</span>
                        </a>
                      );
                    })}
                  </div>
                  <div className="flex-1 p-5">
                    <p className="text-[13px] font-bold uppercase tracking-wider text-slate-500 mb-3">Sub-Categories</p>
                    <div className="grid grid-cols-2 gap-x-6 mb-5">
                      {subcategories.map((sub) => (
                        <a
                          key={sub}
                          href={`/shop?search=${encodeURIComponent(sub)}`}
                          onClick={(e) => { e.preventDefault(); setMegaOpen(false); window.location.href = `/shop?search=${encodeURIComponent(sub)}`; }}
                          className="flex items-center gap-2 py-1.5 text-[14px] text-slate-700 hover:text-epf-500 transition-colors group"
                        >
                          <span className="h-1 w-1 rounded-full bg-slate-400 group-hover:bg-epf-500 transition-colors shrink-0" />
                          <span>{sub}</span>
                        </a>
                      ))}
                    </div>
                    <div className="border-t border-slate-200 pt-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-[13px] font-bold uppercase tracking-wider text-slate-500 mb-1">Featured Product</p>
                          <p className="text-[15px] font-semibold text-slate-900">3-core 4mm² PVC Cable</p>
                          <p className="text-[16px] font-semibold text-slate-900 mt-0.5">৳1,850</p>
                        </div>
                        <a
                          href="/shop?category=wires-cables"
                          onClick={(e) => { e.preventDefault(); setMegaOpen(false); window.location.href = "/shop?category=wires-cables"; }}
                          className="h-9 px-4 bg-epf-500 text-white text-[14px] font-bold hover:bg-epf-600 active:scale-[0.98] transition-all flex items-center gap-1.5 rounded-[4px]"
                        >
                          View <I.ArrowRight className="h-3 w-3" />
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Nav Links */}
            <nav className="hidden lg:flex items-center gap-1 flex-1 justify-center">
              {navLinks.filter((link) => link.href !== "/electrician").map((link) => {
                const isActive = link.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(link.href);
                return (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={(e) => {
                    if (link.href === "/" && pathname === "/") {
                      e.preventDefault();
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }
                  }}
                  className={`px-3 py-2 text-[15px] font-semibold transition-colors relative group flex items-center gap-1 ${
                    isActive ? "font-bold text-epf-500" : "text-slate-50 hover:text-epf-500"
                  }`}
                >
                  <span>{link.label}</span>
                  <span className={`absolute bottom-0 left-0 right-0 h-[2px] bg-epf-500 transition-transform ${isActive ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"}`} />
                </a>
                );
              })}
            </nav>

            {/* Right Utility */}
            <div className="hidden lg:flex items-center gap-4 ml-auto">
              <a
                href="/order-track"
                className="flex items-center gap-1.5 text-[14px] font-medium text-epf-500 hover:text-epf-600 transition-colors"
              >
                <I.Truck className="h-[16px] w-[16px]" /> Track Order
              </a>
              <span className="w-px h-4 bg-white/20" />
              <a
                href="/electrician"
                className="flex items-center gap-1.5 text-[14px] font-medium text-epf-500 hover:text-epf-600 transition-colors"
              >
                <EPFWrench className="h-[16px] w-[16px]" /> Call Electrician
              </a>
            </div>

            {/* Mobile Search Toggle */}
            <button
              className="lg:hidden h-[44px] w-10 flex items-center justify-center text-white ml-auto"
              onClick={() => setSearchOpen(!searchOpen)}
            >
              {searchOpen ? <I.Close className="h-[18px] w-[18px]" /> : <I.Search className="h-[18px] w-[18px]" />}
            </button>
          </div>
        </div>

        {/* Mobile search bar */}
        {searchOpen && (
          <div className="lg:hidden border-t border-slate-200 bg-white px-4 py-3">
            <div className="flex h-[42px]">
              <input
                type="text"
                placeholder="Search products, services or projects..."
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="flex-1 px-4 text-[14px] bg-slate-50 border border-slate-200 focus:outline-none rounded-l-[4px]"
              />
              <button
                onClick={handleSearch}
                className="bg-epf-500 text-white px-5 rounded-r-[4px]"
              >
                <I.Search className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Slide Menu */}
      {mobileOpen && (
        <>
          <div className="fixed inset-y-0 right-0 w-80 bg-white z-[70] shadow-xl overflow-y-auto pb-20" style={{ animation: 'slideInRight 0.25s ease-out' }}>
            <div className="bg-slate-900 p-5">
              <div className="flex items-center justify-between">
                <Link href="/" onClick={() => setMobileOpen(false)}>
                  <span className="text-[18px] font-bold text-white leading-none">
                    e<span className="text-epf-500">Power</span>Fix
                  </span>
                </Link>
                <button onClick={() => setMobileOpen(false)} className="text-white/80 hover:text-white">
                  <I.Close className="h-5 w-5" />
                </button>
              </div>
            </div>
            <nav className="border-b border-slate-200">
              {navLinks.map((link) => {
                const isActive = link.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(link.href);
                return (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={(e) => {
                    if (link.href === "/" && pathname === "/") {
                      e.preventDefault();
                      setMobileOpen(false);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    } else {
                      setMobileOpen(false);
                    }
                  }}
                  className={`flex items-center justify-between w-full px-5 py-3.5 text-[15px] font-medium border-b border-slate-200 transition-colors ${
                    isActive ? "bg-epf-50 text-slate-900 font-semibold" : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <span className={`flex items-center gap-2 ${isActive ? "text-epf-500" : ""}`}>
                    {link.label}
                  </span>
                  <I.ChevronRight className="h-4 w-4 text-slate-400" />
                </a>
                );
              })}
            </nav>
            <div>
              <p className="px-5 py-3 text-[13px] font-bold uppercase tracking-wider text-slate-500 bg-slate-50">Categories</p>
              {megaCategories.map((cat) => (
                <a
                  key={cat.slug}
                  href={`/shop?category=${cat.dbSlug || cat.slug}`}
                  onClick={(e) => {
                    e.preventDefault();
                    setMobileOpen(false);
                    window.location.href = `/shop?category=${cat.dbSlug || cat.slug}`;
                  }}
                  className="flex items-center gap-3 w-full px-5 py-3 text-[14px] text-slate-700 hover:bg-slate-50 border-b border-slate-200 transition-colors"
                >
                  <span className="text-epf-500"><EPFTag className="h-4 w-4" /></span>
                  <span className="flex-1 text-left">{cat.name}</span>
                  <I.ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                </a>
              ))}
            </div>
            <div className="p-4 border-t border-slate-200 flex gap-2">
              <button onClick={() => window.location.href = '/login'} className="flex-1 h-10 bg-epf-500 text-white text-[14px] font-bold rounded-[4px] hover:bg-epf-600 active:scale-[0.98] transition-all">Login / Register</button>
            </div>
          </div>
          <div className="fixed inset-0 bg-black/30 z-[65]" style={{ animation: 'fadeIn 0.2s ease-out' }} onClick={() => setMobileOpen(false)} />
        </>
      )}
    </header>
    </>
  );
}
