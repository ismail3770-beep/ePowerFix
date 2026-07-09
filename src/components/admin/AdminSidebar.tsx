"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";
import { apiFetch } from "@/lib/api";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  FolderTree,
  Tag,
  Users,
  Star,
  Wrench,
  Layers,
  Boxes,
  Calendar,
  RefreshCcw,
  FileText,
  Folder,
  Image as ImageIcon,
  Ticket,
  Zap,
  Mail,
  MessageCircle,
  FileQuestion,
  Settings,
  CreditCard,
  Truck,
  Receipt,
  Bot,
  FolderOpen,
  ShieldCheck,
  UserCog,
  LogOut,
  type LucideIcon,
} from "lucide-react";

interface MenuItem {
  key: string;
  label: string;
  icon: LucideIcon;
  badgeKey?: string;
}

interface MenuSection {
  title: string;
  items: MenuItem[];
}

/**
 * Grouped admin navigation. All tab keys from the original sidebar are
 * preserved so pageTitleMap / tabRouteMap keep working — they have just been
 * reorganised into the four on-brand groups (MAIN / SERVICES / CONTENT /
 * SETTINGS) requested by the redesign.
 */
const menuSections: MenuSection[] = [
  {
    title: "MAIN",
    items: [
      { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
      { key: "orders", label: "Orders", icon: ShoppingCart },
      { key: "products", label: "Products", icon: Package },
      { key: "categories", label: "Categories", icon: FolderTree },
      { key: "brands", label: "Brands", icon: Tag },
      { key: "customers", label: "Customers", icon: Users },
      { key: "reviews", label: "Reviews", icon: Star },
    ],
  },
  {
    title: "SERVICES",
    items: [
      { key: "services", label: "Services", icon: Wrench },
      { key: "service-categories", label: "Service Categories", icon: Layers },
      { key: "project-kits", label: "Project Kits", icon: Boxes },
      { key: "bookings", label: "Bookings", icon: Calendar },
      { key: "returns", label: "Returns", icon: RefreshCcw },
    ],
  },
  {
    title: "CONTENT",
    items: [
      { key: "blog", label: "Blog", icon: FileText },
      { key: "projects", label: "Projects", icon: Folder },
      { key: "banners", label: "Banners", icon: ImageIcon },
      { key: "coupons", label: "Coupons", icon: Ticket },
      { key: "flash-sales", label: "Flash Sales", icon: Zap },
      { key: "newsletter", label: "Newsletter", icon: Mail },
      { key: "messages", label: "Messages", icon: MessageCircle, badgeKey: "messages" },
      { key: "quote-requests", label: "Quote Requests", icon: FileQuestion },
    ],
  },
  {
    title: "SETTINGS",
    items: [
      { key: "general-settings", label: "General Settings", icon: Settings },
      { key: "payment-gateways", label: "Payment Gateways", icon: CreditCard },
      { key: "shipping", label: "Shipping", icon: Truck },
      { key: "taxes", label: "Taxes", icon: Receipt },
      { key: "ai-providers", label: "AI Providers", icon: Bot },
      { key: "media-library", label: "Media Library", icon: FolderOpen },
      { key: "security", label: "Security", icon: ShieldCheck },
      { key: "staff", label: "Staff", icon: UserCog },
    ],
  },
];

interface AdminSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  collapsed: boolean;
  onToggle?: () => void;
  /** Called after a nav item is clicked (used to close the mobile Sheet). */
  onNavigate?: () => void;
  /** "desktop" = fixed collapsible rail, "mobile" = always-expanded drawer body. */
  variant?: "desktop" | "mobile";
}

export default function AdminSidebar({
  activeTab,
  onTabChange,
  collapsed,
  onNavigate,
  variant = "desktop",
}: AdminSidebarProps) {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const [badgeCounts, setBadgeCounts] = useState<Record<string, number>>({});

  // Fetch NEW messages count for the Messages badge.
  useEffect(() => {
    apiFetch<{ data?: { total?: number } }>("/api/admin/messages?status=NEW&limit=1")
      .then((res) => {
        const total = res?.data?.total ?? 0;
        if (total > 0) setBadgeCounts({ messages: total });
      })
      .catch(() => {});
  }, []);

  const isMobile = variant === "mobile";
  // Mobile drawer is always expanded regardless of the `collapsed` prop.
  const showLabels = isMobile || !collapsed;

  const isActive = (key: string) => activeTab === key;

  const handleItemClick = (key: string) => {
    onTabChange(key);
    onNavigate?.();
  };

  const handleLogout = async () => {
    await logout();
    router.push("/admin/login");
  };

  return (
    <aside
      className={`h-full bg-slate-900 flex flex-col transition-[width] duration-300 ease-in-out ${
        isMobile ? "w-[260px]" : collapsed ? "w-[68px]" : "w-[240px]"
      }`}
    >
      {/* Brand */}
      <div
        className={`shrink-0 h-16 flex items-center gap-2.5 border-b border-white/5 ${
          showLabels ? "px-5" : "px-4 justify-center"
        }`}
      >
        <div className="h-9 w-9 rounded-lg bg-epf-500/15 flex items-center justify-center shrink-0">
          <Zap className="h-5 w-5 text-epf-500" fill="currentColor" strokeWidth={0} />
        </div>
        {showLabels && (
          <div className="min-w-0 leading-tight">
            <div className="text-white text-[15px] font-bold tracking-tight">ePowerFix</div>
            <div className="text-slate-500 text-[10px] uppercase tracking-[0.2em] font-medium">
              Admin Panel
            </div>
          </div>
        )}
      </div>

      {/* Scrollable menu */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden py-2 [scrollbar-width:thin]">
        {menuSections.map((section) => (
          <div key={section.title} className="mb-1">
            {showLabels && (
              <div className="text-slate-600 text-[10px] font-bold uppercase tracking-wider px-5 pt-3 pb-1.5">
                {section.title}
              </div>
            )}
            {section.items.map((item) => {
              const active = isActive(item.key);
              const Icon = item.icon;
              const badgeValue = item.badgeKey
                ? badgeCounts[item.badgeKey] ?? 0
                : 0;

              return (
                <button
                  key={item.key}
                  onClick={() => handleItemClick(item.key)}
                  className={`group relative w-full flex items-center gap-3 border-l-[3px] py-2.5 text-[13px] font-medium transition-all duration-150 ${
                    showLabels ? "px-5" : "px-4 justify-center"
                  } ${
                    active
                      ? "bg-epf-500/10 text-white border-epf-500"
                      : "text-slate-400 hover:text-white hover:bg-white/5 border-transparent"
                  }`}
                  title={!showLabels ? item.label : undefined}
                >
                  <Icon
                    className={`h-[18px] w-[18px] shrink-0 transition-colors ${
                      active ? "text-epf-500" : "text-slate-400 group-hover:text-white"
                    }`}
                  />
                  {showLabels && (
                    <>
                      <span className="flex-1 text-left truncate">{item.label}</span>
                      {badgeValue > 0 && (
                        <span className="shrink-0 bg-red-500 text-white text-[10px] font-bold min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center">
                          {badgeValue > 9 ? "9+" : badgeValue}
                        </span>
                      )}
                    </>
                  )}
                  {!showLabels && badgeValue > 0 && (
                    <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500" />
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Bottom: User mini-profile */}
      <div className="shrink-0 border-t border-white/5 p-3">
        {showLabels ? (
          <div className="flex items-center gap-3 px-2 py-1.5">
            <div className="h-9 w-9 rounded-full bg-epf-500/15 text-epf-500 text-[13px] font-bold flex items-center justify-center shrink-0">
              {user?.name?.charAt(0)?.toUpperCase() || "A"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-medium text-white truncate">
                {user?.name || "Admin"}
              </p>
              <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              title="Logout"
              aria-label="Logout"
              className="h-8 w-8 rounded-md hover:bg-white/5 text-slate-500 hover:text-white flex items-center justify-center transition-colors shrink-0"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={handleLogout}
            title="Logout"
            aria-label="Logout"
            className="h-10 w-full rounded-md hover:bg-white/5 text-slate-500 hover:text-white flex items-center justify-center transition-colors"
          >
            <LogOut className="h-[18px] w-[18px]" />
          </button>
        )}
      </div>
    </aside>
  );
}
