"use client";
import { useState } from "react";
import { Send } from "lucide-react";
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
      const res = await apiFetch("/newsletter", {
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
    <section className="bg-[#111827] py-10">
      <div className="mx-auto max-w-[1920px] px-4 sm:px-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-center md:text-left">
            <h3 className="text-[20px] font-semibold text-white mb-1">
              {subscribed ? "Thanks for subscribing!" : "Subscribe for Exclusive Deals"}
            </h3>
            <p className="text-[15px] text-white/40">
              {error
                ? error
                : subscribed
                ? "You'll receive our best deals and guides in your inbox."
                : "Get notified about flash sales, new products & free guides directly in your inbox."}
            </p>
          </div>
          {!subscribed && (
            <form onSubmit={handleSubmit} className="flex w-full md:w-auto max-w-md">
              <input type="email" placeholder="Enter your email address" required value={email}
                onChange={(e) => { setEmail(e.target.value); setError(""); }}
                className="flex-1 min-w-0 h-[42px] px-4 text-[15px] bg-white text-[#111827] placeholder:text-[#6B7280] focus:outline-none focus:ring-1 focus:ring-[#0EA5E9] rounded-l border-r-0" />
              <button type="submit" disabled={loading}
                className="bg-[#0EA5E9] hover:bg-[#0284C7] text-white font-semibold h-[42px] px-6 text-[15px] shrink-0 transition-colors rounded-r flex items-center gap-2 disabled:opacity-50">
                {loading ? "Subscribing..." : <>Subscribe <Send className="h-4 w-4" /></>}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}