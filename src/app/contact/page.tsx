"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Home, ChevronRight, Send, Phone, Mail, MapPin, Check } from "lucide-react";
import Header from "@/components/epf/Header";
import Footer from "@/components/epf/Footer";
import ChatWidget from "@/components/epf/ChatWidget";
import BackToTopButton from "@/components/epf/BackToTopButton";
import { apiFetch } from "@/lib/api";

export default function ContactPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", phone: "", subject: "", message: "" });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await apiFetch("/api/contact", {
        method: "POST",
        body: JSON.stringify(form),
      });
      setSubmitted(true);
      setForm({ name: "", email: "", phone: "", subject: "", message: "" });
    } catch (err: any) {
      setError(err?.message || "Failed to send message");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      <main className="flex-1 mx-auto w-full max-w-[1400px] px-4 sm:px-12 py-8">
        <nav className="flex items-center gap-1.5 mb-6">
          <a href="/" className="flex items-center gap-1 text-[13px] text-[#666] hover:text-[#111827]"><Home className="h-3.5 w-3.5" />Home</a>
          <ChevronRight className="h-3 w-3 text-[#999]" /><span className="text-[13px] font-medium text-[#111827]">Contact Us</span>
        </nav>

        <div className="mb-6">
          <h1 className="text-[28px] font-bold text-[#111827]">Contact Us</h1>
          <p className="text-[14px] text-[#666] mt-1.5">Have a question or need assistance? We&rsquo;re here to help.</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1 min-w-0 lg:w-[65%]">
            {submitted ? (
              <div className="bg-[#F0FFF4] border border-[#4D7300]/20 rounded-lg p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-[#4D7300]/10 flex items-center justify-center mx-auto mb-4"><Check className="w-8 h-8 text-[#4D7300]" /></div>
                <h2 className="text-[20px] font-semibold text-[#111827] mb-2">Message Sent Successfully!</h2>
                <p className="text-[14px] text-[#666] mb-5">Thank you for reaching out. We&rsquo;ll get back to you within 24 hours.</p>
                <button onClick={() => setSubmitted(false)} className="h-10 px-5 bg-[#0EA5E9] text-white text-[14px] font-medium rounded-lg hover:bg-[#0284C7] transition-colors">Send Another Message</button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="text-[14px] font-medium text-[#333] mb-1.5 block">Full Name *</label>
                    <input type="text" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                      className="w-full h-11 px-3 text-[14px] text-[#374151] bg-white border border-[#D1D5DB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]/30 focus:border-[#0EA5E9] placeholder:text-[#9CA3AF]" />
                  </div>
                  <div>
                    <label className="text-[14px] font-medium text-[#333] mb-1.5 block">Email *</label>
                    <input type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                      className="w-full h-11 px-3 text-[14px] text-[#374151] bg-white border border-[#D1D5DB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]/30 focus:border-[#0EA5E9] placeholder:text-[#9CA3AF]" />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="text-[14px] font-medium text-[#333] mb-1.5 block">Phone</label>
                    <input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                      className="w-full h-11 px-3 text-[14px] text-[#374151] bg-white border border-[#D1D5DB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]/30 focus:border-[#0EA5E9] placeholder:text-[#9CA3AF]" />
                  </div>
                  <div>
                    <label className="text-[14px] font-medium text-[#333] mb-1.5 block">Subject *</label>
                    <input type="text" required value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })}
                      className="w-full h-11 px-3 text-[14px] text-[#374151] bg-white border border-[#D1D5DB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]/30 focus:border-[#0EA5E9] placeholder:text-[#9CA3AF]" />
                  </div>
                </div>
                <div>
                  <label className="text-[14px] font-medium text-[#333] mb-1.5 block">Message *</label>
                  <textarea required rows={5} value={form.message} onChange={e => setForm({ ...form, message: e.target.value })}
                    className="w-full px-3 py-2.5 text-[14px] text-[#374151] bg-white border border-[#D1D5DB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]/30 focus:border-[#0EA5E9] placeholder:text-[#9CA3AF] resize-y" />
                </div>
                {error && <p className="text-[14px] text-red-500">{error}</p>}
                <button type="submit" disabled={submitting}
                  className="inline-flex items-center gap-2 h-11 px-6 bg-[#0EA5E9] hover:bg-[#0284C7] disabled:opacity-50 text-white text-[14px] font-semibold rounded-lg transition-all">
                  <Send className="w-4 h-4" />{submitting ? "Sending..." : "Send Message"}
                </button>
              </form>
            )}
          </div>

          <aside className="w-full lg:w-[35%] shrink-0 space-y-6">
            <div className="bg-[#f8f9fa] rounded-lg p-6">
              <h3 className="text-[16px] font-semibold text-[#111827] mb-4">Contact Information</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#0EA5E9]/10 flex items-center justify-center shrink-0"><Phone className="w-5 h-5 text-[#0EA5E9]" /></div>
                  <div><p className="text-[14px] font-medium text-[#333]">Phone</p><p className="text-[13px] text-[#666]">+880 1700-000000</p></div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#0EA5E9]/10 flex items-center justify-center shrink-0"><Mail className="w-5 h-5 text-[#0EA5E9]" /></div>
                  <div><p className="text-[14px] font-medium text-[#333]">Email</p><p className="text-[13px] text-[#666]">info@epowerfix.com</p></div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#0EA5E9]/10 flex items-center justify-center shrink-0"><MapPin className="w-5 h-5 text-[#0EA5E9]" /></div>
                  <div><p className="text-[14px] font-medium text-[#333]">Address</p><p className="text-[13px] text-[#666]">Dhaka, Bangladesh</p></div>
                </div>
              </div>
            </div>
            <div className="bg-[#111827] rounded-lg p-6 text-center">
              <h3 className="text-white font-semibold text-[16px] mb-2">Need urgent help?</h3>
              <p className="text-white/60 text-[13px] mb-4">Call our support line</p>
              <a href="tel:+8801700000000" className="inline-flex items-center gap-2 bg-[#0EA5E9] hover:bg-[#0284C7] text-white font-semibold text-[14px] h-10 px-5 rounded-lg transition-colors"><Phone className="w-4 h-4" />+880 1700-000000</a>
            </div>
          </aside>
        </div>
      </main>
      <ChatWidget /><BackToTopButton /><Footer />
    </div>
  );
}
