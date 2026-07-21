"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Eye, EyeOff, Facebook, Globe2, LockKeyhole, Mail, Zap } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useAuthStore } from "@/store";
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
        try {
          await apiFetch("/api/auth/logout", { method: "POST" });
        } catch {
          // ignore
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
    <main className="min-h-screen flex items-center justify-center px-4 py-12 bg-gray-50">
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
            <a href="/login" className="py-3.5 text-sm font-bold uppercase tracking-wider text-center bg-[#0EA5E9] text-white">
              Sign In
            </a>
            <a href="/register" className="py-3.5 text-sm font-bold uppercase tracking-wider text-center bg-gray-100 text-gray-500 hover:text-gray-800 transition-colors">
              Register
            </a>
          </div>

          {/* Form body */}
          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="john@example.com"
                    required
                    autoComplete="email"
                    className="w-full border border-gray-300 rounded px-3 py-2.5 pl-10 text-sm outline-none focus:border-[#0EA5E9] transition-colors"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="password" className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => toast.info("Password reset", { description: "Please contact support at info@epowerfix.com to reset your password." })}
                    className="text-xs text-[#0EA5E9] hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    autoComplete="current-password"
                    className="w-full border border-gray-300 rounded px-3 py-2.5 pl-10 pr-10 text-sm outline-none focus:border-[#0EA5E9] transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="accent-[#0EA5E9]"
                />
                <span className="text-xs text-gray-500">Remember me for 30 days</span>
              </label>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#0EA5E9] text-white font-bold py-3 rounded hover:bg-sky-600 transition-colors uppercase tracking-wider disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? "Signing in…" : "Sign In"}
              </button>
            </form>

            <div className="my-5 flex items-center gap-3">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs text-gray-400">or continue with</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => showSocialNotice("Google")}
                className="flex items-center justify-center gap-2 border border-gray-300 rounded py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                <span className="text-base font-bold text-[#4285f4]">G</span>
                Google
              </button>
              <button
                type="button"
                onClick={() => showSocialNotice("Facebook")}
                className="flex items-center justify-center gap-2 border border-gray-300 rounded py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                <Facebook className="h-4 w-4 fill-[#1877f2] text-[#1877f2]" />
                Facebook
              </button>
            </div>
          </div>
        </div>

        <p className="mt-6 text-center text-sm text-gray-600">
          Don&apos;t have an account?{" "}
          <a href="/register" className="font-semibold text-[#0EA5E9] hover:underline">
            Sign up
          </a>
        </p>
      </div>

      <CartDrawer /><CheckoutDialog /><ChatWidget /><BackToTopButton />
    </main>
  );
}
