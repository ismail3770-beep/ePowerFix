"use client";
import { useState } from "react";
import { Check, Mail, ShieldCheck, Sparkles } from "lucide-react";
import { apiFetch } from "@/lib/api";
import FadeIn from "@/components/epf/FadeIn";

export default function NewsletterBanner() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {return;}
    setLoading(true);
    setError("");
    try {
      await apiFetch("/api/newsletter", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      setSubscribed(true);
      setEmail("");
    } catch (err: any) {
      if (err?.message?.includes("409") || err?.message?.includes("conflict")) {
        setError("Already subscribed!");
      } else {
        setError(err?.message || "Subscription failed");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="bg-slate-900">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <FadeIn>
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            {/* Left Content */}
            <div className="text-center lg:text-left max-w-xl">
              {subscribed ? (
                <div className="flex items-center gap-3 justify-center lg:justify-start">
                  <div className="flex items-center justify-center h-11 w-11 rounded-full bg-emerald-500/15 text-emerald-400 shrink-0">
                    <Check className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-white text-[20px] sm:text-[24px] font-bold tracking-tight">
                      Successfully subscribed!
                    </h3>
                    <p className="text-slate-400 text-[14px] mt-1">
                      Watch your inbox for exclusive deals.
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-epf-500/15 text-epf-400 text-[12px] font-semibold mb-4">
                    <Sparkles className="h-3.5 w-3.5" />
                    Exclusive Offers
                  </span>
                  <h3 className="text-white text-[24px] sm:text-[32px] font-bold tracking-tight leading-[1.15]">
                    Save Up to 50% with Our Coupons
                  </h3>
                  <p className="text-slate-400 text-[14px] sm:text-[15px] mt-3 max-w-md mx-auto lg:mx-0 leading-relaxed">
                    {error ? (
                      <span className="text-red-400">{error}</span>
                    ) : (
                      "Get exclusive deals and updates delivered to your inbox."
                    )}
                  </p>
                </>
              )}
            </div>

            {/* Right: Email Form */}
            {!subscribed && (
              <form onSubmit={handleSubmit} className="flex w-full lg:w-auto flex-col sm:flex-row gap-3 sm:gap-0">
                <div className="relative flex-1 sm:w-80">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
                  <input
                    type="email"
                    placeholder="Enter your email address"
                    required
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError("");
                    }}
                    className="w-full h-12 pl-11 pr-4 bg-white/5 border border-white/15 text-white placeholder:text-slate-500 rounded-lg sm:rounded-r-none focus:outline-none focus:border-epf-500 focus:bg-white/10 transition-colors text-[14px]"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-epf-500 hover:bg-epf-600 text-white font-semibold h-12 px-7 text-[14px] rounded-lg sm:rounded-l-none transition-colors shrink-0 disabled:opacity-50"
                >
                  {loading ? "Subscribing..." : "Subscribe"}
                </button>
              </form>
            )}
          </div>

          {/* Trust text below */}
          <div className="mt-8 pt-6 border-t border-white/10 flex flex-wrap items-center justify-center lg:justify-start gap-x-6 gap-y-2 text-[12px] text-slate-400">
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-slate-500" />
              No spam, ever — unsubscribe anytime
            </span>
            <span className="hidden sm:inline text-slate-600">•</span>
            <span className="inline-flex items-center gap-1.5">
              <Check className="h-4 w-4 text-slate-500" />
              Trusted by 10,000+ customers across Bangladesh
            </span>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
