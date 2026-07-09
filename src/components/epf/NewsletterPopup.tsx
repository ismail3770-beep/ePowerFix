"use client";
import { useState, useEffect } from "react";
import { X, Zap, Mail, ShieldCheck } from "lucide-react";
import { apiFetch } from "@/lib/api";

const SESSION_KEY = "epf-newsletter-session-seen";
const PERMANENT_KEY = "epf-newsletter-dismissed";

export default function NewsletterPopup() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [dontShow, setDontShow] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const permanentlyDismissed = localStorage.getItem(PERMANENT_KEY);
    const sessionSeen = sessionStorage.getItem(SESSION_KEY);
    if (!permanentlyDismissed && !sessionSeen) {
      sessionStorage.setItem(SESSION_KEY, "1");
      const timer = setTimeout(() => setOpen(true), 5000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    if (dontShow) {
      localStorage.setItem(PERMANENT_KEY, "1");
    }
    setOpen(false);
  };

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await apiFetch("/api/newsletter", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      setSubmitted(true);
      setEmail("");
      if (dontShow) {
        localStorage.setItem(PERMANENT_KEY, "1");
      }
      setTimeout(() => setOpen(false), 3000);
    } catch (err: any) {
      if (err?.message?.includes("409") || err?.message?.includes("conflict")) {
        setError("Already subscribed!");
      } else {
        setError(err?.message || "Something went wrong");
      }
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={handleClose} />

      {/* Popup */}
      <div className="relative bg-white rounded-lg shadow-2xl w-full max-w-[780px] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-3 right-3 z-10 h-8 w-8 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors text-slate-500 hover:text-slate-900"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex flex-col sm:flex-row">
          {/* Left — Content */}
          <div className="flex-1 p-8 sm:p-10 flex flex-col justify-center">
            {submitted ? (
              <div className="text-center py-4">
                <div className="w-14 h-14 mx-auto mb-4 bg-green-700/10 rounded-full flex items-center justify-center">
                  <ShieldCheck className="h-7 w-7 text-green-700" />
                </div>
                <h3 className="text-[22px] font-bold text-slate-900 mb-2">You&apos;re Subscribed!</h3>
                <p className="text-[15px] text-slate-500">Check your inbox for a welcome surprise. 🎉</p>
              </div>
            ) : (
              <>
                <div className="w-10 h-10 mb-4 bg-epf-500 rounded-full flex items-center justify-center">
                  <Zap className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-[22px] font-bold text-slate-900 mb-2 leading-tight">
                  Get <span className="text-epf-500">10% Off</span> Your First Order
                </h3>
                <p className="text-[15px] text-slate-500 leading-relaxed mb-6">
                  Subscribe to our mailing list to receive updates on new arrivals, special offers and exclusive promotions.
                </p>
                {error && (
                  <p className="text-[14px] text-red-500 mb-3">{error}</p>
                )}
                <form onSubmit={handleSubscribe} className="space-y-3">
                  <div className="flex h-[44px] rounded overflow-hidden border border-slate-200 focus-within:border-epf-500 transition-colors">
                    <div className="flex items-center px-3 bg-slate-50 border-r border-slate-200">
                      <Mail className="h-4 w-4 text-slate-500" />
                    </div>
                    <input
                      type="email"
                      placeholder="Enter your email address"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setError(""); }}
                      className="flex-1 h-full px-3 text-[15px] bg-white focus:outline-none text-slate-900 placeholder:text-slate-400"
                      required
                    />
                    <button
                      type="submit"
                      disabled={loading}
                      className="bg-epf-500 hover:bg-epf-600 text-white font-semibold text-[15px] h-full px-6 transition-colors shrink-0 disabled:opacity-50"
                    >
                      {loading ? "..." : "Subscribe"}
                    </button>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={dontShow}
                      onChange={(e) => setDontShow(e.target.checked)}
                      className="h-4 w-4 accent-epf-500 rounded"
                    />
                    <span className="text-[13px] text-slate-500">Don&apos;t show this popup again</span>
                  </label>
                </form>
              </>
            )}
          </div>

          {/* Right — Visual */}
          <div className="hidden sm:flex w-[280px] lg:w-[320px] bg-gradient-to-br from-slate-900 to-slate-900 items-center justify-center p-8 relative overflow-hidden">
            <div className="absolute inset-0 opacity-5">
              <div className="absolute top-4 left-4 w-32 h-32 rounded-full border border-white" />
              <div className="absolute bottom-8 right-8 w-48 h-48 rounded-full border border-white" />
            </div>
            <div className="relative text-center">
              <div className="w-20 h-20 mx-auto mb-4 bg-epf-500/20 rounded-2xl flex items-center justify-center rotate-3">
                <Zap className="h-10 w-10 text-epf-500" />
              </div>
              <p className="text-epf-500 text-[20px] font-bold mb-1">ePowerFix</p>
              <p className="text-white/50 text-[14px]">Electrical Marketplace</p>
              <div className="mt-6 space-y-2">
                {["Free Shipping ৳5k+", "Licensed Electricians", "Genuine Products"].map((f) => (
                  <div key={f} className="flex items-center gap-2 justify-center">
                    <ShieldCheck className="h-3.5 w-3.5 text-green-700" />
                    <span className="text-white/70 text-[13px]">{f}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}