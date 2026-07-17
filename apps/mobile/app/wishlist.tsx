import React, { useEffect } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Heart } from 'lucide-react-native';
import { PremiumCard, PremiumCardData } from '../src/components/PremiumCard';
import { useAuthStore } from '../src/store/auth';
import { useWishlistStore } from '../src/store/wishlist';
import { Colors, Typography, Radius } from '../src/theme/design-system';

function imagesFor(product: any): string[] {
  if (Array.isArray(product?.images)) return product.images;
  if (typeof product?.images === 'string') {
    try {
      const parsed = JSON.parse(product.images);
      return Array.isArray(parsed) ? parsed : [product.images];
    } catch {
      return [product.images];
    }
  }
  return product?.coverImage ? [product.coverImage] : [];
}

export default function WishlistScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const items = useWishlistStore((state) => state.items);
  const loading = useWishlistStore((state) => state.loading);
  const loaded = useWishlistStore((state) => state.loaded);
  const load = useWishlistStore((state) => state.load);

  useEffect(() => {
    if (user && !loaded) void load();
  }, [load, loaded, user]);

  if (!user) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg.secondary }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <Heart size={42} color={Colors.slate[300]} />
          <Text style={{ color: Colors.slate[900], fontSize: 19, fontWeight: Typography.semibold, marginTop: 14 }}>Sign in to use wishlist</Text>
          <Text style={{ color: Colors.slate[500], fontSize: 14, textAlign: 'center', lineHeight: 20, marginTop: 7 }}>Save products you want to come back to later.</Text>
          <Pressable style={{ backgroundColor: Colors.epf[500], borderRadius: Radius.base, paddingHorizontal: 23, paddingVertical: 13, marginTop: 18 }} onPress={() => router.push('/login')}>
            <Text style={{ color: Colors.text.inverse, fontWeight: Typography.bold }}>Login / Register</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg.secondary }}>
      <View style={{ backgroundColor: Colors.bg.primary, padding: 16, borderBottomWidth: 1, borderBottomColor: Colors.slate[200], flexDirection: 'row', alignItems: 'center' }}>
        <Pressable onPress={() => router.back()} style={{ padding: 4, marginRight: 10 }}><ArrowLeft size={21} color={Colors.slate[800]} /></Pressable>
        <View>
          <Text style={{ color: Colors.slate[900], fontSize: 22, fontWeight: Typography.bold }}>Wishlist</Text>
          <Text style={{ color: Colors.slate[500], fontSize: 13, marginTop: 3 }}>{items.length} saved {items.length === 1 ? 'product' : 'products'}</Text>
        </View>
      </View>

      {loading && !loaded ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator size="large" color={Colors.epf[500]} /></View>
      ) : (
        <FlatList
          data={items}
          numColumns={2}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 8, flexGrow: items.length === 0 ? 1 : undefined }}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={() => void load()} tintColor={Colors.epf[500]} />}
          ListEmptyComponent={<View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}><Heart size={38} color={Colors.slate[300]} /><Text style={{ color: Colors.slate[800], fontWeight: Typography.semibold, fontSize: 17, marginTop: 13 }}>Your wishlist is empty</Text><Text style={{ color: Colors.slate[500], fontSize: 13, marginTop: 6 }}>Tap the heart on a product to save it here.</Text></View>}
          renderItem={({ item }) => {
            const product = item.product;
            if (!product) return null;
            const card: PremiumCardData = {
              id: product.id || item.productId,
              name: product.name || 'Product',
              price: Number(product.price || 0),
              salePrice: product.salePrice,
              comparePrice: product.comparePrice || product.price,
              images: imagesFor(product),
              coverImage: product.coverImage,
              stock: product.stock,
              category: product.category?.name,
              rating: product.rating,
              reviewCount: product.reviewCount,
            };
            return <View style={{ width: '50%' }}><PremiumCard data={card} /></View>;
          }}
        />
      )}
    </SafeAreaView>
  );
}
