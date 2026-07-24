// ═══════════════════════════════════════════════════════════════════════════
// ePowerFix SectionHeader — Reusable section headers with "View All" action
// ═══════════════════════════════════════════════════════════════════════════

import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { ArrowRight } from 'lucide-react-native';
import { Colors, Typography } from '../../theme/design-system';

type SectionHeaderProps = {
  title: string;
  subtitle?: string;
  onViewAll?: () => void;
  viewAllLabel?: string;
};

export function SectionHeader({ title, subtitle, onViewAll, viewAllLabel = 'View All' }: SectionHeaderProps) {
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        paddingHorizontal: 16,
        marginBottom: 14,
      }}
    >
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 20, fontWeight: Typography.bold, color: Colors.slate[900] }}>{title}</Text>
        {subtitle ? (
          <Text style={{ fontSize: 13, color: Colors.slate[500], marginTop: 3 }}>{subtitle}</Text>
        ) : null}
      </View>
      {onViewAll ? (
        <Pressable onPress={onViewAll} style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
          <Text style={{ color: Colors.epf[600], fontSize: 13, fontWeight: Typography.medium }}>
            {viewAllLabel}
          </Text>
          <ArrowRight size={14} color={Colors.epf[600]} />
        </Pressable>
      ) : null}
    </View>
  );
}
