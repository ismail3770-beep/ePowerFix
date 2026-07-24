// ═══════════════════════════════════════════════════════════════════════════
// ePowerFix EmptyState — Consistent empty states across the app
// ═══════════════════════════════════════════════════════════════════════════

import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Colors, Typography, Radius } from '../../theme/design-system';

type EmptyStateProps = {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function EmptyState({ icon, title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 48, paddingHorizontal: 32 }}>
      {icon && (
        <View
          style={{
            width: 72,
            height: 72,
            borderRadius: 22,
            backgroundColor: Colors.epf[50],
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 16,
          }}
        >
          {icon}
        </View>
      )}
      <Text style={{ fontSize: 18, fontWeight: Typography.bold, color: Colors.slate[900], textAlign: 'center' }}>
        {title}
      </Text>
      {description ? (
        <Text
          style={{
            fontSize: 14,
            color: Colors.slate[500],
            textAlign: 'center',
            lineHeight: 21,
            marginTop: 8,
          }}
        >
          {description}
        </Text>
      ) : null}
      {actionLabel && onAction ? (
        <Pressable
          onPress={onAction}
          style={{
            marginTop: 20,
            backgroundColor: Colors.epf[500],
            borderRadius: Radius.lg,
            paddingHorizontal: 24,
            paddingVertical: 12,
          }}
        >
          <Text style={{ color: '#fff', fontSize: 14, fontWeight: Typography.semibold }}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
