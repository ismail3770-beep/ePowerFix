"use client";

import type * as React from "react";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { Home, ChevronRight, ArrowLeft, MapPin, Phone, Mail } from "lucide-react";
import { apiFetch } from "@/lib/api";
import Header from "@/components/epf/Header";
import Footer from "@/components/epf/Footer";
import ChatWidget from "@/components/epf/ChatWidget";
import BackToTopButton from "@/components/epf/BackToTopButton";

interface Service {
  id: string;
  name: string;
  slug?: string;
  description: string;
  basePrice: number;
  priceUnit: string;
  priceLabel: string;
  duration: string;
  image: string;
  category: { id: string; name: string; icon: string } | null;
}

const areas = [
  "Mirpur", "Dhanmondi", "Gulshan", "Banani", "Uttara", "Mohammadpur",
  "Rampura", "Badda", "Bashundhara", "Wari", "Motijheel", "Tejgaon",
  "Mohakhali", "Cantonment", "Banani DOHS", "Baridhara DOHS",
];

const timeSlots = [
  "09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM",
  "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM",
  "05:00 PM", "06:00 PM",
];

export default function BookServicePage() {
  const params = useParams();
  const serviceId = params.id as string;
  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [form, setForm] = useState({
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    address: "Dhaka",
    area: "",
    preferredDate: "",
    preferredTime: "",
    description: "",
  });

  useEffect(() => {
    (async () => {
      try {
        const res: any = await apiFetch("/api/services");
        const services = res?.services || res?.data?.services || [];
        const found = services.find((s: Service) => s.id === serviceId || s.slug === serviceId);
        if (found) {setService(found);}
        else {setNotFound(true);}
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    })();
  }, [serviceId]);

  const update = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.customerName.trim() || !form.customerPhone.trim() || !form.area) {
      toast.error("Please fill required fields", { description: "Name, phone, and area are required." });
      return;
    }
    const phone = form.customerPhone.startsWith("+880")
      ? form.customerPhone
      : `+880${form.customerPhone.replace(/^0/, "")}`;
    setSubmitting(true);
    try {
      const res = await fetch("/api/services/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          serviceId: serviceId,
          customerName: form.customerName.trim(),
          phone,
          bookingDate: form.preferredDate,
          bookingTime: form.preferredTime,
          address: `${form.address}, ${form.area}`,
          notes: form.customerName.trim() ? `Customer: ${form.customerName.trim()}\n${form.description}`.trim() : form.description,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Booking failed");
      }
      setSuccess(true);
      toast.success("Booking confirmed!", { description: "We will contact you shortly." });
    } catch (err: any) {
      toast.error("Booking failed", { description: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />

      <main className="flex-1">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-12 py-6">
          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 mb-5">
            <a href="/" className="flex items-center gap-1 text-[14px] text-slate-500 hover:text-slate-900 transition-colors">
              <Home className="h-4 w-4" /> Home
            </a>
            <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
            <a href="/services" className="text-[14px] text-slate-500 hover:text-slate-900 transition-colors">Services</a>
            <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
            <span className="text-[14px] font-medium text-slate-900">Book Service</span>
          </nav>

          {success ? (
            /* ─── Success State ─── */
            <div className="max-w-lg mx-auto text-center py-16">
              <div className="w-20 h-20 mx-auto rounded-full bg-green-100 flex items-center justify-center mb-6">
                <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-[24px] font-bold text-slate-900 mb-2">Booking Confirmed!</h2>
              <p className="text-[15px] text-slate-500 mb-8">
                Thank you for booking. Our team will contact you shortly to confirm the details.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <a href="/services" className="h-11 px-6 bg-slate-900 hover:bg-slate-700 text-white text-[15px] font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors">
                  <ArrowLeft className="h-4 w-4" /> Back to Services
                </a>
                <a href="/" className="h-11 px-6 border border-slate-300 hover:border-slate-900 text-slate-900 text-[15px] font-semibold rounded-lg flex items-center justify-center transition-colors">
                  Go to Home
                </a>
              </div>
            </div>
          ) : notFound ? (
            /* ─── Not Found State ─── */
            <div className="max-w-lg mx-auto text-center py-16">
              <div className="w-20 h-20 mx-auto rounded-full bg-red-50 flex items-center justify-center mb-6">
                <svg className="w-10 h-10 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="text-[24px] font-bold text-slate-900 mb-2">Service Not Found</h2>
              <p className="text-[15px] text-slate-500 mb-8">
                The service you&apos;re trying to book is no longer available.
              </p>
              <a href="/services" className="h-11 px-6 bg-slate-900 hover:bg-slate-700 text-white text-[15px] font-semibold rounded-lg inline-flex items-center justify-center gap-2 transition-colors">
                <ArrowLeft className="h-4 w-4" /> Back to Services
              </a>
            </div>
          ) : (
            <div className="flex flex-col lg:flex-row gap-6">
              {/* ─── LEFT: Booking Form ─── */}
              <div className="flex-1 max-w-2xl">
                <div className="mb-5">
                  <h1 className="text-[24px] font-bold text-slate-900">Book a Service</h1>
                  <p className="text-[15px] text-slate-500 mt-1">Fill in the details below and we&apos;ll get back to you.</p>
                </div>

                {loading ? (
                  <div className="bg-white border border-slate-200 rounded-lg p-8 animate-pulse space-y-4">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="h-10 bg-slate-200 rounded" />
                    ))}
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-lg p-6 sm:p-8 space-y-5">
                    {/* Name */}
                    <div className="space-y-1.5">
                      <label htmlFor="b-name" className="text-[14px] font-medium text-slate-900">
                        Full Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="b-name"
                        type="text"
                        required
                        placeholder="Enter your name"
                        value={form.customerName}
                        onChange={(e) => update("customerName", e.target.value)}
                        className="w-full h-11 px-3 border border-slate-300 rounded-lg text-[14px] focus:outline-none focus:border-slate-900 transition-colors"
                      />
                    </div>

                    {/* Phone */}
                    <div className="space-y-1.5">
                      <label htmlFor="b-phone" className="text-[14px] font-medium text-slate-900">
                        Phone Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="b-phone"
                        type="tel"
                        required
                        placeholder="01XXXXXXXXX"
                        value={form.customerPhone}
                        onChange={(e) => update("customerPhone", e.target.value)}
                        className="w-full h-11 px-3 border border-slate-300 rounded-lg text-[14px] focus:outline-none focus:border-slate-900 transition-colors"
                      />
                    </div>

                    {/* Email */}
                    <div className="space-y-1.5">
                      <label htmlFor="b-email" className="text-[14px] font-medium text-slate-900">
                        Email <span className="text-[13px] text-slate-400 font-normal">(optional)</span>
                      </label>
                      <input
                        id="b-email"
                        type="email"
                        placeholder="email@example.com"
                        value={form.customerEmail}
                        onChange={(e) => update("customerEmail", e.target.value)}
                        className="w-full h-11 px-3 border border-slate-300 rounded-lg text-[14px] focus:outline-none focus:border-slate-900 transition-colors"
                      />
                    </div>

                    {/* Address */}
                    <div className="space-y-1.5">
                      <label htmlFor="b-address" className="text-[14px] font-medium text-slate-900">Address</label>
                      <input
                        id="b-address"
                        type="text"
                        placeholder="House #, Road #, Block"
                        value={form.address}
                        onChange={(e) => update("address", e.target.value)}
                        className="w-full h-11 px-3 border border-slate-300 rounded-lg text-[14px] focus:outline-none focus:border-slate-900 transition-colors"
                      />
                    </div>

                    {/* Area */}
                    <div className="space-y-1.5">
                      <label htmlFor="b-area" className="text-[14px] font-medium text-slate-900">
                        Area <span className="text-red-500">*</span>
                      </label>
                      <select
                        id="b-area"
                        required
                        value={form.area}
                        onChange={(e) => update("area", e.target.value)}
                        className="w-full h-11 px-3 border border-slate-300 rounded-lg text-[14px] focus:outline-none focus:border-slate-900 transition-colors bg-white"
                      >
                        <option value="">Select your area</option>
                        {areas.map((a) => (
                          <option key={a} value={a}>{a}</option>
                        ))}
                      </select>
                    </div>

                    {/* Date & Time */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label htmlFor="b-date" className="text-[14px] font-medium text-slate-900">Preferred Date</label>
                        <input
                          id="b-date"
                          type="date"
                          value={form.preferredDate}
                          min={new Date().toISOString().split("T")[0]}
                          onChange={(e) => update("preferredDate", e.target.value)}
                          className="w-full h-11 px-3 border border-slate-300 rounded-lg text-[14px] focus:outline-none focus:border-slate-900 transition-colors"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label htmlFor="b-time" className="text-[14px] font-medium text-slate-900">Preferred Time</label>
                        <select
                          id="b-time"
                          value={form.preferredTime}
                          onChange={(e) => update("preferredTime", e.target.value)}
                          className="w-full h-11 px-3 border border-slate-300 rounded-lg text-[14px] focus:outline-none focus:border-slate-900 transition-colors bg-white"
                        >
                          <option value="">Select time</option>
                          {timeSlots.map((t) => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-1.5">
                      <label htmlFor="b-desc" className="text-[14px] font-medium text-slate-900">Describe Your Problem</label>
                      <textarea
                        id="b-desc"
                        rows={4}
                        placeholder="Tell us about your problem or requirements in detail..."
                        value={form.description}
                        onChange={(e) => update("description", e.target.value)}
                        className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-[14px] focus:outline-none focus:border-slate-900 transition-colors resize-none"
                      />
                    </div>

                    {/* Submit */}
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full h-12 bg-slate-900 hover:bg-slate-700 disabled:bg-slate-400 text-white text-[16px] font-bold rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer"
                    >
                      {submitting ? (
                        <>
                          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          Processing...
                        </>
                      ) : (
                        "Confirm Booking"
                      )}
                    </button>
                  </form>
                )}
              </div>

              {/* ─── RIGHT: Service Summary + Contact ─── */}
              <div className="w-full lg:w-[360px] shrink-0 space-y-5">
                {/* Service Card */}
                {service && (
                  <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                    <div className="relative h-[160px] overflow-hidden">
                      <img
                        src={service.image || "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=400&h=400&fit=crop"}
                        alt={service.name}
                        className="w-full h-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                      <div className="absolute bottom-0 left-0 p-4">
                        <h3 className="text-white text-[16px] font-bold leading-tight">{service.name}</h3>
                        {service.category && (
                          <p className="text-white/70 text-[13px] mt-0.5">{service.category.name}</p>
                        )}
                      </div>
                    </div>
                    <div className="p-4 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-[14px] text-slate-500">Duration</span>
                        <span className="text-[14px] font-medium text-slate-900">{service.duration || "TBD"}</span>
                      </div>
                      <div className="border-t border-slate-100" />
                      <div className="text-[14px] text-slate-500">
                        Price will be discussed after inspection.
                      </div>
                    </div>
                  </div>
                )}

                {/* Contact Info */}
                <div className="bg-white border border-slate-200 rounded-lg p-5">
                  <h3 className="text-[15px] font-bold text-slate-900 mb-3">Need Help?</h3>
                  <div className="space-y-3">
                    <a href="tel:+8801700000000" className="flex items-center gap-3 text-[14px] text-slate-700 hover:text-epf-500 transition-colors">
                      <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                        <Phone className="h-4 w-4 text-slate-500" />
                      </div>
                      +880 1700-000000
                    </a>
                    <a href="mailto:info@epowerfix.com" className="flex items-center gap-3 text-[14px] text-slate-700 hover:text-epf-500 transition-colors">
                      <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                        <Mail className="h-4 w-4 text-slate-500" />
                      </div>
                      info@epowerfix.com
                    </a>
                    <div className="flex items-start gap-3 text-[14px] text-slate-700">
                      <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                        <MapPin className="h-4 w-4 text-slate-500" />
                      </div>
                      House #12, Road #7, Dhanmondi, Dhaka-1209, Bangladesh
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <ChatWidget />
      <BackToTopButton />
      <Footer />
    </div>
  );
}