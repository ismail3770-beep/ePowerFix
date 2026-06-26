"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { Loader2, Eye, EyeOff, ArrowLeft, Zap, Shield, ShoppingBag, Wrench } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuthStore } from "@/store";
import Image from "next/image";

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

      if (!res.data?.token) {
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
    <div className="min-h-screen flex items-center justify-center bg-[#1e293b] relative overflow-hidden">
      {/* Background subtle grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.8) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* Background gradient orbs */}
      <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-[#0EA5E9]/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] bg-[#0EA5E9]/5 rounded-full blur-[100px]" />

      <div className="relative z-10 w-full max-w-[420px] mx-4">
        {/* Login Card */}
        <div className="bg-white rounded-lg shadow-2xl shadow-black/20 overflow-hidden">
          {/* Top brand bar */}
          <div className="bg-[#1e293b] px-8 py-6 text-center">
            <div className="flex items-center justify-center gap-3">
              <div className="h-9 w-9 rounded-md bg-[#0EA5E9] flex items-center justify-center">
                <Zap className="h-5 w-5 text-white" />
              </div>
              <div className="text-left">
                <h1 className="text-white font-bold text-xl leading-tight tracking-tight">ePowerFix</h1>
                <p className="text-slate-400 text-[11px] font-medium tracking-wide uppercase">Admin Panel</p>
              </div>
            </div>
          </div>

          {/* Form Area */}
          <div className="px-8 py-8">
            <div className="text-center mb-6">
              <h2 className="text-[#111827] text-lg font-semibold">Sign In</h2>
              <p className="text-[#64748b] text-sm mt-1">Enter your credentials to access the admin panel</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div className="space-y-1.5">
                <Label htmlFor="admin-email" className="text-[13px] font-medium text-[#374151]">
                  Email Address
                </Label>
                <Input
                  id="admin-email"
                  type="email"
                  placeholder="admin@epowerfix.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-[42px] text-sm border-[#e2e8f0] bg-[#f8fafc] rounded-md focus:border-[#0EA5E9] focus:ring-[#0EA5E9]/20 focus:bg-white transition-colors"
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
                    className="h-[42px] text-sm border-[#e2e8f0] bg-[#f8fafc] rounded-md focus:border-[#0EA5E9] focus:ring-[#0EA5E9]/20 focus:bg-white pr-10 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-[#64748b] transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Remember me */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={remember}
                    onCheckedChange={(checked) => setRemember(checked === true)}
                    className="h-4 w-4 rounded border-[#d1d5db] data-[state=checked]:bg-[#0EA5E9] data-[state=checked]:border-[#0EA5E9]"
                  />
                  <span className="text-[13px] text-[#64748b]">Remember me</span>
                </label>
              </div>

              {/* Login Button */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-[42px] bg-[#0EA5E9] hover:bg-[#0284C7] text-white text-sm font-semibold rounded-md transition-colors"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing In...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>

            {/* Back link */}
            <div className="mt-6 pt-5 border-t border-[#f1f5f9] text-center">
              <a
                href="/"
                className="inline-flex items-center gap-1.5 text-[13px] text-[#64748b] hover:text-[#0EA5E9] transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to Website
              </a>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-[#475569]/60 text-xs mt-6">
          &copy; {new Date().getFullYear()} ePowerFix. All rights reserved.
        </p>
      </div>
    </div>
  );
}