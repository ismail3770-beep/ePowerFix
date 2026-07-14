// Color theme for ePowerFix mobile app — matches website design
// Primary color: epf (sky blue) — same as website
// Background: slate-50 (220 14% 96%)
// Cards: white with slate-200 borders

export const Colors = {
  // Brand — epf (sky blue), matching website
  epf: {
    50: '#F0F9FF',
    100: '#E0F2FE',
    200: '#BAE6FD',
    300: '#7DD3FC',
    400: '#38BDF8',
    500: '#0EA5E9',  // primary
    600: '#0284C7',
    700: '#0369A1',
    800: '#075985',
    900: '#0C4A6E',
  },
  primary: '#0EA5E9',
  primaryDark: '#0284C7',
  primaryLight: '#E0F2FE',
  primaryForeground: '#FFFFFF',

  // Backgrounds
  background: '#F1F5F9',   // slate-100 (220 14% 96%)
  surface: '#FFFFFF',
  card: '#FFFFFF',
  cardForeground: '#0F172A',

  // Text
  text: '#0F172A',         // slate-900
  textMuted: '#64748B',    // slate-500
  textLight: '#94A3B8',    // slate-400

  // Borders & inputs
  border: '#E2E8F0',       // slate-200
  input: '#E2E8F0',
  ring: '#0EA5E9',

  // Semantic
  white: '#FFFFFF',
  black: '#000000',
  success: '#4D7300',
  warning: '#F59E0B',
  danger: '#DC2626',
  info: '#0EA5E9',

  // Dark (for sidebar/dark sections)
  dark: {
    50: '#F9FAFB',
    900: '#111827',
    950: '#030712',
  },

  // Muted
  muted: '#F1F5F9',
  mutedForeground: '#64748B',

  // Secondary
  secondary: '#EDE9FE',
  secondaryForeground: '#0F172A',
} as const;
