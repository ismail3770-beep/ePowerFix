// ═══════════════════════════════════════════════════════════════════════════
// ePowerFix Category Icons — Professional SVG icons (replaces emoji)
// Uses react-native-svg for crisp rendering at any size
// ═══════════════════════════════════════════════════════════════════════════

import React from 'react';
import Svg, { Path, Circle, Rect, Line, Polyline } from 'react-native-svg';

export type IconProps = {
  size?: number;
  color?: string;
  strokeWidth?: number;
};

const defaultProps = (props: IconProps) => ({
  width: props.size ?? 24,
  height: props.size ?? 24,
  viewBox: '0 0 24 24',
  fill: 'none',
});

const strokeProps = (props: IconProps) => ({
  stroke: props.color ?? '#0EA5E9',
  strokeWidth: props.strokeWidth ?? 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
});

// ─── Cable & Wire (কেবল ও ওয়্যার) ──────────────────────────────────────────
export function CableIcon(props: IconProps) {
  return (
    <Svg {...defaultProps(props)}>
      <Path d="M4 9a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h1a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2H4Z" {...strokeProps(props)} />
      <Path d="M9 5h6" {...strokeProps(props)} />
      <Path d="M17 9a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-1a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h1Z" {...strokeProps(props)} />
      <Path d="M8 13v2a4 4 0 0 0 4 4h0a4 4 0 0 0 4-4v-2" {...strokeProps(props)} />
      <Path d="M6 21h12" {...strokeProps(props)} />
      <Path d="M12 19v2" {...strokeProps(props)} />
    </Svg>
  );
}

// ─── Circuit Breaker (সার্কিট ব্রেকার) ─────────────────────────────────────
export function BreakerIcon(props: IconProps) {
  return (
    <Svg {...defaultProps(props)}>
      <Rect x="4" y="2" width="16" height="20" rx="2" {...strokeProps(props)} />
      <Path d="M12 6v4" {...strokeProps(props)} />
      <Path d="M12 10l3 3" {...strokeProps(props)} />
      <Circle cx="12" cy="17" r="1.5" {...strokeProps(props)} />
      <Path d="M8 6h0" {...strokeProps(props)} />
      <Path d="M16 6h0" {...strokeProps(props)} />
    </Svg>
  );
}

// ─── Switch & Socket (সুইচ ও সকেট) ────────────────────────────────────────
export function SwitchIcon(props: IconProps) {
  return (
    <Svg {...defaultProps(props)}>
      <Rect x="3" y="3" width="18" height="18" rx="3" {...strokeProps(props)} />
      <Circle cx="9" cy="12" r="1.5" {...strokeProps(props)} />
      <Circle cx="15" cy="12" r="1.5" {...strokeProps(props)} />
      <Path d="M12 7v2" {...strokeProps(props)} />
      <Path d="M12 15v2" {...strokeProps(props)} />
    </Svg>
  );
}

// ─── Lighting (লাইটিং) ─────────────────────────────────────────────────────
export function LightingIcon(props: IconProps) {
  return (
    <Svg {...defaultProps(props)}>
      <Path d="M9 18h6" {...strokeProps(props)} />
      <Path d="M10 22h4" {...strokeProps(props)} />
      <Path d="M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.2 1 2V17h6v-.3c0-.8.4-1.5 1-2A7 7 0 0 0 12 2Z" {...strokeProps(props)} />
    </Svg>
  );
}

// ─── Solar Panel (সোলার প্যানেল) ───────────────────────────────────────────
export function SolarIcon(props: IconProps) {
  return (
    <Svg {...defaultProps(props)}>
      <Path d="M4 14l2-9h12l2 9H4Z" {...strokeProps(props)} />
      <Path d="M12 5v9" {...strokeProps(props)} />
      <Path d="M7.5 5L6 14" {...strokeProps(props)} />
      <Path d="M16.5 5L18 14" {...strokeProps(props)} />
      <Path d="M4.5 9.5h15" {...strokeProps(props)} />
      <Path d="M12 14v4" {...strokeProps(props)} />
      <Path d="M8 22h8" {...strokeProps(props)} />
      <Path d="M10 18h4" {...strokeProps(props)} />
    </Svg>
  );
}

// ─── Safety Equipment (সেফটি সরঞ্জাম) ─────────────────────────────────────
export function SafetyIcon(props: IconProps) {
  return (
    <Svg {...defaultProps(props)}>
      <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" {...strokeProps(props)} />
      <Path d="M9 12l2 2 4-4" {...strokeProps(props)} />
    </Svg>
  );
}

// ─── Industrial (ইন্ডাস্ট্রিয়াল) ──────────────────────────────────────────
export function IndustrialIcon(props: IconProps) {
  return (
    <Svg {...defaultProps(props)}>
      <Path d="M2 20h20" {...strokeProps(props)} />
      <Path d="M4 20V8l5 4V8l5 4V4h6v16" {...strokeProps(props)} />
      <Path d="M18 8h.01" {...strokeProps(props)} />
      <Path d="M18 12h.01" {...strokeProps(props)} />
      <Path d="M18 16h.01" {...strokeProps(props)} />
    </Svg>
  );
}

// ─── Tools & Meter (টুলস ও মিটার) ─────────────────────────────────────────
export function ToolsIcon(props: IconProps) {
  return (
    <Svg {...defaultProps(props)}>
      <Path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76Z" {...strokeProps(props)} />
    </Svg>
  );
}

// ─── Fan (ফ্যান) ────────────────────────────────────────────────────────────
export function FanIcon(props: IconProps) {
  return (
    <Svg {...defaultProps(props)}>
      <Circle cx="12" cy="12" r="2" {...strokeProps(props)} />
      <Path d="M12 10c0-3-1.5-5-3-6 2.5-.5 5 1 5.5 4" {...strokeProps(props)} />
      <Path d="M14 12c3 0 5-1.5 6-3 .5 2.5-1 5-4 5.5" {...strokeProps(props)} />
      <Path d="M12 14c0 3 1.5 5 3 6-2.5.5-5-1-5.5-4" {...strokeProps(props)} />
      <Path d="M10 12c-3 0-5 1.5-6 3-.5-2.5 1-5 4-5.5" {...strokeProps(props)} />
    </Svg>
  );
}

// ─── Category Icon Map ─────────────────────────────────────────────────────
export const CATEGORY_ICONS: Record<string, React.FC<IconProps>> = {
  cable: CableIcon,
  breaker: BreakerIcon,
  switch: SwitchIcon,
  lighting: LightingIcon,
  solar: SolarIcon,
  safety: SafetyIcon,
  industrial: IndustrialIcon,
  tools: ToolsIcon,
  fan: FanIcon,
};

export function getCategoryIcon(slug: string): React.FC<IconProps> {
  return CATEGORY_ICONS[slug] ?? ToolsIcon;
}
