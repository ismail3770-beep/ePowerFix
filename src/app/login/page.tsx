"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store";
import {
  EPFLogoBolt,
  EPFMail,
  EPFLock,
  EPFHome,
  EPFChevronRight,
  EPFEye,
  EPFEyeOff,
} from "@/components/epf/icons/EPFIcons";
import Header from "@/components/epf/Header";
import Footer from "@/components/epf/Footer";
import CartDrawer from "@/components/epf/CartDrawer";
import CheckoutDialog from "@/components/epf/CheckoutDialog";
import ProductDetailDialog from "@/components/epf/ProductDetailDialog";
import ServiceBookingDialog from "@/components/epf/ServiceBookingDialog";
import ProjectDetailDialog from "@/components/epf/ProjectDetailDialog";
import ChatWidget from "@/components/epf/ChatWidget";
import BackToTopButton from "@/components/epf/BackToTopButton";

export default function LoginPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { setUser, clearUser } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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

      <main className="flex-1 bg-gradient-to-b from-slate-50 to-slate-100/50">
        {/* Breadcrumb */}
        <div className="bg-white border-b border-slate-200">
          <div className="mx-auto max-w-[1400px] px-4 sm:px-12">
            <nav className="flex items-center gap-1.5 h-[44px] text-[14px]">
              <a
                href="/"
                className="flex items-center gap-1 text-slate-500 hover:text-slate-900 transition-colors"
              >
                <EPFHome size={14} />
                <span>Home</span>
              </a>
              <EPFChevronRight size={12} className="text-slate-400" />
              <span className="text-slate-900 font-medium">Login</span>
            </nav>
          </div>
        </div>

        {/* Login Card */}
        <div className="mx-auto max-w-[1400px] px-4 sm:px-12 py-12 flex items-center justify-center min-h-[calc(100vh-270px)]">
          <div className="w-full max-w-md bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Logo + Header */}
            <div className="text-center pt-10 pb-2 px-8">
              {/* Logo */}
              <div className="flex items-center justify-center gap-1.5 mb-6">
                <EPFLogoBolt size={28} className="text-epf-500" />
                <span className="text-[22px] font-bold text-slate-900 tracking-tight">
                  e<span className="text-epf-500">Power</span>Fix
                </span>
              </div>
              <p className="text-[10px] font-semibold tracking-[0.25em] text-slate-400 uppercase mb-5">
                ELECTRICAL MARKETPLACE
              </p>
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
                    <EPFMail
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
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
                    <EPFLock
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
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
                      aria-label={showPassword ? "পাসওয়ার্ড লুকান" : "পাসওয়ার্ড দেখুন"}
                    >
                      {showPassword ? (
                        <EPFEyeOff size={18} />
                      ) : (
                        <EPFEye size={18} />
                      )}
                    </button>
                  </div>
                </div>

                {/* Forgot Password */}
                <div className="text-right">
                  <button
                    type="button"
                    onClick={() => toast.info("Password reset", { description: "Please contact support at info@epowerfix.com to reset your password." })}
                    className="text-[13px] text-slate-500 hover:text-epf-500 transition-colors"
                  >
                    পাসওয়ার্ড ভুলে গেছেন?
                  </button>
                </div>

                {/* Submit */}
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 bg-epf-500 hover:bg-epf-600 text-white font-semibold text-[15px] transition-colors disabled:opacity-70"
                >
                  {loading ? "প্রসেসিং হচ্ছে..." : "লগইন করুন"}
                </Button>
              </form>

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-sm">
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
