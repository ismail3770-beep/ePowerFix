"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuthStore } from "@/store";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Zap,
  Truck,
  ShieldCheck,
  PackageCheck,
  ArrowRight,
} from "lucide-react";
import Header from "@/components/epf/Header";
import Footer from "@/components/epf/Footer";
import CartDrawer from "@/components/epf/CartDrawer";
import CheckoutDialog from "@/components/epf/CheckoutDialog";
import ProductDetailDialog from "@/components/epf/ProductDetailDialog";
import ServiceBookingDialog from "@/components/epf/ServiceBookingDialog";
import ProjectDetailDialog from "@/components/epf/ProjectDetailDialog";
import ChatWidget from "@/components/epf/ChatWidget";
import BackToTopButton from "@/components/epf/BackToTopButton";

const TRUST_POINTS = [
  {
    icon: PackageCheck,
    title: "500+ Products",
    desc: "Genuine electrical parts, tools & accessories",
  },
  {
    icon: Truck,
    title: "Fast Delivery",
    desc: "Nationwide shipping within 24-48 hours",
  },
  {
    icon: ShieldCheck,
    title: "Secure Payment",
    desc: "bKash, Nagad, Rocket & card payments",
  },
];

export default function LoginPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { setUser, clearUser } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    clearUser();

    // Clear any pre-existing session cookie server-side before logging in.
    // This avoids stale-role cookies (e.g. an admin cookie left in the browser
    // being sent on customer API calls, or vice-versa).
    try {
      await apiFetch("/api/auth/logout", { method: "POST" });
    } catch {
      // ignore — no existing session is fine
    }

    try {
      const res = await apiFetch<any>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      if (!res.data?.user) {
        toast.error("ইমেইল অথবা পাসওয়ার্ড সঠিক নয়");
        return;
      }

      const loggedInUser = res.data?.user;
      setUser(loggedInUser);
      // Clear any stale "not authenticated" cache so protected pages (e.g.
      // /profile) refetch with the new session cookie on next visit.
      queryClient.invalidateQueries({ queryKey: ["auth-me"] });
      queryClient.removeQueries({ queryKey: ["auth-me"], exact: false });
      toast.success("সফলভাবে লগইন হয়েছে!");

      // Redirect: prefer explicit ?redirect= param (e.g. when sent here from
      // /profile), otherwise admins go to the admin panel and customers home.
      const params = new URLSearchParams(window.location.search);
      const redirectTo = params.get("redirect");
      if (redirectTo && redirectTo.startsWith("/")) {
        router.push(redirectTo);
      } else if (loggedInUser.role === "ADMIN") {
        router.push("/admin");
      } else {
        router.push("/");
      }
    } catch (err: any) {
      toast.error(
        err?.message || "কিছু একটা সমস্যা হয়েছে। আবার চেষ্টা করুন।"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 bg-slate-50">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-stretch">
            {/* Left: Brand Panel (hidden on mobile) */}
            <aside className="hidden lg:flex relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-epf-700 p-10 xl:p-12 flex-col justify-between min-h-[620px]">
              {/* Decorative glows */}
              <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-epf-500/30 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-epf-400/20 blur-3xl" />
              {/* Subtle grid pattern */}
              <div
                className="pointer-events-none absolute inset-0 opacity-[0.04]"
                style={{
                  backgroundImage:
                    "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
                  backgroundSize: "32px 32px",
                }}
              />

              {/* Top: Branding */}
              <div className="relative z-10">
                <div className="flex items-center gap-2.5 mb-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-epf-500 shadow-lg shadow-epf-500/30">
                    <Zap className="h-6 w-6 text-white" fill="currentColor" />
                  </div>
                  <span className="text-[24px] font-bold text-white tracking-tight">
                    e<span className="text-epf-400">Power</span>Fix
                  </span>
                </div>
                <p className="text-[11px] font-semibold tracking-[0.25em] text-epf-300/80 uppercase ml-[52px]">
                  Electrical Marketplace
                </p>
              </div>

              {/* Middle: Tagline */}
              <div className="relative z-10 my-8">
                <h2 className="text-[30px] xl:text-[36px] font-bold text-white leading-tight">
                  Bangladesh&apos;s #1 marketplace for{" "}
                  <span className="text-epf-400">electrical &amp; power</span>{" "}
                  products
                </h2>
                <p className="text-[15px] text-slate-300 mt-4 max-w-md leading-relaxed">
                  Sign in to track orders, save favourites, and check out
                  faster across all your devices.
                </p>
              </div>

              {/* Bottom: Trust points */}
              <div className="relative z-10 space-y-4">
                {TRUST_POINTS.map((t) => (
                  <div key={t.title} className="flex items-start gap-3.5">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/10 backdrop-blur-sm border border-white/15">
                      <t.icon className="h-5 w-5 text-epf-300" />
                    </div>
                    <div className="pt-1">
                      <p className="text-[15px] font-semibold text-white">
                        {t.title}
                      </p>
                      <p className="text-[13px] text-slate-300">{t.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </aside>

            {/* Right: Login form card */}
            <section className="flex items-center justify-center">
              <div className="w-full max-w-md bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                {/* Header */}
                <div className="px-8 pt-10 pb-2 text-center">
                  {/* Mobile-only logo */}
                  <div className="lg:hidden flex items-center justify-center gap-1.5 mb-5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-epf-500">
                      <Zap
                        className="h-5 w-5 text-white"
                        fill="currentColor"
                      />
                    </div>
                    <span className="text-[20px] font-bold text-slate-900 tracking-tight">
                      e<span className="text-epf-500">Power</span>Fix
                    </span>
                  </div>
                  <h1 className="text-[24px] font-bold text-slate-900">
                    লগইন করুন / Login
                  </h1>
                  <p className="text-[14px] text-slate-500 mt-1">
                    ePowerFix-এ আবার স্বাগতম
                  </p>
                </div>

                {/* Form */}
                <div className="px-8 pb-10 pt-6">
                  <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Email */}
                    <div className="space-y-2">
                      <Label
                        htmlFor="email"
                        className="text-[14px] font-medium text-slate-700"
                      >
                        ইমেইল
                      </Label>
                      <div className="relative">
                        <Mail
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                          size={16}
                        />
                        <Input
                          id="email"
                          type="email"
                          placeholder="you@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          className="pl-10 h-11 border-slate-200 focus:border-epf-500 focus-visible:ring-epf-500/20"
                        />
                      </div>
                    </div>

                    {/* Password */}
                    <div className="space-y-2">
                      <Label
                        htmlFor="password"
                        className="text-[14px] font-medium text-slate-700"
                      >
                        পাসওয়ার্ড
                      </Label>
                      <div className="relative">
                        <Lock
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                          size={16}
                        />
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="আপনার পাসওয়ার্ড দিন"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          className="pl-10 pr-10 h-11 border-slate-200 focus:border-epf-500 focus-visible:ring-epf-500/20"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors"
                          tabIndex={-1}
                          aria-label={
                            showPassword
                              ? "পাসওয়ার্ড লুকান"
                              : "পাসওয়ার্ড দেখুন"
                          }
                        >
                          {showPassword ? (
                            <EyeOff size={18} />
                          ) : (
                            <Eye size={18} />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Remember + Forgot */}
                    <div className="flex items-center justify-between">
                      <label
                        htmlFor="remember"
                        className="flex items-center gap-2 cursor-pointer select-none"
                      >
                        <Checkbox
                          id="remember"
                          checked={remember}
                          onCheckedChange={(v) => setRemember(v === true)}
                          className="border-slate-300 data-[state=checked]:bg-epf-500 data-[state=checked]:border-epf-500 data-[state=checked]:text-white"
                        />
                        <span className="text-[13px] text-slate-600">
                          মনে রাখুন
                        </span>
                      </label>
                      <button
                        type="button"
                        onClick={() =>
                          toast.info("Password reset", {
                            description:
                              "Please contact support at info@epowerfix.com to reset your password.",
                          })
                        }
                        className="text-[13px] text-slate-500 hover:text-epf-500 transition-colors font-medium"
                      >
                        পাসওয়ার্ড ভুলে গেছেন?
                      </button>
                    </div>

                    {/* Submit */}
                    <Button
                      type="submit"
                      disabled={loading}
                      className="w-full h-11 bg-epf-500 hover:bg-epf-600 text-white font-semibold text-[15px] transition-colors disabled:opacity-70 group"
                    >
                      {loading ? (
                        "প্রসেসিং হচ্ছে..."
                      ) : (
                        <span className="flex items-center justify-center gap-2">
                          লগইন করুন
                          <ArrowRight
                            size={16}
                            className="transition-transform group-hover:translate-x-0.5"
                          />
                        </span>
                      )}
                    </Button>
                  </form>

                  {/* Divider */}
                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-slate-200" />
                    </div>
                    <div className="relative flex justify-center">
                      <span className="px-3 bg-white text-slate-500 text-[13px]">
                        অথবা
                      </span>
                    </div>
                  </div>

                  {/* Register Link */}
                  <p className="text-center text-[14px] text-slate-500">
                    নতুন অ্যাকাউন্ট তৈরি করুন{" "}
                    <a
                      href="/register"
                      className="text-epf-500 font-medium hover:underline"
                    >
                      Register
                    </a>
                  </p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>

      <div className="mt-auto">
        <Footer />
      </div>

      {/* Overlays & Dialogs */}
      <CartDrawer />
      <CheckoutDialog />
      <ServiceBookingDialog />
      <ProductDetailDialog />
      <ProjectDetailDialog />
      <ChatWidget />
      <BackToTopButton />
    </div>
  );
}
