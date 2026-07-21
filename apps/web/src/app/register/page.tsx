"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { z } from "zod";
import {
  Eye,
  EyeOff,
  Facebook,
  LockKeyhole,
  Mail,
  Phone,
  User,
  Zap,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useAuthStore } from "@/store";
import CartDrawer from "@/components/epf/CartDrawer";
import CheckoutDialog from "@/components/epf/CheckoutDialog";
import ChatWidget from "@/components/epf/ChatWidget";
import BackToTopButton from "@/components/epf/BackToTopButton";

const registerSchema = z
  .object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    email: z.string().email("Enter a valid email address"),
    phone: z
      .string()
      .min(11, "Phone number must be 11 digits")
      .max(11, "Phone number must be 11 digits")
      .regex(/^01[3-9]\d{8}$/, "Enter a valid Bangladesh phone number"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

const initialFormData: RegisterFormData = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
};

export default function RegisterPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { setUser, clearUser } = useAuthStore();
  const [formData, setFormData] = useState<RegisterFormData>(initialFormData);
  const [errors, setErrors] = useState<Partial<Record<keyof RegisterFormData, string>>>({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);

  const updateField = (field: keyof RegisterFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

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
      const registerRes = await apiFetch<any>("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          name: `${result.data.firstName} ${result.data.lastName}`.trim(),
          email: result.data.email,
          phone: result.data.phone,
          password: result.data.password,
        }),
      });

      if (!registerRes.success) {
        toast.error(registerRes.error || "Registration failed. Please try again.");
        return;
      }

      try {
        const signInRes = await apiFetch<any>("/api/auth/login", {
          method: "POST",
          body: JSON.stringify({ email: result.data.email, password: result.data.password }),
        });

        if (signInRes.data?.user) {
          setUser(signInRes.data.user);
          queryClient.invalidateQueries({ queryKey: ["auth-me"] });
          queryClient.removeQueries({ queryKey: ["auth-me"], exact: false });
          toast.success("Account created successfully!");
          router.push("/");
          return;
        }
      } catch {
        // If automatic sign-in fails, send to login page.
      }

      toast.success("Account created. Please sign in.");
      router.push("/login");
    } catch (error: any) {
      toast.error(error?.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const showSocialNotice = (provider: string) => {
    toast.info(`${provider} sign in is not configured yet`, {
      description: "Please create your account with email and password.",
    });
  };

  const fieldClass = (field: keyof RegisterFormData) =>
    `w-full border rounded px-3 py-2.5 text-sm outline-none transition-colors ${errors[field] ? "border-red-400 focus:border-red-500" : "border-gray-300 focus:border-[#0EA5E9]"}`;

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-10 bg-gray-50">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <a href="/" className="inline-flex items-center justify-center gap-2 mb-3">
            <div className="w-8 h-8 bg-[#0EA5E9] rounded flex items-center justify-center">
              <Zap className="h-4 w-4 text-white fill-current" />
            </div>
            <span className="font-black text-2xl tracking-tight text-gray-900">e<span className="text-[#0EA5E9]">Power</span>Fix</span>
          </a>
          <p className="text-gray-500 text-sm">Your trusted electrical marketplace</p>
        </div>

        {/* Card */}
        <div className="bg-white border border-gray-200 rounded shadow-lg overflow-hidden">
          {/* Tab bar */}
          <div className="grid grid-cols-2">
            <a href="/login" className="py-3.5 text-sm font-bold uppercase tracking-wider text-center bg-gray-100 text-gray-500 hover:text-gray-800 transition-colors">
              Sign In
            </a>
            <a href="/register" className="py-3.5 text-sm font-bold uppercase tracking-wider text-center bg-[#0EA5E9] text-white">
              Register
            </a>
          </div>

          {/* Form body */}
          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-3.5">
              {/* Name row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => updateField("firstName", e.target.value)}
                      placeholder="First name"
                      autoComplete="given-name"
                      className={`${fieldClass("firstName")} pl-10`}
                    />
                  </div>
                  {errors.firstName && <p className="mt-1 text-[11px] text-red-500">{errors.firstName}</p>}
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => updateField("lastName", e.target.value)}
                      placeholder="Last name"
                      autoComplete="family-name"
                      className={`${fieldClass("lastName")} pl-10`}
                    />
                  </div>
                  {errors.lastName && <p className="mt-1 text-[11px] text-red-500">{errors.lastName}</p>}
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => updateField("email", e.target.value)}
                    placeholder="john@example.com"
                    autoComplete="email"
                    className={`${fieldClass("email")} pl-10`}
                  />
                </div>
                {errors.email && <p className="mt-1 text-[11px] text-red-500">{errors.email}</p>}
              </div>

              {/* Phone */}
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => updateField("phone", e.target.value.replace(/\D/g, "").slice(0, 11))}
                    placeholder="01XXXXXXXXX"
                    autoComplete="tel"
                    className={`${fieldClass("phone")} pl-10`}
                  />
                </div>
                {errors.phone && <p className="mt-1 text-[11px] text-red-500">{errors.phone}</p>}
              </div>

              {/* Password */}
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => updateField("password", e.target.value)}
                    placeholder="Min. 6 characters"
                    autoComplete="new-password"
                    className={`${fieldClass("password")} pl-10 pr-10`}
                  />
                  <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700" aria-label={showPassword ? "Hide" : "Show"}>
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && <p className="mt-1 text-[11px] text-red-500">{errors.password}</p>}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={(e) => updateField("confirmPassword", e.target.value)}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    className={`${fieldClass("confirmPassword")} pl-10 pr-10`}
                  />
                  <button type="button" onClick={() => setShowConfirmPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700" aria-label={showConfirmPassword ? "Hide" : "Show"}>
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="mt-1 text-[11px] text-red-500">{errors.confirmPassword}</p>}
              </div>

              {/* Privacy */}
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={privacyAccepted}
                  onChange={(e) => setPrivacyAccepted(e.target.checked)}
                  className="accent-[#0EA5E9] mt-0.5"
                />
                <span className="text-xs text-gray-500">
                  I agree to the{" "}
                  <a href="/privacy" className="text-[#0EA5E9] hover:underline">Terms of Service</a>
                  {" "}and{" "}
                  <a href="/privacy" className="text-[#0EA5E9] hover:underline">Privacy Policy</a>
                </span>
              </label>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#0EA5E9] text-white font-bold py-3 rounded hover:bg-sky-600 transition-colors uppercase tracking-wider disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? "Creating account…" : "Create Account"}
              </button>
            </form>

            <div className="my-5 flex items-center gap-3">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs text-gray-400">or continue with</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button type="button" onClick={() => showSocialNotice("Google")} className="flex items-center justify-center gap-2 border border-gray-300 rounded py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                <span className="text-base font-bold text-[#4285f4]">G</span>
                Google
              </button>
              <button type="button" onClick={() => showSocialNotice("Facebook")} className="flex items-center justify-center gap-2 border border-gray-300 rounded py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                <Facebook className="h-4 w-4 fill-[#1877f2] text-[#1877f2]" />
                Facebook
              </button>
            </div>
          </div>
        </div>

        <p className="mt-6 text-center text-sm text-gray-600">
          Already have an account?{" "}
          <a href="/login" className="font-semibold text-[#0EA5E9] hover:underline">Sign In</a>
        </p>
      </div>

      <CartDrawer /><CheckoutDialog /><ChatWidget /><BackToTopButton />
    </main>
  );
}
