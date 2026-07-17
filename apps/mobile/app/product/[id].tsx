// Product detail screen — matches website ProductDetailDialog.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { productsApi } from '@epowerfix/api-client';
import { useCartStore } from '@epowerfix/store';
import { useAuthStore } from '../../src/store/auth';
import { useWishlistStore } from '../../src/store/wishlist';
import {
  Star,
  ShoppingCart,
  Heart,
  Share2,
  Minus,
  Plus,
  ArrowLeft,
  Truck,
  Shield,
  RotateCcw,
} from 'lucide-react-native';
import { Colors, Typography, Radius } from '../../src/theme/design-system';

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const addItem = useCartStore((state) => state.addItem);
  const user = useAuthStore((state) => state.user);
  const wishlistItems = useWishlistStore((state) => state.items);
  const toggleWishlist = useWishlistStore((state) => state.toggle);
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [wishlistBusy, setWishlistBusy] = useState(false);
  const [added, setAdded] = useState(false);

  const wished = wishlistItems.some((item) => item.productId === id);

  useEffect(() => {
    const load = async () => {
      try {
        if (!id) return;
        const response = await productsApi.getById(id);
        setProduct(response.data?.product);
      } catch (e: any) {
        setError(e?.message || 'Failed to load');
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [id]);

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg.secondary, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={Colors.epf[500]} />
      </SafeAreaView>
    );
  }

  if (error || !product) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg.secondary, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: Colors.slate[500], fontSize: 16 }}>{error || 'Product not found'}</Text>
      </SafeAreaView>
    );
  }

  const hasDiscount = Number(product.salePrice) > 0 && Number(product.salePrice) < Number(product.price);
  const displayPrice = Number(product.salePrice ?? product.price);
  const discountPct = hasDiscount
    ? Math.round(((Number(product.price) - Number(product.salePrice)) / Number(product.price)) * 100)
    : 0;
  const productImages = Array.isArray(product.images)
    ? product.images
    : typeof product.images === 'string'
      ? (() => {
          try {
            const parsed = JSON.parse(product.images);
            return Array.isArray(parsed) ? parsed : [product.images];
          } catch {
            return [product.images];
          }
        })()
      : [];
  const imageUrl = product.coverImage || productImages[0] || '';
  const maxStock = typeof product.stock === 'number' && product.stock > 0 ? product.stock : 99;

  const handleWishlist = async () => {
    if (!user) {
      router.push('/login');
      return;
    }
    if (wishlistBusy) return;
    setWishlistBusy(true);
    try {
      await toggleWishlist(product.id);
    } catch {
      // Keep the last server-confirmed state if the request fails.
    } finally {
      setWishlistBusy(false);
    }
  };

  const addToCart = (buyNow = false) => {
    addItem({
      itemType: 'PRODUCT',
      productId: product.id,
      productName: product.name,
      productImage: imageUrl,
      price: displayPrice,
      quantity,
    });
    setAdded(true);
    if (buyNow) {
      router.push('/checkout' as never);
    } else {
      setTimeout(() => setAdded(false), 1500);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg.primary }}>
      {/* Header — back, share, wishlist */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: Colors.slate[200],
      }}>
        <Pressable onPress={() => router.back()} style={{ padding: 4 }}>
          <ArrowLeft size={22} color={Colors.slate[900]} />
        </Pressable>
        <View style={{ flex: 1 }} />
        <Pressable style={{ padding: 8, marginRight: 4 }}>
          <Share2 size={20} color={Colors.slate[900]} />
        </Pressable>
        <Pressable onPress={handleWishlist} style={{ padding: 8 }} disabled={wishlistBusy}>
          <Heart size={20} color={wished ? Colors.danger : Colors.slate[900]} fill={wished ? Colors.danger : 'none'} />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Image — bg-slate-50 */}
        <View style={{
          backgroundColor: Colors.slate[50],
          height: 320,
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}>
          {imageUrl ? (
            <Image
              source={{ uri: imageUrl }}
              style={{ width: '100%', height: '100%', resizeMode: 'contain' }}
            />
          ) : (
            <Text style={{ fontSize: 80 }}>📦</Text>
          )}
          {hasDiscount && (
            <View style={{
              position: 'absolute',
              top: 16,
              left: 16,
              backgroundColor: Colors.badge.discount,
              borderRadius: Radius.base,
              paddingHorizontal: 10,
              paddingVertical: 4,
            }}>
              <Text style={{ color: Colors.text.inverse, fontSize: 12, fontWeight: Typography.bold }}>
                -{discountPct}% OFF
              </Text>
            </View>
          )}
        </View>

        <View style={{ padding: 20 }}>
          {/* Category — epf-500, uppercase */}
          {product.category?.name && (
            <Text style={{ color: Colors.epf[500], fontSize: 13, fontWeight: Typography.semibold, marginBottom: 6, textTransform: 'uppercase' }}>
              {product.category.name}
            </Text>
          )}

          {/* Name — slate-900, bold */}
          <Text style={{ fontSize: 22, fontWeight: Typography.bold, color: Colors.slate[900], lineHeight: 30 }}>
            {product.name}
          </Text>

          {/* Rating — amber-400 stars */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
            <View style={{ flexDirection: 'row' }}>
              {[1, 2, 3, 4, 5].map((i) => (
                <Star
                  key={i}
                  size={16}
                  color={i <= Math.round(product.rating || 0) ? Colors.badge.rating : Colors.slate[200]}
                  fill={i <= Math.round(product.rating || 0) ? Colors.badge.rating : Colors.slate[200]}
                />
              ))}
            </View>
            <Text style={{ color: Colors.slate[500], fontSize: 13, marginLeft: 8 }}>
              {product.rating ? product.rating.toFixed(1) : '0.0'} ({product.reviewCount || 0} reviews)
            </Text>
          </View>

          {/* Price — slate-900 bold + strikethrough */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 16 }}>
            <Text style={{ fontSize: 28, fontWeight: Typography.bold, color: Colors.slate[900] }}>
              ৳{Number(product.salePrice ?? product.price).toLocaleString()}
            </Text>
            {hasDiscount && (
              <Text style={{
                color: Colors.slate[400],
                fontSize: 16,
                textDecorationLine: 'line-through',
                marginLeft: 12,
              }}>
                ৳{Number(product.price).toLocaleString()}
              </Text>
            )}
          </View>

          {/* Description */}
          {product.shortDesc || product.description ? (
            <View style={{ marginTop: 20 }}>
              <Text style={{ fontSize: 16, fontWeight: Typography.bold, color: Colors.slate[900], marginBottom: 8 }}>
                Description
              </Text>
              <Text style={{ color: Colors.slate[700], fontSize: 14, lineHeight: 22 }}>
                {product.shortDesc || product.description}
              </Text>
            </View>
          ) : null}

          {/* Quantity */}
          <View style={{ marginTop: 20 }}>
            <Text style={{ fontSize: 14, fontWeight: Typography.semibold, color: Colors.slate[800], marginBottom: 10 }}>
              Quantity
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Pressable
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: Radius.base,
                  backgroundColor: Colors.slate[100],
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                onPress={() => setQuantity(Math.max(1, quantity - 1))}
              >
                <Minus size={18} color={Colors.slate[900]} />
              </Pressable>
              <Text style={{ marginHorizontal: 20, fontSize: 18, fontWeight: Typography.bold, color: Colors.slate[900] }}>
                {quantity}
              </Text>
              <Pressable
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: Radius.base,
                  backgroundColor: Colors.slate[100],
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                onPress={() => setQuantity(Math.min(maxStock, quantity + 1))}
              >
                <Plus size={18} color={Colors.slate[900]} />
              </Pressable>
            </View>
          </View>

          {/* Trust badges — matches website TrustBar */}
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginTop: 24,
            paddingVertical: 16,
            borderTopWidth: 1,
            borderBottomWidth: 1,
            borderColor: Colors.slate[200],
          }}>
            <View style={{ alignItems: 'center', flex: 1 }}>
              <Truck size={20} color={Colors.epf[500]} />
              <Text style={{ fontSize: 11, color: Colors.slate[500], marginTop: 4 }}>Free Delivery</Text>
            </View>
            <View style={{ alignItems: 'center', flex: 1 }}>
              <Shield size={20} color={Colors.epf[500]} />
              <Text style={{ fontSize: 11, color: Colors.slate[500], marginTop: 4 }}>Secure Pay</Text>
            </View>
            <View style={{ alignItems: 'center', flex: 1 }}>
              <RotateCcw size={20} color={Colors.epf[500]} />
              <Text style={{ fontSize: 11, color: Colors.slate[500], marginTop: 4 }}>7-Day Return</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Action Bar */}
      <View style={{
        backgroundColor: Colors.bg.primary,
        borderTopWidth: 1,
        borderTopColor: Colors.slate[200],
        padding: 16,
        flexDirection: 'row',
      }}>
        <Pressable
          style={{
            flex: 1,
            backgroundColor: Colors.epf[500],
            borderRadius: Radius.base,
            paddingVertical: 14,
            alignItems: 'center',
            marginRight: 8,
            flexDirection: 'row',
            justifyContent: 'center',
          }}
          onPress={() => addToCart(false)}
        >
          <ShoppingCart size={18} color={Colors.text.inverse} style={{ marginRight: 6 }} />
          <Text style={{ color: Colors.text.inverse, fontWeight: Typography.bold }}>
            {added ? 'Added to Cart' : 'Add to Cart'}
          </Text>
        </Pressable>
        <Pressable
          style={{
            flex: 1,
            backgroundColor: Colors.slate[900],
            borderRadius: Radius.base,
            paddingVertical: 14,
            alignItems: 'center',
            marginLeft: 8,
          }}
          onPress={() => addToCart(true)}
        >
          <Text style={{ color: Colors.text.inverse, fontWeight: Typography.bold }}>Buy Now</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
