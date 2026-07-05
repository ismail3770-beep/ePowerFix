"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

/**
 * Project Kits admin page.
 *
 * Project kits ARE sellable projects — they're managed from the same
 * Projects page. This page redirects there so the admin doesn't hit a
 * dead-end placeholder.
 */
export default function AdminProjectKitsPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/admin/projects");
  }, [router]);
  return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="h-6 w-6 animate-spin text-[#0EA5E9]" />
      <span className="ml-3 text-sm text-[#6B7280]">Redirecting to Projects…</span>
    </div>
  );
}
