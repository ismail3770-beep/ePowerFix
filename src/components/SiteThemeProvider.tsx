"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

interface PublicSettings {
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  headerBg?: string;
  footerBg?: string;
  bodyBg?: string;
  headingFont?: string;
  bodyFont?: string;
  fontSize?: string;
  containerWidth?: string;
}

function hexToHsl(hex: string): string {
  const r = parseInt(hex.slice(0, 2), 16) / 255;
  const g = parseInt(hex.slice(2, 4), 16) / 255;
  const b = parseInt(hex.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

export function SiteThemeProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<PublicSettings | null>(null);

  useEffect(() => {
    apiFetch("/api/settings")
      .then((res: any) => {
        const data = res.data ?? res;
        if (data) {
          setSettings(data);
          applySettings(data);
        }
      })
      .catch(() => {
        // Fallback: use defaults, no crash
      });
  }, []);

  useEffect(() => {
    if (!settings) {return;}

    const el = document.documentElement;
    const s = settings;

    // Primary → overrides --primary, --ring, --brand, --chart-1, --sidebar-primary, --color-mf-cyan
    if (s.primaryColor) {
      const hsl = hexToHsl(s.primaryColor);
      el.style.setProperty("--primary", hsl);
      el.style.setProperty("--ring", hsl);
      el.style.setProperty("--brand", hsl);
      el.style.setProperty("--chart-1", hsl);
      el.style.setProperty("--sidebar-primary", hsl);
      el.style.setProperty("--color-mf-cyan", `#${s.primaryColor}`);
    }

    // Secondary → --brand-dark, --color-mf-cyan-dark
    if (s.secondaryColor) {
      const hsl = hexToHsl(s.secondaryColor);
      el.style.setProperty("--brand-dark", hsl);
      el.style.setProperty("--sidebar-primary", hsl);
      el.style.setProperty("--color-mf-cyan-dark", `#${s.secondaryColor}`);
    }

    // Accent
    if (s.accentColor) {
      el.style.setProperty("--color-mf-green", `#${s.accentColor}`);
    }

    // Header bg
    if (s.headerBg) {
      el.style.setProperty("--header-bg", `#${s.headerBg}`);
    }

    // Footer bg
    if (s.footerBg) {
      el.style.setProperty("--footer-bg", `#${s.footerBg}`);
    }

    // Body bg
    if (s.bodyBg) {
      el.style.setProperty("--body-bg", `#${s.bodyBg}`);
      // Also set background HSL approximation
      const hsl = hexToHsl(s.bodyBg);
      el.style.setProperty("--background", hsl);
    }

    // Fonts
    if (s.headingFont) {
      el.style.setProperty("--font-heading", s.headingFont);
    }
    if (s.bodyFont) {
      el.style.setProperty("--font-body", s.bodyFont);
    }

    // Font size
    if (s.fontSize) {
      el.style.setProperty("--font-size-base", `${s.fontSize}px`);
      el.style.fontSize = `${s.fontSize}px`;
    }

    // Container width
    if (s.containerWidth) {
      el.style.setProperty("--container-max", `${s.containerWidth}px`);
    }
  }, [settings]);

  return <>{children}</>;
}

function applySettings(data: PublicSettings) {
  // Immediate application on first load (before React hydration catches up)
  if (typeof document === "undefined") {return;}
  const el = document.documentElement;
  if (data.primaryColor) {
    const hsl = hexToHsl(data.primaryColor);
    el.style.setProperty("--primary", hsl);
    el.style.setProperty("--ring", hsl);
    el.style.setProperty("--brand", hsl);
    el.style.setProperty("--chart-1", hsl);
    el.style.setProperty("--color-mf-cyan", `#${data.primaryColor}`);
  }
  if (data.secondaryColor) {
    el.style.setProperty("--brand-dark", hexToHsl(data.secondaryColor));
    el.style.setProperty("--color-mf-cyan-dark", `#${data.secondaryColor}`);
  }
  if (data.accentColor) {
    el.style.setProperty("--color-mf-green", `#${data.accentColor}`);
  }
  if (data.bodyBg) {
    el.style.setProperty("--background", hexToHsl(data.bodyBg));
  }
}