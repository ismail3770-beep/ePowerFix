// ═══════════════════════════════════════════════════════════════════════════
// Product Detail — Enhanced with gallery, related products, share, stock
// ═══════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Image,
  Share,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { productsApi } from '@epowerfix/api-client';
import { useCartStore } from '@epowerfix/store';
import { useAuthStore } from '../../src/store/auth';
import { useWishlistStore } from '../../src/store/wishlist';
import { QuantitySelector } from '../../src/components/ui/QuantitySelector';
import { PremiumCard, PremiumCardData } from '../../src/components/PremiumCard';
import { ErrorState } from '../../src/components/ui/ErrorState';
import {
  Star, ShoppingCart, Heart, Share2, ArrowLeft,
  Truck, Shield, RotateCcw, Package, CheckCircle2,
} from 'lucide-react-native';
import { Colors, Typography, Radius } from '../../src/theme/design-system';

const { width: SCREEN_W } = Dimensions.get('window');

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const addItem = useCartStore((state) => state.addItem);
  const user = useAuthStore((state) => state.user);
  const wishlistItems = useWishlistStore((state) => state.items);
  const toggleWishlist = useWishlistStore((state) => state.toggle);
  const [product, setProduct] = useState<any>(null);
  const [related, setRelated] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [wishlistBusy, setWishlistBusy] = useState(false);
  const [added, setAdded] = useState(false);
  const [activeImage, setActiveImage] = useState(0);

  const wished = wishlistItems.some((item) => item.productId === id);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      if (!id) return;
      const response = await productsApi.getById(id);
      setProduct(response.data?.product);
      setRelated(response.data?.related || []);
    } catch (e: any) {
      setError(e?.message || 'Failed to load product');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, [id]);

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg.secondary, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={Colors.epf[500]} />
      </SafeAreaView>
    );
  }

  if (error || !product) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg.secondary }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderBottomColor: Colors.slate[200] }}>
          <Pressable onPress={() => router.back()} style={{ padding: 4 }}>
            <ArrowLeft size={22} color={Colors.slate[900]} />
          </Pressable>
        </View>
        <ErrorState message={error || 'Product not found'} onRetry={load} />
      </SafeAreaView>
    );
  }

  const hasDiscount = Number(product.salePrice) > 0 && Number(product.salePrice) < Number(product.price);
  const displayPrice = Number(product.salePrice ?? product.price);
  const discountPct = hasDiscount
    ? Math.round(((Number(product.price) - Number(product.salePrice)) / Number(product.price)) * 100)
    : 0;
  const productImages: string[] = Array.isArray(product.images)
    ? product.images
    : typeof product.images === 'string'
      ? (() => { try { const p = JSON.parse(product.images); return Array.isArray(p) ? p : [product.images]; } catch { return [product.images]; } })()
      : [];
  const images = product.coverImage ? [product.coverImage, ...productImages.filter((i: string) => i !== product.coverImage)] : productImages;
  const imageUrl = images[0] || '';
  const maxStock = typeof product.stock === 'number' && product.stock > 0 ? product.stock : 99;
  const inStock = typeof product.stock !== 'number' || product.stock > 0;
  const lowStock = typeof product.stock === 'number' && product.stock > 0 && product.stock <= 5;

  const handleShare = async () => {
    try {
      await Share.share({
        title: product.name,
        message: `${product.name} — ৳${displayPrice.toLocaleString()}\nCheck it out on ePowerFix!`,
      });
    } catch { /* user cancelled */ }
  };

  const handleWishlist = async () => {
    if (!user) { router.push('/login'); return; }
    if (wishlistBusy) return;
    setWishlistBusy(true);
    try { await toggleWishlist(product.id); } catch { /* silent */ }
    finally { setWishlistBusy(false); }
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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg.primary }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderBottomColor: Colors.slate[200] }}>
        <Pressable onPress={() => router.back()} style={{ padding: 4 }}>
          <ArrowLeft size={22} color={Colors.slate[900]} />
        </Pressable>
        <Text style={{ flex: 1, fontSize: 16, fontWeight: Typography.semibold, color: Colors.slate[900], marginLeft: 12 }} numberOfLines={1}>
          {product.name}
        </Text>
        <Pressable onPress={handleShare} style={{ padding: 8, marginRight: 4 }}>
          <Share2 size={20} color={Colors.slate[700]} />
        </Pressable>
        <Pressable onPress={handleWishlist} style={{ padding: 8 }} disabled={wishlistBusy}>
          <Heart size={20} color={wished ? Colors.danger : Colors.slate[700]} fill={wished ? Colors.danger : 'none'} />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Image Gallery */}
        <View style={{ backgroundColor: Colors.slate[50], position: 'relative' }}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => {
              const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_W);
              setActiveImage(idx);
            }}
          >
            {images.length > 0 ? images.map((img: string, idx: number) => (
              <View key={idx} style={{ width: SCREEN_W, height: 320, alignItems: 'center', justifyContent: 'center' }}>
                <Image source={{ uri: img }} style={{ width: '100%', height: '100%', resizeMode: 'contain' }} />
              </View>
            )) : (
              <View style={{ width: SCREEN_W, height: 320, alignItems: 'center', justifyContent: 'center' }}>
                <Package size={64} color={Colors.slate[300]} />
              </View>
            )}
          </ScrollView>
          {/* Image dots */}
          {images.length > 1 && (
            <View style={{ position: 'absolute', bottom: 12, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 6 }}>
              {images.map((_: string, idx: number) => (
                <View key={idx} style={{ width: idx === activeImage ? 18 : 7, height: 7, borderRadius: 4, backgroundColor: idx === activeImage ? Colors.epf[500] : Colors.slate[300] }} />
              ))}
            </View>
          )}
          {/* Discount badge */}
          {hasDiscount && (
            <View style={{ position: 'absolute', top: 16, left: 16, backgroundColor: Colors.badge.discount, borderRadius: Radius.base, paddingHorizontal: 10, paddingVertical: 4 }}>
              <Text style={{ color: '#fff', fontSize: 12, fontWeight: Typography.bold }}>-{discountPct}% OFF</Text>
            </View>
          )}
        </View>

        <View style={{ padding: 20 }}>
          {/* Breadcrumb */}
          {product.category?.name && (
            <Text style={{ color: Colors.epf[600], fontSize: 12, fontWeight: Typography.semibold, marginBottom: 6, textTransform: 'uppercase' }}>
              {product.category.name}
            </Text>
          )}

          {/* Name */}
          <Text style={{ fontSize: 22, fontWeight: Typography.bold, color: Colors.slate[900], lineHeight: 30 }}>
            {product.name}
          </Text>

          {/* Rating */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
            <View style={{ flexDirection: 'row' }}>
              {[1, 2, 3, 4, 5].map((i) => (
                <Star key={i} size={15} color={i <= Math.round(product.rating || 0) ? Colors.badge.rating : Colors.slate[200]} fill={i <= Math.round(product.rating || 0) ? Colors.badge.rating : Colors.slate[200]} />
              ))}
            </View>
            <Text style={{ color: Colors.slate[500], fontSize: 13, marginLeft: 8 }}>
              {product.rating ? Number(product.rating).toFixed(1) : '0.0'} ({product.reviewCount || 0} reviews)
            </Text>
          </View>

          {/* Price */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 16 }}>
            <Text style={{ fontSize: 28, fontWeight: Typography.bold, color: Colors.slate[900] }}>
              ৳{displayPrice.toLocaleString()}
            </Text>
            {hasDiscount && (
              <Text style={{ color: Colors.slate[400], fontSize: 16, textDecorationLine: 'line-through', marginLeft: 12 }}>
                ৳{Number(product.price).toLocaleString()}
              </Text>
            )}
          </View>

          {/* Stock indicator */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 6 }}>
            {inStock ? (
              <>
                <CheckCircle2 size={15} color={lowStock ? Colors.warning : Colors.success} />
                <Text style={{ fontSize: 13, color: lowStock ? Colors.warning : Colors.success, fontWeight: Typography.medium }}>
                  {lowStock ? `Only ${product.stock} left in stock` : 'In Stock'}
                </Text>
              </>
            ) : (
              <Text style={{ fontSize: 13, color: Colors.danger, fontWeight: Typography.medium }}>Out of Stock</Text>
            )}
          </View>

          {/* Description */}
          {(product.shortDesc || product.description) ? (
            <View style={{ marginTop: 20 }}>
              <Text style={{ fontSize: 16, fontWeight: Typography.bold, color: Colors.slate[900], marginBottom: 8 }}>Description</Text>
              <Text style={{ color: Colors.slate[600], fontSize: 14, lineHeight: 22 }}>
                {product.shortDesc || product.description}
              </Text>
            </View>
          ) : null}

          {/* Specifications */}
          {product.specifications && Object.keys(product.specifications).length > 0 && (
            <View style={{ marginTop: 20 }}>
              <Text style={{ fontSize: 16, fontWeight: Typography.bold, color: Colors.slate[900], marginBottom: 10 }}>Specifications</Text>
              <View style={{ borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.slate[200], overflow: 'hidden' }}>
                {Object.entries(product.specifications).map(([key, val], idx) => (
                  <View key={key} style={{ flexDirection: 'row', paddingVertical: 10, paddingHorizontal: 14, backgroundColor: idx % 2 === 0 ? Colors.slate[50] : Colors.bg.primary }}>
                    <Text style={{ flex: 1, fontSize: 13, color: Colors.slate[500], textTransform: 'capitalize' }}>{key}</Text>
                    <Text style={{ flex: 1.5, fontSize: 13, color: Colors.slate[800], fontWeight: Typography.medium }}>{String(val)}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Quantity */}
          <View style={{ marginTop: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 14, fontWeight: Typography.semibold, color: Colors.slate[800] }}>Quantity</Text>
            <QuantitySelector value={quantity} onChange={setQuantity} min={1} max={maxStock} />
          </View>

          {/* Trust badges */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 24, paddingVertical: 16, borderTopWidth: 1, borderBottomWidth: 1, borderColor: Colors.slate[200] }}>
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

        {/* Related Products */}
        {related.length > 0 && (
          <View style={{ marginTop: 8, marginBottom: 16 }}>
            <Text style={{ fontSize: 18, fontWeight: Typography.bold, color: Colors.slate[900], paddingHorizontal: 16, marginBottom: 12 }}>
              Related Products
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 12, gap: 4 }}>
              {related.slice(0, 8).map((item: any) => (
                <View key={item.id} style={{ width: 170 }}>
                  <PremiumCard data={toCard(item)} />
                </View>
              ))}
            </ScrollView>
          </View>
        )}
      </ScrollView>

      {/* Bottom Action Bar */}
      <View style={{ backgroundColor: Colors.bg.primary, borderTopWidth: 1, borderTopColor: Colors.slate[200], padding: 16, flexDirection: 'row' }}>
        <Pressable
          style={{ flex: 1, backgroundColor: inStock ? Colors.epf[500] : Colors.slate[300], borderRadius: Radius.lg, paddingVertical: 14, alignItems: 'center', marginRight: 8, flexDirection: 'row', justifyContent: 'center' }}
          onPress={() => addToCart(false)}
          disabled={!inStock}
        >
          <ShoppingCart size={18} color="#fff" style={{ marginRight: 6 }} />
          <Text style={{ color: '#fff', fontWeight: Typography.bold, fontSize: 15 }}>
            {added ? 'Added ✓' : 'Add to Cart'}
          </Text>
        </Pressable>
        <Pressable
          style={{ flex: 1, backgroundColor: inStock ? Colors.slate[900] : Colors.slate[300], borderRadius: Radius.lg, paddingVertical: 14, alignItems: 'center', marginLeft: 8 }}
          onPress={() => addToCart(true)}
          disabled={!inStock}
        >
          <Text style={{ color: '#fff', fontWeight: Typography.bold, fontSize: 15 }}>Buy Now</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
