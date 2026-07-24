// ═══════════════════════════════════════════════════════════════════════════
// ePowerFix QuantitySelector — Reusable quantity picker with stock limit
// ═══════════════════════════════════════════════════════════════════════════

import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Minus, Plus } from 'lucide-react-native';
import { Colors, Typography, Radius } from '../../theme/design-system';

type QuantitySelectorProps = {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  size?: 'sm' | 'md';
};

export function QuantitySelector({ value, onChange, min = 1, max = 99, size = 'md' }: QuantitySelectorProps) {
  const btnSize = size === 'sm' ? 30 : 38;
  const iconSize = size === 'sm' ? 14 : 16;
  const fontSize = size === 'sm' ? 14 : 16;

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
      <Pressable
        onPress={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        style={{
          width: btnSize,
          height: btnSize,
          borderRadius: Radius.lg,
          backgroundColor: value <= min ? Colors.slate[100] : Colors.epf[50],
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 1,
          borderColor: value <= min ? Colors.slate[200] : Colors.epf[200],
        }}
      >
        <Minus size={iconSize} color={value <= min ? Colors.slate[300] : Colors.epf[600]} />
      </Pressable>
      <View style={{ minWidth: size === 'sm' ? 36 : 44, alignItems: 'center' }}>
        <Text style={{ fontSize, fontWeight: Typography.bold, color: Colors.slate[900] }}>{value}</Text>
      </View>
      <Pressable
        onPress={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        style={{
          width: btnSize,
          height: btnSize,
          borderRadius: Radius.lg,
          backgroundColor: value >= max ? Colors.slate[100] : Colors.epf[50],
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 1,
          borderColor: value >= max ? Colors.slate[200] : Colors.epf[200],
        }}
      >
        <Plus size={iconSize} color={value >= max ? Colors.slate[300] : Colors.epf[600]} />
      </Pressable>
    </View>
  );
}
