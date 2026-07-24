// ═══════════════════════════════════════════════════════════════════════════
// ePowerFix ErrorState — Error display with retry pattern
// ═══════════════════════════════════════════════════════════════════════════

import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { AlertTriangle } from 'lucide-react-native';
import { Colors, Typography, Radius } from '../../theme/design-system';

type ErrorStateProps = {
  message?: string;
  onRetry?: () => void;
};

export function ErrorState({ message = 'Something went wrong. Please try again.', onRetry }: ErrorStateProps) {
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 48, paddingHorizontal: 32 }}>
      <View
        style={{
          width: 64,
          height: 64,
          borderRadius: 20,
          backgroundColor: '#FEF2F2',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 16,
        }}
      >
        <AlertTriangle size={28} color={Colors.danger} />
      </View>
      <Text style={{ fontSize: 16, fontWeight: Typography.bold, color: Colors.slate[900], textAlign: 'center' }}>
        Oops!
      </Text>
      <Text style={{ fontSize: 14, color: Colors.slate[500], textAlign: 'center', lineHeight: 21, marginTop: 6 }}>
        {message}
      </Text>
      {onRetry ? (
        <Pressable
          onPress={onRetry}
          style={{
            marginTop: 20,
            backgroundColor: Colors.epf[500],
            borderRadius: Radius.lg,
            paddingHorizontal: 24,
            paddingVertical: 12,
          }}
        >
          <Text style={{ color: '#fff', fontSize: 14, fontWeight: Typography.semibold }}>Try Again</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
