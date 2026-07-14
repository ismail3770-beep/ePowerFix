// Shop screen — matches website shop page design
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
import { Colors, Typography, Radius } from '../../src/theme/design-system';

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
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg.secondary }}>
      {/* Header with search — matches website */}
      <View style={{
        backgroundColor: Colors.bg.primary,
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: Colors.slate[200],
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <Text style={{ fontSize: 22, fontWeight: Typography.bold, color: Colors.slate[900] }}>
            Shop
          </Text>
          <Pressable
            onPress={() => router.push('/(tabs)/cart')}
            style={{ position: 'relative' }}
          >
            <ShoppingCart size={22} color={Colors.slate[700]} />
            <View style={{
              position: 'absolute',
              top: -6,
              right: -8,
              minWidth: 15,
              height: 15,
              borderRadius: 8,
              backgroundColor: Colors.epf[500],
              alignItems: 'center',
              justifyContent: 'center',
              paddingHorizontal: 2,
            }}>
              <Text style={{ color: Colors.text.inverse, fontSize: 10, fontWeight: Typography.bold }}>0</Text>
            </View>
          </Pressable>
        </View>
        {/* Search bar — matches website Header search */}
        <View style={{
          flexDirection: 'row',
          height: 42,
          borderRadius: Radius.base,
          borderWidth: 1,
          borderColor: Colors.slate[200],
          overflow: 'hidden',
          backgroundColor: Colors.bg.primary,
        }}>
          <View style={{ paddingLeft: 10, justifyContent: 'center' }}>
            <Search size={18} color={Colors.slate[400]} />
          </View>
          <TextInput
            placeholder="Search products, services or projects..."
            placeholderTextColor={Colors.slate[400]}
            value={search}
            onChangeText={setSearch}
            style={{ flex: 1, paddingHorizontal: 8, fontSize: 15, color: Colors.slate[900] }}
          />
          <Pressable
            style={{
              backgroundColor: Colors.epf[500],
              paddingHorizontal: 18,
              justifyContent: 'center',
            }}
          >
            <Text style={{ color: Colors.text.inverse, fontSize: 14, fontWeight: Typography.semibold }}>
              Search
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Products Grid — 2 columns with PremiumCard */}
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
              <Text style={{ color: Colors.slate[500], fontSize: 16, fontWeight: Typography.semibold }}>
                No products found
              </Text>
              <Text style={{ color: Colors.slate[400], fontSize: 13, marginTop: 4 }}>
                Try a different search
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
