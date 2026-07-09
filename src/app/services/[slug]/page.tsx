"use client";

import { useRouter, useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  ChevronRight, Home, ArrowLeft, Phone, MessageCircle, Star,
  Check, Clock, FolderOpen, Calendar,
} from "lucide-react";
import Image from "next/image";
import Header from "@/components/epf/Header";
import Footer from "@/components/epf/Footer";
import CartDrawer from "@/components/epf/CartDrawer";
import CheckoutDialog from "@/components/epf/CheckoutDialog";
import ServiceBookingDialog from "@/components/epf/ServiceBookingDialog";
import ChatWidget from "@/components/epf/ChatWidget";
import BackToTopButton from "@/components/epf/BackToTopButton";
import { apiFetch } from "@/lib/api";
import { useUIStore } from "@/store";

interface ServiceDetail {
  id: string;
  name: string;
  nameBn?: string;
  description: string;
  slug: string;
  basePrice: number;
  priceUnit: string;
  shortDesc?: string | null;
  images: string[];
  features: string;
  isFeatured: boolean;
  rating: number;
  reviewCount: number;
  category: { id: string; name: string; nameBn: string; slug: string } | null;
}

function parseJsonArray(val: unknown): string[] {
  if (Array.isArray(val)) return val;
  if (typeof val === "string") try { const p = JSON.parse(val); if (Array.isArray(p)) return p; } catch {}
  return [];
}

export default function ServiceDetailPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;
  const { setServiceBookingOpen, setBookingServiceId } = useUIStore();

  const { data: apiRes, isLoading } = useQuery<{ success: boolean; data: ServiceDetail }>({
    queryKey: ["service-detail", slug],
    queryFn: () => apiFetch(`/api/services/${slug}`),
    enabled: !!slug,
  });

  const service = apiRes?.data;

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <Header /><div className="flex-1 flex items-center justify-center"><div className="animate-pulse text-slate-400">Loading...</div></div><Footer />
      </div>
    );
  }

  if (!service) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-[24px] font-bold text-slate-900 mb-2">Service not found</h1>
            <button onClick={() => router.push("/services")} className="h-10 px-6 bg-epf-500 text-white rounded-lg hover:bg-epf-600 transition-colors mt-5">Back to Services</button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const features = parseJsonArray(service.features);
  const duration = service.shortDesc || "1-3 days";

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header /><CartDrawer /><CheckoutDialog />
      <main className="flex-1 mx-auto w-full max-w-[1400px] px-4 sm:px-12 py-8">
        <nav className="flex items-center gap-1.5 mb-6">
          <a href="/" className="flex items-center gap-1 text-[13px] text-slate-500 hover:text-slate-900"><Home className="h-3.5 w-3.5" />Home</a>
          <ChevronRight className="w-3 h-3 text-slate-400" />
          <a href="/services" className="text-[13px] text-slate-400 hover:text-slate-900">Services</a>
          <ChevronRight className="w-3 h-3 text-slate-400" />
          <span className="text-[13px] font-medium text-slate-900 truncate max-w-[300px]">{service.name}</span>
        </nav>
        <button onClick={() => router.push("/services")} className="inline-flex items-center gap-1.5 text-[14px] font-medium text-epf-500 hover:underline mb-6"><ArrowLeft className="w-4 h-4" />Back to Services</button>
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1 min-w-0 lg:w-[70%]">
            <div className="relative w-full max-w-[600px] h-[300px] rounded-lg overflow-hidden bg-gradient-to-br from-epf-500/20 via-epf-600/10 to-slate-900 shadow-[0_4px_6px_rgba(0,0,0,0.1)] mb-6">
              {service.images?.[0] ? <Image src={service.images[0]} alt={service.name} fill className="object-cover" unoptimized /> : <div className="w-full h-full flex items-center justify-center text-slate-400">No Image</div>}
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
            </div>
            <h1 className="text-[28px] font-bold text-slate-900 leading-tight mb-3">{service.name}</h1>
            <div className="flex flex-wrap items-center gap-3 text-[14px] text-slate-500 mb-5">
              <span className="flex items-center gap-1.5"><FolderOpen className="w-4 h-4" />{service.category?.name || "Service"}</span>
              <span className="w-1 h-1 rounded-full bg-slate-300" />
              <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" />{duration}</span>
              <span className="w-1 h-1 rounded-full bg-slate-300" />
              <span className="flex items-center gap-1.5"><Star className="w-4 h-4 text-amber-400" />{Number(service.rating || 0).toFixed(1)} reviews</span>
              <span className="w-1 h-1 rounded-full bg-slate-300" />
              <span className="text-[12px] font-medium text-green-700 bg-green-700/10 px-2.5 py-0.5 rounded-full">Available</span>
            </div>
            <div className="mb-6"><p className="text-[16px] leading-relaxed text-slate-700 mb-4">{service.description}</p></div>
            {features.length > 0 && (
              <div className="mb-6">
                <h2 className="text-[20px] font-semibold text-slate-900 mb-4">Service Features</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5">
                  {features.map((feat, i) => (
                    <li key={i} className="flex items-start gap-3 text-[15px] text-slate-700 list-none"><Check className="w-4 h-4 text-epf-500 shrink-0 mt-0.5" />{feat}</li>
                  ))}
                </div>
              </div>
            )}
            <div className="bg-epf-50 rounded-lg p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <div><p className="text-[14px] text-slate-500">Price</p><p className="text-[28px] font-bold text-slate-900">৳{Number(service.basePrice ?? 0).toLocaleString()}<span className="text-[14px] font-normal text-slate-500"> BDT</span></p></div>
              <button
                onClick={() => {
                  setBookingServiceId(service.id);
                  setServiceBookingOpen(true);
                }}
                className="h-11 px-8 bg-epf-500 hover:bg-epf-600 text-white font-semibold text-[15px] rounded-lg transition-all duration-200 flex items-center gap-2"
              >
                <Calendar className="w-4 h-4" /> Book Now
              </button>
            </div>
          </div>
          <aside className="w-full lg:w-[30%] shrink-0 space-y-6">
            <button onClick={() => router.push("/services")} className="inline-flex items-center gap-1.5 text-[14px] font-medium text-epf-500 hover:underline"><ArrowLeft className="w-4 h-4" />Back to Services</button>
            <div className="bg-white border border-slate-200 rounded-lg p-5">
              <h3 className="text-[15px] font-semibold text-slate-900 mb-3">Service Category</h3>
              <span className="text-[12px] text-slate-700 bg-slate-200 px-2.5 py-1 rounded-full">{service.category?.name || "General"}</span>
            </div>
            <div className="bg-slate-50 rounded-lg p-5">
              <h3 className="text-[15px] font-semibold text-slate-900 mb-3">Quick Contact</h3>
              <div className="space-y-3">
                <a href="tel:+8801700000000" className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-lg hover:shadow-sm"><div className="w-10 h-10 rounded-full bg-epf-500/10 flex items-center justify-center"><Phone className="w-5 h-5 text-epf-500" /></div><div><p className="text-[13px] font-medium text-slate-700">Call Us</p><p className="text-[12px] text-slate-400">+880 1700-000000</p></div></a>
                <a href="https://wa.me/8801700000000" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-lg hover:shadow-sm"><div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center"><MessageCircle className="w-5 h-5 text-green-500" /></div><div><p className="text-[13px] font-medium text-slate-700">WhatsApp</p><p className="text-[12px] text-slate-400">Chat with us</p></div></a>
                <button
                  onClick={() => router.push("/contact")}
                  className="w-full py-2.5 px-4 border border-dashed border-epf-500 text-epf-500 text-[13px] font-medium rounded-lg hover:bg-epf-500 hover:text-white transition-all"
                >
                  Request a Callback
                </button>
              </div>
            </div>
          </aside>
        </div>
      </main>
      <ServiceBookingDialog />
      <ChatWidget /><BackToTopButton /><Footer />
    </div>
  );
}
