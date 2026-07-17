"use client";

import Link from "next/link";
import { type MouseEvent, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  BookOpen,
  Cable,
  ChevronRight,
  Lightbulb,
  Package,
  Plug,
  RefreshCw,
  ShieldCheck,
  ShoppingCart,
  Star,
  Sun,
  Truck,
  UserRoundCheck,
  Wrench,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import Header from "@/components/epf/Header";
import Footer from "@/components/epf/Footer";
import HomeClient from "@/components/epf/HomeClient";
import BrandStrip from "@/components/epf/BrandStrip";
import WishlistButton from "@/components/WishlistButton";
import { useCartStore, useUIStore } from "@/store";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";

interface Banner {
  id: string;
  title: string;
  subtitle: string | null;
  image: string;
  link: string | null;
}

interface Product {
  id: string;
  name: string;
  slug?: string;
  price: number;
  salePrice?: number | null;
  comparePrice?: number | null;
  images: string[];
  stock: number;
  rating?: number;
  reviewCount?: number;
  category?: { name: string; slug: string } | null;
  itemType?: "PRODUCT" | "PROJECT";
}

interface ProductListResponse {
  data: { data: Product[]; total: number };
}

interface Category {
  id: string;
  name: string;
  slug: string;
  image?: string | null;
  _count?: { products: number };
}

interface Service {
  id: string;
  name: string;
  slug?: string;
  shortDesc?: string | null;
  description: string;
  images?: string[];
  isFeatured?: boolean;
}

interface Project {
  id: string;
  title: string;
  slug: string;
  coverImage?: string | null;
  images?: string[];
  category?: string;
}

interface BlogPost {
  id: string;
  title: string;
  titleBn?: string | null;
  slug: string;
  excerpt?: string | null;
  content?: string;
  coverImage?: string | null;
  createdAt: string;
}

interface BlogResponse {
  data: { data: BlogPost[] };
}

const fallbackCategories: Category[] = [
  { id: "cables-wires", name: "Cables & Wires", slug: "cables-wires" },
  { id: "circuit-breakers", name: "Circuit Breakers", slug: "circuit-breakers" },
  { id: "led-lighting", name: "LED Lighting", slug: "led-lighting" },
  { id: "switches-sockets", name: "Switches & Sockets", slug: "switches-sockets" },
  { id: "testing-tools", name: "Tools & Meters", slug: "testing-tools" },
  { id: "solar-equipment", name: "Solar Equipment", slug: "solar-equipment" },
];

const categoryIcons: Record<string, LucideIcon> = {
  "cables-wires": Cable,
  "circuit-breakers": ShieldCheck,
  "led-lighting": Lightbulb,
  "switches-sockets": Plug,
  "testing-tools": Wrench,
  "solar-equipment": Sun,
};

const fallbackSlide: Banner = {
  id: "epf-marketplace",
  title: "Power your work with confidence",
  subtitle: "Quality electrical products, expert services and practical project solutions — all from one trusted partner.",
  image: "",
  link: "/shop",
};

function useProducts(queryKey: string, endpoint: string) {
  return useQuery<ProductListResponse>({
    queryKey: [queryKey],
    queryFn: () => apiFetch<ProductListResponse>(endpoint),
    staleTime: 60 * 1000,
  });
}

function getDisplayPrice(product: Product) {
  return product.salePrice != null && product.salePrice < product.price ? product.salePrice : product.price;
}

function getOriginalPrice(product: Product) {
  return product.salePrice != null && product.salePrice < product.price ? product.price : null;
}

function SectionHeading({
  eyebrow,
  title,
  description,
  href,
  linkLabel = "View all",
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  href: string;
  linkLabel?: string;
}) {
  return (
    <div className="epf-reference-section-heading mb-5 flex items-end justify-between gap-4">
      <div className="min-w-0">
        {eyebrow && <span className="epf-eyebrow mb-2">{eyebrow}</span>}
        <h2 className="text-[24px] font-bold tracking-tight text-slate-900 sm:text-[28px]">{title}</h2>
        {description && <p className="mt-1 max-w-2xl text-[13px] text-slate-500 sm:text-sm">{description}</p>}
      </div>
      <Link href={href} className="epf-link inline-flex shrink-0 items-center gap-1.5 text-[13px] font-semibold text-epf-600 hover:text-epf-700">
        {linkLabel} <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}

function StarRating({ rating, reviews }: { rating?: number; reviews?: number }) {
  if (!rating) return null;

  return (
    <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
      {Number(rating).toFixed(1)}{typeof reviews === "number" ? ` (${reviews})` : ""}
    </span>
  );
}

function ProductCard({ product, compact = false }: { product: Product; compact?: boolean }) {
  const addItem = useCartStore((state) => state.addItem);
  const setCartOpen = useUIStore((state) => state.setCartOpen);
  const [imageError, setImageError] = useState(false);
  const displayPrice = getDisplayPrice(product);
  const originalPrice = getOriginalPrice(product);
  const discount = originalPrice ? Math.round(((originalPrice - displayPrice) / originalPrice) * 100) : 0;
  const image = product.images?.[0];
  const inStock = product.stock > 0;
  const href = product.itemType === "PROJECT" ? `/project-kits/${product.slug || product.id}` : `/shop/${product.slug || product.id}`;

  const handleAdd = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (!inStock) return;

    addItem({
      itemType: product.itemType || "PRODUCT",
      productId: product.id,
      productName: product.name,
      productImage: image || "",
      price: Number(displayPrice),
      quantity: 1,
    });
    toast.success("Added to cart", { description: product.name });
    setCartOpen(true);
  };

  return (
    <article className={cn("epf-reference-product-card group relative flex min-w-0 flex-col overflow-hidden border border-slate-200 bg-white", compact && "epf-reference-product-card--compact")}>
      <div className="relative aspect-square overflow-hidden bg-slate-50">
        {image && !imageError ? (
          <img src={image} alt={product.name} className="h-full w-full object-contain p-3 transition-transform duration-500 group-hover:scale-105" loading="lazy" onError={() => setImageError(true)} />
        ) : (
          <div className="flex h-full items-center justify-center"><Package className="h-9 w-9 text-slate-300" /></div>
        )}
        {discount > 0 && <span className="absolute left-2 top-2 bg-epf-500 px-2 py-0.5 text-[10px] font-bold text-white">-{discount}%</span>}
        {!inStock && <span className="absolute left-2 top-2 bg-slate-700 px-2 py-0.5 text-[10px] font-bold text-white">Out of stock</span>}
        <WishlistButton productId={product.id} className="absolute right-2 top-2 border border-slate-100 shadow-sm" />
        {inStock && (
          <button type="button" aria-label={`Add ${product.name} to cart`} onClick={handleAdd} className="absolute bottom-2 right-2 flex h-9 w-9 translate-y-1 items-center justify-center rounded-md bg-slate-900 text-white opacity-0 shadow-md transition-all duration-300 hover:bg-epf-500 group-hover:translate-y-0 group-hover:opacity-100">
            <ShoppingCart className="h-4 w-4" />
          </button>
        )}
      </div>
      <Link href={href} className="flex min-h-[126px] flex-1 flex-col border-t border-slate-100 p-3">
        {product.category?.name && <span className="truncate text-[10px] font-bold uppercase tracking-[0.12em] text-epf-600">{product.category.name}</span>}
        <h3 className="mt-1 line-clamp-2 text-[14px] font-semibold leading-5 text-slate-800 transition-colors group-hover:text-epf-600">{product.name}</h3>
        <div className="mt-auto pt-2">
          <StarRating rating={product.rating} reviews={product.reviewCount} />
          <div className="mt-1 flex flex-wrap items-baseline gap-1.5">
            <span className="text-[16px] font-bold text-slate-900">৳{Number(displayPrice).toLocaleString()}</span>
            {originalPrice && <del className="text-[12px] text-slate-400">৳{Number(originalPrice).toLocaleString()}</del>}
          </div>
        </div>
      </Link>
    </article>
  );
}

function HomeHero() {
  const [activeSlide, setActiveSlide] = useState(0);
  const { data } = useQuery<{ data: Banner[] }>({
    queryKey: ["home-banners"],
    queryFn: () => apiFetch<{ data: Banner[] }>("/api/banners"),
    staleTime: 5 * 60 * 1000,
  });
  const slides = data?.data?.length ? data.data : [fallbackSlide];
  const slide = slides[activeSlide % slides.length];

  useEffect(() => {
    if (slides.length < 2) return;
    const timer = window.setInterval(() => setActiveSlide((current) => (current + 1) % slides.length), 5000);
    return () => window.clearInterval(timer);
  }, [slides.length]);

  return (
    <section className="epf-reference-hero overflow-hidden bg-slate-900 text-white">
      <div className="mx-auto grid min-h-[390px] max-w-[1400px] items-center gap-8 px-4 py-10 sm:px-12 md:min-h-[430px] md:grid-cols-[1.04fr_.96fr] md:py-12">
        <div className="relative z-10 max-w-xl">
          <span className="inline-flex items-center gap-1.5 bg-epf-500 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-white">
            <Zap className="h-3 w-3" /> Electrical marketplace
          </span>
          <h1 className="mt-5 text-[40px] font-bold leading-[.98] tracking-tight sm:text-[54px] md:text-[62px]">{slide.title}</h1>
          <p className="mt-5 max-w-lg text-[14px] leading-6 text-white/70 sm:text-[15px]">{slide.subtitle || fallbackSlide.subtitle}</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href={slide.link || "/shop"} className="epf-btn inline-flex h-11 items-center gap-2 bg-epf-500 px-5 text-[13px] font-bold text-white hover:bg-epf-600">
              Shop now <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/services" className="inline-flex h-11 items-center border border-white/30 bg-white/5 px-5 text-[13px] font-semibold text-white transition-colors hover:border-white hover:bg-white/10">
              Explore services
            </Link>
          </div>
          <div className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-[11px] font-medium text-white/65">
            <span className="inline-flex items-center gap-1.5"><Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> Trusted products</span>
            <span className="inline-flex items-center gap-1.5"><Truck className="h-3.5 w-3.5 text-epf-500" /> Fast delivery</span>
            <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-epf-500" /> Secure checkout</span>
          </div>
        </div>

        <div className="relative mx-auto flex w-full max-w-[430px] items-center justify-center md:justify-end">
          <div className="absolute h-[300px] w-[300px] rounded-full border border-white/10 bg-white/[0.03] md:h-[360px] md:w-[360px]" />
          <div className="absolute h-[235px] w-[235px] rounded-full border border-epf-500/40 bg-epf-500/10 md:h-[286px] md:w-[286px]" />
          <div className="relative flex aspect-square w-[250px] items-center justify-center overflow-hidden rounded-full border-4 border-white/10 bg-slate-800 shadow-2xl sm:w-[300px]">
            {slide.image ? (
              <img src={slide.image} alt={slide.title} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center bg-[radial-gradient(circle_at_35%_30%,rgba(255,255,255,.18),transparent_23%),linear-gradient(145deg,#334155,#0f172a)]">
                <Zap className="h-20 w-20 text-epf-500 sm:h-24 sm:w-24" />
                <span className="mt-4 text-[12px] font-bold uppercase tracking-[.2em] text-white/65">ePowerFix</span>
              </div>
            )}
          </div>
          <span className="absolute bottom-2 right-2 border border-white/10 bg-slate-950/70 px-3 py-2 text-[11px] font-semibold text-white/80 backdrop-blur-sm">Quality you can rely on</span>
        </div>
      </div>
      {slides.length > 1 && (
        <div className="mx-auto flex max-w-[1400px] gap-2 px-4 pb-7 sm:px-12">
          {slides.map((item, index) => <button key={item.id} type="button" aria-label={`Show slide ${index + 1}`} onClick={() => setActiveSlide(index)} className={cn("h-1.5 transition-all", activeSlide % slides.length === index ? "w-8 bg-epf-500" : "w-2 bg-white/30 hover:bg-white/65")} />)}
        </div>
      )}
    </section>
  );
}

function BenefitsRail() {
  const benefits = [
    [Truck, "Fast delivery", "Across Bangladesh"],
    [RefreshCw, "Easy returns", "Simple return process"],
    [ShieldCheck, "Secure payment", "Protected checkout"],
    [UserRoundCheck, "Expert support", "Here when you need us"],
    [Package, "Quality products", "From trusted brands"],
  ] as const;

  return (
    <section className="border-b border-slate-200 bg-white">
      <div className="mx-auto grid max-w-[1400px] grid-cols-2 divide-x divide-y divide-slate-200 px-4 sm:px-12 md:grid-cols-5 md:divide-y-0">
        {benefits.map(([Icon, title, subtitle]) => (
          <div key={title} className="group flex items-center gap-3 px-3 py-4 first:pl-0 sm:px-4 md:justify-center md:px-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-epf-50 text-epf-600 transition-colors group-hover:bg-epf-500 group-hover:text-white"><Icon className="h-4 w-4" /></span>
            <div className="min-w-0"><p className="truncate text-[12px] font-bold text-slate-800">{title}</p><p className="hidden truncate text-[10px] text-slate-400 sm:block">{subtitle}</p></div>
          </div>
        ))}
      </div>
    </section>
  );
}

function CategoryGrid() {
  const { data, isLoading } = useQuery<{ categories: Category[] }>({
    queryKey: ["home-category-grid"],
    queryFn: () => apiFetch<{ categories: Category[] }>("/api/categories?counts=true"),
    staleTime: 5 * 60 * 1000,
  });
  const categories = data?.categories?.length ? data.categories.slice(0, 6) : fallbackCategories;
  const categoryItems: Array<Category | null> = isLoading ? Array.from({ length: 6 }, () => null) : categories;

  return (
    <section className="bg-white py-10 sm:py-12">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-12">
        <SectionHeading eyebrow="Shop by category" title="Top Categories" description="Find the right component, tool, or solution for your next job." href="/shop" linkLabel="View all categories" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {categoryItems.map((category, index) => {
            if (!category) return <div key={index} className="aspect-square animate-pulse bg-slate-100" />;
            const Icon = categoryIcons[category.slug] || Package;
            return (
              <Link key={category.id || category.slug} href={`/shop?category=${category.slug}`} className="epf-reference-category-card group relative aspect-square overflow-hidden border border-slate-200 bg-slate-900">
                {category.image ? <img src={category.image} alt={category.name} className="h-full w-full object-cover opacity-80 transition-transform duration-500 group-hover:scale-110 group-hover:opacity-100" loading="lazy" /> : <div className="flex h-full items-center justify-center bg-[radial-gradient(circle_at_35%_25%,rgba(255,255,255,.18),transparent_25%),linear-gradient(145deg,#334155,#0f172a)]"><Icon className="h-11 w-11 text-white/70" /></div>}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/10 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-3"><p className="line-clamp-2 text-[13px] font-bold leading-4 text-white">{category.name}</p><p className="mt-1 text-[10px] text-white/70">{category._count?.products ?? ""}{category._count?.products != null ? " items" : "Explore collection"}</p></div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function ProductCollections() {
  const [activeTab, setActiveTab] = useState<"featured" | "new" | "sale">("featured");
  const featuredQuery = useProducts("home-featured-products", "/api/products?limit=8&sort=featured");
  const latestQuery = useProducts("home-latest-products", "/api/products?limit=8&sort=latest");
  const saleQuery = useProducts("home-sale-products", "/api/products?limit=8&bestDeals=true&sort=price-desc");
  const queryByTab = { featured: featuredQuery, new: latestQuery, sale: saleQuery };
  const query = queryByTab[activeTab];
  const labels = [
    { key: "featured" as const, label: "Featured" },
    { key: "new" as const, label: "New arrivals" },
    { key: "sale" as const, label: "On sale" },
  ];

  return (
    <section className="bg-slate-50 py-10 sm:py-12">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-12">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
          <div><span className="epf-eyebrow mb-2">Our products</span><h2 className="text-[24px] font-bold tracking-tight text-slate-900 sm:text-[28px]">Explore Collection</h2></div>
          <div className="flex border border-slate-200 bg-white p-1">
            {labels.map((tab) => <button key={tab.key} type="button" onClick={() => setActiveTab(tab.key)} className={cn("px-3 py-2 text-[11px] font-bold uppercase tracking-[.08em] transition-colors sm:px-4", activeTab === tab.key ? "bg-epf-500 text-white" : "text-slate-500 hover:text-slate-900")}>{tab.label}</button>)}
          </div>
        </div>
        {query.isLoading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4"><>{Array.from({ length: 8 }).map((_, index) => <div key={index} className="aspect-[.78] animate-pulse border border-slate-200 bg-white" />)}</></div>
        ) : query.data?.data.data.length ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{query.data.data.data.slice(0, 8).map((product) => <ProductCard key={product.id} product={product} />)}</div>
        ) : (
          <div className="border border-dashed border-slate-300 bg-white px-5 py-14 text-center text-sm text-slate-500">Products will appear here soon.</div>
        )}
        <div className="mt-7 flex justify-center"><Link href={activeTab === "sale" ? "/shop?sort=price-desc" : "/shop"} className="inline-flex h-11 items-center gap-2 border border-epf-500 px-5 text-[13px] font-bold text-epf-600 transition-colors hover:bg-epf-500 hover:text-white">View all products <ArrowRight className="h-4 w-4" /></Link></div>
      </div>
    </section>
  );
}

function PromotionSpotlight() {
  const saleQuery = useProducts("home-promotion-products", "/api/products?limit=2&bestDeals=true&sort=price-desc");
  const products = saleQuery.data?.data.data ?? [];

  return (
    <section className="bg-slate-900 py-10 text-white sm:py-12">
      <div className="mx-auto grid max-w-[1400px] items-center gap-8 px-4 sm:px-12 md:grid-cols-[.95fr_1.05fr]">
        <div><span className="text-[10px] font-bold uppercase tracking-[.17em] text-epf-500">Limited time offer</span><h2 className="mt-3 text-[32px] font-bold leading-[1.02] tracking-tight sm:text-[44px]">Smart deals for every electrical setup</h2><p className="mt-4 max-w-md text-[14px] leading-6 text-white/65">Shop dependable components, project-ready kits, and professional services in one place.</p><Link href="/shop?sort=price-desc" className="epf-btn mt-6 inline-flex h-11 items-center gap-2 bg-epf-500 px-5 text-[13px] font-bold text-white hover:bg-epf-600">Shop the sale <ArrowRight className="h-4 w-4" /></Link></div>
        <div className="grid grid-cols-2 gap-3">
          {saleQuery.isLoading ? Array.from({ length: 2 }).map((_, index) => <div key={index} className="aspect-[.82] animate-pulse border border-white/10 bg-white/5" />) : products.length ? products.map((product) => {
            const image = product.images?.[0];
            return <Link key={product.id} href={`/shop/${product.slug || product.id}`} className="group border border-white/10 bg-white/5 p-3 transition-colors hover:border-epf-500 hover:bg-white/10"><div className="aspect-square overflow-hidden bg-white/5">{image ? <img src={image} alt={product.name} className="h-full w-full object-contain p-2 transition-transform duration-500 group-hover:scale-105" loading="lazy" /> : <div className="flex h-full items-center justify-center"><Package className="h-8 w-8 text-white/35" /></div>}</div><p className="mt-3 line-clamp-2 text-[12px] font-semibold leading-4 text-white">{product.name}</p><p className="mt-1 text-[15px] font-bold text-epf-500">৳{Number(getDisplayPrice(product)).toLocaleString()}</p></Link>;
          }) : <div className="col-span-2 border border-white/10 bg-white/5 p-8 text-center text-sm text-white/55">New offers are coming soon.</div>}
        </div>
      </div>
    </section>
  );
}

function ProjectsAndServices() {
  const servicesQuery = useQuery<{ data: { services: Service[] } }>({ queryKey: ["home-services"], queryFn: () => apiFetch("/api/services"), staleTime: 60 * 1000 });
  const projectsQuery = useQuery<{ data: Project[] }>({ queryKey: ["home-projects"], queryFn: () => apiFetch("/api/projects"), staleTime: 60 * 1000 });
  const services = servicesQuery.data?.data?.services?.slice(0, 3) ?? [];
  const projects = projectsQuery.data?.data?.slice(0, 3) ?? [];

  return (
    <section className="bg-white py-10 sm:py-12">
      <div className="mx-auto grid max-w-[1400px] gap-9 px-4 sm:px-12 lg:grid-cols-2">
        <div><SectionHeading eyebrow="Professional help" title="Popular services" href="/services" />
          <div className="border-y border-slate-200">
            {servicesQuery.isLoading ? Array.from({ length: 3 }).map((_, index) => <div key={index} className="h-[76px] animate-pulse border-b border-slate-100 bg-slate-50 last:border-b-0" />) : services.length ? services.map((service) => <Link key={service.id} href={service.slug ? `/services/${service.slug}` : "/services"} className="group flex items-center gap-3 border-b border-slate-100 py-3 last:border-b-0"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-epf-50 text-epf-600 transition-colors group-hover:bg-epf-500 group-hover:text-white"><Wrench className="h-5 w-5" /></span><span className="min-w-0 flex-1"><span className="block truncate text-[14px] font-bold text-slate-800 group-hover:text-epf-600">{service.name}</span><span className="mt-0.5 block line-clamp-1 text-[12px] text-slate-500">{service.shortDesc || service.description}</span></span><ChevronRight className="h-4 w-4 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-epf-500" /></Link>) : <p className="py-9 text-center text-sm text-slate-500">Services will appear here soon.</p>}
          </div>
        </div>
        <div><SectionHeading eyebrow="Our work" title="Featured projects" href="/projects" />
          <div className="grid grid-cols-3 gap-3">
            {projectsQuery.isLoading ? Array.from({ length: 3 }).map((_, index) => <div key={index} className="aspect-[.8] animate-pulse bg-slate-100" />) : projects.length ? projects.map((project) => { const image = project.coverImage || project.images?.[0]; return <Link key={project.id} href={`/projects/${project.slug}`} className="epf-reference-project-card group overflow-hidden border border-slate-200 bg-white"><div className="aspect-[1.08] overflow-hidden bg-slate-100">{image ? <img src={image} alt={project.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" /> : <div className="flex h-full items-center justify-center"><Zap className="h-7 w-7 text-slate-300" /></div>}</div><div className="p-2.5"><p className="line-clamp-2 text-[12px] font-semibold leading-4 text-slate-700 group-hover:text-epf-600">{project.title}</p></div></Link>; }) : <p className="col-span-3 py-9 text-center text-sm text-slate-500">Projects will appear here soon.</p>}
          </div>
        </div>
      </div>
    </section>
  );
}

function BlogPreview() {
  const { data, isLoading } = useQuery<BlogResponse>({
    queryKey: ["home-blog"],
    queryFn: () => apiFetch<BlogResponse>("/api/blog?limit=3"),
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
  const posts = data?.data?.data ?? [];

  return (
    <section className="bg-slate-50 py-10 sm:py-12">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-12">
        <SectionHeading eyebrow="From the blog" title="Latest news and guides" href="/blog" linkLabel="All articles" />
        {isLoading ? <div className="grid gap-4 sm:grid-cols-3">{Array.from({ length: 3 }).map((_, index) => <div key={index} className="h-[280px] animate-pulse border border-slate-200 bg-white" />)}</div> : posts.length ? <div className="grid gap-4 sm:grid-cols-3">{posts.map((post) => <Link key={post.id} href={`/blog/${post.slug}`} className="epf-reference-article-card group overflow-hidden border border-slate-200 bg-white"><div className="aspect-[16/9] overflow-hidden bg-slate-100">{post.coverImage ? <img src={post.coverImage} alt={post.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" /> : <div className="flex h-full items-center justify-center"><BookOpen className="h-8 w-8 text-slate-300" /></div>}</div><div className="p-4"><span className="text-[10px] font-bold uppercase tracking-[.13em] text-epf-600">Electrical insights</span><h3 className="mt-2 line-clamp-2 text-[15px] font-bold leading-5 text-slate-800 group-hover:text-epf-600">{post.titleBn || post.title}</h3><p className="mt-2 line-clamp-2 text-[12px] leading-5 text-slate-500">{(post.excerpt || post.content || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim()}</p><span className="mt-4 inline-flex items-center gap-1 text-[12px] font-semibold text-epf-600">Read more <ArrowRight className="h-3.5 w-3.5" /></span></div></Link>)}</div> : <div className="border border-slate-200 bg-white px-5 py-10 text-center text-sm text-slate-500">New electrical guides are coming soon.</div>}
      </div>
    </section>
  );
}

export default function HomePage() {
  return (
    <>
      <Header />
      <main className="epf-reference-home bg-slate-50 text-slate-900">
        <HomeHero />
        <BenefitsRail />
        <CategoryGrid />
        <ProductCollections />
        <PromotionSpotlight />
        <BrandStrip />
        <ProjectsAndServices />
        <BlogPreview />
      </main>
      <Footer />
      <HomeClient />
    </>
  );
}
