// ═══════════════════════════════════════════════════════════════════════════
// ePowerFix Design System — Shared between Web and Mobile
// Exact match with website: apps/web/src/app/globals.css + tailwind.config.ts
// ═══════════════════════════════════════════════════════════════════════════

// ─── Colors (from website globals.css + tailwind.config.ts) ──────────────────
export const Colors = {
  // Brand — epf (sky blue) — primary brand color
  epf: {
    50: '#F0F9FF',
    100: '#E0F2FE',
    200: '#BAE6FD',
    300: '#7DD3FC',
    400: '#38BDF8',
    500: '#0EA5E9',  // Primary — used for buttons, links, active states
    600: '#0284C7',  // Hover state
    700: '#0369A1',
    800: '#075985',
    900: '#0C4A6E',  // Dark gradient backgrounds
    950: '#082F49',
  },

  // Dark — neutral grays (used for text, borders, dark sections)
  dark: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',  // Header Row 2 background, footer
    950: '#030712',
  },

  // Slate — UI grays (from website CSS variables)
  slate: {
    50: '#F8FAFC',   // Image placeholder bg
    100: '#F1F5F9',  // Page background, skeleton
    200: '#E2E8F0',  // Borders, dividers
    300: '#CBD5E1',  // Hover borders
    400: '#94A3B8',  // Placeholder text, muted icons
    500: '#64748B',  // Secondary text
    600: '#475569',
    700: '#334155',  // Body text
    800: '#1E293B',  // Headings
    900: '#0F172A',  // Main heading text
    950: '#020617',
  },

  // Semantic colors (from website)
  success: '#4D7300',
  warning: '#F59E0B',  // Amber — rating stars
  danger: '#DC2626',   // Red — out of stock, errors

  // Specific badge colors (from PremiumCard.tsx)
  badge: {
    discount: '#10B981',    // emerald-500 — discount badges
    featured: '#0EA5E9',    // epf-500 — featured badges
    outOfStock: '#EF4444',  // red-500 — out of stock badges
    rating: '#F59E0B',      // amber-400 — rating stars
  },

  // Backgrounds
  bg: {
    primary: '#FFFFFF',     // Cards, header
    secondary: '#F1F5F9',   // Page background (slate-100)
    tertiary: '#F8FAFC',    // Light sections (slate-50)
    dark: '#0F172A',        // Header Row 2, footer (slate-900)
    gradient: '#0C4A6E',    // Hero banner (epf-900)
  },

  // Text
  text: {
    primary: '#0F172A',     // Headings (slate-900)
    secondary: '#334155',   // Body (slate-700)
    muted: '#64748B',       // Captions (slate-500)
    light: '#94A3B8',       // Placeholders (slate-400)
    inverse: '#FFFFFF',     // On dark backgrounds
  },

  // Borders
  border: {
    light: '#E2E8F0',       // Default (slate-200)
    medium: '#CBD5E1',      // Hover (slate-300)
  },
} as const;

// ─── Typography (matching website) ────────────────────────────────────────────
export const Typography = {
  // Font sizes (from website — text-[Npx] classes)
  xs: 10,        // Badge text, category labels
  sm: 12,        // Small text, descriptions
  base: 14,      // Body text, nav links
  lg: 16,        // Subheadings
  xl: 18,        // Section titles
  '2xl': 20,     // Card titles
  '3xl': 24,     // Page titles
  '4xl': 28,     // Hero title (mobile)
  '5xl': 32,     // Hero title (desktop)

  // Font weights
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  extrabold: '800',

  // Line heights
  tight: 1.15,   // Headings
  normal: 1.5,   // Body
  relaxed: 1.75, // Descriptions
} as const;

// ─── Spacing (matching website Tailwind defaults) ─────────────────────────────
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
} as const;

// ─── Border Radius (matching website) ─────────────────────────────────────────
export const Radius = {
  none: 0,
  sm: 2,       // Badges
  base: 4,     // Buttons, inputs
  md: 6,       // Search bar
  lg: 8,       // Cards
  xl: 12,      // Service cards, CTA
  '2xl': 16,   // Hero banner
  full: 9999,  // Circular icons
} as const;

// ─── Shadows (matching website) ───────────────────────────────────────────────
export const Shadows = {
  none: 'none',
  sm: '0 1px 3px rgba(0,0,0,0.05)',           // Card default
  md: '0 4px 12px rgba(0,0,0,0.08)',          // Card hover
  lg: '0 10px 25px rgba(0,0,0,0.1)',          // Dropdowns
} as const;

// ─── Layout constants ─────────────────────────────────────────────────────────
export const Layout = {
  headerHeight: 70,        // Row 1 height (h-[70px])
  navHeight: 44,           // Row 2 height (h-[44px])
  maxWidth: 1400,          // max-w-[1400px]
  cardWidth: 170,          // PremiumCard width in horizontal scroll
  tabBarHeight: 60,        // Bottom tab bar
} as const;
