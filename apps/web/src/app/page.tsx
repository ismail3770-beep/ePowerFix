"use client";

import Link from "next/link";
import { useState } from "react";
import type { MouseEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  BookOpen,
  Cable,
  ChevronRight,
  Heart,
  Lightbulb,
  Loader2,
  Package,
  Plug,
  ShieldCheck,
  ShoppingCart,
  Star,
  Sun,
  Truck,
  Users,
  Wrench,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import Header from "@/components/epf/Header";
import Footer from "@/components/epf/Footer";
import HomeClient from "@/components/epf/HomeClient";
import { useCartStore } from "@/store";
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

const fallbackCategories: Array<{ name: string; slug: string; icon: LucideIcon }> = [
  { name: "Cables & Wires", slug: "cables-wires", icon: Cable },
  { name: "Circuit Breakers", slug: "circuit-breakers", icon: ShieldCheck },
  { name: "LED Lighting", slug: "led-lighting", icon: Lightbulb },
  { name: "Switches & Sockets", slug: "switches-sockets", icon: Plug },
  { name: "Tools & Meters", slug: "testing-tools", icon: Wrench },
  { name: "Safety Equipment", slug: "safety-equipment", icon: ShieldCheck },
  { name: "Solar Equipment", slug: "solar-equipment", icon: Sun },
  { name: "Smart Home", slug: "smart-home", icon: Zap },
];

function useProducts(queryKey: string, endpoint: string) {
  return useQuery<ProductListResponse>({
    queryKey: [queryKey],
    queryFn: () => apiFetch<ProductListResponse>(endpoint),
    staleTime: 60 * 1000,
  });
}

function getDisplayPrice(item: Product) {
  return item.salePrice != null && item.salePrice < item.price ? item.salePrice : item.price;
}

function getOriginalPrice(item: Product) {
  return item.salePrice != null && item.salePrice < item.price ? item.price : null;
}

function SectionHeading({
  eyebrow,
  title,
  href,
  linkLabel = "View all",
}: {
  eyebrow?: string;
  title: string;
  href: string;
  linkLabel?: string;
}) {
  return (
    <div className="mb-4 flex items-end justify-between gap-3 border-b border-slate-200 pb-3">
      <div>
        {eyebrow && <span className="epf-eyebrow mb-1.5">{eyebrow}</span>}
        <h2 className="text-[19px] font-bold tracking-tight text-slate-900 sm:text-[21px]">{title}</h2>
      </div>
      <Link href={href} className="epf-link inline-flex shrink-0 items-center gap-1 text-[13px] font-semibold text-epf-600 hover:text-epf-700">
        {linkLabel} <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}

function HomeHero() {
  const { data } = useQuery<{ data: Banner[] }>({
    queryKey: ["home-banners"],
    queryFn: () => apiFetch<{ data: Banner[] }>("/api/banners"),
    staleTime: 5 * 60 * 1000,
  });
  const banner = data?.data?.[0];

  return (
    <section className="border-b border-slate-200 bg-slate-50 py-4 sm:py-5">
      <div className="mx-auto grid max-w-[1400px] gap-3 px-4 sm:px-12 lg:grid-cols-[minmax(0,1fr)_218px]">
        <div className="epf-rise relative min-h-[286px] overflow-hidden rounded-lg bg-slate-900 shadow-[var(--epf-shadow-lg)] sm:min-h-[320px] lg:min-h-[350px]">
          {banner?.image ? (
            <img src={banner.image} alt={banner.title} className="absolute inset-0 h-full w-full object-cover" />
          ) : (
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,#3b8270_0%,transparent_35%),linear-gradient(115deg,#0f172a_0%,#1e293b_55%,#0f766e_100%)]" />
          )}
          {/* Electric brand glow */}
          <div className="pointer-events-none absolute -left-16 top-1/2 h-72 w-72 -translate-y-1/2 rounded-full bg-epf-500/25 blur-3xl" />
          <div className="pointer-events-none absolute -right-10 -top-10 h-56 w-56 rounded-full bg-sky-400/20 blur-3xl" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-900/45 to-transparent" />
          <div className="relative flex h-full max-w-[560px] flex-col justify-center px-6 py-8 text-white sm:px-10">
            <span className="mb-3 inline-flex w-fit items-center gap-1.5 rounded-full bg-epf-500/90 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] shadow-[var(--epf-shadow-brand)]">
              <Zap className="h-3 w-3" /> ePowerFix marketplace
            </span>
            <h1 className="max-w-lg text-[28px] font-bold leading-[1.12] tracking-tight sm:text-[38px]">
              {banner?.title || "Power your work with confidence"}
            </h1>
            <p className="mt-3 max-w-md text-[13px] leading-6 text-white/75 sm:text-[14px]">
              {banner?.subtitle || "Quality electrical products, expert services and practical project solutions — all from one trusted partner."}
            </p>
            <div className="mt-5 flex flex-wrap gap-2.5">
              <Link href={banner?.link || "/shop"} className="epf-btn inline-flex h-11 items-center gap-2 rounded-md bg-epf-500 px-5 text-[13px] font-bold text-white hover:bg-epf-600">
                Shop now <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/services" className="inline-flex h-11 items-center rounded-md border border-white/35 bg-white/5 px-5 text-[13px] font-semibold text-white backdrop-blur-sm transition-colors hover:border-white hover:bg-white/10">
                Explore services
              </Link>
            </div>
            {/* Trust row — real e-commerce feel */}
            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] font-medium text-white/70">
              <span className="inline-flex items-center gap-1.5"><Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> 4.9 rating</span>
              <span className="inline-flex items-center gap-1.5"><Users className="h-3.5 w-3.5 text-epf-400" /> 10,000+ customers</span>
              <span className="inline-flex items-center gap-1.5"><Truck className="h-3.5 w-3.5 text-epf-400" /> Fast delivery</span>
            </div>
          </div>
          <div className="absolute bottom-3 right-4 flex gap-1.5">
            <span className="h-1.5 w-6 rounded-full bg-epf-400" />
            <span className="h-1.5 w-1.5 rounded-full bg-white/55" />
            <span className="h-1.5 w-1.5 rounded-full bg-white/55" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-1">
          <Link href="/shop?search=LED" className="epf-card epf-zoom group relative min-h-[138px] overflow-hidden rounded-lg border border-slate-200 bg-white p-4 sm:min-h-[154px]">
            <div className="absolute -right-6 -top-8 h-28 w-28 rounded-full bg-amber-100 transition-transform duration-500 group-hover:scale-110" />
            <Lightbulb className="relative h-6 w-6 text-amber-500" />
            <p className="relative mt-5 text-[11px] font-bold uppercase tracking-wider text-slate-400">Bright choices</p>
            <h3 className="relative mt-1 text-[16px] font-bold text-slate-900">LED &amp; Lighting</h3>
            <span className="relative mt-2 inline-flex items-center gap-1 text-[12px] font-semibold text-epf-600">Shop now <ArrowRight className="h-3 w-3" /></span>
          </Link>
          <Link href="/project-kits" className="epf-card group relative min-h-[138px] overflow-hidden rounded-lg bg-slate-900 p-4 text-white sm:min-h-[154px]">
            <div className="absolute -bottom-12 -right-8 h-32 w-32 rounded-full bg-epf-500/35 transition-transform duration-500 group-hover:scale-110" />
            <Package className="relative h-6 w-6 text-epf-400" />
            <p className="relative mt-5 text-[11px] font-bold uppercase tracking-wider text-white/45">Build smarter</p>
            <h3 className="relative mt-1 text-[16px] font-bold">Project Kits</h3>
            <span className="relative mt-2 inline-flex items-center gap-1 text-[12px] font-semibold text-epf-400">Explore kits <ArrowRight className="h-3 w-3" /></span>
          </Link>
        </div>
      </div>
    </section>
  );
}

function BenefitsStrip() {
  const benefits = [
    [ShieldCheck, "Authentic products", "Trusted brands"],
    [Zap, "Expert support", "Before and after purchase"],
    [ShoppingCart, "Easy ordering", "Fast local delivery"],
    [Wrench, "Professional service", "Qualified technicians"],
  ] as const;

  return (
    <section className="border-b border-slate-200 bg-white">
      <div className="mx-auto grid max-w-[1400px] grid-cols-2 divide-x divide-slate-200 px-4 py-4 sm:grid-cols-4 sm:px-12">
        {benefits.map(([Icon, title, description]) => (
          <div key={title} className="group flex items-center gap-2.5 px-3 first:pl-0 sm:justify-center sm:px-4 lg:px-6">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-epf-50 text-epf-500 transition-colors group-hover:bg-epf-500 group-hover:text-white">
              <Icon className="h-5 w-5" strokeWidth={1.8} />
            </span>
            <div className="min-w-0">
              <p className="truncate text-[12px] font-bold text-slate-800 sm:text-[13px]">{title}</p>
              <p className="hidden truncate text-[11px] text-slate-400 sm:block">{description}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function CategoryRail() {
  const { data, isLoading } = useQuery<{ categories: Category[] }>({
    queryKey: ["home-category-rail"],
    queryFn: () => apiFetch<{ categories: Category[] }>("/api/categories?counts=true"),
    staleTime: 5 * 60 * 1000,
  });
  const categories = data?.categories?.length ? data.categories.slice(0, 8) : fallbackCategories;

  return (
    <section className="bg-slate-50 py-6 sm:py-7">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-12">
        <SectionHeading title="Featured categories" href="/shop" linkLabel="Browse all" />
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 lg:grid-cols-8">
          {(isLoading ? Array.from({ length: 8 }) : categories).map((category, index) => {
            if (!category) {
              return <div key={index} className="epf-skeleton h-[118px] rounded-lg border border-slate-200" />;
            }
            const item = category as Category | (typeof fallbackCategories)[number];
            const fallbackIcon = fallbackCategories[index % fallbackCategories.length].icon;
            const apiIcon = "icon" in item ? item.icon : null;
            const Icon = typeof apiIcon === "function" ? apiIcon : fallbackIcon;
            const href = `/shop?category=${item.slug}`;
            return (
              <Link key={item.slug} href={href} className="epf-card group flex min-h-[118px] flex-col items-center justify-center rounded-lg border border-slate-200 bg-white px-2 text-center hover:bg-epf-50">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-50 text-slate-500 transition-colors group-hover:bg-epf-500 group-hover:text-white">
                  <Icon className="h-5 w-5" strokeWidth={1.7} />
                </span>
                <span className="mt-2 line-clamp-2 text-[12px] font-semibold leading-4 text-slate-700 group-hover:text-epf-700">{item.name}</span>
                {"_count" in item && item._count?.products != null && <span className="mt-1 text-[10px] text-slate-400">{item._count.products} items</span>}
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function StoreProductCard({ product, compact = false }: { product: Product; compact?: boolean }) {
  const addItem = useCartStore((state) => state.addItem);
  const [imageError, setImageError] = useState(false);
  const displayPrice = getDisplayPrice(product);
  const originalPrice = getOriginalPrice(product);
  const discount = originalPrice ? Math.round(((originalPrice - displayPrice) / originalPrice) * 100) : 0;
  const image = product.images?.[0];
  const inStock = product.stock > 0;
  const href = product.itemType === "PROJECT" ? `/project-kits/${product.slug || product.id}` : `/shop/${product.slug || product.id}`;

  const handleAdd = (event: MouseEvent) => {
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
  };

  return (
    <article className={cn("epf-card group relative flex min-w-0 flex-col overflow-hidden rounded-lg border border-slate-200 bg-white", compact && "border-slate-100")}>
      <div className="epf-zoom relative aspect-square overflow-hidden bg-white">
        {image && !imageError ? (
          <img src={image} alt={product.name} className="h-full w-full object-contain p-2" loading="lazy" onError={() => setImageError(true)} />
        ) : (
          <div className="flex h-full items-center justify-center bg-slate-50"><Package className="h-8 w-8 text-slate-300" /></div>
        )}
        {discount > 0 && <span className="epf-badge-sale absolute left-2 top-2 rounded px-1.5 py-0.5 text-[10px] font-bold text-white">-{discount}%</span>}
        {!inStock && <span className="absolute left-2 top-2 rounded bg-slate-700 px-1.5 py-0.5 text-[10px] font-bold text-white">Out of stock</span>}
        <button type="button" aria-label="Add to wishlist" className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-slate-400 shadow-sm backdrop-blur-sm transition-colors hover:text-red-500" onClick={(event) => event.stopPropagation()}>
          <Heart className="h-3.5 w-3.5" />
        </button>
        {inStock && <button type="button" aria-label="Add to cart" onClick={handleAdd} className="absolute bottom-2 right-2 flex h-8 w-8 translate-y-1 items-center justify-center rounded-md bg-slate-900 text-white opacity-0 shadow-md transition-all duration-300 hover:bg-epf-500 group-hover:translate-y-0 group-hover:opacity-100"><ShoppingCart className="h-4 w-4" /></button>}
      </div>
      <Link href={href} className="flex min-h-[112px] flex-1 flex-col border-t border-slate-100 p-2.5">
        {product.category?.name && <span className="truncate text-[11px] font-semibold uppercase tracking-wide text-epf-600">{product.category.name}</span>}
        <h3 className="mt-1 line-clamp-2 text-[14px] font-medium leading-[1.35] text-slate-800 group-hover:text-epf-600">{product.name}</h3>
        <div className="mt-auto pt-2">
          {(product.rating || 0) > 0 && <span className="inline-flex items-center gap-1 text-[11px] text-slate-400"><Star className="h-3 w-3 fill-amber-400 text-amber-400" /> {Number(product.rating).toFixed(1)} ({product.reviewCount || 0})</span>}
          <div className="mt-1 flex items-center gap-1.5"><span className="text-[16px] font-bold text-slate-900">৳{Number(displayPrice).toLocaleString()}</span>{originalPrice && <del className="text-[12px] text-slate-400">৳{Number(originalPrice).toLocaleString()}</del>}</div>
        </div>
      </Link>
    </article>
  );
}

function ProductRail({ title, eyebrow, href, products, isLoading }: { title: string; eyebrow?: string; href: string; products: Product[]; isLoading: boolean }) {
  return (
    <section className="bg-slate-50 py-7 sm:py-9">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-12">
        <SectionHeading eyebrow={eyebrow} title={title} href={href} />
        {isLoading ? (
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {Array.from({ length: 6 }).map((_, index) => <div key={index} className="epf-skeleton aspect-[.78] rounded-lg border border-slate-200" />)}
          </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {products.slice(0, 6).map((product) => <StoreProductCard key={product.id} product={product} />)}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white py-10 text-center text-sm text-slate-400">Products will appear here soon.</div>
        )}
      </div>
    </section>
  );
}

function PromotionStrip() {
  return (
    <section className="bg-slate-50 pb-7 sm:pb-9">
      <div className="mx-auto grid max-w-[1400px] gap-3 px-3 sm:grid-cols-3 sm:px-5 lg:px-6">
        <Link href="/shop?category=cables-wires" className="epf-card group relative min-h-[132px] overflow-hidden rounded-lg bg-slate-900 px-5 py-5 text-white">
          <div className="absolute -right-10 -top-12 h-36 w-36 rounded-full bg-epf-500/25 transition-transform duration-500 group-hover:scale-110" />
          <Cable className="relative h-6 w-6 text-epf-400" />
          <p className="relative mt-4 text-[11px] font-bold uppercase tracking-widest text-white/50">Reliable connections</p>
          <h3 className="relative mt-1 text-[17px] font-bold">Cables for every setup</h3>
        </Link>
        <Link href="/services" className="epf-card group relative min-h-[132px] overflow-hidden rounded-lg border border-slate-200 bg-white px-5 py-5">
          <Wrench className="h-6 w-6 text-epf-500" />
          <p className="mt-4 text-[11px] font-bold uppercase tracking-widest text-slate-400">Need an expert?</p>
          <h3 className="mt-1 text-[17px] font-bold text-slate-900">Book an electrical service</h3>
          <span className="mt-2 inline-flex items-center gap-1 text-[12px] font-semibold text-epf-600">Get started <ArrowRight className="h-3.5 w-3.5" /></span>
        </Link>
        <Link href="/projects" className="epf-card group relative min-h-[132px] overflow-hidden rounded-lg border border-slate-200 bg-epf-50 px-5 py-5">
          <Zap className="h-6 w-6 text-epf-600" />
          <p className="mt-4 text-[11px] font-bold uppercase tracking-widest text-epf-700/60">Built by ePowerFix</p>
          <h3 className="mt-1 text-[17px] font-bold text-slate-900">See our latest projects</h3>
          <span className="mt-2 inline-flex items-center gap-1 text-[12px] font-semibold text-epf-700">View work <ArrowRight className="h-3.5 w-3.5" /></span>
        </Link>
      </div>
    </section>
  );
}

function ServicesProjectsBlock() {
  const { data: servicesData, isLoading: servicesLoading } = useQuery<{ data: { services: Service[] } }>({
    queryKey: ["home-services-compact"],
    queryFn: () => apiFetch<{ data: { services: Service[] } }>("/api/services"),
    staleTime: 60 * 1000,
  });
  const { data: projectsData, isLoading: projectsLoading } = useQuery<{ data: Project[] }>({
    queryKey: ["home-projects-compact"],
    queryFn: () => apiFetch<{ data: Project[] }>("/api/projects"),
    staleTime: 60 * 1000,
  });
  const services = servicesData?.data?.services?.slice(0, 3) ?? [];
  const projects = projectsData?.data?.slice(0, 3) ?? [];

  return (
    <section className="bg-white py-8 sm:py-10">
      <div className="mx-auto grid max-w-[1400px] gap-8 px-3 sm:px-5 md:grid-cols-2 lg:px-6">
        <div>
          <SectionHeading title="Popular services" href="/services" />
          <div className="divide-y divide-slate-100 border-y border-slate-100">
            {servicesLoading ? Array.from({ length: 3 }).map((_, index) => <div key={index} className="epf-skeleton h-[68px]" />) : services.length > 0 ? services.map((service) => (
              <Link key={service.id} href={service.slug ? `/services/${service.slug}` : "/services"} className="group flex items-center gap-3 py-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-epf-50 text-epf-600 transition-colors group-hover:bg-epf-500 group-hover:text-white"><Wrench className="h-5 w-5" /></div>
                <div className="min-w-0 flex-1"><h3 className="truncate text-[14px] font-semibold text-slate-800 group-hover:text-epf-600">{service.name}</h3><p className="mt-0.5 line-clamp-1 text-[12px] text-slate-500">{service.shortDesc || service.description}</p></div>
                <ChevronRight className="h-4 w-4 shrink-0 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-epf-500" />
              </Link>
            )) : <p className="py-8 text-sm text-slate-400">Services will appear here soon.</p>}
          </div>
        </div>
        <div>
          <SectionHeading title="Featured projects" href="/projects" />
          <div className="grid grid-cols-3 gap-2.5">
            {projectsLoading ? Array.from({ length: 3 }).map((_, index) => <div key={index} className="epf-skeleton aspect-[.85] rounded-lg" />) : projects.length > 0 ? projects.map((project) => {
              const image = project.coverImage || project.images?.[0];
              return <Link key={project.id} href={`/projects/${project.slug}`} className="epf-card epf-zoom group overflow-hidden rounded-lg border border-slate-200 bg-white"><div className="aspect-[1.15] overflow-hidden bg-slate-100">{image ? <img src={image} alt={project.title} className="h-full w-full object-cover" loading="lazy" /> : <div className="flex h-full items-center justify-center"><Zap className="h-6 w-6 text-slate-300" /></div>}</div><div className="p-2.5"><p className="line-clamp-2 text-[12px] font-semibold leading-4 text-slate-700 group-hover:text-epf-600">{project.title}</p></div></Link>;
            }) : <p className="col-span-3 py-8 text-sm text-slate-400">Projects will appear here soon.</p>}
          </div>
        </div>
      </div>
    </section>
  );
}

function BlogRail() {
  const { data, isLoading } = useQuery<BlogResponse>({
    queryKey: ["home-blog-compact"],
    queryFn: async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      try {
        return await apiFetch<BlogResponse>("/api/blog?limit=3", { signal: controller.signal });
      } finally {
        clearTimeout(timeoutId);
      }
    },
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
  const posts = data?.data?.data ?? [];

  return (
    <section className="bg-slate-50 py-8 sm:py-10">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-12">
        <SectionHeading eyebrow="Knowledge hub" title="Ideas and electrical guides" href="/blog" linkLabel="View all articles" />
        {isLoading ? <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">{Array.from({ length: 3 }).map((_, index) => <div key={index} className="epf-skeleton h-32 rounded-lg" />)}</div> : posts.length > 0 ? <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">{posts.map((post) => <Link key={post.id} href={`/blog/${post.slug}`} className="epf-card epf-zoom group flex gap-3 rounded-lg border border-slate-200 bg-white p-3"><div className="h-24 w-28 shrink-0 overflow-hidden rounded-md bg-slate-100">{post.coverImage ? <img src={post.coverImage} alt={post.title} className="h-full w-full object-cover" loading="lazy" /> : <div className="flex h-full items-center justify-center"><BookOpen className="h-6 w-6 text-slate-300" /></div>}</div><div className="min-w-0"><p className="text-[10px] text-slate-400">Electrical guide</p><h3 className="mt-1 line-clamp-3 text-[13px] font-semibold leading-5 text-slate-800 group-hover:text-epf-600">{post.titleBn || post.title}</h3><span className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-epf-600">Read more <ArrowRight className="h-3 w-3" /></span></div></Link>)}</div> : <div className="rounded-lg border border-slate-200 bg-white px-5 py-8 text-center text-sm text-slate-400">New electrical guides are coming soon.</div>}
      </div>
    </section>
  );
}

export default function HomePage() {
  const featured = useProducts("home-featured-products", "/api/products?limit=6&sort=featured");
  const latest = useProducts("home-latest-products", "/api/products?limit=6&sort=latest");
  const deals = useProducts("home-deal-products", "/api/products?limit=6&bestDeals=true&sort=price-desc");
  const kits = useQuery<{ data: Array<{ id: string; title: string; slug: string; price: number; salePrice: number | null; coverImage: string | null; images: string[]; category: string | null; stock: number }> }>({
    queryKey: ["home-project-kits"],
    queryFn: () => apiFetch("/api/project-kits"),
    staleTime: 60 * 1000,
  });

  const kitProducts: Product[] = (kits.data?.data ?? []).slice(0, 6).map((kit) => ({
    id: kit.id,
    name: kit.title,
    slug: kit.slug,
    price: kit.price,
    salePrice: kit.salePrice,
    images: [kit.coverImage, ...(kit.images || [])].filter(Boolean) as string[],
    stock: kit.stock,
    category: { name: kit.category || "Project Kit", slug: "project-kits" },
    itemType: "PROJECT",
  }));

  return (
    <>
      <Header />
      <main className="bg-slate-50 text-slate-900">
        <HomeHero />
        <BenefitsStrip />
        <CategoryRail />
        <ProductRail title="Featured products" eyebrow="Picked for you" href="/shop" products={featured.data?.data?.data ?? []} isLoading={featured.isLoading} />
        <PromotionStrip />
        <ProductRail title="Best deals" eyebrow="Save more today" href="/shop?sort=price-desc" products={deals.data?.data?.data ?? []} isLoading={deals.isLoading} />
        <ProductRail title="Latest products" href="/shop?sort=latest" products={latest.data?.data?.data ?? []} isLoading={latest.isLoading} />
        <ProductRail title="Project kits" eyebrow="Build, learn and create" href="/project-kits" products={kitProducts} isLoading={kits.isLoading} />
        <ServicesProjectsBlock />
        <BlogRail />
      </main>
      <Footer />
      <HomeClient />
    </>
  );
}
