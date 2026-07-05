"use client";
import { useQuery } from "@tanstack/react-query";
import { EPFArrowRight } from "@/components/epf/icons/EPFIcons";
import { apiFetch } from "@/lib/api";

interface Service {
  id: string;
  name: string;
  nameBn: string;
  description: string;
  descriptionBn: string;
  basePrice: number;
  priceUnit: string;
  priceLabel: string;
  duration: string;
  popular: boolean;
  icon: string;
  image?: string;
  category: { id: string; name: string; icon: string } | null;
  features: string;
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
    <section id="services" className="bg-[#f8f9fa] py-10 sm:py-14">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-12">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-dark-900 tracking-tight">
              Our Services
            </h2>
            <p className="text-sm text-dark-500 mt-1">
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white border border-dark-200/80 rounded-lg overflow-hidden animate-pulse">
                <div className="h-[160px] bg-dark-100" />
                <div className="p-4 space-y-2.5">
                  <div className="h-4 bg-dark-100 rounded w-3/4" />
                  <div className="h-3 bg-dark-100 rounded w-full" />
                  <div className="h-8 bg-dark-100 rounded w-28 mt-2" />
                </div>
              </div>
            ))}
          </div>
        ) : displayServices.length === 0 ? (
          <div className="bg-white border border-dark-200/80 rounded-lg py-16 text-center">
            <p className="text-sm text-dark-500">No services available yet. Please check back soon.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {displayServices.map((svc) => (
              <div
                key={svc.id}
                className="bg-white border border-dark-200/80 rounded-lg overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 group"
              >
                <a href="/services" className="block h-[160px] sm:h-[180px] overflow-hidden bg-dark-100">
                  {svc.image ? (
                    <img
                      src={svc.image}
                      alt={svc.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-dark-300 text-sm">
                      No image
                    </div>
                  )}
                </a>
                <div className="p-4 flex flex-col gap-2">
                  <div className="flex items-start gap-2">
                    <h4 className="text-[14px] sm:text-[15px] font-semibold text-dark-900 leading-snug line-clamp-2 flex-1">
                      {svc.name}
                    </h4>
                    {svc.popular && (
                      <span className="bg-epf-500 text-white text-[10px] font-bold px-1.5 py-0.5 leading-none uppercase shrink-0 mt-0.5">
                        Popular
                      </span>
                    )}
                  </div>
                  <p className="text-[12px] sm:text-[13px] text-dark-500 leading-relaxed line-clamp-2">
                    {svc.description}
                  </p>
                  <div className="mt-auto pt-2">
                    <a
                      href="/services"
                      className="inline-flex items-center gap-1.5 text-[13px] font-medium text-epf-500 hover:text-epf-600 transition-colors"
                    >
                      Details <EPFArrowRight size={13} />
                    </a>
                  </div>
                </div>
              </div>
            ))}
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
