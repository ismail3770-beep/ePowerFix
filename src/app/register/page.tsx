"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store";
import {
  EPFLogoBolt,
  EPFUser,
  EPFMail,
  EPFPhone,
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

/* ------------------------------------------------------------------ */
/*  Zod schema                                                         */
/* ------------------------------------------------------------------ */
const registerSchema = z
  .object({
    name: z.string().min(2, "নাম কমপক্ষে ২ অক্ষরের হতে হবে"),
    email: z.string().email("সঠিক ইমেইল অ্যাড্রেস দিন"),
    phone: z
      .string()
      .min(11, "ফোন নম্বর ১১ ডিজিটের হতে হবে")
      .max(11, "ফোন নম্বর ১১ ডিজিটের হতে হবে")
      .regex(
        /^01[3-9]\d{8}$/,
        "সঠিক বাংলাদেশি ফোন নম্বর দিন (01XXXXXXXXX)"
      ),
    password: z.string().min(6, "পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে"),
    confirmPassword: z.string().min(1, "পাসওয়ার্ড নিশ্চিত করুন"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "পাসওয়ার্ড মিলছে না",
    path: ["confirmPassword"],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const { setUser, clearUser } = useAuthStore();
  const [formData, setFormData] = useState<RegisterFormData>({
    name: "",
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
          toast.success("অ্যাকাউন্ট সফলভাবে তৈরি হয়েছে!");
          router.push(signInRes.data.user.role === "ADMIN" ? "/admin" : "/");
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
              <span className="text-slate-900 font-medium">Register</span>
            </nav>
          </div>
        </div>

        {/* Register Card */}
        <div className="mx-auto max-w-[1400px] px-4 sm:px-12 py-10 flex items-center justify-center min-h-[calc(100vh-270px)]">
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
                রেজিস্টার করুন / Register
              </h1>
              <p className="text-[14px] text-slate-500 mt-1">
                ePowerFix-এ যোগ দিন
              </p>
            </div>

            {/* Form */}
            <div className="px-8 pb-10 pt-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Full Name */}
                <div className="space-y-2">
                  <Label
                    htmlFor="name"
                    className="text-[14px] font-medium text-slate-700"
                  >
                    পুরো নাম
                  </Label>
                  <div className="relative">
                    <EPFUser
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                    />
                    <Input
                      id="name"
                      type="text"
                      placeholder="আপনার পুরো নাম"
                      value={formData.name}
                      onChange={(e) => updateField("name", e.target.value)}
                      className={`pl-10 h-11 border-slate-200 focus:border-epf-500 focus-visible:ring-epf-500/20 ${errors.name ? "border-danger" : ""}`}
                    />
                  </div>
                  {errors.name && (
                    <p className="text-[12px] text-danger">{errors.name}</p>
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
                    <EPFMail
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                    />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={formData.email}
                      onChange={(e) => updateField("email", e.target.value)}
                      className={`pl-10 h-11 border-slate-200 focus:border-epf-500 focus-visible:ring-epf-500/20 ${errors.email ? "border-danger" : ""}`}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-[12px] text-danger">{errors.email}</p>
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
                    <EPFPhone
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                    />
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="01XXXXXXXXX"
                      value={formData.phone}
                      onChange={(e) =>
                        updateField(
                          "phone",
                          e.target.value.replace(/\D/g, "").slice(0, 11)
                        )
                      }
                      className={`pl-10 h-11 border-slate-200 focus:border-epf-500 focus-visible:ring-epf-500/20 ${errors.phone ? "border-danger" : ""}`}
                    />
                  </div>
                  {errors.phone && (
                    <p className="text-[12px] text-danger">{errors.phone}</p>
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
                    <EPFLock
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                    />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="কমপক্ষে ৬ অক্ষর"
                      value={formData.password}
                      onChange={(e) => updateField("password", e.target.value)}
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
                        <EPFEyeOff size={18} />
                      ) : (
                        <EPFEye size={18} />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-[12px] text-danger">{errors.password}</p>
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
                    <EPFLock
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
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
                        <EPFEyeOff size={18} />
                      ) : (
                        <EPFEye size={18} />
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
                  className="w-full h-11 bg-epf-500 hover:bg-epf-600 text-white font-semibold text-[15px] transition-colors disabled:opacity-70 mt-2"
                >
                  {loading
                    ? "অ্যাকাউন্ট তৈরি হচ্ছে..."
                    : "রেজিস্টার করুন"}
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
