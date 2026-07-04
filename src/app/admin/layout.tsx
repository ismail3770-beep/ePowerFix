"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";
import { useAdminHeaderStore } from "@/store/admin-header-store";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminAIChat from "@/components/admin/AdminAIChat";
import { Bell, ChevronDown, LogOut, ExternalLink, Plus, Menu } from "lucide-react";

interface AdminTabContextType {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const AdminTabContext = createContext<AdminTabContextType>({
  activeTab: 'dashboard',
  onTabChange: () => {},
});

export function useAdminTab() {
  return useContext(AdminTabContext);
}

const pageTitleMap: Record<string, string> = {
  'dashboard': 'Dashboard',
  'orders': 'All Orders',
  'orders-all': 'All Orders',
  'orders-pending': 'Pending Orders',
  'orders-processing': 'Processing Orders',
  'orders-completed': 'Completed Orders',
  'products': 'All Products',
  'products-list': 'All Products',
  'products-add': 'Add Product',
  'categories': 'Categories',
  'brands': 'Brands',
  'services': 'Services',
  'services-list': 'All Services',
  'services-add': 'Add Service',
  'service-categories': 'Service Categories',
  'project-kits': 'Project Kits',
  'bookings': 'Bookings',
  'returns': 'Returns',
  'customers': 'Customers',
  'reviews': 'Reviews',
  'staff': 'Staff',
  'coupons': 'Coupons',
  'flash-sales': 'Flash Sales',
  'newsletter': 'Newsletter',
  'banners': 'Banners',
  'projects': 'Projects',
  'blog': 'Blog',
  'messages': 'Messages',
  'quote-requests': 'Quote Requests',
  'general-settings': 'General Settings',
  'payment-gateways': 'Payment Gateways',
  'shipping': 'Shipping',
  'ai-providers': 'AI Providers',
  'media-library': 'Media Library',
  'security': 'Security',
};

/**
 * Map of every sidebar tab key to its target admin route.
 * Used both for navigation (`router.push`) and for highlighting the
 * active menu item on direct URL visits.
 */
const tabRouteMap: Record<string, string> = {
  'dashboard': '/admin',
  'products': '/admin/products',
  'products-list': '/admin/products',
  'products-add': '/admin/products',
  'categories': '/admin/categories',
  'categories-shortcut': '/admin/categories',
  'brands': '/admin/brands',
  'brands-shortcut': '/admin/brands',
  'services': '/admin/services',
  'services-list': '/admin/services',
  'services-add': '/admin/services',
  'service-categories': '/admin/service-categories',
  'project-kits': '/admin/project-kits',
  'orders': '/admin/orders',
  'orders-all': '/admin/orders',
  'orders-pending': '/admin/orders?status=PENDING',
  'orders-processing': '/admin/orders?status=PROCESSING',
  'orders-completed': '/admin/orders?status=DELIVERED',
  'bookings': '/admin/bookings',
  'returns': '/admin/returns',
  'customers': '/admin/users',
  'reviews': '/admin/reviews',
  'staff': '/admin/staff',
  'coupons': '/admin/coupons',
  'flash-sales': '/admin/flash-sales',
  'newsletter': '/admin/newsletter',
  'banners': '/admin/banners',
  'projects': '/admin/projects',
  'blog': '/admin/blog',
  'messages': '/admin/messages',
  'quote-requests': '/admin/quote-requests',
  'general-settings': '/admin/settings',
  'payment-gateways': '/admin/payment-gateways',
  'shipping': '/admin/shipping',
  'ai-providers': '/admin/ai-providers',
  'media-library': '/admin/media',
  'security': '/admin/security',
};

/**
 * Reverse map: derive the sidebar tab key from the current pathname.
 * Longer routes are matched first so `/admin/products` doesn't shadow
 * `/admin/product-questions` etc.
 */
const pathToTabMap: Array<{ prefix: string; tab: string }> = [
  { prefix: '/admin/products', tab: 'products' },
  { prefix: '/admin/categories', tab: 'categories' },
  { prefix: '/admin/brands', tab: 'brands' },
  { prefix: '/admin/services', tab: 'services' },
  { prefix: '/admin/service-categories', tab: 'service-categories' },
  { prefix: '/admin/project-kits', tab: 'project-kits' },
  { prefix: '/admin/orders', tab: 'orders' },
  { prefix: '/admin/bookings', tab: 'bookings' },
  { prefix: '/admin/returns', tab: 'returns' },
  { prefix: '/admin/users', tab: 'customers' },
  { prefix: '/admin/reviews', tab: 'reviews' },
  { prefix: '/admin/staff', tab: 'staff' },
  { prefix: '/admin/coupons', tab: 'coupons' },
  { prefix: '/admin/flash-sales', tab: 'flash-sales' },
  { prefix: '/admin/newsletter', tab: 'newsletter' },
  { prefix: '/admin/banners', tab: 'banners' },
  { prefix: '/admin/projects', tab: 'projects' },
  { prefix: '/admin/blog', tab: 'blog' },
  { prefix: '/admin/messages', tab: 'messages' },
  { prefix: '/admin/quote-requests', tab: 'quote-requests' },
  { prefix: '/admin/settings', tab: 'general-settings' },
  { prefix: '/admin/payment-gateways', tab: 'payment-gateways' },
  { prefix: '/admin/shipping', tab: 'shipping' },
  { prefix: '/admin/ai-providers', tab: 'ai-providers' },
  { prefix: '/admin/ai-agent', tab: 'ai-providers' },
  { prefix: '/admin/media', tab: 'media-library' },
  { prefix: '/admin/security', tab: 'security' },
  { prefix: '/admin/product-questions', tab: 'products' },
  { prefix: '/admin/taxes', tab: 'coupons' },
  { prefix: '/admin/profile', tab: 'general-settings' },
  { prefix: '/admin', tab: 'dashboard' },
];

function deriveTabFromPath(pathname: string): string {
  if (!pathname || !pathname.startsWith('/admin')) return 'dashboard';
  // Sort by length desc so the most specific prefix wins.
  const sorted = [...pathToTabMap].sort(
    (a, b) => b.prefix.length - a.prefix.length
  );
  for (const entry of sorted) {
    if (pathname === entry.prefix || pathname.startsWith(entry.prefix + '/')) {
      return entry.tab;
    }
  }
  return 'dashboard';
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isRestoring } = useAuthStore();
  const [profileOpen, setProfileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  // Subscribe to the global "Add New" handler registered by each page.
  const addNewLabel = useAdminHeaderStore((s) => s.label);
  const addNewOnClick = useAdminHeaderStore((s) => s.onClick);

  // Derive the active sidebar tab from the URL so direct visits highlight
  // correctly. Fall back to ?tab= query param if present (legacy support).
  const searchTab = typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search).get('tab')
    : null;
  const activeTab = searchTab || deriveTabFromPath(pathname);

  const isLoginPage = pathname === "/admin/login";

  useEffect(() => {
    if (isLoginPage) return;
    if (isRestoring) return;
    if (!user) { router.replace("/login"); return; }
    if (user.role !== "ADMIN") { router.replace("/"); return; }
  }, [user, isRestoring, router, isLoginPage]);

  useEffect(() => {
    const handleClick = () => setProfileOpen(false);
    if (profileOpen) document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [profileOpen]);

  const handleTabChange = (tab: string) => {
    const route = tabRouteMap[tab] || '/admin';
    router.push(route);
  };

  if (isLoginPage) return <>{children}</>;

  if (isRestoring || !user || user.role !== "ADMIN") {
    return (
      <div className="flex h-screen items-center justify-center bg-[#111827]">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin h-8 w-8 border-3 border-[#0EA5E9] border-t-transparent rounded-full" />
          <p className="text-sm text-white/60">Verifying access...</p>
        </div>
      </div>
    );
  }

  return (
    <AdminTabContext.Provider value={{ activeTab, onTabChange: handleTabChange }}>
      <div className="flex h-screen overflow-hidden bg-[#F3F4F6]">
        <AdminSidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          activeTab={activeTab}
          onTabChange={handleTabChange}
        />

        {/* Content area */}
        <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${sidebarCollapsed ? "ml-[60px]" : "ml-[220px]"}`}>
          {/* Top Header */}
          <header className="h-[60px] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.08)] flex items-center justify-between px-6 shrink-0 z-10">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="h-9 w-9 flex items-center justify-center rounded-lg hover:bg-[#F3F4F6] transition-colors"
              >
                <Menu className="h-5 w-5 text-gray-500" />
              </button>
              <h1 className="text-[15px] font-semibold text-[#111827]">{pageTitleMap[activeTab] || 'Dashboard'}</h1>
            </div>

            <div className="flex items-center gap-3">
              {/* Add New — rendered only when a page has registered a handler */}
              {addNewLabel && (
                <button
                  onClick={() => { if (addNewOnClick) addNewOnClick(); }}
                  className="bg-[#0EA5E9] hover:bg-[#0284C7] text-white text-[13px] font-medium rounded-lg px-4 py-2 transition-colors flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" /> {addNewLabel}
                </button>
              )}

              {/* Notification */}
              <button
                onClick={() => router.push('/admin/messages')}
                className="relative h-9 w-9 flex items-center justify-center rounded-lg hover:bg-[#F3F4F6] transition-colors"
                title="Messages"
              >
                <Bell className="h-[18px] w-[18px] text-gray-500" />
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500" />
              </button>

              {/* Profile */}
              <div className="relative">
                <button
                  onClick={(e) => { e.stopPropagation(); setProfileOpen(!profileOpen); }}
                  className="flex items-center gap-2 h-9 px-2 rounded-lg hover:bg-[#F3F4F6] transition-colors"
                >
                  <div className="h-8 w-8 rounded-full bg-sky-100 text-[#0EA5E9] text-[13px] font-bold flex items-center justify-center">
                    {user.name?.charAt(0)?.toUpperCase() || "A"}
                  </div>
                  <span className="hidden sm:block text-[14px] font-medium text-[#111827]">Admin</span>
                  <ChevronDown className="h-3.5 w-3.5 text-gray-400 hidden sm:block" />
                </button>

                {profileOpen && (
                  <div className="absolute right-0 top-full mt-1.5 w-[180px] bg-white rounded-lg border border-[#E5E7EB] shadow-lg py-1 z-50">
                    <div className="px-3 py-2 border-b border-[#E5E7EB]">
                      <p className="text-[13px] font-medium text-[#111827]">{user.name}</p>
                      <p className="text-[11px] text-[#6B7280]">{user.email}</p>
                    </div>
                    <a href="/" className="flex items-center gap-2 px-3 py-2 text-[13px] text-[#374151] hover:bg-[#F9FAFB]">
                      <ExternalLink className="h-3.5 w-3.5" /> View Website
                    </a>
                    <div className="border-t border-[#E5E7EB] my-1" />
                    <button onClick={async () => { const { logout } = useAuthStore.getState(); await logout(); router.push("/admin/login"); }}
                      className="flex items-center gap-2 px-3 py-2 text-[13px] text-red-600 hover:bg-red-50 w-full">
                      <LogOut className="h-3.5 w-3.5" /> Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </header>

          {/* Content */}
          <main className="flex-1 overflow-auto p-5">
            {children}
          </main>
        </div>

        <AdminAIChat />
      </div>
    </AdminTabContext.Provider>
  );
}
