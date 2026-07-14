// Cart screen — matches website design
import React, { useState } from 'react';
import { View, Text, Pressable, FlatList, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ShoppingCart, ArrowRight } from 'lucide-react-native';

export default function CartScreen() {
  const router = useRouter();
  // Placeholder — will use shared cart store later
  const [items] = useState<any[]>([]);

  if (items.length === 0) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' }}>
        <View style={{
          width: 80,
          height: 80,
          borderRadius: 40,
          backgroundColor: '#F0F9FF',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 20,
        }}>
          <ShoppingCart size={36} color="#0EA5E9" strokeWidth={1.5} />
        </View>
        <Text style={{ fontSize: 20, fontWeight: '700', color: '#0F172A' }}>
          Your cart is empty
        </Text>
        <Text style={{ color: '#64748B', fontSize: 14, marginTop: 8, textAlign: 'center' }}>
          Browse our products and add items to your cart
        </Text>
        <Pressable
          style={{
            backgroundColor: '#0EA5E9',
            borderRadius: 8,
            paddingHorizontal: 24,
            paddingVertical: 12,
            marginTop: 20,
            flexDirection: 'row',
            alignItems: 'center',
          }}
          onPress={() => router.push('/(tabs)/shop')}
        >
          <Text style={{ color: '#FFFFFF', fontWeight: '600', marginRight: 6 }}>
            Start Shopping
          </Text>
          <ArrowRight size={16} color="#FFFFFF" />
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F1F5F9' }}>
      <View style={{
        padding: 16,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
      }}>
        <Text style={{ fontSize: 22, fontWeight: '700', color: '#0F172A' }}>
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
