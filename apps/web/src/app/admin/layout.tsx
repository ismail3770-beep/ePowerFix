"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isRestoring } = useAuthStore();

  const isLoginPage = pathname === "/admin/login";

  useEffect(() => {
    if (isLoginPage) return;
    if (isRestoring) return;
    if (!user) { router.replace("/login"); return; }
    if (user.role !== "ADMIN") { router.replace("/"); return; }
  }, [user, isRestoring, router, isLoginPage]);

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (isRestoring || !user || user.role !== "ADMIN") {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin h-10 w-10 border-4 border-blue-600 border-t-transparent rounded-full" />
          <p className="text-sm text-gray-500">Verifying access...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      <AdminSidebar />
      <main className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-900 p-6">
        {children}
      </main>
    </div>
  );
}
