// Cart screen — matches website CartDrawer.tsx design
import React, { useState } from 'react';
import { View, Text, Pressable, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ShoppingCart, ArrowRight, PackageOpen } from 'lucide-react-native';
import { Colors, Typography, Radius } from '../../src/theme/design-system';

export default function CartScreen() {
  const router = useRouter();
  const [items] = useState<any[]>([]);

  if (items.length === 0) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg.secondary, alignItems: 'center', justifyContent: 'center' }}>
        {/* Empty state — matches website BestDeals empty state */}
        <View style={{
          width: 64,
          height: 64,
          borderRadius: 32,
          backgroundColor: Colors.bg.primary,
          borderWidth: 1,
          borderColor: Colors.slate[200],
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 16,
        }}>
          <PackageOpen size={32} color={Colors.slate[300]} strokeWidth={1.5} />
        </View>
        <Text style={{ fontSize: 18, fontWeight: Typography.medium, color: Colors.slate[700] }}>
          Your cart is empty
        </Text>
        <Text style={{ color: Colors.slate[400], fontSize: 14, marginTop: 8, textAlign: 'center', maxWidth: 300 }}>
          Browse our products and add items to your cart
        </Text>
        <Pressable
          style={{
            backgroundColor: Colors.epf[500],
            borderRadius: Radius.base,
            paddingHorizontal: 24,
            paddingVertical: 12,
            marginTop: 20,
            flexDirection: 'row',
            alignItems: 'center',
          }}
          onPress={() => router.push('/(tabs)/shop')}
        >
          <Text style={{ color: Colors.text.inverse, fontWeight: Typography.semibold, marginRight: 6 }}>
            Start Shopping
          </Text>
          <ArrowRight size={16} color={Colors.text.inverse} />
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg.secondary }}>
      <View style={{
        padding: 16,
        backgroundColor: Colors.bg.primary,
        borderBottomWidth: 1,
        borderBottomColor: Colors.slate[200],
      }}>
        <Text style={{ fontSize: 22, fontWeight: Typography.bold, color: Colors.slate[900] }}>
          Cart ({items.length})
        </Text>
      </View>
      <FlatList
        data={items}
        renderItem={({ item }) => <Text>{item.productName}</Text>}
        keyExtractor={(item) => item.id}
      />
    </SafeAreaView>
  );
}
