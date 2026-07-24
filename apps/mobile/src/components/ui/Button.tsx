// ═══════════════════════════════════════════════════════════════════════════
// ePowerFix Button — Primary, Secondary, Outline, Ghost variants
// ═══════════════════════════════════════════════════════════════════════════

import React from 'react';
import { Pressable, Text, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { Colors, Typography, Radius } from '../../theme/design-system';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

type ButtonProps = {
  title: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
  style?: ViewStyle;
};

const variantStyles: Record<ButtonVariant, { bg: string; text: string; border?: string }> = {
  primary: { bg: Colors.epf[500], text: '#FFFFFF' },
  secondary: { bg: Colors.slate[100], text: Colors.slate[800] },
  outline: { bg: 'transparent', text: Colors.epf[600], border: Colors.epf[500] },
  ghost: { bg: 'transparent', text: Colors.epf[600] },
  danger: { bg: Colors.danger, text: '#FFFFFF' },
};

const sizeStyles: Record<ButtonSize, { paddingV: number; paddingH: number; fontSize: number }> = {
  sm: { paddingV: 8, paddingH: 14, fontSize: 13 },
  md: { paddingV: 12, paddingH: 20, fontSize: 14 },
  lg: { paddingV: 15, paddingH: 24, fontSize: 16 },
};

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  fullWidth = false,
  style,
}: ButtonProps) {
  const vStyle = variantStyles[variant];
  const sStyle = sizeStyles[size];

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          borderRadius: Radius.lg,
          backgroundColor: disabled ? Colors.slate[200] : vStyle.bg,
          paddingVertical: sStyle.paddingV,
          paddingHorizontal: sStyle.paddingH,
          borderWidth: vStyle.border ? 1.5 : 0,
          borderColor: vStyle.border,
          opacity: pressed && !disabled ? 0.85 : 1,
          alignSelf: fullWidth ? 'stretch' : 'auto',
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={disabled ? Colors.slate[400] : vStyle.text} />
      ) : (
        <>
          {icon}
          <Text
            style={{
              color: disabled ? Colors.slate[400] : vStyle.text,
              fontSize: sStyle.fontSize,
              fontWeight: Typography.semibold,
            }}
          >
            {title}
          </Text>
        </>
      )}
    </Pressable>
  );
}
