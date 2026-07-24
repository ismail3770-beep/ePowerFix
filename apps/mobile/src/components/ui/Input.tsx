// ═══════════════════════════════════════════════════════════════════════════
// ePowerFix Input — Form input with label, error, icon support
// ═══════════════════════════════════════════════════════════════════════════

import React from 'react';
import { View, Text, TextInput, TextInputProps, ViewStyle } from 'react-native';
import { Colors, Typography, Radius } from '../../theme/design-system';

type InputProps = TextInputProps & {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  containerStyle?: ViewStyle;
};

export function Input({ label, error, icon, containerStyle, style, ...rest }: InputProps) {
  return (
    <View style={[{ marginBottom: 16 }, containerStyle]}>
      {label ? (
        <Text style={{ fontSize: 13, fontWeight: Typography.medium, color: Colors.slate[700], marginBottom: 6 }}>
          {label}
        </Text>
      ) : null}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          borderWidth: 1,
          borderColor: error ? Colors.danger : Colors.slate[200],
          borderRadius: Radius.lg,
          backgroundColor: Colors.bg.primary,
          paddingHorizontal: 12,
          height: 48,
        }}
      >
        {icon ? <View style={{ marginRight: 8 }}>{icon}</View> : null}
        <TextInput
          placeholderTextColor={Colors.slate[400]}
          style={[
            {
              flex: 1,
              fontSize: 14,
              color: Colors.slate[900],
              padding: 0,
            },
            style,
          ]}
          {...rest}
        />
      </View>
      {error ? (
        <Text style={{ fontSize: 12, color: Colors.danger, marginTop: 4 }}>{error}</Text>
      ) : null}
    </View>
  );
}
