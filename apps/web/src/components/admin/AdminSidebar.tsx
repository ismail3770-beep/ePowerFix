"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";
import { AnimatePresence, motion } from "framer-motion";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Zap,
  Ticket,
  FileText,
  Users,
  Globe,
  Palette,
  BarChart3,
  Settings,
  Box,
  FolderTree,
  Tag,
  Layers,
  SlidersHorizontal,
  FolderOpen,
  Settings2,
  Tags,
  ShoppingBag,
  CreditCard,
  RefreshCcw,
  Newspaper,
  Image as ImageIcon,
  Menu as MenuIcon,
  Languages,
  ChevronRight,
  ChevronLeft,
  LogOut,
  type LucideIcon,
} from "lucide-react";

interface MenuChild {
  key: string;
  label: string;
  icon?: LucideIcon;
}

interface MenuItem {
  key: string;
  label: string;
  icon?: LucideIcon;
  children?: MenuChild[];
  type?: "header";
}

const menuItems: MenuItem[] = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  {
    key: "catalog",
    label: "Products",
    icon: Package,
    children: [
      { key: "products", label: "All Products" },
      { key: "categories", label: "Categories" },
      { key: "brands", label: "Brands" },
      { key: "variations", label: "Variations" },
      { key: "attributes", label: "Attributes" },
      { key: "attribute-sets", label: "Attribute Sets" },
      { key: "options", label: "Options" },
      { key: "tags", label: "Tags" },
      { key: "reviews", label: "Reviews" },
    ],
  },
  {
    key: "sales",
    label: "Sales",
    icon: ShoppingCart,
    children: [
      { key: "orders", label: "Orders" },
      { key: "transactions", label: "Transactions" },
      { key: "returns", label: "Returns" },
    ],
  },
  { key: "flash-sales", label: "Flash Sales", icon: Zap },
  { key: "coupons", label: "Coupons", icon: Ticket },
  {
    key: "content",
    label: "Pages",
    icon: FileText,
    children: [
      { key: "pages", label: "All Pages" },
      { key: "menus", label: "Menus" },
    ],
  },
  {
    key: "blog",
    label: "Blog",
    icon: Newspaper,
    children: [
      { key: "blog", label: "Posts" },
      { key: "blog-categories", label: "Categories" },
      { key: "blog-tags", label: "Tags" },
    ],
  },
  { key: "import", label: "Import", icon: RefreshCcw },
  { key: "media-library", label: "Media", icon: ImageIcon },
  
  { key: "system_header", label: "System", type: "header" },
  
  {
    key: "customers",
    label: "Users",
    icon: Users,
    children: [
      { key: "customers", label: "Users" },
      { key: "roles", label: "Roles" },
    ],
  },
  {
    key: "localization",
    label: "Localization",
    icon: Globe,
    children: [
      { key: "languages", label: "Languages" },
      { key: "currencies", label: "Currencies" },
    ],
  },
  {
    key: "appearance",
    label: "Appearance",
    icon: Palette,
    children: [
      { key: "sliders", label: "Sliders" },
      { key: "storefront", label: "Storefront" },
    ],
  },
  { key: "reports", label: "Reports", icon: BarChart3 },
  { key: "tools", label: "Tools", icon: SlidersHorizontal },
  { key: "settings", label: "Settings", icon: Settings },
];

interface AdminSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  collapsed: boolean;
  onToggle?: () => void;
  onNavigate?: () => void;
  variant?: "desktop" | "mobile";
}

export default function AdminSidebar({
  activeTab,
  onTabChange,
  collapsed,
  onToggle,
  onNavigate,
  variant = "desktop",
}: AdminSidebarProps) {
  const { user, logout } = useAuthStore();
  const router = useRouter();

  const isMobile = variant === "mobile";
  const showLabels = isMobile || !collapsed;

  const [userToggle, setUserToggle] = useState<Record<string, boolean>>({});

  const isParentOpen = (item: MenuItem): boolean => {
    if (!item.children?.length) return false;
    const override = userToggle[item.key];
    if (override !== undefined) return override;
    return item.children.some((c) => c.key === activeTab);
  };

  const isParentActive = useMemo(
    () => (item: MenuItem) =>
      !!item.children?.some((c) => c.key === activeTab),
    [activeTab]
  );

  const handleItemClick = (key: string) => {
    onTabChange(key);
    onNavigate?.();
  };

  const handleParentClick = (item: MenuItem) => {
    if (!isMobile && collapsed) {
      onToggle?.();
      return;
    }
    const currentlyOpen = isParentOpen(item);
    setUserToggle((prev) => ({ ...prev, [item.key]: !currentlyOpen }));
  };

  const handleLogout = async () => {
    await logout();
    router.push("/admin/login");
  };

  const widthClass = isMobile
    ? "w-[260px]"
    : collapsed
    ? "w-[72px]"
    : "w-[260px]";

  return (
    <aside
      className={`relative h-full bg-[#1e1e2d] flex flex-col transition-[width] duration-300 ease-in-out ${widthClass}`}
    >
      {/* Desktop Toggle Button */}
      {!isMobile && (
        <button
          onClick={onToggle}
          className="absolute top-5 -right-3 h-6 w-6 rounded-full bg-[#1e1e2d] border border-slate-600 flex items-center justify-center text-white hover:bg-slate-700 z-50 transition-colors"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <ChevronLeft className={`h-3 w-3 transition-transform duration-300 ${collapsed ? "rotate-180" : ""}`} />
        </button>
      )}
      {/* Brand */}
      <div
        className={`shrink-0 h-[64px] flex items-center gap-3 border-b border-[#2b2b40] ${
          showLabels ? "px-6" : "px-4 justify-center"
        }`}
      >
        <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center shrink-0 shadow-sm">
          <Zap
            className="h-4 w-4 text-white"
            fill="currentColor"
            strokeWidth={0}
          />
        </div>
        {showLabels && (
          <div className="min-w-0 leading-tight">
            <div className="text-white text-[18px] font-semibold tracking-wide">
              ePowerFix
            </div>
          </div>
        )}
      </div>

      {/* Scrollable menu */}
      <nav
        className="flex-1 overflow-y-auto overflow-x-hidden py-4 [scrollbar-width:thin] [scrollbar-color:#334155_transparent]"
        aria-label="Admin navigation"
      >
        <ul className="flex flex-col">
          {menuItems.map((item) => {
            if (item.type === "header") {
              if (!showLabels) return null;
              return (
                <li key={item.key} className="px-6 pt-5 pb-2">
                  <span className="text-[12px] font-semibold text-[#6e6e8e] uppercase tracking-wider">
                    {item.label}
                  </span>
                </li>
              );
            }

            const hasChildren = !!item.children?.length;
            const isOpen = isParentOpen(item);
            const parentActive = isParentActive(item);
            const selfActive = activeTab === item.key;
            const active = selfActive || (hasChildren && parentActive);
            const Icon = item.icon;

            return (
              <li key={item.key}>
                <button
                  type="button"
                  onClick={() =>
                    hasChildren ? handleParentClick(item) : handleItemClick(item.key)
                  }
                  aria-expanded={hasChildren ? isOpen : undefined}
                  className={`group relative w-full flex items-center gap-4 py-[12px] text-[14px] font-medium transition-colors duration-200 ${
                    showLabels ? "px-6" : "px-2 justify-center"
                  } ${
                    active
                      ? "bg-[#1b1b29] text-white"
                      : "text-[#a2a3b7] hover:text-white hover:bg-[#1b1b29]"
                  }`}
                  title={!showLabels ? item.label : undefined}
                >
                  {Icon && (
                    <Icon
                      className={`h-[18px] w-[18px] shrink-0 transition-colors ${
                        active ? "text-white" : "text-[#70708c] group-hover:text-white"
                      }`}
                    />
                  )}
                  {showLabels && (
                    <>
                      <span className="flex-1 text-left truncate">
                        {item.label}
                      </span>
                      {hasChildren && (
                        <ChevronRight
                          className={`h-4 w-4 shrink-0 transition-colors duration-200 ${
                            isOpen ? "text-white" : "text-[#70708c]"
                          }`}
                        />
                      )}
                    </>
                  )}
                </button>

                {/* Dropdown children */}
                {hasChildren && showLabels && item.children && (
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.ul
                        key="dropdown"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: "easeInOut" }}
                        className="relative overflow-hidden bg-[#1a1a27]"
                      >
                        {item.children.map((child) => {
                          const childActive = activeTab === child.key;
                          return (
                            <li key={child.key} className="relative">
                              <button
                                type="button"
                                onClick={() => handleItemClick(child.key)}
                                className={`group w-full flex items-center gap-3 py-3 pl-[60px] pr-6 text-[13.5px] font-medium transition-colors duration-150 ${
                                  childActive
                                    ? "text-white"
                                    : "text-[#6297af] hover:text-white"
                                }`}
                              >
                                <span className="flex-1 text-left truncate">
                                  {child.label}
                                </span>
                              </button>
                            </li>
                          );
                        })}
                        {/* Vertical line connecting children */}
                        <div className="absolute left-[33px] top-0 bottom-4 w-[1px] bg-[#2b3346]" />
                      </motion.ul>
                    )}
                  </AnimatePresence>
                )}
              </li>
            );
          })}
        </ul>
      </nav>

    </aside>
  );
}
