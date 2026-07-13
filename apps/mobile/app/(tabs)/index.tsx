// Home screen — shows hero banner, categories, featured products
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
import { productsApi } from '@epowerfix/api-client';
import { formatPrice, APP_CONFIG } from '@epowerfix/utils';
import type { Product } from '@epowerfix/types';
import { Colors } from '../../src/theme/colors';

export default function HomeScreen() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadProducts = async () => {
    try {
      const res = await productsApi.list({ limit: 8 });
      setProducts(res.data?.data || []);
    } catch (e) {
      // API not reachable — show empty state
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadProducts();
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text className="mt-3 text-gray-500">Loading...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Hero Banner */}
        <View className="bg-primary-500 p-6 pt-10">
          <Text className="text-3xl font-bold text-white">
            {APP_CONFIG.nameBn}
          </Text>
          <Text className="text-white/90 mt-2 text-base">
            Electrical services & products in Bangladesh
          </Text>
          <Pressable
            className="mt-5 bg-white rounded-lg px-5 py-3 self-start"
            onPress={() => router.push('/shop')}
          >
            <Text className="text-primary-600 font-semibold">Shop Now →</Text>
          </Pressable>
        </View>

        {/* Categories Grid */}
        <View className="p-5">
          <Text className="text-xl font-bold text-slate-900 mb-4">
            Categories
          </Text>
          <View className="flex-row flex-wrap justify-between">
            {[
              { name: 'Wiring', icon: '🔌' },
              { name: 'Lights', icon: '💡' },
              { name: 'Switches', icon: '⚡' },
              { name: 'Tools', icon: '🔧' },
            ].map((cat) => (
              <Pressable
                key={cat.name}
                className="w-[48%] bg-slate-50 rounded-xl p-5 mb-3 items-center"
                onPress={() => router.push('/shop')}
              >
                <Text className="text-4xl mb-2">{cat.icon}</Text>
                <Text className="font-semibold text-slate-700">{cat.name}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Featured Products */}
        <View className="px-5 pb-10">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-xl font-bold text-slate-900">
              Featured Products
            </Text>
            <Pressable onPress={() => router.push('/shop')}>
              <Text className="text-primary-600 font-medium">See all</Text>
            </Pressable>
          </View>

          {products.length === 0 ? (
            <View className="bg-slate-50 rounded-xl p-8 items-center">
              <Text className="text-slate-500">No products available</Text>
              <Text className="text-slate-400 text-sm mt-1">
                Check API connection
              </Text>
            </View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {products.map((product: any) => (
                <Pressable
                  key={product.id}
                  className="mr-3 w-40 bg-white border border-slate-200 rounded-xl p-3"
                  onPress={() => router.push(`/product/${product.id}`)}
                >
                  <View className="bg-slate-100 rounded-lg h-32 mb-2 items-center justify-center">
                    <Text className="text-3xl">📦</Text>
                  </View>
                  <Text className="font-semibold text-slate-900" numberOfLines={2}>
                    {product.name}
                  </Text>
                  <Text className="text-primary-600 font-bold mt-1">
                    {formatPrice(product.price)}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Trust Bar */}
        <View className="bg-slate-900 p-5 mx-5 rounded-xl mb-5">
          <View className="flex-row justify-around">
            <View className="items-center">
              <Text className="text-white font-bold text-lg">24/7</Text>
              <Text className="text-slate-400 text-xs">Support</Text>
            </View>
            <View className="items-center">
              <Text className="text-white font-bold text-lg">100%</Text>
              <Text className="text-slate-400 text-xs">Genuine</Text>
            </View>
            <View className="items-center">
              <Text className="text-white font-bold text-lg">Fast</Text>
              <Text className="text-slate-400 text-xs">Delivery</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
