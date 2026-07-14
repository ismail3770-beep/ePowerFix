// Cart screen — simple version using local state
import React, { useState } from 'react';
import { View, Text, Pressable, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CartScreen() {
  // Local state placeholder — will use Zustand store later
  const [items] = useState<any[]>([]);

  if (items.length === 0) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: 'white', alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: 64, marginBottom: 16 }}>🛒</Text>
        <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#0f172a' }}>Cart is empty</Text>
        <Text style={{ color: '#64748b', marginTop: 4 }}>Add products to get started</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      <View style={{ padding: 16, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' }}>
        <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#0f172a' }}>Cart</Text>
      </View>
      <FlatList
        data={items}
        renderItem={({ item }) => <Text>{item.productName}</Text>}
        keyExtractor={(item) => item.id}
      />
    </SafeAreaView>
  );
}
