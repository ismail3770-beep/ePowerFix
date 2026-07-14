// Product detail screen — matches website design
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
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#0EA5E9" />
      </SafeAreaView>
    );
  }

  if (error || !product) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: '#64748B', fontSize: 16 }}>{error || 'Product not found'}</Text>
      </SafeAreaView>
    );
  }

  const hasDiscount = product.salePrice && product.salePrice < product.price;
  const discountPct = hasDiscount
    ? Math.round(((product.price - product.salePrice) / product.price) * 100)
    : 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      {/* Header */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
      }}>
        <Pressable onPress={() => router.back()} style={{ padding: 4 }}>
          <ArrowLeft size={22} color="#0F172A" />
        </Pressable>
        <View style={{ flex: 1 }} />
        <Pressable style={{ padding: 8, marginRight: 4 }}>
          <Share2 size={20} color="#0F172A" />
        </Pressable>
        <Pressable onPress={() => setWished(!wished)} style={{ padding: 8 }}>
          <Heart size={20} color={wished ? '#DC2626' : '#0F172A'} fill={wished ? '#DC2626' : 'none'} />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Image */}
        <View style={{
          backgroundColor: '#F8FAFC',
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
              backgroundColor: '#DC2626',
              borderRadius: 6,
              paddingHorizontal: 10,
              paddingVertical: 4,
            }}>
              <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '700' }}>
                -{discountPct}% OFF
              </Text>
            </View>
          )}
        </View>

        {/* Content */}
        <View style={{ padding: 20 }}>
          {/* Category */}
          {product.category?.name && (
            <Text style={{ color: '#0EA5E9', fontSize: 13, fontWeight: '600', marginBottom: 6 }}>
              {product.category.name}
            </Text>
          )}

          {/* Name */}
          <Text style={{ fontSize: 22, fontWeight: '700', color: '#0F172A', lineHeight: 30 }}>
            {product.name}
          </Text>

          {/* Rating */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
            <View style={{ flexDirection: 'row' }}>
              {[1, 2, 3, 4, 5].map((i) => (
                <Star
                  key={i}
                  size={16}
                  color="#F59E0B"
                  fill={i <= Math.round(product.rating || 0) ? '#F59E0B' : 'none'}
                />
              ))}
            </View>
            <Text style={{ color: '#64748B', fontSize: 13, marginLeft: 8 }}>
              {product.rating ? product.rating.toFixed(1) : '0.0'} ({product.reviewCount || 0} reviews)
            </Text>
          </View>

          {/* Price */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 16 }}>
            <Text style={{ fontSize: 28, fontWeight: '800', color: '#0EA5E9' }}>
              ৳{product.salePrice ?? product.price}
            </Text>
            {hasDiscount && (
              <Text style={{
                color: '#94A3B8',
                fontSize: 16,
                textDecorationLine: 'line-through',
                marginLeft: 12,
              }}>
                ৳{product.price}
              </Text>
            )}
          </View>

          {/* Description */}
          {product.shortDesc || product.description ? (
            <View style={{ marginTop: 20 }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: '#0F172A', marginBottom: 8 }}>
                Description
              </Text>
              <Text style={{ color: '#475569', fontSize: 14, lineHeight: 22 }}>
                {product.shortDesc || product.description}
              </Text>
            </View>
          ) : null}

          {/* Quantity */}
          <View style={{ marginTop: 20 }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#1E293B', marginBottom: 10 }}>
              Quantity
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Pressable
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 8,
                  backgroundColor: '#F1F5F9',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                onPress={() => setQuantity(Math.max(1, quantity - 1))}
              >
                <Minus size={18} color="#0F172A" />
              </Pressable>
              <Text style={{ marginHorizontal: 20, fontSize: 18, fontWeight: '700', color: '#0F172A' }}>
                {quantity}
              </Text>
              <Pressable
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 8,
                  backgroundColor: '#F1F5F9',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                onPress={() => setQuantity(quantity + 1)}
              >
                <Plus size={18} color="#0F172A" />
              </Pressable>
            </View>
          </View>

          {/* Trust badges */}
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginTop: 24,
            paddingVertical: 16,
            borderTopWidth: 1,
            borderBottomWidth: 1,
            borderColor: '#E2E8F0',
          }}>
            <View style={{ alignItems: 'center', flex: 1 }}>
              <Truck size={20} color="#0EA5E9" />
              <Text style={{ fontSize: 11, color: '#64748B', marginTop: 4 }}>Free Delivery</Text>
            </View>
            <View style={{ alignItems: 'center', flex: 1 }}>
              <Shield size={20} color="#0EA5E9" />
              <Text style={{ fontSize: 11, color: '#64748B', marginTop: 4 }}>Secure Pay</Text>
            </View>
            <View style={{ alignItems: 'center', flex: 1 }}>
              <RotateCcw size={20} color="#0EA5E9" />
              <Text style={{ fontSize: 11, color: '#64748B', marginTop: 4 }}>7-Day Return</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Action Bar */}
      <View style={{
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
        padding: 16,
        flexDirection: 'row',
      }}>
        <Pressable
          style={{
            flex: 1,
            backgroundColor: '#0EA5E9',
            borderRadius: 8,
            paddingVertical: 14,
            alignItems: 'center',
            marginRight: 8,
            flexDirection: 'row',
            justifyContent: 'center',
          }}
          onPress={() => router.push('/(tabs)/cart')}
        >
          <ShoppingCart size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
          <Text style={{ color: '#FFFFFF', fontWeight: '700' }}>Add to Cart</Text>
        </Pressable>
        <Pressable
          style={{
            flex: 1,
            backgroundColor: '#0F172A',
            borderRadius: 8,
            paddingVertical: 14,
            alignItems: 'center',
            marginLeft: 8,
          }}
        >
          <Text style={{ color: '#FFFFFF', fontWeight: '700' }}>Buy Now</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
