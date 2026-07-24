// ═══════════════════════════════════════════════════════════════════════════
// Electricians Browse — List of verified electricians with filters
// ═══════════════════════════════════════════════════════════════════════════

import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Pressable, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Star, MapPin, CheckCircle2, Zap } from 'lucide-react-native';
import { marketplaceCatalogApi } from '@epowerfix/api-client';
import { Colors, Typography, Radius } from '../../src/theme/design-system';

// Sample electrician data (will be replaced with API when available)
const SAMPLE_ELECTRICIANS = [
  { id: '1', name: 'Md. Karim Uddin', area: 'Mirpur, Dhaka', rating: 4.8, jobs: 234, specialty: 'Wiring & Installation', verified: true },
  { id: '2', name: 'Abdul Halim', area: 'Dhanmondi, Dhaka', rating: 4.9, jobs: 189, specialty: 'Repair & Maintenance', verified: true },
  { id: '3', name: 'Rafiqul Islam', area: 'Uttara, Dhaka', rating: 4.7, jobs: 156, specialty: 'Industrial Electrical', verified: true },
  { id: '4', name: 'Shahidul Haque', area: 'Gulshan, Dhaka', rating: 4.6, jobs: 312, specialty: 'Solar Installation', verified: true },
  { id: '5', name: 'Jamal Hossain', area: 'Mohammadpur, Dhaka', rating: 4.5, jobs: 98, specialty: 'Home Wiring', verified: true },
];

export default function ElectriciansScreen() {
  const router = useRouter();
  const [electricians, setElectricians] = useState(SAMPLE_ELECTRICIANS);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const renderCard = ({ item }: { item: typeof SAMPLE_ELECTRICIANS[0] }) => (
    <Pressable
      onPress={() => router.push(`/marketplace/electrician/${item.id}` as never)}
      style={{
        backgroundColor: Colors.bg.primary, borderRadius: Radius.xl, padding: 16,
        marginHorizontal: 16, marginBottom: 12, borderWidth: 1, borderColor: Colors.slate[200],
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        {/* Avatar */}
        <View style={{ width: 52, height: 52, borderRadius: 16, backgroundColor: Colors.epf[50], alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
          <Text style={{ fontSize: 20, fontWeight: Typography.bold, color: Colors.epf[600] }}>
            {item.name.charAt(0)}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={{ fontSize: 15, fontWeight: Typography.bold, color: Colors.slate[900] }}>{item.name}</Text>
            {item.verified && <CheckCircle2 size={14} color={Colors.epf[500]} />}
          </View>
          <Text style={{ fontSize: 12, color: Colors.epf[600], fontWeight: Typography.medium, marginTop: 2 }}>{item.specialty}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 6 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
              <Star size={12} color={Colors.badge.rating} fill={Colors.badge.rating} />
              <Text style={{ fontSize: 12, color: Colors.slate[600], fontWeight: Typography.medium }}>{item.rating}</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
              <MapPin size={12} color={Colors.slate[400]} />
              <Text style={{ fontSize: 12, color: Colors.slate[500] }}>{item.area}</Text>
            </View>
            <Text style={{ fontSize: 12, color: Colors.slate[500] }}>{item.jobs} jobs</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg.secondary }}>
      {/* Header */}
      <View style={{ backgroundColor: Colors.bg.primary, flexDirection: 'row', alignItems: 'center', padding: 14, borderBottomWidth: 1, borderBottomColor: Colors.slate[200] }}>
        <Pressable onPress={() => router.back()} style={{ padding: 4, marginRight: 12 }}>
          <ArrowLeft size={22} color={Colors.slate[900]} />
        </Pressable>
        <Zap size={18} color={Colors.epf[500]} />
        <Text style={{ fontSize: 18, fontWeight: Typography.bold, color: Colors.slate[900], marginLeft: 8 }}>Verified Electricians</Text>
      </View>

      <FlatList
        data={electricians}
        renderItem={renderCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingVertical: 16 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => setRefreshing(false)} tintColor={Colors.epf[500]} />}
        ListHeaderComponent={
          <View style={{ paddingHorizontal: 16, marginBottom: 12 }}>
            <Text style={{ fontSize: 13, color: Colors.slate[500] }}>
              {electricians.length} certified professionals near you
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}
