"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  Phone,
  Zap,
  Truck,
  ShieldCheck,
  PackageCheck,
  ArrowRight,
  Languages,
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

/* ------------------------------------------------------------------ */
/*  Zod schema                                                         */
/* ------------------------------------------------------------------ */
const registerSchema = z
  .object({
    name: z.string().min(2, "নাম কমপক্ষে ২ অক্ষরের হতে হবে"),
    nameBn: z
      .string()
      .optional()
      .refine(
        (v) => !v || v.trim().length >= 2,
        "বাংলা নাম কমপক্ষে ২ অক্ষরের হতে হবে"
      ),
    email: z.string().email("সঠিক ইমেইল অ্যাড্রেস দিন"),
    phone: z
      .string()
      .min(11, "ফোন নম্বর ১১ ডিজিটের হতে হবে")
      .max(11, "ফোন নম্বর ১১ ডিজিটের হতে হবে")
      .regex(/^01[3-9]\d{8}$/, "সঠিক বাংলাদেশি ফোন নম্বর দিন (01XXXXXXXXX)"),
    password: z.string().min(6, "পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে"),
    confirmPassword: z.string().min(1, "পাসওয়ার্ড নিশ্চিত করুন"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "পাসওয়ার্ড মিলছে না",
    path: ["confirmPassword"],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

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

export default function RegisterPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { setUser, clearUser } = useAuthStore();
  const [formData, setFormData] = useState<RegisterFormData>({
    name: "",
    nameBn: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<
    Partial<Record<keyof RegisterFormData, string>>
  >({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const updateField = (field: keyof RegisterFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // Client-side Zod validation
    const result = registerSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof RegisterFormData, string>> = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof RegisterFormData;
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);
    clearUser();

    try {
      // Register via Express API (exclude confirmPassword)
      const { confirmPassword: _, ...registerData } = result.data;
      const registerRes = await apiFetch<any>("/api/auth/register", {
        method: "POST",
        body: JSON.stringify(registerData),
      });

      if (!registerRes.success) {
        toast.error(
          registerRes.error ||
            "রেজিস্ট্রেশন ব্যর্থ হয়েছে। আবার চেষ্টা করুন।"
        );
        return;
      }

      // Auto sign in after registration
      try {
        const signInRes = await apiFetch<any>("/api/auth/login", {
          method: "POST",
          body: JSON.stringify({
            email: result.data.email,
            password: result.data.password,
          }),
        });

        if (signInRes.data?.user) {
          setUser(signInRes.data.user);
          // Invalidate auth cache so protected pages refetch with the new
          // session cookie on next visit (mirrors the login page behaviour).
          queryClient.invalidateQueries({ queryKey: ["auth-me"] });
          queryClient.removeQueries({ queryKey: ["auth-me"], exact: false });
          toast.success("অ্যাকাউন্ট সফলভাবে তৈরি হয়েছে!");
          // Always send customer registrations to the home page.
          // Admin access should only happen via /admin/login separately.
          router.push("/");
          return;
        }
      } catch {
        // Login after register failed — redirect to login page
      }

      toast.success("অ্যাকাউন্ট তৈরি হয়েছে! লগইন করুন।");
      router.push("/login");
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
                  Join{" "}
                  <span className="text-epf-400">ePowerFix</span> —
                  Bangladesh&apos;s #1 electrical marketplace
                </h2>
                <p className="text-[15px] text-slate-300 mt-4 max-w-md leading-relaxed">
                  Create a free account to track orders, save favourites,
                  book services, and check out faster.
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

            {/* Right: Register form card */}
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
                    রেজিস্টার করুন / Register
                  </h1>
                  <p className="text-[14px] text-slate-500 mt-1">
                    ePowerFix-এ যোগ দিন
                  </p>
                </div>

                {/* Form */}
                <div className="px-8 pb-10 pt-6">
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Name (English) */}
                    <div className="space-y-2">
                      <Label
                        htmlFor="name"
                        className="text-[14px] font-medium text-slate-700"
                      >
                        Name (English){" "}
                        <span className="text-slate-400 font-normal">
                          • পুরো নাম
                        </span>
                      </Label>
                      <div className="relative">
                        <User
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                          size={16}
                        />
                        <Input
                          id="name"
                          type="text"
                          placeholder="Your full name"
                          value={formData.name}
                          onChange={(e) =>
                            updateField("name", e.target.value)
                          }
                          className={`pl-10 h-11 border-slate-200 focus:border-epf-500 focus-visible:ring-epf-500/20 ${errors.name ? "border-danger" : ""}`}
                        />
                      </div>
                      {errors.name && (
                        <p className="text-[12px] text-danger">
                          {errors.name}
                        </p>
                      )}
                    </div>

                    {/* Name (Bengali) */}
                    <div className="space-y-2">
                      <Label
                        htmlFor="nameBn"
                        className="text-[14px] font-medium text-slate-700"
                      >
                        নাম (Bengali){" "}
                        <span className="text-slate-400 font-normal">
                          • optional
                        </span>
                      </Label>
                      <div className="relative">
                        <Languages
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                          size={16}
                        />
                        <Input
                          id="nameBn"
                          type="text"
                          placeholder="আপনার নাম বাংলায়"
                          value={formData.nameBn ?? ""}
                          onChange={(e) =>
                            updateField("nameBn", e.target.value)
                          }
                          className={`pl-10 h-11 border-slate-200 focus:border-epf-500 focus-visible:ring-epf-500/20 ${errors.nameBn ? "border-danger" : ""}`}
                        />
                      </div>
                      {errors.nameBn && (
                        <p className="text-[12px] text-danger">
                          {errors.nameBn}
                        </p>
                      )}
                    </div>

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
                          value={formData.email}
                          onChange={(e) =>
                            updateField("email", e.target.value)
                          }
                          className={`pl-10 h-11 border-slate-200 focus:border-epf-500 focus-visible:ring-epf-500/20 ${errors.email ? "border-danger" : ""}`}
                        />
                      </div>
                      {errors.email && (
                        <p className="text-[12px] text-danger">
                          {errors.email}
                        </p>
                      )}
                    </div>

                    {/* Phone */}
                    <div className="space-y-2">
                      <Label
                        htmlFor="phone"
                        className="text-[14px] font-medium text-slate-700"
                      >
                        ফোন নম্বর
                      </Label>
                      <div className="relative">
                        <Phone
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                          size={16}
                        />
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="01XXXXXXXXX"
                          value={formData.phone}
                          onChange={(e) =>
                            updateField(
                              "phone",
                              e.target.value
                                .replace(/\D/g, "")
                                .slice(0, 11)
                            )
                          }
                          className={`pl-10 h-11 border-slate-200 focus:border-epf-500 focus-visible:ring-epf-500/20 ${errors.phone ? "border-danger" : ""}`}
                        />
                      </div>
                      {errors.phone && (
                        <p className="text-[12px] text-danger">
                          {errors.phone}
                        </p>
                      )}
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
                          placeholder="কমপক্ষে ৬ অক্ষর"
                          value={formData.password}
                          onChange={(e) =>
                            updateField("password", e.target.value)
                          }
                          className={`pl-10 pr-10 h-11 border-slate-200 focus:border-epf-500 focus-visible:ring-epf-500/20 ${errors.password ? "border-danger" : ""}`}
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
                      {errors.password && (
                        <p className="text-[12px] text-danger">
                          {errors.password}
                        </p>
                      )}
                    </div>

                    {/* Confirm Password */}
                    <div className="space-y-2">
                      <Label
                        htmlFor="confirmPassword"
                        className="text-[14px] font-medium text-slate-700"
                      >
                        পাসওয়ার্ড নিশ্চিত করুন
                      </Label>
                      <div className="relative">
                        <Lock
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                          size={16}
                        />
                        <Input
                          id="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="পাসওয়ার্ড আবার দিন"
                          value={formData.confirmPassword}
                          onChange={(e) =>
                            updateField("confirmPassword", e.target.value)
                          }
                          className={`pl-10 pr-10 h-11 border-slate-200 focus:border-epf-500 focus-visible:ring-epf-500/20 ${errors.confirmPassword ? "border-danger" : ""}`}
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setShowConfirmPassword(!showConfirmPassword)
                          }
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors"
                          tabIndex={-1}
                          aria-label={
                            showConfirmPassword
                              ? "পাসওয়ার্ড লুকান"
                              : "পাসওয়ার্ড দেখুন"
                          }
                        >
                          {showConfirmPassword ? (
                            <EyeOff size={18} />
                          ) : (
                            <Eye size={18} />
                          )}
                        </button>
                      </div>
                      {errors.confirmPassword && (
                        <p className="text-[12px] text-danger">
                          {errors.confirmPassword}
                        </p>
                      )}
                    </div>

                    {/* Submit */}
                    <Button
                      type="submit"
                      disabled={loading}
                      className="w-full h-11 bg-epf-500 hover:bg-epf-600 text-white font-semibold text-[15px] transition-colors disabled:opacity-70 mt-2 group"
                    >
                      {loading ? (
                        "অ্যাকাউন্ট তৈরি হচ্ছে..."
                      ) : (
                        <span className="flex items-center justify-center gap-2">
                          রেজিস্টার করুন
                          <ArrowRight
                            size={16}
                            className="transition-transform group-hover:translate-x-0.5"
                          />
                        </span>
                      )}
                    </Button>
                  </form>

                  {/* Login Link */}
                  <p className="text-center text-[14px] text-slate-500 mt-6">
                    ইতিমধ্যে অ্যাকাউন্ট আছে?{" "}
                    <a
                      href="/login"
                      className="text-epf-500 font-medium hover:underline"
                    >
                      লগইন করুন
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
