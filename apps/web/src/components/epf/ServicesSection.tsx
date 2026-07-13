"use client";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Wrench } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { FadeInStagger, FadeInItem } from "@/components/epf/FadeIn";

interface Service {
  id: string;
  name: string;
  nameBn?: string | null;
  description: string;
  slug?: string;
  basePrice: number;
  priceUnit: string;
  shortDesc?: string | null;
  isFeatured?: boolean;
  images?: string[];
  category: { id: string; name: string; nameBn?: string } | null;
  features?: string;
}

export default function ServicesSection() {
  const { data: servicesData, isLoading } = useQuery<{
    data: { services: Service[] };
  }>({
    queryKey: ["services-home"],
    queryFn: () => apiFetch("/api/services"),
  });

  const services = servicesData?.data?.services ?? [];
  const displayServices = services.slice(0, 6);

  return (
    <section id="services" className="bg-slate-50 py-12 sm:py-16">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex items-end justify-between mb-8 sm:mb-10">
          <div>
            <h2 className="text-[20px] sm:text-[24px] font-bold text-slate-900 tracking-tight">
              Our Services
            </h2>
            <p className="text-[14px] text-slate-500 mt-1">
              Expert electrical solutions at your doorstep
            </p>
          </div>
          <a
            href="/services"
            className="hidden sm:inline-flex items-center gap-1.5 text-[14px] font-medium text-epf-600 hover:text-epf-700 transition-colors group"
          >
            View All
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
          </a>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white border border-slate-200 rounded-xl overflow-hidden animate-pulse">
                <div className="h-44 bg-slate-100" />
                <div className="p-5 space-y-3">
                  <div className="h-3 bg-slate-100 rounded w-1/3" />
                  <div className="h-4 bg-slate-100 rounded w-3/4" />
                  <div className="h-3 bg-slate-100 rounded w-full" />
                  <div className="h-3 bg-slate-100 rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : displayServices.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl py-16 px-6 text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center mb-4">
              <Wrench className="h-8 w-8 text-slate-300" strokeWidth={1.5} />
            </div>
            <h3 className="text-[18px] font-medium text-slate-700">No services available yet</h3>
            <p className="text-[14px] text-slate-400 mt-1.5">
              Please check back soon — our team is preparing the catalogue.
            </p>
          </div>
        ) : (
          <FadeInStagger className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {displayServices.map((svc) => {
              const img = svc.images?.[0];
              return (
                <FadeInItem key={svc.id}>
                  <a
                    href={svc.slug ? `/services/${svc.slug}` : "/services"}
                    className="group flex flex-col bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 h-full"
                  >
                    {/* Image */}
                    <div className="relative h-44 bg-slate-50 overflow-hidden">
                      {img ? (
                        <img
                          src={img}
                          alt={svc.name}
                          className="w-full h-full object-cover group-hover:scale-[1.05] transition-transform duration-500 ease-out"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                          <Wrench className="h-10 w-10" strokeWidth={1.5} />
                        </div>
                      )}
                      {svc.isFeatured && (
                        <span className="absolute top-3 left-3 bg-epf-500 text-white text-[11px] font-bold px-2.5 py-1 rounded-full leading-none tracking-wide uppercase shadow-sm">
                          Popular
                        </span>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex flex-col flex-1 p-5 gap-2">
                      {svc.category && (
                        <span className="text-[11px] text-slate-400 uppercase tracking-wide font-semibold">
                          {svc.category.name}
                        </span>
                      )}
                      <h4 className="text-[15px] font-semibold text-slate-800 leading-snug line-clamp-1 group-hover:text-epf-600 transition-colors">
                        {svc.name}
                      </h4>
                      <p className="text-[13px] text-slate-500 leading-relaxed line-clamp-2">
                        {svc.shortDesc || svc.description}
                      </p>

                      {/* Footer: Get Quote CTA (no price) */}
                      <div className="mt-auto pt-4 flex items-center justify-between border-t border-slate-100">
                        <span className="text-[12px] text-slate-400">
                          Price on request
                        </span>
                        <span className="inline-flex items-center gap-1 text-[13px] font-semibold text-slate-900 group-hover:text-epf-600 transition-colors">
                          Get Quote
                          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                        </span>
                      </div>
                    </div>
                  </a>
                </FadeInItem>
              );
            })}
          </FadeInStagger>
        )}

        {displayServices.length > 0 && (
          <div className="sm:hidden mt-8 text-center">
            <a
              href="/services"
              className="inline-flex items-center justify-center gap-1.5 text-[14px] font-semibold text-white bg-epf-500 hover:bg-epf-600 h-11 px-6 rounded-lg transition-colors"
            >
              View All Services
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        )}
      </div>
    </section>
  );
}
