"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Home, ChevronRight, Send, Check } from "lucide-react";
import Header from "@/components/epf/Header";
import Footer from "@/components/epf/Footer";
import ChatWidget from "@/components/epf/ChatWidget";
import BackToTopButton from "@/components/epf/BackToTopButton";
import { apiFetch } from "@/lib/api";

const SERVICE_TYPES = [
  "Home Wiring",
  "Industrial Setup",
  "Solar Installation",
  "Generator Repair",
  "LED Lighting",
  "Smart Home Automation",
  "Electrical Inspection",
  "Other",
];

export default function GetQuotePage() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", serviceType: "", description: "", address: "", budget: "" });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await apiFetch("/api/quote-requests", {
        method: "POST",
        body: JSON.stringify(form),
      });
      setSubmitted(true);
    } catch (err: any) {
      setError(err?.message || "Failed to submit request");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      <main className="flex-1 mx-auto w-full max-w-[1400px] px-4 sm:px-12 py-8">
        <nav className="flex items-center gap-1.5 mb-6">
          <a href="/" className="flex items-center gap-1 text-[13px] text-slate-500 hover:text-slate-900"><Home className="h-3.5 w-3.5" />Home</a>
          <ChevronRight className="h-3 w-3 text-slate-400" /><span className="text-[13px] font-medium text-slate-900">Request a Quote</span>
        </nav>
        <div className="mb-6">
          <h1 className="text-[28px] font-bold text-slate-900">Request a Quote</h1>
          <p className="text-[14px] text-slate-500 mt-1.5">Tell us about your electrical project and we&rsquo;ll get back to you with a custom quote.</p>
        </div>

        <div className="max-w-[700px]">
          {submitted ? (
            <div className="bg-green-50 border border-green-700/20 rounded-lg p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-green-700/10 flex items-center justify-center mx-auto mb-4"><Check className="w-8 h-8 text-green-700" /></div>
              <h2 className="text-[20px] font-semibold text-slate-900 mb-2">Quote Request Submitted!</h2>
              <p className="text-[14px] text-slate-500 mb-5">Our team will review your requirements and contact you within 24 hours.</p>
              <button onClick={() => window.location.href = "/"} className="h-10 px-5 bg-epf-500 text-white text-[14px] font-medium rounded-lg hover:bg-epf-600 transition-colors">Back to Home</button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="text-[14px] font-medium text-slate-700 mb-1.5 block">Full Name *</label>
                  <input type="text" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                    className="w-full h-11 px-3 text-[14px] text-slate-700 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-epf-500/30 focus:border-epf-500 placeholder:text-slate-400" />
                </div>
                <div>
                  <label className="text-[14px] font-medium text-slate-700 mb-1.5 block">Email *</label>
                  <input type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                    className="w-full h-11 px-3 text-[14px] text-slate-700 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-epf-500/30 focus:border-epf-500 placeholder:text-slate-400" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="text-[14px] font-medium text-slate-700 mb-1.5 block">Phone *</label>
                  <input type="tel" required value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                    className="w-full h-11 px-3 text-[14px] text-slate-700 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-epf-500/30 focus:border-epf-500 placeholder:text-slate-400" />
                </div>
                <div>
                  <label className="text-[14px] font-medium text-slate-700 mb-1.5 block">Service Type *</label>
                  <select required value={form.serviceType} onChange={e => setForm({ ...form, serviceType: e.target.value })}
                    className="w-full h-11 px-3 text-[14px] text-slate-700 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-epf-500/30 focus:border-epf-500">
                    <option value="">Select a service</option>
                    {SERVICE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[14px] font-medium text-slate-700 mb-1.5 block">Project Description *</label>
                <textarea required rows={4} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2.5 text-[14px] text-slate-700 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-epf-500/30 focus:border-epf-500 resize-y" placeholder="Describe your project requirements..." />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="text-[14px] font-medium text-slate-700 mb-1.5 block">Address</label>
                  <input type="text" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })}
                    className="w-full h-11 px-3 text-[14px] text-slate-700 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-epf-500/30 focus:border-epf-500 placeholder:text-slate-400" />
                </div>
                <div>
                  <label className="text-[14px] font-medium text-slate-700 mb-1.5 block">Budget Range</label>
                  <input type="text" value={form.budget} onChange={e => setForm({ ...form, budget: e.target.value })}
                    className="w-full h-11 px-3 text-[14px] text-slate-700 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-epf-500/30 focus:border-epf-500 placeholder:text-slate-400" placeholder="e.g. ৳10,000 - ৳50,000" />
                </div>
              </div>
              {error && <p className="text-[14px] text-red-500">{error}</p>}
              <button type="submit" disabled={submitting}
                className="inline-flex items-center gap-2 h-11 px-6 bg-epf-500 hover:bg-epf-600 disabled:opacity-50 text-white text-[14px] font-semibold rounded-lg transition-all">
                <Send className="w-4 h-4" />{submitting ? "Submitting..." : "Submit Quote Request"}
              </button>
            </form>
          )}
        </div>
      </main>
      <ChatWidget /><BackToTopButton /><Footer />
    </div>
  );
}
