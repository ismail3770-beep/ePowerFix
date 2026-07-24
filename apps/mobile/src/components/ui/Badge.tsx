// ═══════════════════════════════════════════════════════════════════════════
// ePowerFix Badge — Status badges (success, warning, danger, info, neutral)
// ═══════════════════════════════════════════════════════════════════════════

import React from 'react';
import { View, Text, ViewStyle } from 'react-native';
import { Colors, Typography, Radius } from '../../theme/design-system';

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'brand';

type BadgeProps = {
  label: string;
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  style?: ViewStyle;
};

const variantColors: Record<BadgeVariant, { bg: string; text: string }> = {
  success: { bg: '#ECFDF5', text: '#065F46' },
  warning: { bg: '#FFF7ED', text: '#C2410C' },
  danger: { bg: '#FEF2F2', text: '#991B1B' },
  info: { bg: '#EFF6FF', text: '#1D4ED8' },
  neutral: { bg: Colors.slate[100], text: Colors.slate[600] },
  brand: { bg: Colors.epf[50], text: Colors.epf[700] },
};

export function Badge({ label, variant = 'neutral', size = 'md', style }: BadgeProps) {
  const colors = variantColors[variant];
  return (
    <View
      style={[
        {
          alignSelf: 'flex-start',
          borderRadius: Radius.full,
          backgroundColor: colors.bg,
          paddingHorizontal: size === 'sm' ? 8 : 10,
          paddingVertical: size === 'sm' ? 2 : 4,
        },
        style,
      ]}
    >
      <Text
        style={{
          color: colors.text,
          fontSize: size === 'sm' ? 10 : 12,
          fontWeight: Typography.semibold,
        }}
      >
        {label}
      </Text>
    </View>
  );
}
