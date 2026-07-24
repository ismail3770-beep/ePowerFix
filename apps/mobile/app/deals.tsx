// ═══════════════════════════════════════════════════════════════════════════
// Flash Deals Screen — Active deals with countdown + product grid
// ═══════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, Pressable, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Zap, Timer } from 'lucide-react-native';
import { productsApi } from '@epowerfix/api-client';
import { PremiumCard, PremiumCardData, PremiumCardSkeleton } from '../src/components/PremiumCard';
import { Colors, Typography, Radius } from '../src/theme/design-system';

function CountdownTimer() {
  const [time, setTime] = useState({ h: 10, m: 28, s: 39 });
  useEffect(() => {
    const id = setInterval(() => {
      setTime((prev) => {
        let { h, m, s } = prev;
        s -= 1;
        if (s < 0) { s = 59; m -= 1; }
        if (m < 0) { m = 59; h -= 1; }
        if (h < 0) { h = 0; m = 0; s = 0; }
        return { h, m, s };
      });
    }, 1000);
    return () => clearInterval(id);
  }, []);
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      {[pad(time.h), pad(time.m), pad(time.s)].map((v, i) => (
        <React.Fragment key={i}>
          <View style={{ backgroundColor: '#fff', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 3, minWidth: 28, alignItems: 'center' }}>
            <Text style={{ color: Colors.slate[900], fontSize: 13, fontWeight: Typography.bold, fontVariant: ['tabular-nums'] }}>{v}</Text>
          </View>
          {i < 2 && <Text style={{ color: '#fff', fontWeight: Typography.bold, fontSize: 14 }}>:</Text>}
        </React.Fragment>
      ))}
    </View>
  );
}

export default function DealsScreen() {
  const router = useRouter();
  const [deals, setDeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const res = await productsApi.list({ limit: 20 });
      const data = res.data?.data || [];
      // Filter products that have a sale price (deals)
      const dealProducts = data.filter((p: any) => Number(p.salePrice) > 0 && Number(p.salePrice) < Number(p.price));
      setDeals(dealProducts.length > 0 ? dealProducts : data.slice(0, 10));
    } catch { /* silent */ }
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { void load(); }, []);

  const toCard = (item: any): PremiumCardData => ({
    id: item.id,
    name: item.name,
    price: item.price,
    salePrice: item.salePrice,
    comparePrice: item.comparePrice ?? item.price,
    images: item.images,
    isFeatured: item.isFeatured,
    stock: item.stock,
    category: item.category?.name,
    rating: item.rating,
    reviewCount: item.reviewCount,
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg.secondary }}>
      {/* Header */}
      <View style={{ backgroundColor: Colors.epf[600], paddingHorizontal: 16, paddingTop: 12, paddingBottom: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
          <Pressable onPress={() => router.back()} style={{ padding: 4, marginRight: 12 }}>
            <ArrowLeft size={22} color="#fff" />
          </Pressable>
          <Zap size={20} color="#FDE047" fill="#FDE047" />
          <Text style={{ fontSize: 20, fontWeight: Typography.bold, color: '#fff', marginLeft: 8 }}>Flash Deals</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Timer size={16} color="#fff" />
            <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13 }}>Ends in</Text>
          </View>
          <CountdownTimer />
        </View>
      </View>

      {/* Deals Grid */}
      {loading ? (
        <FlatList
          data={[1, 2, 3, 4]}
          renderItem={() => <PremiumCardSkeleton />}
          keyExtractor={(item) => String(item)}
          numColumns={2}
          contentContainerStyle={{ padding: 8 }}
        />
      ) : (
        <FlatList
          data={deals}
          renderItem={({ item }) => <PremiumCard data={toCard(item)} />}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={{ padding: 8, paddingBottom: 24 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} tintColor={Colors.epf[500]} />}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', paddingVertical: 60 }}>
              <Zap size={40} color={Colors.slate[300]} />
              <Text style={{ color: Colors.slate[500], fontSize: 15, marginTop: 12 }}>No active deals right now</Text>
              <Text style={{ color: Colors.slate[400], fontSize: 13, marginTop: 4 }}>Check back later for new offers!</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
