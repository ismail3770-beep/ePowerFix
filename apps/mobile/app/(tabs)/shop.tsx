// Shop screen — matches website design
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
import { Search } from 'lucide-react-native';

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

  const renderItem = ({ item }: { item: any }) => {
    const hasDiscount = item.salePrice && item.salePrice < item.price;
    const discountPct = hasDiscount
      ? Math.round(((item.price - item.salePrice) / item.price) * 100)
      : 0;

    return (
      <Pressable
        style={{
          flex: 1,
          margin: 6,
          backgroundColor: '#FFFFFF',
          borderRadius: 12,
          borderWidth: 1,
          borderColor: '#E2E8F0',
          overflow: 'hidden',
        }}
        onPress={() => router.push(`/product/${item.id}`)}
      >
        {/* Image */}
        <View style={{
          backgroundColor: '#F8FAFC',
          height: 140,
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}>
          <Text style={{ fontSize: 36 }}>📦</Text>
          {hasDiscount && (
            <View style={{
              position: 'absolute',
              top: 8,
              left: 8,
              backgroundColor: '#DC2626',
              borderRadius: 4,
              paddingHorizontal: 6,
              paddingVertical: 2,
            }}>
              <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: '700' }}>
                -{discountPct}%
              </Text>
            </View>
          )}
        </View>

        {/* Content */}
        <View style={{ padding: 10 }}>
          <Text style={{ fontSize: 13, fontWeight: '600', color: '#0F172A' }} numberOfLines={2}>
            {item.name}
          </Text>

          {/* Rating */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
            <Text style={{ color: '#F59E0B', fontSize: 11 }}>★</Text>
            <Text style={{ color: '#64748B', fontSize: 11, marginLeft: 2 }}>
              {item.rating ? item.rating.toFixed(1) : '0.0'}
            </Text>
          </View>

          {/* Price */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
            <Text style={{ fontSize: 15, fontWeight: '700', color: '#0EA5E9' }}>
              ৳{item.salePrice ?? item.price}
            </Text>
            {hasDiscount && (
              <Text style={{
                color: '#94A3B8',
                fontSize: 11,
                textDecorationLine: 'line-through',
                marginLeft: 6,
              }}>
                ৳{item.price}
              </Text>
            )}
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F1F5F9' }}>
      {/* Search Header */}
      <View style={{
        padding: 16,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
      }}>
        <Text style={{ fontSize: 22, fontWeight: '700', color: '#0F172A', marginBottom: 12 }}>
          Shop
        </Text>
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: '#F1F5F9',
          borderRadius: 8,
          paddingHorizontal: 12,
          paddingVertical: 10,
        }}>
          <Search size={18} color="#94A3B8" />
          <TextInput
            placeholder="Search products..."
            value={search}
            onChangeText={setSearch}
            placeholderTextColor="#94A3B8"
            style={{ flex: 1, color: '#0F172A', marginLeft: 8, fontSize: 14 }}
          />
        </View>
      </View>

      {error ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Text style={{ color: '#DC2626', marginBottom: 12 }}>⚠️ {error}</Text>
          <Pressable
            style={{ backgroundColor: '#0EA5E9', borderRadius: 8, paddingHorizontal: 20, paddingVertical: 10 }}
            onPress={loadProducts}
          >
            <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>Retry</Text>
          </Pressable>
        </View>
      ) : loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#0EA5E9" />
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
              <Text style={{ color: '#64748B', fontSize: 16, fontWeight: '600' }}>
                No products found
              </Text>
              <Text style={{ color: '#94A3B8', fontSize: 13, marginTop: 4 }}>
                Try a different search
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
