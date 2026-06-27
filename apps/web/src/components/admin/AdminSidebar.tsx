"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";
import { toast } from "sonner";
import {
  LayoutDashboard,
  Zap,
  ShoppingBag,
  Users,
  User,
  Package,
  Tag,
  FolderOpen,
  Ticket,
  Receipt,
  FileText,
  Wrench,
  CalendarCheck,
  Star,
  MessageSquare,
  HelpCircle,
  ClipboardList,
  Mail,
  RotateCcw,
  LogOut,
  ExternalLink,
  ChevronDown,
  Menu,
  X,
  Settings,
  ImageIcon,
  Bot,
  Shield,
} from "lucide-react";

interface NavGroup {
  label: string;
  items: { href: string; label: string; icon: React.ElementType }[];
}

const navGroups: NavGroup[] = [
  {
    label: "MAIN",
    items: [
      { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
      { href: "/admin/ai-agent", label: "AI Assistant", icon: Bot },
      { href: "/admin/profile", label: "Profile", icon: User },
    ],
  },
  {
    label: "CATALOG",
    items: [
      { href: "/admin/flash-sales", label: "Flash Sales", icon: Zap },
      { href: "/admin/products", label: "Products", icon: Package },
      { href: "/admin/brands", label: "Brands", icon: Tag },
      { href: "/admin/categories", label: "Categories", icon: FolderOpen },
      { href: "/admin/services", label: "Services", icon: Wrench },
    ],
  },
  {
    label: "SALES",
    items: [
      { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
      { href: "/admin/coupons", label: "Coupons", icon: Ticket },
      { href: "/admin/taxes", label: "Taxes", icon: Receipt },
      { href: "/admin/bookings", label: "Bookings", icon: CalendarCheck },
    ],
  },
  {
    label: "PEOPLE",
    items: [
      { href: "/admin/users", label: "Users", icon: Users },
      { href: "/admin/reviews", label: "Reviews", icon: Star },
    ],
  },
  {
    label: "CONTENT & SUPPORT",
    items: [
      { href: "/admin/blog", label: "Blog", icon: FileText },
      { href: "/admin/messages", label: "Messages", icon: MessageSquare },
      { href: "/admin/product-questions", label: "Q&A", icon: HelpCircle },
      { href: "/admin/quote-requests", label: "Quotes", icon: ClipboardList },
      { href: "/admin/newsletter", label: "Newsletter", icon: Mail },
      { href: "/admin/returns", label: "Returns", icon: RotateCcw },
    ],
  },
  {
    label: "SETTINGS",
    items: [
      { href: "/admin/media", label: "Media", icon: ImageIcon },
      { href: "/admin/security", label: "Security", icon: Shield },
      { href: "/admin/settings", label: "Site Settings", icon: Settings },
    ],
  },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(() => {
    const groups: Record<string, boolean> = {};
    navGroups.forEach((g) => (groups[g.label] = true));
    return groups;
  });

  const handleLogout = async () => {
    await logout();
    toast.success("Logged out");
    router.push("/admin/login");
  };

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  };

  const toggleGroup = (label: string) => {
    setExpandedGroups((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#1e293b]">
      {/* Logo */}
      <div className="h-[56px] flex items-center px-4 border-b border-white/[0.08] shrink-0">
        <Link href="/admin" className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-md bg-[#0EA5E9] flex items-center justify-center shrink-0">
            <Zap className="h-4 w-4 text-white" />
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <h1 className="text-white font-bold text-[15px] leading-tight">ePowerFix</h1>
              <p className="text-[#94a3b8] text-[11px] font-medium tracking-wider uppercase">Admin Panel</p>
            </div>
          )}
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2.5 custom-scrollbar">
        {navGroups.map((group) => (
          <div key={group.label} className="mb-4">
            {/* Group label */}
            {!collapsed && (
              <button
                onClick={() => toggleGroup(group.label)}
                className="flex items-center gap-1 w-full px-2 mb-1.5 text-[12px] font-semibold tracking-wider text-[#64748b] uppercase hover:text-[#94a3b8] transition-colors"
              >
                {group.label}
                <ChevronDown
                  className={`h-3 w-3 transition-transform ${expandedGroups[group.label] ? "rotate-0" : "-rotate-90"}`}
                />
              </button>
            )}
            {collapsed && <div className="mx-2 mb-1.5 border-t border-white/[0.06]" />}

            {/* Items */}
            {(collapsed || expandedGroups[group.label]) && (
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      title={collapsed ? item.label : undefined}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-2.5 h-[38px] px-2.5 rounded-md text-[14px] font-medium transition-all ${
                        active
                          ? "bg-[#0EA5E9] text-white"
                          : "text-[#94a3b8] hover:bg-white/[0.06] hover:text-white"
                      }`}
                    >
                      <Icon className="h-[16px] w-[16px] shrink-0" />
                      {!collapsed && <span>{item.label}</span>}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* Bottom */}
      <div className="border-t border-white/[0.08] p-2.5 space-y-0.5 shrink-0">
        <Link
          href="/"
          className="flex items-center gap-2.5 h-[38px] px-2.5 rounded-md text-[14px] font-medium text-[#94a3b8] hover:bg-white/[0.06] hover:text-white transition-all"
        >
          <ExternalLink className="h-[16px] w-[16px] shrink-0" />
          {!collapsed && <span>View Website</span>}
        </Link>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2.5 h-[38px] px-2.5 rounded-md text-[14px] font-medium text-[#f87171] hover:bg-red-500/10 hover:text-red-400 transition-all w-full"
        >
          <LogOut className="h-[16px] w-[16px] shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={`hidden lg:flex flex-col shrink-0 transition-all duration-200 ${
          collapsed ? "w-[68px]" : "w-[220px]"
        }`}
      >
        {sidebarContent}
        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute top-[16px] right-[-14px] h-7 w-7 rounded-full bg-[#1e293b] border border-white/10 text-[#94a3b8] hover:text-white flex items-center justify-center z-10 transition-colors hidden lg:flex"
        >
          {collapsed ? <Menu className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
        </button>
      </aside>

      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-3 left-3 z-50 h-9 w-9 rounded-md bg-[#1e293b] text-white flex items-center justify-center shadow-lg"
      >
        <Menu className="h-4 w-4" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <>
          <div
            className="lg:hidden fixed inset-0 bg-black/50 z-[80]"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="lg:hidden fixed inset-y-0 left-0 w-[260px] z-[90]">
            {sidebarContent}
          </aside>
        </>
      )}
    </>
  );
}