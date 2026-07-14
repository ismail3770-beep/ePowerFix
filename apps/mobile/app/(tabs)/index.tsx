// Home screen — simple version first to debug white screen
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

export default function HomeScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [error, setError] = useState('');

  const loadProducts = async () => {
    try {
      setError('');
      const apiUrl = process.env.EXPO_PUBLIC_API_BASE_URL || '';
      if (!apiUrl) {
        setError('EXPO_PUBLIC_API_BASE_URL not set in .env');
        return;
      }
      const res = await fetch(`${apiUrl}/api/products?limit=8`);
      const json = await res.json();
      setProducts(json?.data?.data || []);
    } catch (e: any) {
      setError(e?.message || 'Failed to load products');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    loadProducts();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadProducts();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#ffffff' }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Hero Banner */}
        <View style={{ backgroundColor: '#f59e0b', padding: 24, paddingTop: 40 }}>
          <Text style={{ fontSize: 28, fontWeight: 'bold', color: 'white' }}>
            ePowerFix
          </Text>
          <Text style={{ color: 'rgba(255,255,255,0.9)', marginTop: 8, fontSize: 16 }}>
            Electrical services & products in Bangladesh
          </Text>
          <Pressable
            style={{
              marginTop: 20,
              backgroundColor: 'white',
              borderRadius: 8,
              paddingHorizontal: 20,
              paddingVertical: 12,
              alignSelf: 'flex-start',
            }}
            onPress={() => router.push('/shop')}
          >
            <Text style={{ color: '#d97706', fontWeight: '600' }}>Shop Now →</Text>
          </Pressable>
        </View>

        {/* Categories */}
        <View style={{ padding: 20 }}>
          <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#0f172a', marginBottom: 16 }}>
            Categories
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
            {[
              { name: 'Wiring', icon: '🔌' },
              { name: 'Lights', icon: '💡' },
              { name: 'Switches', icon: '⚡' },
              { name: 'Tools', icon: '🔧' },
            ].map((cat) => (
              <Pressable
                key={cat.name}
                style={{
                  width: '48%',
                  backgroundColor: '#f8fafc',
                  borderRadius: 12,
                  padding: 20,
                  marginBottom: 12,
                  alignItems: 'center',
                }}
                onPress={() => router.push('/shop')}
              >
                <Text style={{ fontSize: 36, marginBottom: 8 }}>{cat.icon}</Text>
                <Text style={{ fontWeight: '600', color: '#334155' }}>{cat.name}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Featured Products */}
        <View style={{ paddingHorizontal: 20, paddingBottom: 40 }}>
          <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#0f172a', marginBottom: 16 }}>
            Featured Products
          </Text>

          {error ? (
            <View style={{ backgroundColor: '#fef2f2', borderRadius: 12, padding: 20, alignItems: 'center' }}>
              <Text style={{ color: '#ef4444', marginBottom: 8 }}>⚠️ {error}</Text>
              <Pressable
                style={{ backgroundColor: '#f59e0b', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 8, marginTop: 8 }}
                onPress={loadProducts}
              >
                <Text style={{ color: 'white', fontWeight: '600' }}>Retry</Text>
              </Pressable>
            </View>
          ) : loading ? (
            <ActivityIndicator size="large" color="#f59e0b" />
          ) : products.length === 0 ? (
            <View style={{ backgroundColor: '#f8fafc', borderRadius: 12, padding: 20, alignItems: 'center' }}>
              <Text style={{ color: '#64748b' }}>No products available</Text>
            </View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {products.map((product: any) => (
                <Pressable
                  key={product.id}
                  style={{
                    marginRight: 12,
                    width: 160,
                    backgroundColor: 'white',
                    borderWidth: 1,
                    borderColor: '#e2e8f0',
                    borderRadius: 12,
                    padding: 12,
                  }}
                  onPress={() => router.push(`/product/${product.id}`)}
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
                  <Text
                    style={{ fontWeight: '600', color: '#0f172a' }}
                    numberOfLines={2}
                  >
                    {product.name}
                  </Text>
                  <Text style={{ color: '#d97706', fontWeight: 'bold', marginTop: 4 }}>
                    ৳{product.price}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Trust Bar */}
        <View style={{ backgroundColor: '#0f172a', padding: 20, marginHorizontal: 20, borderRadius: 12, marginBottom: 20 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 18 }}>24/7</Text>
              <Text style={{ color: '#94a3b8', fontSize: 12 }}>Support</Text>
            </View>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 18 }}>100%</Text>
              <Text style={{ color: '#94a3b8', fontSize: 12 }}>Genuine</Text>
            </View>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 18 }}>Fast</Text>
              <Text style={{ color: '#94a3b8', fontSize: 12 }}>Delivery</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
