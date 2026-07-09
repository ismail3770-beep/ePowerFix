"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";
import { useAdminHeaderStore } from "@/store/admin-header-store";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminAIChat from "@/components/admin/AdminAIChat";
import NotificationBell from "@/components/epf/NotificationBell";
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, LogOut, ExternalLink, Plus, Menu, UserCircle } from "lucide-react";

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
  'orders': 'Orders',
  'products': 'All Products',
  'categories': 'Categories',
  'brands': 'Brands',
  'services': 'Services',
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
  'taxes': 'Taxes',
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
  'categories': '/admin/categories',
  'brands': '/admin/brands',
  'services': '/admin/services',
  'service-categories': '/admin/service-categories',
  'project-kits': '/admin/project-kits',
  'orders': '/admin/orders',
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
  'taxes': '/admin/taxes',
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
  { prefix: '/admin/taxes', tab: 'taxes' },
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
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

  const handleTabChange = (tab: string) => {
    const route = tabRouteMap[tab] || '/admin';
    router.push(route);
  };

  const handleHamburger = () => {
    // Mobile → open the drawer; Desktop → collapse/expand the rail.
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setMobileOpen(true);
    } else {
      setSidebarCollapsed((v) => !v);
    }
  };

  const handleLogout = async () => {
    const { logout } = useAuthStore.getState();
    await logout();
    router.push("/admin/login");
  };

  if (isLoginPage) return <>{children}</>;

  if (isRestoring || !user || user.role !== "ADMIN") {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-900">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin h-8 w-8 border-[3px] border-epf-500 border-t-transparent rounded-full" />
          <p className="text-sm text-slate-400">Verifying access...</p>
        </div>
      </div>
    );
  }

  return (
    <AdminTabContext.Provider value={{ activeTab, onTabChange: handleTabChange }}>
      <div className="flex h-screen overflow-hidden bg-slate-50">
        {/* Desktop sidebar — fixed rail (hidden on mobile) */}
        <div
          className={`hidden lg:block fixed left-0 top-0 h-screen z-40 transition-[left] duration-300 ${
            sidebarCollapsed ? "lg:left-0" : "lg:left-0"
          }`}
        >
          <AdminSidebar
            collapsed={sidebarCollapsed}
            activeTab={activeTab}
            onTabChange={handleTabChange}
          />
        </div>

        {/* Mobile sidebar — Sheet drawer */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent
            side="left"
            className="p-0 w-[260px] max-w-[85vw] border-0 bg-slate-900 overflow-hidden"
          >
            <SheetTitle className="sr-only">Admin navigation</SheetTitle>
            <AdminSidebar
              collapsed={false}
              activeTab={activeTab}
              onTabChange={handleTabChange}
              onNavigate={() => setMobileOpen(false)}
              variant="mobile"
            />
          </SheetContent>
        </Sheet>

        {/* Content area */}
        <div
          className={`flex-1 flex flex-col min-w-0 transition-[margin] duration-300 ${
            sidebarCollapsed ? "lg:ml-[68px]" : "lg:ml-[240px]"
          }`}
        >
          {/* Top Header */}
          <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 shrink-0 z-30">
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={handleHamburger}
                className="h-9 w-9 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
                aria-label="Toggle sidebar"
              >
                <Menu className="h-5 w-5" />
              </button>
              <h1 className="text-[16px] font-semibold text-slate-900 truncate">
                {pageTitleMap[activeTab] || 'Dashboard'}
              </h1>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              {/* Add New — rendered only when a page has registered a handler */}
              {addNewLabel && (
                <button
                  onClick={() => { if (addNewOnClick) addNewOnClick(); }}
                  className="bg-epf-500 hover:bg-epf-600 text-white text-[13px] font-semibold rounded-lg px-4 h-9 transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">{addNewLabel}</span>
                </button>
              )}

              {/* Notifications — real dropdown with latest order/return/status alerts */}
              <NotificationBell />

              {/* Profile dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 h-9 px-2 rounded-lg hover:bg-slate-100 transition-colors">
                    <div className="h-8 w-8 rounded-full bg-epf-500/15 text-epf-500 text-[13px] font-bold flex items-center justify-center">
                      {user.name?.charAt(0)?.toUpperCase() || "A"}
                    </div>
                    <span className="hidden sm:block text-[13px] font-medium text-slate-700 max-w-[120px] truncate">
                      {user.name?.split(' ')[0] || 'Admin'}
                    </span>
                    <ChevronDown className="h-3.5 w-3.5 text-slate-400 hidden sm:block" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[220px]">
                  <DropdownMenuLabel className="font-normal px-3 py-2">
                    <div className="flex flex-col space-y-0.5">
                      <p className="text-[13px] font-medium text-slate-900 truncate">{user.name}</p>
                      <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <a href="/admin/profile" className="flex items-center gap-2 cursor-pointer">
                      <UserCircle className="h-4 w-4" /> My Profile
                    </a>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <a href="/" className="flex items-center gap-2 cursor-pointer">
                      <ExternalLink className="h-4 w-4" /> View Website
                    </a>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    variant="destructive"
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <LogOut className="h-4 w-4" /> Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          {/* Content */}
          <main className="flex-1 overflow-auto p-4 sm:p-6 bg-slate-50">
            {children}
          </main>
        </div>

        <AdminAIChat />
      </div>
    </AdminTabContext.Provider>
  );
}
