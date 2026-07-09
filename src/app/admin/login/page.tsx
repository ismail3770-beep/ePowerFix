"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { Loader2, Eye, EyeOff, ArrowLeft, Zap, Package, ShoppingBag, Users } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuthStore } from "@/store";

export default function AdminLoginPage() {
  const router = useRouter();
  const { setUser, clearUser } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Clear any stale local auth state before attempting a fresh admin login.
    // This prevents a leftover customer-role cookie in the browser from being
    // sent on subsequent admin API calls (which would return 403 "Admin
    // access required" even though the UI shows the admin user).
    clearUser();

    try {
      // Hit /api/auth/logout first to clear any pre-existing session cookie
      // server-side before establishing the new admin session.
      try {
        await apiFetch("/api/auth/logout", { method: "POST" });
      } catch {
        // ignore — may not have a session, that's fine
      }

      const res = await apiFetch<any>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      if (!res.data?.user) {
        toast.error("Invalid email or password");
        return;
      }

      const userRole = res.data?.user?.role;
      if (userRole !== "ADMIN") {
        toast.error("This login is for admins only");
        return;
      }

      setUser(res.data?.user);
      toast.success("Welcome to Admin Panel!");

      router.push("/admin");
    } catch (err: any) {
      toast.error(err?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel — Branding (slate-900 with epf-500 accents, matches admin sidebar) */}
      <div className="hidden lg:flex flex-col justify-between w-[45%] p-10 relative overflow-hidden bg-slate-900">
        {/* Decorative glows */}
        <div className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full opacity-20 bg-[radial-gradient(circle,#0EA5E9,transparent)]" />
        <div className="absolute bottom-[-100px] left-[-100px] w-[300px] h-[300px] rounded-full opacity-10 bg-[radial-gradient(circle,#38BDF8,transparent)]" />

        {/* Top: Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg flex items-center justify-center bg-epf-500">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-white font-bold text-xl leading-tight">ePowerFix</h1>
              <p className="text-epf-400 text-[11px] font-medium tracking-wider uppercase">Admin Panel</p>
            </div>
          </div>
        </div>

        {/* Center: Tagline */}
        <div className="relative z-10 space-y-6">
          <h2 className="text-white text-3xl font-bold leading-tight">
            Manage Your Store<br />
            <span className="text-epf-400">Like a Pro</span>
          </h2>
          <p className="text-slate-300 text-[15px] leading-relaxed max-w-[360px]">
            Complete e-commerce & service booking management platform for electrical products in Bangladesh.
          </p>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 pt-4">
            <div className="text-center">
              <div className="flex items-center justify-center h-10 w-10 rounded-lg mx-auto mb-2 bg-white/5">
                <Package className="h-5 w-5 text-epf-400" />
              </div>
              <p className="text-white text-lg font-bold">500+</p>
              <p className="text-slate-400 text-[11px]">Products</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center h-10 w-10 rounded-lg mx-auto mb-2 bg-white/5">
                <ShoppingBag className="h-5 w-5 text-epf-400" />
              </div>
              <p className="text-white text-lg font-bold">1K+</p>
              <p className="text-slate-400 text-[11px]">Orders</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center h-10 w-10 rounded-lg mx-auto mb-2 bg-white/5">
                <Users className="h-5 w-5 text-epf-400" />
              </div>
              <p className="text-white text-lg font-bold">200+</p>
              <p className="text-slate-400 text-[11px]">Customers</p>
            </div>
          </div>
        </div>

        {/* Bottom: Copyright */}
        <div className="relative z-10">
          <p className="text-slate-500 text-xs">
            &copy; {new Date().getFullYear()} ePowerFix. All rights reserved.
          </p>
        </div>
      </div>

      {/* Right Panel — Login Form */}
      <div className="flex-1 flex items-center justify-center bg-slate-50 p-6">
        <div className="w-full max-w-[400px]">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center gap-2.5 mb-8">
            <div className="h-10 w-10 rounded-lg flex items-center justify-center bg-epf-500">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-xl leading-tight text-slate-900">ePowerFix</h1>
              <p className="text-slate-400 text-[11px] font-medium tracking-wider uppercase">Admin Panel</p>
            </div>
          </div>

          {/* Login Card */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
            <div className="text-center mb-8">
              <h2 className="text-slate-900 text-lg font-bold uppercase tracking-wide">
                Welcome to ePowerFix
              </h2>
              <p className="text-slate-500 text-sm mt-1">Login to your admin account.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div className="space-y-1.5">
                <Label htmlFor="admin-email" className="text-[13px] font-medium text-slate-700">
                  Email
                </Label>
                <Input
                  id="admin-email"
                  type="email"
                  placeholder="admin@epowerfix.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-[44px] text-sm border-slate-200 bg-slate-50 rounded-lg focus:border-epf-500 focus:ring-epf-500/20 focus:bg-white transition-colors"
                />
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <Label htmlFor="admin-password" className="text-[13px] font-medium text-slate-700">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="admin-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-[44px] text-sm border-slate-200 bg-slate-50 rounded-lg focus:border-epf-500 focus:ring-epf-500/20 focus:bg-white pr-10 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Remember me + Forgot */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={remember}
                    onCheckedChange={(checked) => setRemember(checked === true)}
                    className="h-4 w-4 rounded border-slate-300 data-[state=checked]:bg-epf-500 data-[state=checked]:border-epf-500"
                  />
                  <span className="text-[13px] text-slate-600">Remember Me</span>
                </label>
                <a href="#" className="text-[13px] text-epf-500 hover:text-epf-600 hover:underline">
                  Forgot password?
                </a>
              </div>

              {/* Login Button */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-[44px] bg-epf-500 hover:bg-epf-600 text-white text-sm font-semibold rounded-lg transition-colors"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Logging in...
                  </>
                ) : (
                  "Login"
                )}
              </Button>
            </form>
          </div>

          {/* Back link */}
          <div className="text-center mt-6">
            <a
              href="/"
              className="inline-flex items-center gap-1.5 text-[13px] text-slate-500 hover:text-epf-500 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Previous Page
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}