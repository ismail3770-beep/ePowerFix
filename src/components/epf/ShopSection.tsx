"use client";
import { useQuery } from "@tanstack/react-query";
import { EPFCart, EPFStar } from "@/components/epf/icons/EPFIcons";
import { Boxes } from "lucide-react";
import { useCartStore, useUIStore } from "@/store";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";

interface Product {
  id: string;
  name: string;
  price: number;
  comparePrice: number | null;
  salePrice?: number | null;
  rating: number;
  reviews: number;
  images: string[];
  category?: { name: string; slug: string } | null;
}

interface Project {
  id: string;
  title: string;
  slug: string;
  price: number | null;
  salePrice: number | null;
  coverImage: string | null;
  images: string[];
  isSellable: boolean;
  location?: string | null;
}

function StarRating({ rating, reviews }: { rating: number; reviews: number }) {
  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((s) => (
          <EPFStar key={s} size={11} className={s <= Math.round(rating) ? "text-amber-400" : "text-dark-200"} />
        ))}
      </div>
      <span className="text-[10px] text-dark-400">({reviews})</span>
    </div>
  );
}

/* Compact section header with a "View All" link */
function RowHeader({ title, subtitle, href }: { title: string; subtitle: string; href: string }) {
  return (
    <div className="flex items-end justify-between mb-5">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-dark-900 tracking-tight">{title}</h2>
        <p className="text-sm text-dark-500 mt-1">{subtitle}</p>
      </div>
      <a
        href={href}
        className="hidden sm:inline-flex items-center gap-1.5 text-sm font-medium text-epf-500 hover:text-epf-600 transition-colors border border-epf-500 hover:border-epf-600 rounded-md px-4 py-2"
      >
        View All
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </a>
    </div>
  );
}

/* Smaller grid: up to 6 across on wide screens so cards stay compact at 1920px */
const GRID = "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4";

function CardSkeleton() {
  return (
    <div className="border border-dark-200/80 rounded-lg overflow-hidden bg-white">
      <div className="animate-pulse">
        <div className="aspect-square bg-dark-100" />
        <div className="p-3 space-y-2">
          <div className="h-3 bg-dark-100 rounded w-full" />
          <div className="h-3 bg-dark-100 rounded w-3/4" />
          <div className="h-3 bg-dark-100 rounded w-1/2" />
        </div>
      </div>
    </div>
  );
}

export default function ShopSection() {
  const addItem = useCartStore((s) => s.addItem);
  const { setSelectedProjectId, setProjectDetailOpen } = useUIStore();

  const { data: productsData, isLoading: productsLoading } = useQuery<{ data: { data: Product[] } }>({
    queryKey: ["products-shop-home"],
    queryFn: () => apiFetch("/api/products?limit=6"),
  });
  const products = (productsData?.data?.data ?? []).slice(0, 6);

  const { data: projectsData, isLoading: projectsLoading } = useQuery<{ data: Project[] }>({
    queryKey: ["project-kits-home"],
    queryFn: () => apiFetch("/api/projects"),
  });
  // Kits are the sellable projects (Arduino/IoT/PLC build kits). Prefer sellable
  // ones; if the catalogue has none yet, fall back to recent projects.
  const allProjects = projectsData?.data ?? [];
  const sellableKits = allProjects.filter((p) => p.isSellable && p.price != null);
  const kits = (sellableKits.length > 0 ? sellableKits : allProjects).slice(0, 6);

  const addProduct = (e: React.MouseEvent, p: Product) => {
    e.preventDefault();
    e.stopPropagation();
    addItem({
      itemType: "PRODUCT",
      productId: p.id,
      productName: p.name,
      productImage: p.images?.[0] || "",
      price: Number(p.salePrice || p.price),
      quantity: 1,
    });
    toast.success("Added to cart", { description: p.name });
  };

  const addKit = (e: React.MouseEvent, k: Project) => {
    e.preventDefault();
    e.stopPropagation();
    addItem({
      itemType: "PROJECT",
      productId: k.id,
      productName: k.title,
      productImage: k.coverImage || k.images?.[0] || "",
      price: Number(k.salePrice || k.price || 0),
      quantity: 1,
    });
    toast.success("Kit added to cart", { description: k.title });
  };

  return (
    <section id="shop" className="py-10 sm:py-14 bg-white">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-12 space-y-12">
        {/* ── Row 1: Products ── */}
        <div>
          <RowHeader
            title="Featured Products"
            subtitle="Quality electrical products at best prices"
            href="/shop"
          />
          <div className={GRID}>
            {productsLoading
              ? Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)
              : products.map((product) => {
                  const compare = product.comparePrice;
                  const price = Number(product.salePrice || product.price);
                  const discount = compare ? Math.round((1 - price / compare) * 100) : 0;
                  return (
                    <a
                      key={product.id}
                      href={`/shop/${product.id}`}
                      className="border border-dark-200/80 rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 group flex flex-col"
                    >
                      <div className="relative aspect-square bg-dark-100/40 overflow-hidden">
                        {product.images?.[0] ? (
                          <img
                            src={product.images[0]}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-dark-50">
                            <EPFCart size={32} className="text-dark-300" />
                          </div>
                        )}
                        {discount > 0 && (
                          <span className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-sm">
                            -{discount}%
                          </span>
                        )}
                        <div className="absolute inset-x-0 bottom-0 p-2 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                          <button
                            onClick={(e) => addProduct(e, product)}
                            className="w-full bg-dark-900/90 hover:bg-dark-900 text-white text-[12px] font-medium py-2 rounded-md flex items-center justify-center gap-1.5 backdrop-blur-sm"
                          >
                            <EPFCart size={13} /> Add to Cart
                          </button>
                        </div>
                      </div>
                      <div className="p-2.5 flex flex-col gap-1 flex-1">
                        {product.category && (
                          <p className="text-[10px] text-dark-400 line-clamp-1 uppercase tracking-wider font-medium">
                            {product.category.name}
                          </p>
                        )}
                        <h4 className="text-[12.5px] font-medium text-dark-900 line-clamp-2 leading-snug min-h-[2.2rem] group-hover:text-epf-500 transition-colors">
                          {product.name}
                        </h4>
                        <StarRating rating={product.rating} reviews={product.reviews} />
                        <div className="flex items-baseline gap-1.5 mt-0.5">
                          <span className="text-[14px] font-bold text-dark-900">৳{price.toLocaleString()}</span>
                          {compare && <span className="text-[11px] text-dark-400 line-through">৳{compare.toLocaleString()}</span>}
                        </div>
                      </div>
                    </a>
                  );
                })}
          </div>
        </div>

        {/* ── Row 2: Project Kits ── */}
        <div>
          <RowHeader
            title="Project Kits"
            subtitle="Everything you need to build your project — components, code & guides"
            href="/project-kits"
          />
          <div className={GRID}>
            {projectsLoading
              ? Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)
              : kits.map((kit) => {
                  const buyable = kit.isSellable && kit.price != null;
                  const price = Number(kit.salePrice || kit.price || 0);
                  return (
                    <div
                      key={kit.id}
                      onClick={() => { setSelectedProjectId(kit.id); setProjectDetailOpen(true); }}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedProjectId(kit.id); setProjectDetailOpen(true); } }}
                      className="border border-dark-200/80 rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 group flex flex-col cursor-pointer"
                    >
                      <div className="relative aspect-square bg-dark-100/40 overflow-hidden">
                        {kit.coverImage || kit.images?.[0] ? (
                          <img
                            src={kit.coverImage || kit.images[0]}
                            alt={kit.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-dark-50">
                            <Boxes className="w-8 h-8 text-dark-300" />
                          </div>
                        )}
                        <span className="absolute top-2 left-2 bg-epf-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-sm flex items-center gap-1">
                          <Boxes className="w-3 h-3" /> KIT
                        </span>
                        {buyable && (
                          <div className="absolute inset-x-0 bottom-0 p-2 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                            <button
                              onClick={(e) => addKit(e, kit)}
                              className="w-full bg-dark-900/90 hover:bg-dark-900 text-white text-[12px] font-medium py-2 rounded-md flex items-center justify-center gap-1.5 backdrop-blur-sm"
                            >
                              <EPFCart size={13} /> Add to Cart
                            </button>
                          </div>
                        )}
                      </div>
                      <div className="p-2.5 flex flex-col gap-1 flex-1">
                        <p className="text-[10px] text-dark-400 line-clamp-1 uppercase tracking-wider font-medium">
                          Project Kit
                        </p>
                        <h4 className="text-[12.5px] font-medium text-dark-900 line-clamp-2 leading-snug min-h-[2.2rem] group-hover:text-epf-500 transition-colors">
                          {kit.title}
                        </h4>
                        <div className="mt-auto pt-1">
                          {buyable ? (
                            <span className="text-[14px] font-bold text-dark-900">৳{price.toLocaleString()}</span>
                          ) : (
                            <span className="text-[12px] font-medium text-epf-500">View details</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
          </div>
          {!projectsLoading && kits.length === 0 && (
            <p className="text-sm text-dark-400 text-center py-8">No project kits available yet.</p>
          )}
        </div>
      </div>
    </section>
  );
}
