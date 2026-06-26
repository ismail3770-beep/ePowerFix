"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { Home, ChevronRight, Mail, Lock, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store";
import Header from "@/components/epf/Header";
import Footer from "@/components/epf/Footer";
import CartDrawer from "@/components/epf/CartDrawer";
import CheckoutDialog from "@/components/epf/CheckoutDialog";
import ProductDetailDialog from "@/components/epf/ProductDetailDialog";
import ServiceBookingDialog from "@/components/epf/ServiceBookingDialog";
import ProjectDetailDialog from "@/components/epf/ProjectDetailDialog";
import ChatWidget from "@/components/epf/ChatWidget";
import BackToTopButton from "@/components/epf/BackToTopButton";

export default function LoginPage() {
  const router = useRouter();
  const { setUser, clearUser } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    clearUser();

    try {
      const res = await apiFetch<any>("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });

      if (!res.data?.token) {
        toast.error("Invalid email or password");
        return;
      }

      const userRole = res.data?.user?.role;

      if (userRole === "ADMIN") {
        toast.error("Invalid email or password");
        return;
      }

      setUser(res.data?.user);
      toast.success("Signed in successfully!");
      router.push("/");
    } catch (err: any) {
      toast.error(err?.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 bg-[#F8FAFC]">
        {/* Breadcrumb */}
        <div className="bg-white border-b border-[#E2E8F0]">
          <div className="mx-auto max-w-[1920px] px-4 sm:px-12">
            <nav className="flex items-center gap-1.5 h-[44px] text-[14px]">
              <a
                href="/"
                className="flex items-center gap-1 text-[#6B7280] hover:text-[#111827] transition-colors"
              >
                <Home className="h-3.5 w-3.5" />
                <span>Home</span>
              </a>
              <ChevronRight className="h-3 w-3 text-[#94A3B8]" />
              <span className="text-[#111827] font-medium">Login</span>
            </nav>
          </div>
        </div>

        {/* Login Card */}
        <div className="mx-auto max-w-[1920px] px-4 sm:px-12 py-12 flex items-center justify-center min-h-[calc(100vh-270px)]">
          <Card className="w-full max-w-md border border-[#E2E8F0] shadow-sm">
            <CardHeader className="text-center pb-2 pt-8 px-8">
              <h1 className="text-[24px] font-bold text-[#111827]">Sign In</h1>
              <p className="text-[14px] text-[#6B7280] mt-1">
                Welcome back to ePowerFix
              </p>
            </CardHeader>
            <CardContent className="px-8 pb-8 pt-4">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-[14px] font-medium text-[#374151]">
                    Email Address
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94A3B8]" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="pl-10 h-11 border-[#E2E8F0] focus:border-[#0EA5E9] focus-visible:ring-[#0EA5E9]/20"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-[14px] font-medium text-[#374151]">
                    Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94A3B8]" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="pl-10 h-11 border-[#E2E8F0] focus:border-[#0EA5E9] focus-visible:ring-[#0EA5E9]/20"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 bg-[#111827] hover:bg-[#0EA5E9] text-white font-semibold text-[15px] transition-colors"
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

              <p className="text-center text-[14px] text-[#6B7280] mt-6">
                Don&apos;t have an account?{" "}
                <a
                  href="/register"
                  className="text-[#0EA5E9] font-medium hover:underline"
                >
                  Register
                </a>
              </p>
            </CardContent>
          </Card>
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