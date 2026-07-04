"use client";
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
} from "@/components/epf/icons/EPFIcons";

const megaCategories = [
  { icon: EPFCable, name: "Cables & Wires", slug: "cables-wires", dbSlug: "wires-cables" },
  { icon: EPFSafetyShield, name: "Circuit Breakers", slug: "circuit-breakers", dbSlug: "circuit-breakers" },
  { icon: EPFLightbulb, name: "LED & Lighting", slug: "led-lighting", dbSlug: "led-lights" },
  { icon: EPFCpu, name: "Switches & Sockets", slug: "switches-sockets", dbSlug: "switches-sockets" },
  { icon: EPFWrench, name: "Testing Tools", slug: "testing-tools", dbSlug: "tools-accessories" },
  { icon: EPFHardHat, name: "Safety Equipment", slug: "safety-equipment", dbSlug: "" },
  { icon: EPFPlug, name: "Motors & Drives", slug: "motors-drives", dbSlug: "" },
  { icon: EPFSolar, name: "Solar Equipment", slug: "solar-equipment", dbSlug: "solar-equipment" },
  { icon: EPFBookOpen, name: "Digital Guides", slug: "digital-guides", dbSlug: "" },
  { icon: EPFSmartphone, name: "Smart Home", slug: "smart-home", dbSlug: "" },
];

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/services", label: "Services" },
  { href: "/shop", label: "Shop" },
  { href: "/projects", label: "Projects" },
  { href: "/cost-estimator", label: "Cost Estimator" },
  { href: "/deals", label: "Best Deals" },
];

const subcategories = [
  "PVC Cables", "XLPE Cables", "Armoured Cables", "Bare Conductors", "Coaxial Cables",
  "Flexible Cables", "Control Cables", "HT Cables", "Fire Resistant", "LSZH Cables",
];

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
  if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
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
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});
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

  useEffect(() => {
    (async () => {
      try {
        const data = await apiFetch<{ categories: { slug: string; _count?: { products: number } }[] }>("/api/products?countOnly=true");
        const counts: Record<string, number> = {};
        (data.categories ?? []).forEach((cat) => {
          counts[cat.slug] = cat._count?.products ?? 0;
        });
        setCategoryCounts(counts);
      } catch {
        // Silently fail
      }
    })();
  }, []);

  const getCategoryCount = (cat: (typeof megaCategories)[number]): string => {
    const key = cat.dbSlug || cat.slug;
    const cnt = categoryCounts[key];
    if (cnt === undefined) return "0";
    return formatCount(cnt);
  };

  useEffect(() => {
    const onScroll = () => setHeaderShadow(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!mobileOpen) return;
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
      const [prodRes, svcRes, projRes] = await Promise.allSettled([
        apiFetch<{ data: { data: SearchResult[] } }>(`/api/products?search=${encodeURIComponent(query)}&limit=3`),
        apiFetch<{ services: SearchResult[] }>(`/api/services?search=${encodeURIComponent(query)}&limit=2`),
        apiFetch<{ data: SearchResult[] }>(`/api/projects?search=${encodeURIComponent(query)}&limit=2`),
      ]);
      const products = prodRes.status === "fulfilled" ? (prodRes.value?.data?.data ?? []) : [];
      const services = svcRes.status === "fulfilled" ? (svcRes.value?.services ?? []) : [];
      const projects = projRes.status === "fulfilled" ? (projRes.value?.data ?? []) : [];
      setSearchResults({ products, services, projects });
      setShowDropdown(true);
    } catch {
      setShowDropdown(false);
    }
  }, []);

  const handleSearchChange = (val: string) => {
    setLocalSearch(val);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => doSearch(val), 300);
  };

  const handleSearch = () => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
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
    <header className="sticky top-0 z-50 bg-white">
      {/* ROW 1 */}
      <div className="border-b border-dark-200">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-12">
          <div className="flex items-center h-[70px] gap-6">
            {/* Logo - first focusable element */}
            <Link href="/" className="flex flex-col shrink-0 group focus:outline-none focus-visible:ring-2 focus-visible:ring-epf-500 rounded" tabIndex={0}>
              <span className="text-[26px] font-extrabold tracking-tight text-dark-900 leading-none group-hover:text-epf-500 transition-colors">
                e<span className="text-epf-500">Power</span>Fix
              </span>
              <span className="text-[12px] text-dark-500 font-semibold tracking-[0.2em] uppercase leading-none mt-1">ELECTRICAL MARKETPLACE</span>
            </Link>

            {/* Search Bar - Desktop */}
            <div className="hidden md:flex flex-1 justify-center relative" ref={searchRef}>
              <div className="flex w-full max-w-[700px] h-[42px] rounded border border-dark-200 relative">
                <I.Search className="h-[18px] w-[18px] text-dark-400 my-auto ml-3 shrink-0" />
                <input
                  type="text"
                  placeholder="Search products, services or projects..."
                  value={localSearch}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  onFocus={() => localSearch.length >= 2 && setShowDropdown(true)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleSearch(); if (e.key === "Escape") setShowDropdown(false); }}
                  className="flex-1 h-full px-3 text-[15px] bg-white focus:outline-none text-dark-900 placeholder:text-dark-400"
                  aria-label="Search"
                />
                <button
                  onClick={handleSearch}
                  className="bg-epf-500 text-white h-full px-5 flex items-center hover:bg-epf-600 transition-colors text-[14px] font-semibold"
                >
                  Search
                </button>

                {/* Search Dropdown */}
                {showDropdown && localSearch.length >= 2 && (
                  <div className="absolute top-full left-0 right-0 bg-white border border-dark-200 rounded-b shadow-md z-50 max-h-[400px] overflow-y-auto search-dropdown">
                    {!hasResults && (
                      <div className="p-6 text-center">
                        <p className="text-[14px] text-dark-500">No results found</p>
                        <p className="text-[13px] text-dark-400 mt-1">Browse <a href="/shop" className="text-epf-500 hover:underline">Shop</a> for categories</p>
                      </div>
                    )}
                    {searchResults.products.length > 0 && (
                      <div>
                        <p className="px-4 py-2 text-[12px] font-bold uppercase tracking-wider text-dark-400 bg-dark-50">Products</p>
                        {searchResults.products.map((p) => (
                          <button key={p.id} onClick={() => { setShowDropdown(false); window.location.href = `/shop?search=${encodeURIComponent(localSearch)}`; }} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-dark-50 border-b border-dark-200 last:border-0 text-left">
                            <div className="h-9 w-9 bg-dark-100 rounded flex items-center justify-center shrink-0">
                              {p.image ? <img src={p.image} alt="" className="h-7 w-7 object-contain" /> : <I.Package className="h-4 w-4 text-dark-400" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[13px] text-dark-900 truncate">{p.name}</p>
                            </div>
                            <span className="text-[13px] font-semibold text-epf-500 shrink-0">৳{p.price?.toLocaleString()}</span>
                          </button>
                        ))}
                      </div>
                    )}
                    {searchResults.services.length > 0 && (
                      <div>
                        <p className="px-4 py-2 text-[12px] font-bold uppercase tracking-wider text-dark-400 bg-dark-50">Services</p>
                        {searchResults.services.map((s) => (
                          <button key={s.id} onClick={() => { setShowDropdown(false); window.location.href = "/services"; }} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-dark-50 border-b border-dark-200 last:border-0 text-left">
                            <div className="h-9 w-9 bg-epf-50 rounded-full flex items-center justify-center shrink-0">
                              <I.Wrench className="h-4 w-4 text-epf-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[13px] text-dark-900 truncate">{s.name}</p>
                            </div>
                            {s.price !== undefined && <span className="text-[12px] text-dark-500 shrink-0">From ৳{s.price}</span>}
                          </button>
                        ))}
                      </div>
                    )}
                    {searchResults.projects.length > 0 && (
                      <div>
                        <p className="px-4 py-2 text-[12px] font-bold uppercase tracking-wider text-dark-400 bg-dark-50">Projects</p>
                        {searchResults.projects.map((p) => (
                          <button key={p.id} onClick={() => { setShowDropdown(false); window.location.href = "/projects"; }} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-dark-50 border-b border-dark-200 last:border-0 text-left">
                            <div className="h-9 w-9 bg-dark-100 rounded flex items-center justify-center shrink-0">
                              {p.image ? <img src={p.image} alt="" className="h-7 w-7 object-cover rounded" /> : <I.Cpu className="h-4 w-4 text-dark-400" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[13px] text-dark-900 truncate">{p.name}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                    {hasResults && (
                      <a href={`/shop?search=${encodeURIComponent(localSearch)}`} className="block px-4 py-3 text-center text-[13px] font-semibold text-epf-500 hover:bg-epf-50 border-t border-dark-200 transition-colors">
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
                    className="hidden lg:flex items-center gap-1.5 px-2 py-1 rounded hover:bg-dark-50 transition-colors"
                  >
                    <div className="h-6 w-6 rounded-full bg-epf-500 text-white text-[12px] font-bold flex items-center justify-center shrink-0">
                      {user.name?.charAt(0)?.toUpperCase() || "U"}
                    </div>
                    <div className="flex flex-col leading-tight">
                      <span className="text-[13px] text-dark-500">Hello, {user.name?.split(" ")[0]}</span>
                      <span className="text-[14px] font-medium text-dark-900">My Account</span>
                    </div>
                  </button>
                ) : (
                  <a href="/login" className="hidden lg:flex items-center gap-1.5 px-2 py-1 rounded hover:bg-dark-50 transition-colors">
                    <I.User className="h-[16px] w-[16px] text-dark-500" />
                    <div className="flex flex-col leading-tight">
                      <span className="text-[13px] text-dark-500">Login</span>
                      <span className="text-[14px] font-medium text-dark-900">Account</span>
                    </div>
                  </a>
                )}

                {/* User Dropdown Menu (when logged in) */}
                {user && userMenuOpen && (
                  <div className="absolute right-0 top-full mt-1 w-[220px] bg-white border border-dark-200 rounded-lg shadow-md py-1 z-50">
                    <div className="px-4 py-3 border-b border-dark-200">
                      <p className="text-[14px] font-semibold text-dark-900">{user.name}</p>
                      <p className="text-[12px] text-dark-500">{user.email}</p>
                    </div>
                    <a href="/order-track" className="flex items-center gap-2.5 px-4 py-2.5 text-[14px] text-dark-700 hover:bg-dark-50 hover:text-epf-500 transition-colors">
                      <I.Truck className="h-4 w-4" /> Track Order
                    </a>
                    <a href="/profile" className="flex items-center gap-2.5 px-4 py-2.5 text-[14px] text-dark-700 hover:bg-dark-50 hover:text-epf-500 transition-colors">
                      <I.User className="h-4 w-4" /> My Profile
                    </a>
                    <a href="/cost-estimator" className="flex items-center gap-2.5 px-4 py-2.5 text-[14px] text-dark-700 hover:bg-dark-50 hover:text-epf-500 transition-colors">
                      <I.Calculator className="h-4 w-4" /> Cost Estimator
                    </a>
                    <a href="/wishlist" className="flex items-center gap-2.5 px-4 py-2.5 text-[14px] text-dark-700 hover:bg-dark-50 hover:text-epf-500 transition-colors">
                      <I.Heart className="h-4 w-4" /> Wishlist
                    </a>
                    <div className="border-t border-dark-200 my-1" />
                    <button onClick={handleLogout} className="flex items-center gap-2.5 px-4 py-2.5 text-[14px] text-danger hover:bg-dark-50 transition-colors w-full text-left">
                      Logout
                    </button>
                  </div>
                )}

                {/* Login/Register Dropdown (when NOT logged in) */}
                {!user && (
                  <div className="hidden lg:block absolute right-0 top-full mt-0.5 w-[140px] bg-white border border-dark-200 rounded-md shadow-md py-1 z-50 group-hover:opacity-100 group-hover:visible opacity-0 invisible transition-all">
                    <a href="/login" className="block px-4 py-2 text-[14px] text-dark-700 hover:bg-dark-50 hover:text-epf-500 transition-colors">Login</a>
                    <a href="/register" className="block px-4 py-2 text-[14px] text-dark-700 hover:bg-dark-50 hover:text-epf-500 transition-colors">Register</a>
                  </div>
                )}
              </div>

              {/* Wishlist */}
              <a href="/wishlist" className="hidden lg:flex flex-col items-center px-2 py-1 rounded hover:bg-dark-50 transition-colors">
                <I.Heart className="h-[16px] w-[16px] text-dark-500" />
                <span className="text-[13px] text-dark-700">Wishlist</span>
              </a>

              {/* Cart */}
              <button
                onClick={() => setCartOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded border border-dark-200 hover:border-dark-300 hover:bg-dark-50 transition-colors relative"
              >
                <div className="relative">
                  <I.Cart className="h-[18px] w-[18px] text-dark-700" />
                  {mounted && count > 0 && (
                    <span className="absolute -top-2 -right-2 h-[15px] min-w-[15px] rounded-full bg-epf-500 text-white text-[12px] font-bold flex items-center justify-center px-0.5">
                      {formatCount(count)}
                    </span>
                  )}
                </div>
                <div className="hidden sm:flex flex-col leading-tight">
                  <span className="text-[13px] text-dark-500">Cart</span>
                  <span className="text-[14px] font-semibold text-dark-900">{mounted ? `৳${total.toLocaleString()}` : ""}</span>
                </div>
              </button>

              {/* Mobile menu trigger */}
              <button
                className="md:hidden flex items-center justify-center text-dark-900 ml-1"
                onClick={() => setMobileOpen(true)}
              >
                <I.Menu className="h-[22px] w-[22px]" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ROW 2 */}
      <div id="header-row-2" className={`bg-dark-900 transition-shadow duration-200 ${headerShadow ? "shadow-md" : ""}`}>
        <div className="mx-auto max-w-[1400px] px-4 sm:px-12">
          <div className="flex items-center h-[44px]">
            {/* Shop By Category + Mega Menu */}
            <div
              className="relative hidden lg:block"
              onMouseEnter={() => { clearTimeout(megaTimeout.current!); setMegaOpen(true); }}
              onMouseLeave={() => { megaTimeout.current = setTimeout(() => setMegaOpen(false), 200); }}
            >
              <button className="flex items-center gap-2 h-[44px] px-5 bg-dark-900 text-white hover:bg-dark-950 transition-colors">
                <I.Menu className="h-[18px] w-[18px]" />
                <span className="text-[15px] font-bold">Categories</span>
                <ChevronDown className="h-3.5 w-3.5 text-epf-500" />
              </button>

              {megaOpen && (
                <div
                  className="absolute top-[44px] left-0 w-[750px] bg-white border border-dark-200 z-[60] flex rounded-b"
                  onMouseEnter={() => { clearTimeout(megaTimeout.current!); setMegaOpen(true); }}
                  onMouseLeave={() => { megaTimeout.current = setTimeout(() => setMegaOpen(false), 200); }}
                >
                  <div className="w-[260px] border-r border-dark-200 py-1 bg-dark-50">
                    {megaCategories.map((cat, i) => {
                      const Icon = iconMap[cat.slug] || EPFTag;
                      return (
                        <a
                          key={cat.slug}
                          href="/shop"
                          onClick={(e) => { e.preventDefault(); setMegaOpen(false); window.location.href = "/shop"; }}
                          className={`w-full flex items-center gap-3 px-4 py-2.5 text-left text-[14px] transition-all border-l-[3px] ${
                            i === 0
                              ? "bg-white text-epf-500 font-semibold border-epf-500"
                              : "text-dark-700 hover:bg-white hover:text-dark-900 border-transparent"
                          }`}
                        >
                          <span className={i === 0 ? "text-epf-500" : "text-dark-500"}>
                            <Icon className="h-4 w-4" />
                          </span>
                          <span className="flex-1 truncate">{cat.name}</span>
                          <span className="text-[13px] text-dark-500 bg-dark-200 px-1.5 py-0.5 rounded">{getCategoryCount(cat)}</span>
                        </a>
                      );
                    })}
                  </div>
                  <div className="flex-1 p-5">
                    <p className="text-[13px] font-bold uppercase tracking-wider text-dark-500 mb-3">Sub-Categories</p>
                    <div className="grid grid-cols-2 gap-x-6 mb-5">
                      {subcategories.map((sub) => (
                        <a
                          key={sub}
                          href="/shop"
                          onClick={(e) => { e.preventDefault(); setMegaOpen(false); window.location.href = "/shop"; }}
                          className="flex items-center gap-2 py-1.5 text-[14px] text-dark-700 hover:text-epf-500 transition-colors group"
                        >
                          <span className="h-1 w-1 rounded-full bg-dark-400 group-hover:bg-epf-500 transition-colors shrink-0" />
                          <span>{sub}</span>
                        </a>
                      ))}
                    </div>
                    <div className="border-t border-dark-200 pt-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-[13px] font-bold uppercase tracking-wider text-dark-500 mb-1">Featured Product</p>
                          <p className="text-[15px] font-semibold text-dark-900">3-core 4mm² PVC Cable</p>
                          <p className="text-[16px] font-semibold text-dark-900 mt-0.5">৳1,850</p>
                        </div>
                        <a
                          href="/shop"
                          onClick={(e) => { e.preventDefault(); setMegaOpen(false); window.location.href = "/shop"; }}
                          className="h-9 px-4 bg-epf-500 text-white text-[14px] font-bold hover:bg-epf-600 transition-colors flex items-center gap-1.5 rounded-[4px]"
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
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }
                  }}
                  className={`px-3 py-2 text-[15px] font-semibold transition-colors relative group flex items-center gap-1 ${
                    isActive ? "font-bold text-epf-500" : "text-dark-50 hover:text-epf-500"
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
                href="/cost-estimator"
                className="flex items-center gap-1.5 text-[14px] font-medium text-epf-500 hover:text-epf-600 transition-colors"
              >
                <I.LogoBolt className="h-[16px] w-[16px]" /> Cost Estimator
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
          <div className="lg:hidden border-t border-dark-200 bg-white px-4 py-3">
            <div className="flex h-[42px]">
              <input
                type="text"
                placeholder="Search products, services or projects..."
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="flex-1 px-4 text-[14px] bg-dark-50 border border-dark-200 focus:outline-none rounded-l-[4px]"
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
          <div className="fixed inset-y-0 right-0 w-80 bg-white z-[70] shadow-xl overflow-y-auto">
            <div className="bg-dark-900 p-5">
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
            <nav className="border-b border-dark-200">
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
                  className={`flex items-center justify-between w-full px-5 py-3.5 text-[15px] font-medium border-b border-dark-200 ${
                    isActive ? "bg-epf-50 text-dark-900 font-semibold" : "text-dark-700 hover:bg-dark-50"
                  }`}
                >
                  <span className={`flex items-center gap-2 ${isActive ? "text-epf-500" : ""}`}>
                    {link.label}
                  </span>
                  <I.ChevronRight className="h-4 w-4 text-dark-400" />
                </a>
                );
              })}
            </nav>
            <div>
              <p className="px-5 py-3 text-[13px] font-bold uppercase tracking-wider text-dark-500 bg-dark-50">Categories</p>
              {megaCategories.map((cat) => (
                <a
                  key={cat.slug}
                  href="/shop"
                  onClick={(e) => {
                    e.preventDefault();
                    setMobileOpen(false);
                    window.location.href = "/shop";
                  }}
                  className="flex items-center gap-3 w-full px-5 py-3 text-[14px] text-dark-700 hover:bg-dark-50 border-b border-dark-200"
                >
                  <span className="text-epf-500"><EPFTag className="h-4 w-4" /></span>
                  <span className="flex-1 text-left">{cat.name}</span>
                  <I.ChevronRight className="h-3.5 w-3.5 text-dark-400" />
                </a>
              ))}
            </div>
            <div className="p-4 border-t border-dark-200 flex gap-2">
              <button onClick={() => window.location.href = '/login'} className="flex-1 h-10 bg-epf-500 text-white text-[14px] font-bold rounded-[4px] hover:bg-epf-600">Login / Register</button>
            </div>
          </div>
          <div className="fixed inset-0 bg-black/30 z-[65]" onClick={() => setMobileOpen(false)} />
        </>
      )}
    </header>
  );
}
