"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/store";
import { toast } from "sonner";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: "📊" },
  { href: "/admin/flash-sales", label: "Flash Sales", icon: "⚡" },
  { href: "/admin/products", label: "Products", icon: "📦" },
  { href: "/admin/orders", label: "Orders", icon: "🛒" },
  { href: "/admin/users", label: "Users", icon: "👥" },
  { href: "/admin/brands", label: "Brands", icon: "🏷️" },
  { href: "/admin/categories", label: "Categories", icon: "📂" },
  { href: "/admin/coupons", label: "Coupons", icon: "🎫" },
  { href: "/admin/taxes", label: "Taxes", icon: "🧾" },
  { href: "/admin/blog", label: "Blog", icon: "📝" },
  { href: "/admin/services", label: "Services", icon: "🔧" },
  { href: "/admin/bookings", label: "Bookings", icon: "📅" },
  { href: "/admin/reviews", label: "Reviews", icon: "⭐" },
  { href: "/admin/product-questions", label: "Q&A", icon: "❓" },
  { href: "/admin/messages", label: "Messages", icon: "💬" },
  { href: "/admin/quote-requests", label: "Quotes", icon: "📋" },
  { href: "/admin/newsletter", label: "Newsletter", icon: "📧" },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);

  const handleLogout = async () => {
    await logout();
    toast.success("Logged out");
    router.push("/admin/login");
  };

  return (
    <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <Link href="/admin" className="text-xl font-bold text-primary">
          ePowerFix Admin
        </Link>
      </div>
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="p-3 border-t border-gray-200 dark:border-gray-700 space-y-1">
        <Link
          href="/"
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 w-full"
        >
          <span>🏠</span>
          <span>Back to Store</span>
        </Link>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 w-full"
        >
          <span>🚪</span>
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
