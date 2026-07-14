// Shop screen — simple version (no shared packages yet)
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

export default function ShopScreen() {
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  const loadProducts = async () => {
    try {
      setError('');
      const apiUrl = process.env.EXPO_PUBLIC_API_BASE_URL || '';
      if (!apiUrl) {
        setError('API URL not configured');
        setLoading(false);
        return;
      }
      const url = search
        ? `${apiUrl}/api/products?limit=20&search=${encodeURIComponent(search)}`
        : `${apiUrl}/api/products?limit=20`;
      const res = await fetch(url);
      const json = await res.json();
      setProducts(json?.data?.data || []);
    } catch (e: any) {
      setError(e?.message || 'Failed to load');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(loadProducts, 300);
    return () => clearTimeout(timeout);
  }, [search]);

  const onRefresh = () => {
    setRefreshing(true);
    loadProducts();
  };

  const renderItem = ({ item }: { item: any }) => (
    <Pressable
      style={{
        flex: 1,
        margin: 6,
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 12,
        padding: 12,
      }}
      onPress={() => router.push(`/product/${item.id}`)}
    >
      <View style={{
        backgroundColor: '#f1f5f9',
        borderRadius: 8,
        height: 128,
        marginBottom: 8,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <Text style={{ fontSize: 32 }}>📦</Text>
      </View>
      <Text style={{ fontWeight: '600', color: '#0f172a' }} numberOfLines={2}>
        {item.name}
      </Text>
      <Text style={{ color: '#d97706', fontWeight: 'bold', marginTop: 4 }}>
        ৳{item.price}
      </Text>
    </Pressable>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
      <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' }}>
        <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#0f172a', marginBottom: 12 }}>Shop</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f5f9', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 }}>
          <Text style={{ color: '#94a3b8', marginRight: 8 }}>🔍</Text>
          <TextInput
            placeholder="Search products..."
            value={search}
            onChangeText={setSearch}
            style={{ flex: 1, color: '#0f172a' }}
          />
        </View>
      </View>

      {error ? (
        <View style={{ padding: 20, alignItems: 'center' }}>
          <Text style={{ color: '#ef4444' }}>⚠️ {error}</Text>
          <Pressable
            style={{ backgroundColor: '#f59e0b', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 8, marginTop: 12 }}
            onPress={loadProducts}
          >
            <Text style={{ color: 'white', fontWeight: '600' }}>Retry</Text>
          </Pressable>
        </View>
      ) : loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#f59e0b" />
        </View>
      ) : (
        <FlatList
          data={products}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={{ padding: 8 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', paddingVertical: 80 }}>
              <Text style={{ color: '#64748b', fontSize: 18 }}>No products found</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
