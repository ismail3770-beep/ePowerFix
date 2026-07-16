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
  Globe2,
  LockKeyhole,
  Mail,
  Phone,
  ShieldCheck,
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
  const [errors, setErrors] = useState<
    Partial<Record<keyof RegisterFormData, string>>
  >({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [captchaAccepted, setCaptchaAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);

  const updateField = (field: keyof RegisterFormData, value: string) => {
    setFormData((previous) => ({ ...previous, [field]: value }));
    setErrors((previous) => ({ ...previous, [field]: undefined }));
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
        toast.error(
          registerRes.error || "Registration failed. Please try again."
        );
        return;
      }

      // Sign the new customer in immediately, preserving the existing flow.
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
          queryClient.invalidateQueries({ queryKey: ["auth-me"] });
          queryClient.removeQueries({ queryKey: ["auth-me"], exact: false });
          toast.success("Account created successfully!");
          router.push("/");
          return;
        }
      } catch {
        // If automatic sign-in fails, send the user to the login page.
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

  const inputClass = (field: keyof RegisterFormData) =>
    `h-10 w-full rounded-md border bg-white text-[13px] text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-epf-500 focus:ring-2 focus:ring-epf-500/10 ${
      errors[field] ? "border-red-400" : "border-slate-200"
    }`;

  return (
    <main
      className="auth-page relative isolate flex min-h-screen items-start justify-center overflow-hidden px-5 py-10 text-slate-900 sm:py-12"
      style={{ backgroundColor: "#f8fbff" }}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-[-16px] auth-grid opacity-70 blur-[5px]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(210,226,247,.42) 1px, transparent 1px), linear-gradient(90deg, rgba(210,226,247,.42) 1px, transparent 1px), linear-gradient(135deg, rgba(239,249,255,.72), rgba(255,252,245,.82))",
          backgroundSize: "40px 40px, 40px 40px, 100% 100%",
        }}
      />
      <div aria-hidden="true" className="auth-orb auth-orb-one" />
      <div aria-hidden="true" className="auth-orb auth-orb-two" />
      <div aria-hidden="true" className="auth-orb auth-orb-three" />
      <span aria-hidden="true" className="auth-spark auth-spark-one">+</span>
      <span aria-hidden="true" className="auth-spark auth-spark-two">+</span>
      <span aria-hidden="true" className="auth-spark auth-spark-three">+</span>

      <section className="auth-panel relative z-10 w-full max-w-[390px]">
        <div className="mb-7 flex items-center justify-between">
          <a
            href="/"
            className="flex items-center gap-2.5"
            aria-label="ePowerFix home"
          >
            <span className="auth-logo-mark flex h-9 w-9 items-center justify-center rounded-full bg-epf-500 shadow-sm shadow-epf-500/30">
              <Zap className="h-5 w-5 text-white" fill="currentColor" />
            </span>
            <span className="text-[21px] font-semibold tracking-tight text-slate-700">
              e<span className="text-epf-500">Power</span>Fix
            </span>
          </a>
          <label className="flex items-center gap-1.5 text-[11px] text-slate-500">
            <Globe2 className="h-3.5 w-3.5" />
            <select
              defaultValue="EN"
              aria-label="Language"
              className="cursor-pointer appearance-none bg-transparent pr-1 text-[11px] outline-none"
            >
              <option value="EN">EN</option>
              <option value="BN">বাংলা</option>
            </select>
            <span className="text-slate-400">⌄</span>
          </label>
        </div>

        <div>
          <h1 className="text-[30px] font-semibold tracking-tight text-slate-900">
            Register
          </h1>
          <p className="mt-1.5 text-[13px] text-slate-500">
            Enter your details below to create your account.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form-stagger mt-6 space-y-3.5">
          <div>
            <label
              htmlFor="firstName"
              className="mb-1.5 block text-[13px] font-medium text-slate-700"
            >
              First Name <span className="text-red-500">*</span>
            </label>
            <div className="auth-field relative">
              <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                id="firstName"
                type="text"
                value={formData.firstName}
                onChange={(event) => updateField("firstName", event.target.value)}
                placeholder="First Name"
                autoComplete="given-name"
                className={`${inputClass("firstName")} pl-10 pr-3`}
              />
            </div>
            {errors.firstName && (
              <p className="mt-1 text-[11px] text-red-500">{errors.firstName}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="lastName"
              className="mb-1.5 block text-[13px] font-medium text-slate-700"
            >
              Last Name <span className="text-red-500">*</span>
            </label>
            <div className="auth-field relative">
              <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                id="lastName"
                type="text"
                value={formData.lastName}
                onChange={(event) => updateField("lastName", event.target.value)}
                placeholder="Last Name"
                autoComplete="family-name"
                className={`${inputClass("lastName")} pl-10 pr-3`}
              />
            </div>
            {errors.lastName && (
              <p className="mt-1 text-[11px] text-red-500">{errors.lastName}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="email"
              className="mb-1.5 block text-[13px] font-medium text-slate-700"
            >
              Email <span className="text-red-500">*</span>
            </label>
            <div className="auth-field relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                id="email"
                type="email"
                value={formData.email}
                onChange={(event) => updateField("email", event.target.value)}
                placeholder="Enter your email"
                autoComplete="email"
                className={`${inputClass("email")} pl-10 pr-3`}
              />
            </div>
            {errors.email && (
              <p className="mt-1 text-[11px] text-red-500">{errors.email}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="phone"
              className="mb-1.5 block text-[13px] font-medium text-slate-700"
            >
              Phone <span className="text-red-500">*</span>
            </label>
            <div className="auth-field relative">
              <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(event) =>
                  updateField(
                    "phone",
                    event.target.value.replace(/\D/g, "").slice(0, 11)
                  )
                }
                placeholder="Phone"
                autoComplete="tel"
                className={`${inputClass("phone")} pl-10 pr-3`}
              />
            </div>
            {errors.phone && (
              <p className="mt-1 text-[11px] text-red-500">{errors.phone}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-1.5 block text-[13px] font-medium text-slate-700"
            >
              Password <span className="text-red-500">*</span>
            </label>
            <div className="auth-field relative">
              <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={(event) => updateField("password", event.target.value)}
                placeholder="Password"
                autoComplete="new-password"
                className={`${inputClass("password")} pl-10 pr-10`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-700"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-[11px] text-red-500">{errors.password}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="mb-1.5 block text-[13px] font-medium text-slate-700"
            >
              Confirm Password <span className="text-red-500">*</span>
            </label>
            <div className="auth-field relative">
              <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={formData.confirmPassword}
                onChange={(event) =>
                  updateField("confirmPassword", event.target.value)
                }
                placeholder="Confirm Password"
                autoComplete="new-password"
                className={`${inputClass("confirmPassword")} pl-10 pr-10`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((value) => !value)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-700"
                aria-label={
                  showConfirmPassword ? "Hide password" : "Show password"
                }
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="mt-1 text-[11px] text-red-500">
                {errors.confirmPassword}
              </p>
            )}
          </div>

          <div className="flex w-[264px] items-center justify-between border border-slate-300 bg-[#fafafa] px-3 py-2.5 shadow-sm">
            <label className="flex cursor-pointer items-center gap-3 text-[12px] text-slate-700">
              <input
                type="checkbox"
                checked={captchaAccepted}
                onChange={(event) => setCaptchaAccepted(event.target.checked)}
                aria-label="I'm not a robot"
                className="h-6 w-6 rounded-sm border-slate-400 accent-slate-700"
              />
              <span>I&apos;m not a robot</span>
            </label>
            <div className="flex flex-col items-center gap-0.5 text-slate-400">
              <ShieldCheck className="h-7 w-7 text-[#4285f4]" />
              <span className="text-[8px] font-medium">reCAPTCHA</span>
            </div>
          </div>

          <label className="flex cursor-pointer items-center gap-2 text-[12px] text-slate-500">
            <input
              type="checkbox"
              checked={privacyAccepted}
              onChange={(event) => setPrivacyAccepted(event.target.checked)}
              className="h-4 w-4 rounded border-slate-300 accent-epf-500"
            />
            <span>
              I agree to the{" "}
              <a href="/privacy" className="text-slate-700 underline underline-offset-2">
                Privacy Policy
              </a>
            </span>
          </label>

          <button
            type="submit"
            disabled={loading}
            className="auth-primary-button h-10 w-full rounded-md bg-slate-800 text-[13px] font-semibold text-white shadow-sm transition hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Creating account…" : "Create Account"}
          </button>
        </form>

        <div className="my-6 flex items-center gap-4 text-[12px] text-slate-500">
          <span className="h-px flex-1 bg-slate-200" />
          <span>Or</span>
          <span className="h-px flex-1 bg-slate-200" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => showSocialNotice("Google")}
            className="auth-social-button flex h-10 min-w-0 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-[12px] text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
          >
            <span className="text-[17px] font-bold text-[#4285f4]">G</span>
            <span className="truncate">Sign in with Google</span>
          </button>
          <button
            type="button"
            onClick={() => showSocialNotice("Facebook")}
            className="auth-social-button flex h-10 min-w-0 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-[12px] text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
          >
            <Facebook className="h-4 w-4 fill-[#1877f2] text-[#1877f2]" />
            <span className="truncate">Sign in with Facebook</span>
          </button>
        </div>

        <p className="mt-7 text-center text-[13px] text-slate-600">
          Already have an account?{" "}
          <a href="/login" className="font-medium text-epf-500 hover:text-epf-600">
            Sign In
          </a>
        </p>
      </section>

      <CartDrawer />
      <CheckoutDialog />
      <ChatWidget />
      <BackToTopButton />
    </main>
  );
}
