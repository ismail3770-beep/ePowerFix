"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";
import { ChevronDown, ChevronRight, LogOut } from "lucide-react";
import { apiFetch } from "@/lib/api";

interface MenuItem {
  key: string;
  label: string;
  icon: string;
  badge?: number;
  badgeKey?: string;
  children?: { key: string; label: string }[];
}

const menuSections: { title: string; items: MenuItem[] }[] = [
  {
    title: "MAIN",
    items: [{ key: "dashboard", label: "Dashboard", icon: "grid" }],
  },
  {
    title: "CATALOG",
    items: [
      {
        key: "products", label: "Product Management", icon: "box",
        children: [
          { key: "products", label: "All Products" },
          { key: "categories", label: "Categories" },
          { key: "brands", label: "Brands" },
        ],
      },
      {
        key: "services", label: "Services", icon: "wrench",
        children: [
          { key: "services", label: "All Services" },
          { key: "service-categories", label: "Service Categories" },
        ],
      },
      { key: "project-kits", label: "Project Kits", icon: "package" },
      { key: "projects", label: "Projects", icon: "folder" },
      { key: "blog", label: "Blog", icon: "file-text" },
    ],
  },
  {
    title: "ORDERS & SALES",
    items: [
      { key: "orders", label: "Orders", icon: "shopping-cart" },
      { key: "bookings", label: "Bookings", icon: "calendar" },
      { key: "returns", label: "Returns", icon: "refresh-ccw" },
    ],
  },
  {
    title: "USERS",
    items: [
      { key: "customers", label: "Customers", icon: "users" },
      { key: "reviews", label: "Reviews", icon: "star" },
      { key: "staff", label: "Staff", icon: "user-check" },
    ],
  },
  {
    title: "MARKETING",
    items: [
      { key: "coupons", label: "Coupons", icon: "ticket" },
      { key: "flash-sales", label: "Flash Sales", icon: "zap" },
      { key: "newsletter", label: "Newsletter", icon: "mail" },
      { key: "banners", label: "Banners", icon: "image" },
    ],
  },
  {
    title: "COMMUNICATION",
    items: [
      { key: "messages", label: "Messages", icon: "message-circle", badgeKey: "messages" },
      { key: "quote-requests", label: "Quote Requests", icon: "file-text" },
    ],
  },
  {
    title: "SETTINGS",
    items: [
      { key: "general-settings", label: "General Settings", icon: "settings" },
      { key: "payment-gateways", label: "Payment Gateways", icon: "credit-card" },
      { key: "shipping", label: "Shipping", icon: "truck" },
      { key: "taxes", label: "Taxes", icon: "file-text" },
      { key: "ai-providers", label: "AI Providers", icon: "bot" },
      { key: "media-library", label: "Media Library", icon: "folder" },
      { key: "security", label: "Security", icon: "shield" },
    ],
  },
];

function MenuIcon({ name, className = "" }: { name: string; className?: string }) {
  const size = 18;
  const props = { width: size, height: size, className, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (name) {
    case "grid": return <svg {...props}><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></svg>;
    case "box": return <svg {...props}><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" /></svg>;
    case "wrench": return <svg {...props}><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" /></svg>;
    case "package": return <svg {...props}><path d="M16.5 9.4 7.55 4.24" /><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.29 7 12 12 20.71 7" /><line x1="12" y1="22" x2="12" y2="12" /></svg>;
    case "layers": return <svg {...props}><polygon points="12 2 2 7 12 12 22 7 12 2" /><polyline points="2 17 12 22 22 17" /><polyline points="2 12 12 17 22 12" /></svg>;
    case "tag": return <svg {...props}><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" /><line x1="7" y1="7" x2="7.01" y2="7" /></svg>;
    case "shopping-cart": return <svg {...props}><circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" /></svg>;
    case "calendar": return <svg {...props}><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>;
    case "refresh-ccw": return <svg {...props}><polyline points="1 4 1 10 7 10" /><polyline points="23 20 23 14 17 14" /><path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" /></svg>;
    case "users": return <svg {...props}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>;
    case "star": return <svg {...props}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>;
    case "user-check": return <svg {...props}><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" /><polyline points="17 11 19 13 23 9" /></svg>;
    case "ticket": return <svg {...props}><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" /><path d="M13 5v2" /><path d="M13 17v2" /><path d="M13 11v2" /></svg>;
    case "zap": return <svg {...props}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>;
    case "mail": return <svg {...props}><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>;
    case "image": return <svg {...props}><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>;
    case "folder": return <svg {...props}><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /></svg>;
    case "file-text": return <svg {...props}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>;
    case "message-circle": return <svg {...props}><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" /></svg>;
    case "settings": return <svg {...props}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>;
    case "credit-card": return <svg {...props}><rect x="1" y="4" width="22" height="16" rx="2" ry="2" /><line x1="1" y1="10" x2="23" y2="10" /></svg>;
    case "truck": return <svg {...props}><rect x="1" y="3" width="15" height="13" /><polygon points="16 8 20 8 23 11 23 16 16 16 16 8" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" /></svg>;
    case "bot": return <svg {...props}><rect x="3" y="11" width="18" height="10" rx="2" /><circle cx="12" cy="5" r="2" /><path d="M12 7v4" /><line x1="8" y1="16" x2="8" y2="16" /><line x1="16" y1="16" x2="16" y2="16" /></svg>;
    case "shield": return <svg {...props}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>;
    case "monitor": return <svg {...props}><rect x="2" y="3" width="20" height="14" rx="2" ry="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" /></svg>;
    default: return <svg {...props}><circle cx="12" cy="12" r="10" /></svg>;
  }
}

export default function AdminSidebar({ activeTab, onTabChange, collapsed, onToggle }: {
  activeTab: string;
  onTabChange: (tab: string) => void;
  collapsed: boolean;
  onToggle: () => void;
}) {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [badgeCounts, setBadgeCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    apiFetch<any>("/api/admin/messages?status=NEW&limit=1")
      .then((res) => {
        // API returns { data: { data: [...], total, page, limit, totalPages } }
        const total = res?.data?.total ?? 0;
        if (total > 0) setBadgeCounts({ messages: total });
      })
      .catch(() => {});
  }, []);

  const toggleMenu = (key: string) => {
    setExpandedMenus((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const isActive = (key: string) => {
    if (activeTab === key) return true;
    if (!activeTab) return false;
    for (const section of menuSections) {
      for (const item of section.items) {
        if (item.key === key && activeTab.startsWith(key)) return true;
        if (item.children?.some((c) => c.key === activeTab || activeTab.startsWith(c.key))) return true;
      }
    }
    return false;
  };

  return (
    <aside className={`fixed left-0 top-0 h-screen bg-[#111827] z-40 flex flex-col transition-all duration-300 ${collapsed ? "w-[60px]" : "w-[220px]"}`}>
      {/* Brand */}
      <div className="px-4 pt-4 pb-2 shrink-0">
        {!collapsed && (
          <>
            <div className="text-white text-[16px] font-bold mb-0.5">ePowerFix</div>
            <div className="text-white/40 text-[10px] uppercase tracking-[0.2em] font-medium mb-3">ADMIN PANEL</div>
          </>
        )}
        {/* Search */}
        {!collapsed && (
          <div className="relative">
            <input
              type="text"
              placeholder="Search in menu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#1F2937] text-white/40 text-[12px] placeholder:text-white/40 border-none rounded-md px-3 py-2 pr-8 focus:outline-none focus:ring-1 focus:ring-[#0EA5E9]/50"
            />
            <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
          </div>
        )}
      </div>

      {/* Scrollable menu */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-0 scrollbar-thin">
        {menuSections.map((section) => {
          const filteredItems = searchQuery
            ? section.items.filter((i) => i.label.toLowerCase().includes(searchQuery.toLowerCase()) || i.children?.some((c) => c.label.toLowerCase().includes(searchQuery.toLowerCase())))
            : section.items;
          if (filteredItems.length === 0) return null;

          return (
            <div key={section.title}>
              {!collapsed && (
                <div className="text-white/30 text-[11px] font-bold uppercase tracking-wider px-4 pt-4 pb-1.5">
                  {section.title}
                </div>
              )}
              {filteredItems.map((item) => {
                const active = isActive(item.key);
                const hasChildren = item.children && item.children.length > 0;
                const expanded = expandedMenus.has(item.key);
                const badgeValue = item.badge ?? (item.badgeKey ? (badgeCounts[item.badgeKey] ?? 0) : 0);

                return (
                  <div key={item.key}>
                    <button
                      onClick={() => {
                        if (hasChildren) {
                          toggleMenu(item.key);
                        } else {
                          onTabChange(item.key);
                        }
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-[14px] transition-all duration-150 relative ${
                        active
                          ? "bg-white/10 text-white border-l-[3px] border-[#0EA5E9]"
                          : "text-white/70 hover:bg-white/5 hover:text-white border-l-[3px] border-transparent"
                      }`}
                      title={collapsed ? item.label : undefined}
                    >
                      {/* Icon */}
                      <span className={`shrink-0 ${active ? "text-[#0EA5E9]" : ""}`}>
                        <MenuIcon name={item.icon} />
                      </span>

                      {!collapsed && (
                        <>
                          <span className="flex-1 text-left truncate">{item.label}</span>

                          {/* Badge */}
                          {badgeValue > 0 && (
                            <span className="shrink-0 bg-red-500 text-white text-[11px] font-bold w-[18px] h-[18px] rounded-full flex items-center justify-center">
                              {badgeValue}
                            </span>
                          )}

                          {/* Chevron */}
                          {hasChildren && (
                            <span className="shrink-0 text-white/40">
                              {expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                            </span>
                          )}
                        </>
                      )}
                    </button>

                    {/* Submenu */}
                    {hasChildren && expanded && !collapsed && (
                      <div className="bg-[#0F172A]/40">
                        {item.children!.map((child) => {
                          const childActive = activeTab === child.key;
                          return (
                            <button
                              key={child.key}
                              onClick={() => onTabChange(child.key)}
                              className={`w-full flex items-center gap-3 pl-[52px] pr-4 py-2 text-[13px] transition-colors ${
                                childActive ? "text-white bg-white/5" : "text-white/50 hover:text-white hover:bg-white/5"
                              }`}
                            >
                              <span className="w-1 h-1 rounded-full bg-current shrink-0" />
                              {child.label}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Bottom: Logout */}
      {!collapsed && (
        <div className="border-t border-white/10 shrink-0 p-3">
          <button
            onClick={async () => { await logout(); router.push("/admin/login"); }}
            className="w-full flex items-center gap-3 px-3 py-2 text-[13px] text-white/50 hover:text-white hover:bg-white/5 rounded-md transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      )}
    </aside>
  );
}
