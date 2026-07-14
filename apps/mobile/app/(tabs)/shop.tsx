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
import { Search, ShoppingCart } from 'lucide-react-native';
import { PremiumCard, PremiumCardData, PremiumCardSkeleton } from '../../src/components/PremiumCard';

export default function ShopScreen() {
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  const loadProducts = async () => {
    try {
      const apiUrl = process.env.EXPO_PUBLIC_API_BASE_URL || '';
      if (!apiUrl) {
        setLoading(false);
        return;
      }
      const url = search
        ? `${apiUrl}/api/products?limit=20&search=${encodeURIComponent(search)}`
        : `${apiUrl}/api/products?limit=20`;
      const res = await fetch(url);
      const json = await res.json();
      setProducts(json?.data?.data || []);
    } catch (e) {
      // silent
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
    const cardData: PremiumCardData = {
      id: item.id,
      name: item.name,
      price: item.price,
      salePrice: item.salePrice,
      comparePrice: item.salePrice,
      images: item.images,
      isFeatured: item.isFeatured,
      stock: item.stock,
      category: item.category?.name,
      rating: item.rating,
      reviewCount: item.reviewCount,
    };
    return <PremiumCard data={cardData} />;
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F1F5F9' }}>
      {/* Header */}
      <View style={{
        backgroundColor: '#FFFFFF',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <Text style={{ fontSize: 22, fontWeight: '700', color: '#0F172A' }}>Shop</Text>
          <Pressable onPress={() => router.push('/(tabs)/cart')} style={{ position: 'relative' }}>
            <ShoppingCart size={22} color="#0F172A" />
            <View style={{
              position: 'absolute',
              top: -6,
              right: -8,
              minWidth: 15,
              height: 15,
              borderRadius: 8,
              backgroundColor: '#0EA5E9',
              alignItems: 'center',
              justifyContent: 'center',
              paddingHorizontal: 2,
            }}>
              <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: '700' }}>0</Text>
            </View>
          </Pressable>
        </View>
        {/* Search */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: '#F8FAFC',
          borderRadius: 6,
          borderWidth: 1,
          borderColor: '#E2E8F0',
          overflow: 'hidden',
        }}>
          <View style={{ paddingLeft: 10 }}>
            <Search size={18} color="#94A3B8" />
          </View>
          <TextInput
            placeholder="Search products, services or projects..."
            placeholderTextColor="#94A3B8"
            value={search}
            onChangeText={setSearch}
            style={{ flex: 1, paddingHorizontal: 8, paddingVertical: 9, fontSize: 14, color: '#0F172A' }}
          />
          <Pressable
            style={{
              backgroundColor: '#0EA5E9',
              paddingHorizontal: 14,
              paddingVertical: 9,
              justifyContent: 'center',
            }}
          >
            <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '600' }}>Search</Text>
          </Pressable>
        </View>
      </View>

      {/* Products Grid */}
      {loading ? (
        <FlatList
          data={[1, 2, 3, 4, 5, 6]}
          renderItem={() => <PremiumCardSkeleton />}
          keyExtractor={(item) => String(item)}
          numColumns={2}
          contentContainerStyle={{ padding: 8 }}
        />
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
