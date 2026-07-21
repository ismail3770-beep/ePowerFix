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
  DollarSign,
  ChevronDown,
  LogOut,
  type LucideIcon,
} from "lucide-react";

interface MenuChild {
  key: string;
  label: string;
  icon: LucideIcon;
}

interface MenuItem {
  key: string;
  label: string;
  icon: LucideIcon;
  children?: MenuChild[];
}

/**
 * FleetCart-style admin navigation.
 * - Single flat list (no section headers) matching FleetCart exactly.
 * - Parent items with `children` expand/collapse on click.
 * - All dropdowns are CLOSED by default; the parent containing the active
 *   child auto-expands so the active item is always visible.
 */
const menuItems: MenuItem[] = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  {
    key: "catalog",
    label: "Catalog",
    icon: Package,
    children: [
      { key: "products", label: "Products", icon: Box },
      { key: "categories", label: "Categories", icon: FolderTree },
      { key: "brands", label: "Brands", icon: Tag },
      { key: "variations", label: "Variations", icon: Layers },
      { key: "attributes", label: "Attributes", icon: SlidersHorizontal },
      { key: "attribute-sets", label: "Attribute Sets", icon: FolderOpen },
      { key: "options", label: "Options", icon: Settings2 },
      { key: "tags", label: "Tags", icon: Tags },
      { key: "import", label: "Import", icon: FolderOpen },
    ],
  },
  {
    key: "sales",
    label: "Sales",
    icon: ShoppingCart,
    children: [
      { key: "orders", label: "Orders", icon: ShoppingBag },
      { key: "transactions", label: "Transactions", icon: CreditCard },
      { key: "returns", label: "Returns", icon: RefreshCcw },
    ],
  },
  { key: "flash-sales", label: "Flash Sales", icon: Zap },
  { key: "coupons", label: "Coupons", icon: Ticket },
  {
    key: "content",
    label: "Content",
    icon: FileText,
    children: [
      { key: "pages", label: "Pages", icon: FileText },
      { key: "menus", label: "Menus", icon: MenuIcon },
      { key: "blog", label: "Blog", icon: Newspaper },
      { key: "media-library", label: "Media", icon: ImageIcon },
    ],
  },
  { key: "customers", label: "Customers", icon: Users },
  {
    key: "localization",
    label: "Localization",
    icon: Globe,
    children: [
      { key: "languages", label: "Languages", icon: Languages },
      { key: "currencies", label: "Currencies", icon: DollarSign },
    ],
  },
  { key: "appearance", label: "Appearance", icon: Palette },
  { key: "reports", label: "Reports", icon: BarChart3 },
  { key: "settings", label: "Settings", icon: Settings },
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
  onToggle,
  onNavigate,
  variant = "desktop",
}: AdminSidebarProps) {
  const { user, logout } = useAuthStore();
  const router = useRouter();

  const isMobile = variant === "mobile";
  // Mobile drawer is always expanded regardless of the `collapsed` prop.
  const showLabels = isMobile || !collapsed;

  /**
   * Per-parent explicit override. `true` forces the dropdown open, `false`
   * forces it closed, `undefined` falls back to auto (open if any child is
   * the active tab). Derived in render — no effect needed, so no cascading
   * renders. Multiple parents may be open at once (FleetCart behaviour).
   */
  const [userToggle, setUserToggle] = useState<Record<string, boolean>>({});

  const isParentOpen = (item: MenuItem): boolean => {
    if (!item.children?.length) return false;
    const override = userToggle[item.key];
    if (override !== undefined) return override;
    // Auto: open if the active tab is one of this parent's children.
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
    // In collapsed desktop rail, expand the sidebar first instead of toggling
    // an inline dropdown (which would overflow the narrow rail).
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
    ? "w-[68px]"
    : "w-[240px]";

  return (
    <aside
      className={`h-full bg-slate-900 flex flex-col transition-[width] duration-300 ease-in-out ${widthClass}`}
    >
      {/* Brand */}
      <div
        className={`shrink-0 h-16 flex items-center gap-2.5 border-b border-white/5 ${
          showLabels ? "px-5" : "px-4 justify-center"
        }`}
      >
        <div className="h-9 w-9 rounded-lg bg-epf-500/15 flex items-center justify-center shrink-0">
          <Zap
            className="h-5 w-5 text-epf-500"
            fill="currentColor"
            strokeWidth={0}
          />
        </div>
        {showLabels && (
          <div className="min-w-0 leading-tight">
            <div className="text-white text-[15px] font-bold tracking-tight">
              ePowerFix
            </div>
            <div className="text-slate-500 text-[10px] uppercase tracking-[0.2em] font-medium">
              Admin Panel
            </div>
          </div>
        )}
      </div>

      {/* Scrollable menu */}
      <nav
        className="flex-1 overflow-y-auto overflow-x-hidden py-3 [scrollbar-width:thin] [scrollbar-color:#334155_transparent]"
        aria-label="Admin navigation"
      >
        <ul className="flex flex-col gap-0.5 px-2">
          {menuItems.map((item) => {
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
                  className={`group relative w-full flex items-center gap-3 rounded-md border-l-[3px] py-2.5 text-[13px] font-medium transition-colors duration-150 ${
                    showLabels ? "px-3" : "px-2 justify-center"
                  } ${
                    active
                      ? "bg-white/5 text-white border-epf-500"
                      : "text-slate-400 hover:text-white hover:bg-white/5 border-transparent"
                  }`}
                  title={!showLabels ? item.label : undefined}
                >
                  <Icon
                    className={`h-[18px] w-[18px] shrink-0 transition-colors ${
                      active
                        ? selfActive
                          ? "text-epf-500"
                          : "text-white"
                        : "text-slate-400 group-hover:text-white"
                    }`}
                  />
                  {showLabels && (
                    <>
                      <span className="flex-1 text-left truncate">
                        {item.label}
                      </span>
                      {hasChildren && (
                        <ChevronDown
                          className={`h-4 w-4 shrink-0 text-slate-500 transition-transform duration-200 ${
                            isOpen ? "rotate-180" : ""
                          }`}
                        />
                      )}
                    </>
                  )}
                </button>

                {/* Dropdown children — animated height */}
                {hasChildren && showLabels && item.children && (
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.ul
                        key="dropdown"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: "easeInOut" }}
                        className="overflow-hidden pl-4 pr-1"
                      >
                        {item.children.map((child) => {
                          const childActive = activeTab === child.key;
                          const ChildIcon = child.icon;
                          return (
                            <li key={child.key}>
                              <button
                                type="button"
                                onClick={() => handleItemClick(child.key)}
                                className={`group w-full flex items-center gap-2.5 rounded-md py-2 pl-3 pr-2 text-[12.5px] font-medium transition-colors duration-150 ${
                                  childActive
                                    ? "bg-epf-500/10 text-white"
                                    : "text-slate-400 hover:text-white hover:bg-white/5"
                                }`}
                              >
                                <span
                                  className={`h-1.5 w-1.5 rounded-full shrink-0 transition-colors ${
                                    childActive
                                      ? "bg-epf-500"
                                      : "bg-slate-600 group-hover:bg-slate-400"
                                  }`}
                                />
                                <ChildIcon
                                  className={`h-[15px] w-[15px] shrink-0 transition-colors ${
                                    childActive
                                      ? "text-epf-500"
                                      : "text-slate-500 group-hover:text-slate-300"
                                  }`}
                                />
                                <span className="flex-1 text-left truncate">
                                  {child.label}
                                </span>
                              </button>
                            </li>
                          );
                        })}
                      </motion.ul>
                    )}
                  </AnimatePresence>
                )}
              </li>
            );
          })}
        </ul>
      </nav>

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
              <p className="text-[11px] text-slate-500 truncate">
                {user?.email}
              </p>
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
