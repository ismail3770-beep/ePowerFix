"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  EPFHome,
  EPFSearch,
  EPFHeartFilled,
  EPFCartFilled,
} from "./icons/EPFIcons";
import { useUIStore, useCartStore } from "@/store";

/* ── Small inline Grid icon (no EPFGrid exists yet) ── */
function GridIcon({ className, size = 20 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  );
}

/* ── Types ── */
interface NavItem {
  label: string;
  href?: string;
  activePaths?: string[];
  onClick?: () => void;
  icon: React.ReactNode;
  badge?: number;
}

export default function MobileBottomNav() {
  const pathname = usePathname();
  const setCartOpen = useUIStore((s) => s.setCartOpen);
  const cartCount = useCartStore((s) => s.getItemCount());
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const items: NavItem[] = [
    {
      label: "Home",
      href: "/",
      activePaths: ["/"],
      icon: <EPFHome size={20} />,
    },
    {
      label: "Categories",
      href: "/shop",
      activePaths: ["/shop"],
      icon: <GridIcon size={20} />,
    },
    {
      label: "Search",
      onClick: () => window.scrollTo({ top: 0, behavior: "smooth" }),
      icon: <EPFSearch size={20} />,
    },
    {
      label: "Wishlist",
      href: "/wishlist",
      activePaths: ["/wishlist"],
      icon: <EPFHeartFilled size={20} />,
    },
    {
      label: "Cart",
      href: "#",
      onClick: () => setCartOpen(true),
      activePaths: [],
      icon: <EPFCartFilled size={20} />,
      badge: cartCount > 0 ? cartCount : undefined,
    },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 h-16 w-full border-t border-dark-200 bg-white/95 backdrop-blur-sm pb-1 lg:hidden"
      role="navigation"
      aria-label="Mobile bottom navigation"
    >
      <div className="flex h-full w-full items-center justify-around">
        {items.map((item) => {
          const isActive =
            item.activePaths?.some(
              (p) => pathname === p || pathname.startsWith(p + "/")
            ) ?? false;

          const shared = "flex flex-col items-center gap-0.5 relative";

          /* Action-only items (no href) */
          if (!item.href || item.href === "#") {
            return (
              <button
                key={item.label}
                type="button"
                onClick={item.onClick}
                className={`${shared} ${isActive ? "text-epf-500 font-medium" : "text-dark-500"}`}
                aria-label={item.label}
              >
                {item.icon}
                <span className="text-[11px] leading-tight">{item.label}</span>
                {mounted && item.badge != null && item.badge > 0 && (
                  <span className="absolute -right-2.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-epf-500 px-1 text-[10px] font-semibold leading-none text-white">
                    {item.badge > 99 ? "99+" : item.badge}
                  </span>
                )}
              </button>
            );
          }

          /* Link items */
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`${shared} ${isActive ? "text-epf-500 font-medium" : "text-dark-500"}`}
              aria-label={item.label}
              aria-current={isActive ? "page" : undefined}
            >
              {item.icon}
              <span className="text-[11px] leading-tight">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}