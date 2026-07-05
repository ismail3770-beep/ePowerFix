"use client";
import { useQuery } from "@tanstack/react-query";
import { useCartStore, useUIStore } from "@/store";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";
import { PremiumCard, PremiumCardSkeleton, type PremiumCardData } from "@/components/epf/PremiumCard";

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

interface ProjectKit {
  id: string;
  title: string;
  slug: string;
  description: string;
  price: number;
  salePrice: number | null;
  coverImage: string | null;
  images: string[];
  category: string | null;
  difficulty: string | null;
  stock: number;
  itemCount?: number;
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

  const { data: kitsData, isLoading: projectsLoading } = useQuery<{ data: ProjectKit[] }>({
    queryKey: ["project-kits-home"],
    queryFn: () => apiFetch("/api/project-kits"),
  });
  const kits = (kitsData?.data ?? []).slice(0, 6);

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

  const addKit = (e: React.MouseEvent, k: ProjectKit) => {
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
              ? Array.from({ length: 6 }).map((_, i) => <PremiumCardSkeleton key={i} />)
              : products.map((product) => (
                  <PremiumCard
                    key={product.id}
                    data={{
                      id: product.id,
                      name: product.name,
                      price: product.price,
                      salePrice: product.salePrice,
                      comparePrice: product.comparePrice,
                      images: product.images,
                      category: product.category?.name,
                      isFeatured: true,
                    }}
                    onCardClick={(id) => { window.location.href = `/shop/${id}`; }}
                    onAddToCart={(d) => addProduct({ preventDefault: () => {}, stopPropagation: () => {} } as React.MouseEvent, product)}
                  />
                ))}
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
              ? Array.from({ length: 6 }).map((_, i) => <PremiumCardSkeleton key={i} />)
              : kits.map((kit) => (
                  <PremiumCard
                    key={kit.id}
                    data={{
                      id: kit.id,
                      name: kit.title,
                      price: kit.price ?? 0,
                      salePrice: kit.salePrice,
                      coverImage: kit.coverImage,
                      images: kit.images,
                      badge: "KIT",
                      itemType: "PROJECT",
                      category: kit.category,
                    }}
                    onCardClick={(id) => { setSelectedProjectId(id); setProjectDetailOpen(true); }}
                    onAddToCart={(d) => addKit({ preventDefault: () => {}, stopPropagation: () => {} } as React.MouseEvent, kit)}
                  />
                ))}
          </div>
          {!projectsLoading && kits.length === 0 && (
            <p className="text-sm text-dark-400 text-center py-8">No project kits available yet.</p>
          )}
        </div>
      </div>
    </section>
  );
}
