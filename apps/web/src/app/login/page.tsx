"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Eye, EyeOff, Facebook, Globe2, LockKeyhole, Mail, Zap } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useAuthStore } from "@/store";
import { Checkbox } from "@/components/ui/checkbox";
import CartDrawer from "@/components/epf/CartDrawer";
import CheckoutDialog from "@/components/epf/CheckoutDialog";
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
  const [remember, setRemember] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    clearUser();

    try {
      await apiFetch("/api/auth/logout", { method: "POST" });
    } catch {
      // A missing previous session is expected.
    }

    try {
      const response = await apiFetch<any>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      if (!response.data?.user) {
        toast.error("Email or password is incorrect");
        return;
      }

      const loggedInUser = response.data.user;

      if (loggedInUser.role === "ADMIN") {
        // The shared login endpoint also accepts admin credentials. Do not
        // let the customer login establish an admin session or enter /admin.
        try {
          await apiFetch("/api/auth/logout", { method: "POST" });
        } catch {
          // The login rejection still applies even if session cleanup fails.
        }
        clearUser();
        queryClient.removeQueries({ queryKey: ["auth-me"], exact: false });
        toast.error("Admin accounts must use the admin login page.");
        return;
      }

      setUser(loggedInUser);
      queryClient.invalidateQueries({ queryKey: ["auth-me"] });
      queryClient.removeQueries({ queryKey: ["auth-me"], exact: false });
      toast.success("Logged in successfully");

      const redirectTo = new URLSearchParams(window.location.search).get("redirect");
      if (redirectTo?.startsWith("/")) {
        router.push(redirectTo);
      } else if (loggedInUser.role === "ADMIN") {
        router.push("/admin");
      } else {
        router.push("/");
      }
    } catch (error: any) {
      toast.error(error?.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const showSocialNotice = (provider: string) => {
    toast.info(`${provider} sign in is not configured yet`, {
      description: "Please use your email and password to continue.",
    });
  };

  return (
    <main
      className="auth-page relative isolate flex min-h-screen items-start justify-center overflow-hidden px-5 py-14 text-slate-900 sm:py-20"
      style={{ backgroundColor: "#f8fbff" }}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-[-16px] auth-grid opacity-70 blur-[5px]"
        style={{
          backgroundImage: "linear-gradient(rgba(210,226,247,.42) 1px, transparent 1px), linear-gradient(90deg, rgba(210,226,247,.42) 1px, transparent 1px), linear-gradient(135deg, rgba(239,249,255,.72), rgba(255,252,245,.82))",
          backgroundSize: "40px 40px, 40px 40px, 100% 100%",
        }}
      />
      <div aria-hidden="true" className="auth-orb auth-orb-one" />
      <div aria-hidden="true" className="auth-orb auth-orb-two" />
      <div aria-hidden="true" className="auth-orb auth-orb-three" />
      <span aria-hidden="true" className="auth-spark auth-spark-one">+</span>
      <span aria-hidden="true" className="auth-spark auth-spark-two">+</span>
      <span aria-hidden="true" className="auth-spark auth-spark-three">+</span>
      <section className="auth-panel relative z-10 w-full max-w-[430px]">
        <div className="mb-8 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2.5" aria-label="ePowerFix home">
            <span className="auth-logo-mark flex h-9 w-9 items-center justify-center rounded-full bg-epf-500 shadow-sm shadow-epf-500/30"><Zap className="h-5 w-5 text-white" fill="currentColor" /></span>
            <span className="text-[21px] font-semibold tracking-tight text-slate-700">e<span className="text-epf-500">Power</span>Fix</span>
          </a>
          <label className="flex items-center gap-1.5 text-[11px] text-slate-500"><Globe2 className="h-3.5 w-3.5" /><select defaultValue="EN" className="cursor-pointer appearance-none bg-transparent pr-1 text-[11px] outline-none"><option value="EN">EN</option><option value="BN">বাংলা</option></select><span className="text-slate-400">⌄</span></label>
        </div>

        <div>
          <h1 className="text-[30px] font-semibold tracking-tight text-slate-900">Welcome</h1>
          <p className="mt-2 text-[13px] text-slate-500">Enter your details below to sign in into your account.</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form-stagger mt-7 space-y-4">
          <div>
            <label htmlFor="email" className="mb-2 block text-[13px] font-medium text-slate-700">Email <span className="text-red-500">*</span></label>
            <div className="auth-field relative"><Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="admin@email.com" required autoComplete="email" className="h-11 w-full rounded-md border border-slate-200 bg-white pl-10 pr-3 text-[13px] text-slate-700 outline-none transition focus:border-epf-500 focus:ring-2 focus:ring-epf-500/10" /></div>
          </div>
          <div>
            <label htmlFor="password" className="mb-2 block text-[13px] font-medium text-slate-700">Password <span className="text-red-500">*</span></label>
            <div className="auth-field relative"><LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input id="password" type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="••••••" required autoComplete="current-password" className="h-11 w-full rounded-md border border-slate-200 bg-white pl-10 pr-10 text-[13px] text-slate-700 outline-none transition focus:border-epf-500 focus:ring-2 focus:ring-epf-500/10" /><button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700" aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div>
          </div>

          <div className="flex items-center justify-between pt-0.5"><label htmlFor="remember" className="flex cursor-pointer items-center gap-2 text-[13px] text-slate-500"><Checkbox id="remember" checked={remember} onCheckedChange={(value) => setRemember(value === true)} className="h-[18px] w-[18px] rounded border-slate-300 data-[state=checked]:border-epf-500 data-[state=checked]:bg-epf-500" />Remember me</label><button type="button" onClick={() => toast.info("Password reset", { description: "Please contact support at info@epowerfix.com to reset your password." })} className="text-[13px] font-medium text-epf-500 hover:text-epf-600">Forgot password?</button></div>

          <button type="submit" disabled={loading} className="auth-primary-button h-11 w-full rounded-md bg-epf-500 text-[13px] font-semibold text-white shadow-sm transition hover:bg-epf-600 disabled:cursor-not-allowed disabled:opacity-60">{loading ? "Signing in…" : "Sign In"}</button>
        </form>

        <div className="my-7 flex items-center gap-4 text-[12px] text-slate-500"><span className="h-px flex-1 bg-slate-200" /><span>Or</span><span className="h-px flex-1 bg-slate-200" /></div>

        <div className="grid grid-cols-2 gap-3"><button type="button" onClick={() => showSocialNotice("Google")} className="auth-social-button flex h-10 min-w-0 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-[12px] text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"><span className="text-[17px] font-bold text-[#4285f4]">G</span><span className="truncate">Sign in with Google</span></button><button type="button" onClick={() => showSocialNotice("Facebook")} className="auth-social-button flex h-10 min-w-0 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-[12px] text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"><Facebook className="h-4 w-4 fill-[#1877f2] text-[#1877f2]" /><span className="truncate">Sign in with Facebook</span></button></div>

        <p className="mt-7 text-center text-[13px] text-slate-600">Don&apos;t have an account? <a href="/register" className="font-medium text-epf-500 hover:text-epf-600">Sign up</a></p>
      </section>
      <CartDrawer /><CheckoutDialog /><ChatWidget /><BackToTopButton />
    </main>
  );
}
