// Shop screen — product listing with filters
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
import { productsApi } from '@epowerfix/api-client';
import { formatPrice } from '@epowerfix/utils';
import { Colors } from '../../src/theme/colors';

export default function ShopScreen() {
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  const loadProducts = async () => {
    try {
      const res = await productsApi.list({ limit: 20, search });
      setProducts(res.data?.data || []);
    } catch (e) {
      // API not reachable
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
      className="flex-1 m-1.5 bg-white border border-slate-200 rounded-xl p-3"
      onPress={() => router.push(`/product/${item.id}`)}
    >
      <View className="bg-slate-100 rounded-lg h-32 mb-2 items-center justify-center">
        <Text className="text-3xl">📦</Text>
      </View>
      <Text className="font-semibold text-slate-900" numberOfLines={2}>
        {item.name}
      </Text>
      <Text className="text-primary-600 font-bold mt-1">
        {formatPrice(item.price)}
      </Text>
      {item.comparePrice && (
        <Text className="text-slate-400 line-through text-xs">
          {formatPrice(item.comparePrice)}
        </Text>
      )}
    </Pressable>
  );

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="p-4 border-b border-slate-200">
        <Text className="text-2xl font-bold text-slate-900 mb-3">Shop</Text>
        <View className="flex-row items-center bg-slate-100 rounded-lg px-3 py-2">
          <Text className="text-slate-400 mr-2">🔍</Text>
          <TextInput
            placeholder="Search products..."
            value={search}
            onChangeText={setSearch}
            className="flex-1 text-slate-900"
          />
        </View>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={products}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={{ padding: 8 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View className="items-center py-20">
              <Text className="text-slate-500 text-lg">No products found</Text>
              <Text className="text-slate-400 mt-1">Try a different search</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
