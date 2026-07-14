// Product detail screen — matches website ProductDetailDialog.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
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
import { Colors, Typography, Radius } from '../theme/design-system';

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [wished, setWished] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const apiUrl = process.env.EXPO_PUBLIC_API_BASE_URL || '';
        const res = await fetch(`${apiUrl}/api/products/${id}`);
        const json = await res.json();
        setProduct(json?.data?.product);
      } catch (e: any) {
        setError(e?.message || 'Failed to load');
      } finally {
        setLoading(false);
      }
    };
    if (id) load();
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

  const hasDiscount = product.salePrice && product.salePrice < product.price;
  const discountPct = hasDiscount
    ? Math.round(((product.price - product.salePrice) / product.price) * 100)
    : 0;

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
        <Pressable onPress={() => setWished(!wished)} style={{ padding: 8 }}>
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
          <Text style={{ fontSize: 80 }}>📦</Text>
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
                onPress={() => setQuantity(quantity + 1)}
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
          onPress={() => router.push('/(tabs)/cart')}
        >
          <ShoppingCart size={18} color={Colors.text.inverse} style={{ marginRight: 6 }} />
          <Text style={{ color: Colors.text.inverse, fontWeight: Typography.bold }}>Add to Cart</Text>
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
        >
          <Text style={{ color: Colors.text.inverse, fontWeight: Typography.bold }}>Buy Now</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
