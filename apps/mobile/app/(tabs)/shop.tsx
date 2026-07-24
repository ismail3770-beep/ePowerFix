// ═══════════════════════════════════════════════════════════════════════════
// Shop Screen — Enhanced with category filter, sort, pagination, search
// ═══════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  ScrollView,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Search, ShoppingCart, SlidersHorizontal, ChevronDown,
  LayoutGrid, List, X, ArrowUpDown,
} from 'lucide-react-native';
import { productsApi } from '@epowerfix/api-client';
import { useCartStore } from '@epowerfix/store';
import { PremiumCard, PremiumCardData, PremiumCardSkeleton } from '../../src/components/PremiumCard';
import { getCategoryIcon } from '../../src/components/icons/CategoryIcons';
import { Colors, Typography, Radius } from '../../src/theme/design-system';

const CATEGORIES = [
  { name: 'All', slug: '' },
  { name: 'কেবল ও ওয়্যার', slug: 'cable' },
  { name: 'সার্কিট ব্রেকার', slug: 'breaker' },
  { name: 'সুইচ ও সকেট', slug: 'switch' },
  { name: 'লাইটিং', slug: 'lighting' },
  { name: 'সোলার প্যানেল', slug: 'solar' },
  { name: 'সেফটি সরঞ্জাম', slug: 'safety' },
  { name: 'ইন্ডাস্ট্রিয়াল', slug: 'industrial' },
  { name: 'টুলস ও মিটার', slug: 'tools' },
];

const SORT_OPTIONS = [
  { label: 'Newest First', value: 'newest' },
  { label: 'Price: Low to High', value: 'price_asc' },
  { label: 'Price: High to Low', value: 'price_desc' },
  { label: 'Top Rated', value: 'rating' },
];

const PAGE_SIZE = 12;

export default function ShopScreen() {
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [category, setCategory] = useState('');
  const [sort, setSort] = useState('newest');
  const [showSortModal, setShowSortModal] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const cartItems = useCartStore((state) => state.items);
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Debounce search input
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
      setProducts([]);
    }, 400);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [search]);

  // Reset when filters change
  useEffect(() => {
    setPage(1);
    setProducts([]);
  }, [category, sort, debouncedSearch]);

  const loadProducts = useCallback(async (pageNum: number, append = false) => {
    if (pageNum === 1) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }
    try {
      const params: any = { page: pageNum, limit: PAGE_SIZE };
      if (debouncedSearch) params.search = debouncedSearch;
      if (category) params.category = category;
      const response = await productsApi.list(params);
      const data = response.data?.data || [];
      const totalCount = response.data?.total || 0;
      setTotal(totalCount);
      setHasMore(pageNum * PAGE_SIZE < totalCount);
      if (append) {
        setProducts((prev) => [...prev, ...data]);
      } else {
        setProducts(data);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  }, [debouncedSearch, category, sort]);

  useEffect(() => {
    void loadProducts(page, page > 1);
  }, [page, debouncedSearch, category, sort]);

  const onRefresh = () => {
    setRefreshing(true);
    setPage(1);
    void loadProducts(1);
  };

  const onEndReached = () => {
    if (hasMore && !loadingMore && !loading) {
      setPage((prev) => prev + 1);
    }
  };

  const toCard = (item: any): PremiumCardData => ({
    id: item.id,
    name: item.name,
    price: item.price,
    salePrice: item.salePrice,
    comparePrice: item.comparePrice ?? item.price,
    images: item.images,
    isFeatured: item.isFeatured,
    stock: item.stock,
    category: item.category?.name,
    rating: item.rating,
    reviewCount: item.reviewCount,
  });

  const renderItem = ({ item }: { item: any }) => (
    <PremiumCard data={toCard(item)} />
  );

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={{ paddingVertical: 20, alignItems: 'center' }}>
        <ActivityIndicator size="small" color={Colors.epf[500]} />
      </View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg.secondary }}>
      {/* Header */}
      <View style={{
        backgroundColor: Colors.bg.primary,
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: Colors.slate[200],
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <Text style={{ fontSize: 22, fontWeight: Typography.bold, color: Colors.slate[900] }}>Shop</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            {/* Sort button */}
            <Pressable onPress={() => setShowSortModal(true)} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <ArrowUpDown size={18} color={Colors.slate[600]} />
            </Pressable>
            {/* Cart */}
            <Pressable onPress={() => router.push('/(tabs)/cart')} style={{ position: 'relative' }}>
              <ShoppingCart size={22} color={Colors.slate[700]} />
              {cartCount > 0 && (
                <View style={{
                  position: 'absolute', top: -6, right: -8, minWidth: 16, height: 16,
                  borderRadius: 8, backgroundColor: Colors.epf[500], alignItems: 'center',
                  justifyContent: 'center', paddingHorizontal: 3,
                }}>
                  <Text style={{ color: '#fff', fontSize: 9, fontWeight: Typography.bold }}>{cartCount}</Text>
                </View>
              )}
            </Pressable>
          </View>
        </View>

        {/* Search bar */}
        <View style={{
          flexDirection: 'row', height: 42, borderRadius: Radius.lg,
          borderWidth: 1, borderColor: Colors.slate[200], overflow: 'hidden',
          backgroundColor: Colors.bg.primary,
        }}>
          <View style={{ paddingLeft: 12, justifyContent: 'center' }}>
            <Search size={17} color={Colors.slate[400]} />
          </View>
          <TextInput
            placeholder="Search products..."
            placeholderTextColor={Colors.slate[400]}
            value={search}
            onChangeText={setSearch}
            style={{ flex: 1, paddingHorizontal: 8, fontSize: 14, color: Colors.slate[900] }}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch('')} style={{ paddingRight: 12, justifyContent: 'center' }}>
              <X size={16} color={Colors.slate[400]} />
            </Pressable>
          )}
        </View>

        {/* Category filter chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginTop: 10 }}
          contentContainerStyle={{ gap: 8 }}
        >
          {CATEGORIES.map((cat) => {
            const active = category === cat.slug;
            const IconComp = cat.slug ? getCategoryIcon(cat.slug) : null;
            return (
              <Pressable
                key={cat.slug}
                onPress={() => setCategory(cat.slug)}
                style={{
                  flexDirection: 'row', alignItems: 'center', gap: 6,
                  paddingHorizontal: 14, paddingVertical: 8, borderRadius: Radius.full,
                  backgroundColor: active ? Colors.epf[500] : Colors.slate[100],
                  borderWidth: 1,
                  borderColor: active ? Colors.epf[500] : Colors.slate[200],
                }}
              >
                {IconComp && <IconComp size={14} color={active ? '#fff' : Colors.slate[600]} />}
                <Text style={{
                  fontSize: 13, fontWeight: active ? Typography.semibold : Typography.normal,
                  color: active ? '#fff' : Colors.slate[700],
                }}>
                  {cat.name}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Results count */}
      {!loading && products.length > 0 && (
        <View style={{ paddingHorizontal: 16, paddingVertical: 8 }}>
          <Text style={{ fontSize: 12, color: Colors.slate[500] }}>
            {total} products found
          </Text>
        </View>
      )}

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
          contentContainerStyle={{ padding: 8, paddingBottom: 24 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.epf[500]} />}
          onEndReached={onEndReached}
          onEndReachedThreshold={0.3}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', paddingVertical: 80 }}>
              <View style={{ width: 64, height: 64, borderRadius: 20, backgroundColor: Colors.slate[100], alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                <Search size={26} color={Colors.slate[400]} />
              </View>
              <Text style={{ color: Colors.slate[700], fontSize: 16, fontWeight: Typography.semibold }}>
                No products found
              </Text>
              <Text style={{ color: Colors.slate[400], fontSize: 13, marginTop: 4 }}>
                Try a different search or category
              </Text>
            </View>
          }
        />
      )}

      {/* Sort Modal */}
      <Modal visible={showSortModal} transparent animationType="fade" onRequestClose={() => setShowSortModal(false)}>
        <Pressable
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }}
          onPress={() => setShowSortModal(false)}
        >
          <Pressable
            style={{
              backgroundColor: Colors.bg.primary, borderTopLeftRadius: 20, borderTopRightRadius: 20,
              padding: 20, paddingBottom: 34,
            }}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: Colors.slate[200], alignSelf: 'center', marginBottom: 18 }} />
            <Text style={{ fontSize: 17, fontWeight: Typography.bold, color: Colors.slate[900], marginBottom: 16 }}>
              Sort By
            </Text>
            {SORT_OPTIONS.map((opt) => {
              const active = sort === opt.value;
              return (
                <Pressable
                  key={opt.value}
                  onPress={() => { setSort(opt.value); setShowSortModal(false); }}
                  style={{
                    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                    paddingVertical: 14, paddingHorizontal: 14, borderRadius: Radius.lg,
                    backgroundColor: active ? Colors.epf[50] : 'transparent',
                    marginBottom: 4,
                  }}
                >
                  <Text style={{ fontSize: 15, color: active ? Colors.epf[700] : Colors.slate[700], fontWeight: active ? Typography.semibold : Typography.normal }}>
                    {opt.label}
                  </Text>
                  {active && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.epf[500] }} />}
                </Pressable>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
