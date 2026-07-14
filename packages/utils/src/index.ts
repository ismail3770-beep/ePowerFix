// @epowerfix/utils — Shared utility functions
// This package holds shared helpers (formatting, validation, etc.).

export function formatPrice(amount: number, currency: string = "BDT"): string {
  const symbols: Record<string, string> = { BDT: "৳", USD: "$", EUR: "€" };
  const symbol = symbols[currency] || currency;
  // Use simple number formatting (works in both web and React Native)
  const formatted = Number(amount || 0).toFixed(
    amount % 1 === 0 ? 0 : 2
  );
  return `${symbol}${formatted}`;
}

export function formatDate(date: string | Date, locale: string = "bn-BD"): string {
  return new Date(date).toLocaleDateString(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

export const APP_CONFIG = {
  name: "ePowerFix",
  nameBn: "ই-পাওয়ার ফিক্স",
  defaultCurrency: "BDT",
  defaultLocale: "bn-BD",
} as const;
