"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { Loader2, Eye, EyeOff, ArrowLeft, Zap, Shield, ShoppingBag, Wrench } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store";

export default function AdminLoginPage() {
  const router = useRouter();
  const { setUser } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-amber-500 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-500 rounded-full blur-3xl" />
        </div>

        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          {/* Top Logo */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-amber-500 flex items-center justify-center">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-white font-bold text-lg leading-tight">ePowerFix</h2>
              <p className="text-blue-300 text-xs">Admin Panel</p>
            </div>
          </div>

          {/* Center Content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/10">
                <div className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                <span className="text-blue-200 text-sm font-medium">System Online</span>
              </div>
              <h1 className="text-4xl font-bold text-white leading-tight">
                Electrical Power &
                <br />
                <span className="text-amber-400">Digital Technology</span>
              </h1>
              <p className="text-blue-200/80 text-lg max-w-md leading-relaxed">
                Bangladesh&apos;s trusted online marketplace for electrical products, services, and tools.
              </p>
            </div>

            {/* Feature cards */}
            <div className="grid grid-cols-2 gap-4 max-w-md">
              <div className="p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 space-y-2">
                <div className="h-9 w-9 rounded-lg bg-amber-500/20 flex items-center justify-center">
                  <ShoppingBag className="h-4 w-4 text-amber-400" />
                </div>
                <p className="text-white text-sm font-medium">Product Management</p>
                <p className="text-blue-300/60 text-xs">Manage inventory & orders</p>
              </div>
              <div className="p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 space-y-2">
                <div className="h-9 w-9 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <Shield className="h-4 w-4 text-blue-400" />
                </div>
                <p className="text-white text-sm font-medium">Secure Dashboard</p>
                <p className="text-blue-300/60 text-xs">Role-based access control</p>
              </div>
              <div className="p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 space-y-2">
                <div className="h-9 w-9 rounded-lg bg-green-500/20 flex items-center justify-center">
                  <Wrench className="h-4 w-4 text-green-400" />
                </div>
                <p className="text-white text-sm font-medium">Service Booking</p>
                <p className="text-blue-300/60 text-xs">Manage service requests</p>
              </div>
              <div className="p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 space-y-2">
                <div className="h-9 w-9 rounded-lg bg-purple-500/20 flex items-center justify-center">
                  <Zap className="h-4 w-4 text-purple-400" />
                </div>
                <p className="text-white text-sm font-medium">Analytics</p>
                <p className="text-blue-300/60 text-xs">Track sales & revenue</p>
              </div>
            </div>
          </div>

          {/* Bottom branding */}
          <div className="space-y-1">
            <p className="text-white/40 text-xs">
              &copy; {new Date().getFullYear()} ePowerFix. All rights reserved.
            </p>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-white p-8">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile logo (shown only on small screens) */}
          <div className="flex items-center gap-3 lg:hidden">
            <div className="h-10 w-10 rounded-lg bg-amber-500 flex items-center justify-center">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <h2 className="font-bold text-lg text-slate-900">ePowerFix</h2>
          </div>

          {/* Header */}
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-slate-900">
              Welcome to <span className="text-amber-500">ePowerFix</span>
            </h1>
            <p className="text-slate-500">Login to your admin account.</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="admin-email" className="text-sm font-medium text-slate-600">
                Email Address
              </Label>
              <Input
                id="admin-email"
                type="email"
                placeholder="admin@epowerfix.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-11 border-slate-200 focus:border-amber-500 focus:ring-amber-500/20"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="admin-password" className="text-sm font-medium text-slate-600">
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
                  className="h-11 border-slate-200 focus:border-amber-500 focus:ring-amber-500/20 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-amber-500 hover:bg-amber-600 text-white font-semibold transition-colors"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing In...
                </>
              ) : (
                "Login"
              )}
            </Button>
          </form>

          {/* Back link */}
          <a
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-amber-500 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Website
          </a>
        </div>
      </div>
    </div>
  );
}