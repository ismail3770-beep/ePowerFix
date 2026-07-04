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
  const { setUser } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
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
      {/* Left Panel — Branding */}
      <div
        className="hidden lg:flex flex-col justify-between w-[45%] p-10 relative overflow-hidden"
        style={{ background: "#1a0d33" }}
      >
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full opacity-10" style={{ background: "radial-gradient(circle, #7C3AED, transparent)" }} />
        <div className="absolute bottom-[-100px] left-[-100px] w-[300px] h-[300px] rounded-full opacity-5" style={{ background: "radial-gradient(circle, #a78bfa, transparent)" }} />

        {/* Top: Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg flex items-center justify-center" style={{ background: "#7C3AED" }}>
              <Zap className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-white font-bold text-xl leading-tight">ePowerFix</h1>
              <p className="text-[#a78bfa] text-[11px] font-medium tracking-wider uppercase">Admin Panel</p>
            </div>
          </div>
        </div>

        {/* Center: Tagline */}
        <div className="relative z-10 space-y-6">
          <h2 className="text-white text-3xl font-bold leading-tight">
            Manage Your Store<br />
            <span style={{ color: "#a78bfa" }}>Like a Pro</span>
          </h2>
          <p className="text-[#c4b5fd]/80 text-[15px] leading-relaxed max-w-[360px]">
            Complete e-commerce & service booking management platform for electrical products in Bangladesh.
          </p>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 pt-4">
            <div className="text-center">
              <div className="flex items-center justify-center h-10 w-10 rounded-lg mx-auto mb-2" style={{ background: "#2d1b5a" }}>
                <Package className="h-5 w-5 text-[#a78bfa]" />
              </div>
              <p className="text-white text-lg font-bold">500+</p>
              <p className="text-[#a78bfa]/60 text-[11px]">Products</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center h-10 w-10 rounded-lg mx-auto mb-2" style={{ background: "#2d1b5a" }}>
                <ShoppingBag className="h-5 w-5 text-[#a78bfa]" />
              </div>
              <p className="text-white text-lg font-bold">1K+</p>
              <p className="text-[#a78bfa]/60 text-[11px]">Orders</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center h-10 w-10 rounded-lg mx-auto mb-2" style={{ background: "#2d1b5a" }}>
                <Users className="h-5 w-5 text-[#a78bfa]" />
              </div>
              <p className="text-white text-lg font-bold">200+</p>
              <p className="text-[#a78bfa]/60 text-[11px]">Customers</p>
            </div>
          </div>
        </div>

        {/* Bottom: Copyright */}
        <div className="relative z-10">
          <p className="text-[#a78bfa]/40 text-xs">
            &copy; {new Date().getFullYear()} ePowerFix. All rights reserved.
          </p>
        </div>
      </div>

      {/* Right Panel — Login Form */}
      <div className="flex-1 flex items-center justify-center bg-[#f8f9fa] p-6">
        <div className="w-full max-w-[400px]">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center gap-2.5 mb-8">
            <div className="h-10 w-10 rounded-lg flex items-center justify-center" style={{ background: "#7C3AED" }}>
              <Zap className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-xl leading-tight text-[#1f2937]">ePowerFix</h1>
              <p className="text-[#9ca3af] text-[11px] font-medium tracking-wider uppercase">Admin Panel</p>
            </div>
          </div>

          {/* Login Card */}
          <div className="bg-white rounded-xl shadow-sm border border-[#e5e7eb] p-8">
            <div className="text-center mb-8">
              <h2 className="text-[#1f2937] text-lg font-bold uppercase tracking-wide">
                Welcome to ePowerFix
              </h2>
              <p className="text-[#6b7280] text-sm mt-1">Login to your account.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div className="space-y-1.5">
                <Label htmlFor="admin-email" className="text-[13px] font-medium text-[#374151]">
                  Email
                </Label>
                <Input
                  id="admin-email"
                  type="email"
                  placeholder="admin@epowerfix.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-[44px] text-sm border-[#e5e7eb] bg-[#f8f9fa] rounded-lg focus:border-[#7C3AED] focus:ring-[#7C3AED]/20 focus:bg-white transition-colors"
                />
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <Label htmlFor="admin-password" className="text-[13px] font-medium text-[#374151]">
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
                    className="h-[44px] text-sm border-[#e5e7eb] bg-[#f8f9fa] rounded-lg focus:border-[#7C3AED] focus:ring-[#7C3AED]/20 focus:bg-white pr-10 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9ca3af] hover:text-[#6b7280] transition-colors"
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
                    className="h-4 w-4 rounded border-[#d1d5db] data-[state=checked]:bg-[#7C3AED] data-[state=checked]:border-[#7C3AED]"
                  />
                  <span className="text-[13px] text-[#6b7280]">Remember Me</span>
                </label>
                <a href="#" className="text-[13px] text-[#7C3AED] hover:underline">
                  Forgot password?
                </a>
              </div>

              {/* Login Button */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-[44px] text-white text-sm font-semibold rounded-lg transition-colors"
                style={{ background: "#7C3AED" }}
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
              className="inline-flex items-center gap-1.5 text-[13px] text-[#6b7280] hover:text-[#7C3AED] transition-colors"
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