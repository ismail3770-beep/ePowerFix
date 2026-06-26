"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { Loader2, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store";

export default function AdminLoginPage() {
  const router = useRouter();
  const { setUser } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <Card className="w-full max-w-md border shadow-lg">
        <CardHeader className="text-center pb-2 pt-8 px-8">
          <div className="flex justify-center mb-4">
            <div className="h-14 w-14 rounded-full bg-red-100 flex items-center justify-center">
              <ShieldAlert className="h-7 w-7 text-red-600" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Login</h1>
          <p className="text-sm text-gray-500 mt-1">
            Sign in to manage ePowerFix
          </p>
        </CardHeader>
        <CardContent className="px-8 pb-8 pt-4">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="admin-email" className="text-sm font-medium text-gray-700">
                Email Address
              </Label>
              <Input
                id="admin-email"
                type="email"
                placeholder="admin@epowerfix.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="admin-password" className="text-sm font-medium text-gray-700">
                Password
              </Label>
              <Input
                id="admin-password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-11"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-red-600 hover:bg-red-700 text-white font-semibold"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing In...
                </>
              ) : (
                "Sign In to Admin"
              )}
            </Button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            <a href="/" className="text-gray-600 hover:text-gray-900 underline">
              Back to Website
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
