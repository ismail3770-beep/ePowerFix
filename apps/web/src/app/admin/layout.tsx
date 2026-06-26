"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { Search, Bell, ChevronDown, LogOut, User, ExternalLink } from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isRestoring, logout } = useAuthStore();
  const [searchValue, setSearchValue] = useState("");
  const [profileOpen, setProfileOpen] = useState(false);

  const isLoginPage = pathname === "/admin/login";

  useEffect(() => {
    if (isLoginPage) return;
    if (isRestoring) return;
    if (!user) { router.replace("/login"); return; }
    if (user.role !== "ADMIN") { router.replace("/"); return; }
  }, [user, isRestoring, router, isLoginPage, isLoginPage]);

  useEffect(() => {
    const handleClick = () => setProfileOpen(false);
    if (profileOpen) document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [profileOpen]);

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (isRestoring || !user || user.role !== "ADMIN") {
    return (
      <div className="flex h-screen items-center justify-center bg-[#1e293b]">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin h-8 w-8 border-3 border-[#0EA5E9] border-t-transparent rounded-full" />
          <p className="text-sm text-[#94a3b8]">Verifying access...</p>
        </div>
      </div>
    );
  }

  const currentPath = pathname === "/admin" ? "Dashboard" :
    pathname.split("/").pop()?.replace(/-/g, " ")?.replace(/\b\w/g, c => c.toUpperCase()) ?? "Admin";

  return (
    <div className="flex h-screen overflow-hidden bg-[#f8fafc] relative">
      <AdminSidebar />

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar */}
        <header className="h-[56px] bg-white border-b border-[#e2e8f0] flex items-center justify-between px-6 shrink-0">
          {/* Left: Page title */}
          <div className="flex items-center gap-3">
            <div className="lg:hidden w-9" /> {/* Spacer for mobile menu button */}
            <h1 className="text-[16px] font-semibold text-[#111827]">{currentPath}</h1>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="hidden md:flex items-center h-[34px] w-[220px] rounded-md border border-[#e2e8f0] bg-[#f8fafc] px-3 gap-2">
              <Search className="h-3.5 w-3.5 text-[#94a3b8] shrink-0" />
              <input
                type="text"
                placeholder="Search..."
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                className="flex-1 bg-transparent text-[14px] text-[#111827] placeholder:text-[#94a3b8] outline-none"
              />
            </div>

            {/* Notifications */}
            <button className="relative h-9 w-9 flex items-center justify-center rounded-md hover:bg-[#f1f5f9] transition-colors">
              <Bell className="h-[16px] w-[16px] text-[#64748b]" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500" />
            </button>

            {/* Profile dropdown */}
            <div className="relative">
              <button
                onClick={(e) => { e.stopPropagation(); setProfileOpen(!profileOpen); }}
                className="flex items-center gap-2 h-9 px-2 rounded-md hover:bg-[#f1f5f9] transition-colors"
              >
                <div className="h-7 w-7 rounded-full bg-[#0EA5E9] text-white text-[11px] font-bold flex items-center justify-center">
                  {user.name?.charAt(0)?.toUpperCase() || "A"}
                </div>
                <div className="hidden sm:flex flex-col items-start leading-tight">
                  <span className="text-[12px] font-medium text-[#111827]">{user.name?.split(" ")[0]}</span>
                  <span className="text-[11px] text-[#94a3b8]">Administrator</span>
                </div>
                <ChevronDown className="h-3.5 w-3.5 text-[#94a3b8] hidden sm:block" />
              </button>

              {profileOpen && (
                <div className="absolute right-0 top-full mt-1 w-[180px] bg-white rounded-md border border-[#e2e8f0] shadow-lg py-1 z-50">
                  <a
                    href="/admin/profile"
                    className="flex items-center gap-2 px-3 py-2 text-[14px] text-[#374151] hover:bg-[#f8fafc]"
                  >
                    <User className="h-3.5 w-3.5" /> Profile
                  </a>
                  <a
                    href="/"
                    className="flex items-center gap-2 px-3 py-2 text-[14px] text-[#374151] hover:bg-[#f8fafc]"
                  >
                    <ExternalLink className="h-3.5 w-3.5" /> View Website
                  </a>
                  <div className="border-t border-[#e2e8f0] my-1" />
                  <button
                    onClick={async () => { await logout(); router.push("/admin/login"); }}
                    className="flex items-center gap-2 px-3 py-2 text-[13px] text-red-600 hover:bg-red-50 w-full"
                  >
                    <LogOut className="h-3.5 w-3.5" /> Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}