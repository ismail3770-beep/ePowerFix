"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { Home, ChevronRight, User, Mail, Phone, Lock, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
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

/* ------------------------------------------------------------------ */
/*  Zod schema                                                         */
/* ------------------------------------------------------------------ */
const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z
    .string()
    .min(11, "Phone must be 11 digits")
    .max(11, "Phone must be 11 digits")
    .regex(/^01[3-9]\d{8}$/, "Please enter a valid BD phone number (01XXXXXXXXX)"),
  password: z.string().min(6, "Password must be at least 6 characters"),
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
  });
  const [errors, setErrors] = useState<Partial<Record<keyof RegisterFormData, string>>>({});
  const [loading, setLoading] = useState(false);

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
      // Register via Express API
      const registerRes = await apiFetch<any>("/api/auth/register", { method: "POST", body: JSON.stringify(result.data) });

      if (!registerRes.success) {
        toast.error(registerRes.error || "Registration failed. Please try again.");
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
          toast.success("Account created successfully!");
          router.push(signInRes.data.user.role === "ADMIN" ? "/admin" : "/");
          return;
        }
      } catch {
        // Login after register failed — redirect to login page
      }

      toast.success("Account created! Please sign in.");
      router.push("/login");
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
              <span className="text-[#111827] font-medium">Register</span>
            </nav>
          </div>
        </div>

        {/* Register Card */}
        <div className="mx-auto max-w-[1920px] px-4 sm:px-12 py-10 flex items-center justify-center min-h-[calc(100vh-270px)]">
          <Card className="w-full max-w-md border border-[#E2E8F0] shadow-sm">
            <CardHeader className="text-center pb-2 pt-8 px-8">
              <h1 className="text-[24px] font-bold text-[#111827]">Create Account</h1>
              <p className="text-[14px] text-[#6B7280] mt-1">
                Join ePowerFix today
              </p>
            </CardHeader>
            <CardContent className="px-8 pb-8 pt-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Full Name */}
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-[14px] font-medium text-[#374151]">
                    Full Name
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94A3B8]" />
                    <Input
                      id="name"
                      type="text"
                      placeholder="Your full name"
                      value={formData.name}
                      onChange={(e) => updateField("name", e.target.value)}
                      className={`pl-10 h-11 border-[#E2E8F0] focus:border-[#0EA5E9] focus-visible:ring-[#0EA5E9]/20 ${errors.name ? "border-red-400" : ""}`}
                    />
                  </div>
                  {errors.name && <p className="text-[12px] text-red-500">{errors.name}</p>}
                </div>

                {/* Email */}
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
                      value={formData.email}
                      onChange={(e) => updateField("email", e.target.value)}
                      className={`pl-10 h-11 border-[#E2E8F0] focus:border-[#0EA5E9] focus-visible:ring-[#0EA5E9]/20 ${errors.email ? "border-red-400" : ""}`}
                    />
                  </div>
                  {errors.email && <p className="text-[12px] text-red-500">{errors.email}</p>}
                </div>

                {/* Phone */}
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-[14px] font-medium text-[#374151]">
                    Phone Number
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94A3B8]" />
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="01XXXXXXXXX"
                      value={formData.phone}
                      onChange={(e) => updateField("phone", e.target.value.replace(/\D/g, "").slice(0, 11))}
                      className={`pl-10 h-11 border-[#E2E8F0] focus:border-[#0EA5E9] focus-visible:ring-[#0EA5E9]/20 ${errors.phone ? "border-red-400" : ""}`}
                    />
                  </div>
                  {errors.phone && <p className="text-[12px] text-red-500">{errors.phone}</p>}
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-[14px] font-medium text-[#374151]">
                    Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94A3B8]" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="Min 6 characters"
                      value={formData.password}
                      onChange={(e) => updateField("password", e.target.value)}
                      className={`pl-10 h-11 border-[#E2E8F0] focus:border-[#0EA5E9] focus-visible:ring-[#0EA5E9]/20 ${errors.password ? "border-red-400" : ""}`}
                    />
                  </div>
                  {errors.password && <p className="text-[12px] text-red-500">{errors.password}</p>}
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 bg-[#111827] hover:bg-[#0EA5E9] text-white font-semibold text-[15px] transition-colors mt-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    "Create Account"
                  )}
                </Button>
              </form>

              <p className="text-center text-[14px] text-[#6B7280] mt-6">
                Already have an account?{" "}
                <a
                  href="/login"
                  className="text-[#0EA5E9] font-medium hover:underline"
                >
                  Sign In
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