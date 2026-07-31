"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Package } from "lucide-react";
import { apiFetch } from "@/lib/api";
import ProductGridCard from "@/components/epf/ProductGridCard";
import { FadeInStagger, FadeInItem } from "@/components/epf/FadeIn";

interface ProjectKit {
  id: string;
  title: string;
  titleBn?: string | null;
  slug: string;
  description: string;
  coverImage?: string | null;
  images?: string[];
  category?: string | null;
  difficulty?: string | null;
  price: number;
  salePrice?: number | null;
  stock?: number;
  itemCount?: number;
}

interface KitsResponse {
  data: ProjectKit[];
}

export default function ProjectKitsSection() {
  const { data, isLoading } = useQuery<KitsResponse>({
    queryKey: ["project-kits-home"],
    queryFn: () => apiFetch("/api/project-kits"),
  });

  const kits = (data?.data ?? []).slice(0, 10);

  return (
    <section id="project-kits" className="ff bg-white mt-[50px]">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
        {/* ── Section Header ── */}
        <div className="flex items-end justify-between border-b border-[#e5e5e5] pb-4 mb-6">
          <div>
            <h3 className="ff-section-title !text-[20px] !pb-0">Project Kits</h3>
            <p className="text-[14px] text-[#6e6e6e] mt-2">
              সম্পূর্ণ প্রজেক্টের সব প্রোডাক্ট এক প্যাকে · সাশ্রয়ী মূল্যে
            </p>
          </div>
          <a
            href="/project-kits"
            className="hidden sm:inline-flex items-center gap-1 text-[14px] text-[#0068e1] hover:underline group"
          >
            সব দেখুন
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
          </a>
        </div>

        {/* ── Kits Grid ── */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-5">
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className="mx-auto h-[364px] w-full max-w-[231px] animate-pulse rounded-lg bg-[#f2f2f2]"
              />
            ))}
          </div>
        ) : kits.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 py-16 px-6 text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center mb-4">
              <Package className="h-8 w-8 text-slate-300" strokeWidth={1.5} />
            </div>
            <h3 className="text-[18px] font-medium text-slate-700">
              No project kits available
            </h3>
            <p className="text-[14px] text-slate-400 mt-1.5">
              Project kit bundles will appear here once published.
            </p>
          </div>
        ) : (
          <FadeInStagger className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-5">
            {kits.map((kit) => {
              const hasSale =
                kit.salePrice != null && Number(kit.salePrice) < Number(kit.price);
              const displayPrice = hasSale ? Number(kit.salePrice) : Number(kit.price);
              const comparePrice = hasSale ? Number(kit.price) : null;
              return (
                <FadeInItem key={kit.id}>
                  <ProductGridCard
                    href={`/project-kits/${kit.slug}`}
                    name={kit.title}
                    price={displayPrice}
                    comparePrice={comparePrice}
                    image={kit.coverImage || kit.images?.[0]}
                    inStock={(kit.stock ?? 0) > 0}
                  />
                </FadeInItem>
              );
            })}
          </FadeInStagger>
        )}

        {/* ── Mobile "View All" ── */}
        {kits.length > 0 && (
          <div className="sm:hidden mt-8 text-center">
            <a
              href="/project-kits"
              className="inline-flex items-center justify-center gap-1.5 text-[14px] font-semibold text-white bg-epf-500 hover:bg-epf-600 h-11 px-6 rounded-lg transition-colors"
            >
              View All Project Kits
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        )}
      </div>
    </section>
  );
}
