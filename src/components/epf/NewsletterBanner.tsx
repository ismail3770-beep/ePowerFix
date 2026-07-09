"use client";
import { useState } from "react";
import { Check } from "lucide-react";
import { apiFetch } from "@/lib/api";

export default function NewsletterBanner() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
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
      <div className="max-w-[1400px] mx-auto px-4 sm:px-12 py-12 sm:py-16">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
          {/* Left Content */}
          <div className="text-center lg:text-left">
            {subscribed ? (
              <div className="flex items-center gap-2 justify-center lg:justify-start">
                <Check className="h-5 w-5 text-success" />
                <h3 className="text-white text-xl sm:text-2xl font-bold">
                  Successfully subscribed!
                </h3>
              </div>
            ) : (
              <>
                <h3 className="text-white text-xl sm:text-2xl font-bold">
                  Save Up to 50% with Our Coupons
                </h3>
                <p className="text-slate-400 text-sm sm:text-[15px] mt-2 max-w-md">
                  {error ? (
                    <span className="text-red-400">{error}</span>
                  ) : (
                    "Get exclusive deals and updates delivered to your inbox"
                  )}
                </p>
              </>
            )}
          </div>

          {/* Right: Email Form */}
          {!subscribed && (
            <form onSubmit={handleSubmit} className="flex w-full lg:w-auto">
              <input
                type="email"
                placeholder="Enter your email address"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError("");
                }}
                className="flex-1 min-w-0 w-full lg:w-72 h-11 px-4 bg-white/10 border border-white/20 text-white placeholder:text-white/50 rounded-l-md focus:outline-none focus:border-epf-500 text-sm"
              />
              <button
                type="submit"
                disabled={loading}
                className="bg-epf-500 hover:bg-epf-600 text-white font-semibold h-11 px-6 text-sm rounded-r-md transition-colors shrink-0 disabled:opacity-50"
              >
                {loading ? "Subscribing..." : "Subscribe"}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
