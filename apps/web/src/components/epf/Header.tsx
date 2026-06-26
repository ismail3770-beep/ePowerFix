"use client";
import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import {
  Menu,
  Search,
  ChevronDown,
  ShoppingCart,
  User,
  Heart,
  X,
  Zap,
  Truck,
  Tag,
  ChevronRight,
  ArrowRight,
  Cable,
  ShieldCheck,
  Lightbulb,
  Cpu,
  Wrench,
  HardHat,
  Plug,
  Sun,
  BookOpen,
  Smartphone,
} from "lucide-react";
import { useCartStore, useUIStore } from "@/store";
import { useAuthStore } from "@/store/auth-store";
import { apiFetch } from "@/lib/api";

const megaCategories = [
  { icon: Cable, name: "Cables & Wires", slug: "cables-wires", dbSlug: "wires-cables" },
  { icon: ShieldCheck, name: "Circuit Breakers", slug: "circuit-breakers", dbSlug: "circuit-breakers" },
  { icon: Lightbulb, name: "LED & Lighting", slug: "led-lighting", dbSlug: "led-lights" },
  { icon: Cpu, name: "Switches & Sockets", slug: "switches-sockets", dbSlug: "switches-sockets" },
  { icon: Wrench, name: "Testing Tools", slug: "testing-tools", dbSlug: "tools-accessories" },
  { icon: HardHat, name: "Safety Equipment", slug: "safety-equipment", dbSlug: "" },
  { icon: Plug, name: "Motors & Drives", slug: "motors-drives", dbSlug: "" },
  { icon: Sun, name: "Solar Equipment", slug: "solar-equipment", dbSlug: "solar-equipment" },
  { icon: BookOpen, name: "Digital Guides", slug: "digital-guides", dbSlug: "" },
  { icon: Smartphone, name: "Smart Home", slug: "smart-home", dbSlug: "" },
];

const navLinks = [
  { href: "/", label: "HOME" },
  { href: "/services", label: "Services" },
  { href: "/shop", label: "Shop" },
  { href: "/projects", label: "Projects" },
  { href: "/tools", label: "Tools" },
  { href: "/deals", label: "Best Deals", badge: "HOT" },
];

const subcategories = [
  "PVC Cables", "XLPE Cables", "Armoured Cables", "Bare Conductors", "Coaxial Cables",
  "Flexible Cables", "Control Cables", "HT Cables", "Fire Resistant", "LSZH Cables",
];

const iconMap: Record<string, React.ElementType> = {
  "cables-wires": Cable,
  "circuit-breakers": ShieldCheck,
  "led-lighting": Lightbulb,
  "switches-sockets": Cpu,
  "testing-tools": Wrench,
  "safety-equipment": HardHat,
  "motors-drives": Plug,
  "solar-equipment": Sun,
  "digital-guides": BookOpen,
  "smart-home": Smartphone,
};

function formatCount(count: number): string {
  if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
  return String(count);
}

export default function Header() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [megaOpen, setMegaOpen] = useState(false);
  const [headerShadow, setHeaderShadow] = useState(false);
  const [localSearch, setLocalSearch] = useState("");
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});
  const megaTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { setSearchQuery, setCartOpen } = useUIStore();
  const { getTotal, getItemCount } = useCartStore();
  const { user } = useAuthStore();
  const total = getTotal();
  const count = getItemCount();

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
        // Silently fail — will show 0
      }
    })();
  }, []);

  const getCategoryCount = (cat: (typeof megaCategories)[number]): string => {
    const key = cat.dbSlug || cat.slug;
    const count = categoryCounts[key];
    if (count === undefined) return "0";
    return formatCount(count);
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

  const handleSearch = () => {
    setSearchQuery(localSearch);
  };

  return (
    <header className="sticky top-0 z-50 bg-white">
      {/* ROW 1 */}
      <div className="border-b border-[#E2E8F0]">
        <div className="mx-auto max-w-[1920px] px-4 sm:px-12">
          <div className="flex items-center h-[70px] gap-6">
            {/* Logo */}
            <a href="#" className="flex flex-col shrink-0 group" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: "smooth" }); }}>
              <span className="text-[26px] font-extrabold tracking-tight text-[#111827] leading-none group-hover:text-[#0EA5E9] transition-colors">
                e<span className="text-[#0EA5E9]">Power</span>Fix
              </span>
              <span className="text-[12px] text-[#6B7280] font-semibold tracking-[0.2em] uppercase leading-none mt-1">ELECTRICAL MARKETPLACE</span>
            </a>

            {/* Search Bar */}
            <div className="hidden md:flex flex-1 justify-center">
              <div className="flex w-full max-w-[700px] h-[42px] rounded overflow-hidden border border-[#E2E8F0]">
                <input
                  type="text"
                  placeholder="Search for cables, breakers, tools, guides..."
                  value={localSearch}
                  onChange={(e) => setLocalSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="flex-1 h-full px-4 text-[15px] bg-white focus:outline-none text-[#111827] placeholder:text-[#6B7280]"
                />
                <button
                  onClick={handleSearch}
                  className="bg-[#0EA5E9] text-white h-full px-5 flex items-center hover:bg-[#0284C7] transition-colors"
                >
                  <Search className="h-[18px] w-[18px]" />
                </button>
              </div>
            </div>

            {/* Right Icons */}
            <div className="flex items-center gap-1 ml-auto shrink-0">
              {/* Account */}
              {user ? (
                <a href="/profile" className="hidden lg:flex items-center gap-1.5 px-2 py-1 rounded hover:bg-[#F1F5F9] transition-colors">
                  <div className="h-6 w-6 rounded-full bg-[#0EA5E9] text-white text-[12px] font-bold flex items-center justify-center shrink-0">
                    {user.name?.charAt(0)?.toUpperCase() || "U"}
                  </div>
                  <div className="flex flex-col leading-tight">
                    <span className="text-[13px] text-[#6B7280]">Hello, {user.name?.split(" ")[0]}</span>
                    <span className="text-[14px] font-medium text-[#111827]">My Account</span>
                  </div>
                </a>
              ) : (
                <a href="/login" className="hidden lg:flex items-center gap-1.5 px-2 py-1 rounded hover:bg-[#F1F5F9] transition-colors">
                  <User className="h-[16px] w-[16px] text-[#6B7280]" />
                  <div className="flex flex-col leading-tight">
                    <span className="text-[13px] text-[#6B7280]">Hello, Sign in</span>
                    <span className="text-[14px] font-medium text-[#111827]">Account</span>
                  </div>
                </a>
              )}

              {/* Wishlist */}
              <a href="#" className="hidden lg:flex flex-col items-center px-2 py-1 rounded hover:bg-[#F1F5F9] transition-colors">
                <Heart className="h-[16px] w-[16px] text-[#6B7280]" />
                <span className="text-[13px] text-[#374151]">Wishlist</span>
              </a>

              {/* Cart */}
              <button
                onClick={() => setCartOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded border border-[#E2E8F0] hover:border-[#CBD5E1] hover:bg-[#F8FAFC] transition-colors relative"
              >
                <div className="relative">
                  <ShoppingCart className="h-[18px] w-[18px] text-[#374151]" />
                  {count > 0 && (
                    <span className="absolute -top-2 -right-2 h-[15px] min-w-[15px] rounded-full bg-[#0EA5E9] text-white text-[12px] font-bold flex items-center justify-center px-0.5">
                      {count}
                    </span>
                  )}
                </div>
                <div className="hidden sm:flex flex-col leading-tight">
                  <span className="text-[13px] text-[#6B7280]">Your Cart</span>
                  <span className="text-[14px] font-semibold text-[#111827]">৳{total.toLocaleString()}</span>
                </div>
              </button>

              {/* Mobile menu trigger */}
              <button
                className="md:hidden flex items-center justify-center text-[#111827] ml-1"
                onClick={() => setMobileOpen(true)}
              >
                <Menu className="h-[22px] w-[22px]" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ROW 2 */}
      <div id="header-row-2" className={`bg-[#111827] transition-shadow duration-200 ${headerShadow ? "shadow-md" : ""}`}>
        <div className="mx-auto max-w-[1920px] px-4 sm:px-12">
          <div className="flex items-center h-[44px]">
            {/* Shop By Category + Mega Menu */}
            <div
              className="relative hidden lg:block"
              onMouseEnter={() => { clearTimeout(megaTimeout.current!); setMegaOpen(true); }}
              onMouseLeave={() => { megaTimeout.current = setTimeout(() => setMegaOpen(false), 200); }}
            >
              <button className="flex items-center gap-2 h-[44px] px-5 bg-[#111827] text-white hover:bg-black transition-colors">
                <Menu className="h-[18px] w-[18px]" />
                <span className="text-[15px] font-bold">Shop By Category</span>
                <ChevronDown className="h-3.5 w-3.5 text-[#0EA5E9]" />
              </button>

              {megaOpen && (
                <div
                  className="absolute top-[44px] left-0 w-[750px] bg-white border border-[#E2E8F0] z-[60] flex rounded-b"
                  onMouseEnter={() => { clearTimeout(megaTimeout.current!); setMegaOpen(true); }}
                  onMouseLeave={() => { megaTimeout.current = setTimeout(() => setMegaOpen(false), 200); }}
                >
                  {/* Left */}
                  <div className="w-[260px] border-r border-[#E2E8F0] py-1 bg-[#F8FAFC]">
                    {megaCategories.map((cat, i) => {
                      const Icon = iconMap[cat.slug] || Tag;
                      return (
                        <a
                          key={cat.slug}
                          href="/shop"
                          onClick={(e) => { e.preventDefault(); setMegaOpen(false); window.location.href = "/shop"; }}
                          className={`w-full flex items-center gap-3 px-4 py-2.5 text-left text-[14px] transition-all border-l-[3px] ${
                            i === 0
                              ? "bg-white text-[#0EA5E9] font-semibold border-[#0EA5E9]"
                              : "text-[#374151] hover:bg-white hover:text-[#111827] border-transparent"
                          }`}
                        >
                          <span className={i === 0 ? "text-[#0EA5E9]" : "text-[#6B7280]"}>
                            <Icon className="h-4 w-4" />
                          </span>
                          <span className="flex-1 truncate">{cat.name}</span>
                          <span className="text-[13px] text-[#6B7280] bg-[#E2E8F0] px-1.5 py-0.5 rounded">{getCategoryCount(cat)}</span>
                        </a>
                      );
                    })}
                  </div>
                  {/* Right */}
                  <div className="flex-1 p-5">
                    <p className="text-[13px] font-bold uppercase tracking-wider text-[#6B7280] mb-3">Subcategories</p>
                    <div className="grid grid-cols-2 gap-x-6 mb-5">
                      {subcategories.map((sub) => (
                        <a
                          key={sub}
                          href="/shop"
                          onClick={(e) => { e.preventDefault(); setMegaOpen(false); window.location.href = "/shop"; }}
                          className="flex items-center gap-2 py-1.5 text-[14px] text-[#374151] hover:text-[#0EA5E9] transition-colors group"
                        >
                          <span className="h-1 w-1 rounded-full bg-[#94A3B8] group-hover:bg-[#0EA5E9] transition-colors shrink-0" />
                          <span>{sub}</span>
                        </a>
                      ))}
                    </div>
                    <div className="border-t border-[#E2E8F0] pt-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-[13px] font-bold uppercase tracking-wider text-[#6B7280] mb-1">Featured Product</p>
                          <p className="text-[15px] font-semibold text-[#111827]">3-core 4mm² PVC Cable</p>
                          <p className="text-[16px] font-semibold text-[#111827] mt-0.5">৳1,850</p>
                        </div>
                        <a
                          href="/shop"
                          onClick={(e) => { e.preventDefault(); setMegaOpen(false); window.location.href = "/shop"; }}
                          className="h-9 px-4 bg-[#0EA5E9] text-white text-[14px] font-bold hover:bg-[#0284C7] transition-colors flex items-center gap-1.5 rounded-[4px]"
                        >
                          View <ArrowRight className="h-3 w-3" />
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Nav Links */}
            <nav className="hidden lg:flex items-center gap-1 flex-1 justify-center">
              {navLinks.map((link, i) => {
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
                    isActive ? "font-bold text-[#0EA5E9]" : "text-[#F8FAFC] hover:text-[#0EA5E9]"
                  }`}
                >
                  <span>{link.label}</span>
                  {link.badge && (
                    <span className="bg-[#0EA5E9] text-white text-[12px] font-bold px-1.5 py-0.5 rounded-sm leading-none">{link.badge}</span>
                  )}
                  <span className={`absolute bottom-0 left-0 right-0 h-[2px] bg-[#0EA5E9] transition-transform ${isActive ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"}`} />
                </a>
                );
              })}
            </nav>

            {/* Right Utility */}
            <div className="hidden lg:flex items-center gap-4 ml-auto">
              <a
                href="/tools"
                className="flex items-center gap-1.5 text-[14px] font-medium text-[#0EA5E9] hover:text-[#0284C7] transition-colors"
              >
                <Zap className="h-[16px] w-[16px]" /> Free Tools
              </a>
              <span className="w-px h-4 bg-white/20" />
              <a
                href="/services"
                className="flex items-center gap-1.5 text-[14px] font-medium text-[#0EA5E9] hover:text-[#0284C7] transition-colors"
              >
                <Truck className="h-[16px] w-[16px]" /> Book Service
              </a>
            </div>

            {/* Mobile Search Toggle */}
            <button
              className="lg:hidden h-[44px] w-10 flex items-center justify-center text-white ml-auto"
              onClick={() => setSearchOpen(!searchOpen)}
            >
              {searchOpen ? <X className="h-[18px] w-[18px]" /> : <Search className="h-[18px] w-[18px]" />}
            </button>
          </div>
        </div>

        {/* Mobile search bar */}
        {searchOpen && (
          <div className="lg:hidden border-t border-[#CBD5E1] bg-white px-4 py-3">
            <div className="flex h-[42px]">
              <input
                type="text"
                placeholder="Search products..."
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="flex-1 px-4 text-[14px] bg-[#F8FAFC] border border-[#CBD5E1] focus:outline-none rounded-l-[4px]"
              />
              <button
                onClick={handleSearch}
                className="bg-[#0EA5E9] text-white px-5 rounded-r-[4px]"
              >
                <Search className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Slide Menu */}
      {mobileOpen && (
        <>
          <div className="fixed inset-y-0 right-0 w-80 bg-white z-[70] shadow-xl overflow-y-auto">
            <div className="bg-[#111827] p-5">
              <div className="flex items-center justify-between">
                <span className="text-[18px] font-bold text-white leading-none">
                  e<span className="text-[#0EA5E9]">Power</span>Fix
                </span>
                <button onClick={() => setMobileOpen(false)} className="text-white/80 hover:text-white">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            <nav className="border-b border-[#E2E8F0]">
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
                  className={`flex items-center justify-between w-full px-5 py-3.5 text-[15px] font-medium border-b border-[#E2E8F0] ${
                    isActive ? "bg-[#F0F9FF] text-[#111827] font-semibold" : "text-[#374151] hover:bg-[#F1F5F9]"
                  }`}
                >
                  <span className={`flex items-center gap-2 ${isActive ? "text-[#0EA5E9]" : ""}`}>
                    {link.label}
                  </span>
                  <ChevronRight className="h-4 w-4 text-[#94A3B8]" />
                </a>
                );
              })}
            </nav>
            <div>
              <p className="px-5 py-3 text-[13px] font-bold uppercase tracking-wider text-[#6B7280] bg-[#F8FAFC]">Categories</p>
              {megaCategories.map((cat) => (
                <a
                  key={cat.slug}
                  href="/shop"
                  onClick={(e) => {
                    e.preventDefault();
                    setMobileOpen(false);
                    window.location.href = "/shop";
                  }}
                  className="flex items-center gap-3 w-full px-5 py-3 text-[14px] text-[#374151] hover:bg-[#F1F5F9] border-b border-[#E2E8F0]"
                >
                  <span className="text-[#0EA5E9]"><Tag className="h-4 w-4" /></span>
                  <span className="flex-1 text-left">{cat.name}</span>
                  <ChevronRight className="h-3.5 w-3.5 text-[#94A3B8]" />
                </a>
              ))}
            </div>
            <div className="p-4 border-t border-[#E2E8F0] flex gap-2">
              <button className="flex-1 h-10 bg-[#0EA5E9] text-white text-[14px] font-bold rounded-[4px] hover:bg-[#0284C7]">Login / Register</button>

            </div>
          </div>
          <div className="fixed inset-0 bg-black/30 z-[65]" onClick={() => setMobileOpen(false)} />
        </>
      )}
    </header>
  );
}