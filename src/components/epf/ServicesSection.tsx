"use client";
import { useQuery } from "@tanstack/react-query";
import { EPFArrowRight } from "@/components/epf/icons/EPFIcons";
import { apiFetch } from "@/lib/api";

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
    <section id="services" className="bg-white py-10 sm:py-14">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-12">
        {/* Section Header */}
        <div className="flex items-end justify-between mb-6 sm:mb-8">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Our Services
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Expert electrical solutions at your doorstep
            </p>
          </div>
          <a
            href="/services"
            className="hidden sm:inline-flex items-center gap-1.5 text-sm font-medium text-epf-500 hover:text-epf-600 transition-colors border border-epf-500 hover:border-epf-600 rounded-md px-4 py-2"
          >
            View All
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </a>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white border border-slate-200 rounded-lg overflow-hidden animate-pulse">
                <div className="h-[170px] bg-slate-100" />
                <div className="p-4 space-y-2.5">
                  <div className="h-4 bg-slate-100 rounded w-3/4" />
                  <div className="h-3 bg-slate-100 rounded w-full" />
                  <div className="h-8 bg-slate-100 rounded w-28 mt-2" />
                </div>
              </div>
            ))}
          </div>
        ) : displayServices.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-lg py-16 text-center">
            <p className="text-sm text-slate-500">No services available yet. Please check back soon.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {displayServices.map((svc) => {
              const img = svc.images?.[0];
              return (
                <a
                  key={svc.id}
                  href={svc.slug ? `/services/${svc.slug}` : "/services"}
                  className="group flex flex-col bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-200"
                >
                  {/* Image */}
                  <div className="relative h-[170px] bg-slate-50 overflow-hidden">
                    {img ? (
                      <img
                        src={img}
                        alt={svc.name}
                        className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500 ease-out"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300 text-sm">
                        No image
                      </div>
                    )}
                    {svc.isFeatured && (
                      <span className="absolute top-2.5 left-2.5 bg-epf-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded leading-none tracking-wide uppercase">
                        Popular
                      </span>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex flex-col flex-1 p-4 gap-1.5">
                    {svc.category && (
                      <span className="text-[11px] text-slate-400 uppercase tracking-wide font-medium">
                        {svc.category.name}
                      </span>
                    )}
                    <h4 className="text-[15px] font-semibold text-slate-800 leading-snug line-clamp-1 group-hover:text-epf-600 transition-colors">
                      {svc.name}
                    </h4>
                    <p className="text-[13px] text-slate-500 leading-relaxed line-clamp-2">
                      {svc.shortDesc || svc.description}
                    </p>

                    {/* Footer: contact CTA (pricing on request via quote) */}
                    <div className="mt-auto pt-3 flex items-center justify-between">
                      <span className="text-[13px] font-medium text-slate-500">
                        Price on request
                      </span>
                      <span className="inline-flex items-center gap-1 text-[13px] font-semibold text-slate-900 group-hover:text-epf-600 transition-colors">
                        Get Quote
                        <EPFArrowRight size={13} />
                      </span>
                    </div>
                  </div>
                </a>
              );
            })}
          </div>
        )}

        <div className="sm:hidden mt-6 text-center">
          <a
            href="/services"
            className="inline-flex items-center justify-center gap-1.5 w-full text-sm font-medium text-white bg-epf-500 hover:bg-epf-600 rounded-md px-4 py-3 transition-colors"
          >
            View All Services
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
}
