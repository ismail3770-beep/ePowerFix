// Home screen — matches website design (epf sky blue theme)
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
import {
  Truck,
  RotateCcw,
  Shield,
  Headphones,
  BadgeCheck,
  ArrowRight,
  Zap,
} from 'lucide-react-native';

export default function HomeScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [error, setError] = useState('');

  const loadProducts = async () => {
    try {
      setError('');
      const apiUrl = process.env.EXPO_PUBLIC_API_BASE_URL || '';
      if (!apiUrl) {
        setError('EXPO_PUBLIC_API_BASE_URL not set');
        return;
      }
      const res = await fetch(`${apiUrl}/api/products?limit=10`);
      const json = await res.json();
      setProducts(json?.data?.data || []);
    } catch (e: any) {
      setError(e?.message || 'Failed to load');
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

  const categories = [
    { name: 'Wiring', icon: '🔌', color: '#0EA5E9' },
    { name: 'Lights', icon: '💡', color: '#F59E0B' },
    { name: 'Switches', icon: '⚡', color: '#4D7300' },
    { name: 'Tools', icon: '🔧', color: '#8B5CF6' },
    { name: 'Fans', icon: '🌀', color: '#EC4899' },
    { name: 'Projects', icon: '📚', color: '#06B6D4' },
  ];

  const trustFeatures = [
    { icon: Truck, label: 'Free Delivery', desc: 'Orders over ৳5,000' },
    { icon: RotateCcw, label: 'Easy Returns', desc: '7-day return' },
    { icon: Shield, label: 'Secure Payment', desc: '100% secure' },
    { icon: Headphones, label: '24/7 Support', desc: 'Expert help' },
    { icon: BadgeCheck, label: 'Authentic', desc: 'Official warranty' },
  ];

  const renderProduct = (product: any) => {
    const hasDiscount = product.salePrice && product.salePrice < product.price;
    const discountPct = hasDiscount
      ? Math.round(((product.price - product.salePrice) / product.price) * 100)
      : 0;

    return (
      <Pressable
        key={product.id}
        style={{
          width: 160,
          backgroundColor: '#FFFFFF',
          borderRadius: 12,
          marginRight: 12,
          borderWidth: 1,
          borderColor: '#E2E8F0',
          overflow: 'hidden',
        }}
        onPress={() => router.push(`/product/${product.id}`)}
      >
        {/* Image placeholder */}
        <View style={{
          backgroundColor: '#F8FAFC',
          height: 140,
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}>
          <Text style={{ fontSize: 40 }}>📦</Text>
          {hasDiscount && (
            <View style={{
              position: 'absolute',
              top: 8,
              left: 8,
              backgroundColor: '#DC2626',
              borderRadius: 4,
              paddingHorizontal: 6,
              paddingVertical: 2,
            }}>
              <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: '700' }}>
                -{discountPct}%
              </Text>
            </View>
          )}
        </View>

        {/* Content */}
        <View style={{ padding: 10 }}>
          <Text
            style={{ fontSize: 13, fontWeight: '600', color: '#0F172A' }}
            numberOfLines={2}
          >
            {product.name}
          </Text>

          {/* Rating */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
            <Text style={{ color: '#F59E0B', fontSize: 11 }}>★</Text>
            <Text style={{ color: '#64748B', fontSize: 11, marginLeft: 2 }}>
              {product.rating ? product.rating.toFixed(1) : '0.0'}
            </Text>
          </View>

          {/* Price */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
            <Text style={{ fontSize: 15, fontWeight: '700', color: '#0EA5E9' }}>
              ৳{product.salePrice ?? product.price}
            </Text>
            {hasDiscount && (
              <Text style={{
                color: '#94A3B8',
                fontSize: 11,
                textDecorationLine: 'line-through',
                marginLeft: 6,
              }}>
                ৳{product.price}
              </Text>
            )}
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F1F5F9' }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* ─── Header ─── */}
        <View style={{
          backgroundColor: '#FFFFFF',
          paddingHorizontal: 16,
          paddingVertical: 14,
          borderBottomWidth: 1,
          borderBottomColor: '#E2E8F0',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              backgroundColor: '#0EA5E9',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Zap size={20} color="#FFFFFF" />
            </View>
            <View style={{ marginLeft: 10 }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: '#0F172A' }}>
                ePowerFix
              </Text>
              <Text style={{ fontSize: 10, color: '#64748B' }}>
                Electrical & Services
              </Text>
            </View>
          </View>
          <Pressable onPress={() => router.push('/login')}>
            <Text style={{ color: '#0EA5E9', fontSize: 13, fontWeight: '600' }}>
              Login
            </Text>
          </Pressable>
        </View>

        {/* ─── Hero Banner ─── */}
        <View style={{
          backgroundColor: '#0C4A6E', // epf-900
          padding: 24,
          paddingTop: 30,
        }}>
          <Text style={{ fontSize: 24, fontWeight: '800', color: '#FFFFFF', lineHeight: 32 }}>
            Quality Electrical{'\n'}Products & Services
          </Text>
          <Text style={{ color: '#BAE6FD', fontSize: 14, marginTop: 8, lineHeight: 20 }}>
            Trusted electrical solutions for home, office & projects in Bangladesh
          </Text>
          <Pressable
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: '#0EA5E9',
              borderRadius: 8,
              paddingHorizontal: 18,
              paddingVertical: 11,
              alignSelf: 'flex-start',
              marginTop: 16,
            }}
            onPress={() => router.push('/shop')}
          >
            <Text style={{ color: '#FFFFFF', fontWeight: '600', fontSize: 14, marginRight: 6 }}>
              Shop Now
            </Text>
            <ArrowRight size={16} color="#FFFFFF" />
          </Pressable>
        </View>

        {/* ─── Trust Bar ─── */}
        <View style={{
          backgroundColor: '#FFFFFF',
          paddingVertical: 16,
          borderBottomWidth: 1,
          borderBottomColor: '#E2E8F0',
        }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 12 }}>
            {trustFeatures.map((feat, idx) => {
              const Icon = feat.icon;
              return (
                <View key={idx} style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 10,
                  marginRight: 8,
                }}>
                  <View style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    backgroundColor: '#F0F9FF',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 8,
                  }}>
                    <Icon size={18} color="#0EA5E9" strokeWidth={1.75} />
                  </View>
                  <View>
                    <Text style={{ fontSize: 11, fontWeight: '600', color: '#1E293B' }}>
                      {feat.label}
                    </Text>
                    <Text style={{ fontSize: 10, color: '#64748B', marginTop: 1 }}>
                      {feat.desc}
                    </Text>
                  </View>
                </View>
              );
            })}
          </ScrollView>
        </View>

        {/* ─── Categories ─── */}
        <View style={{ padding: 16 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: '#0F172A' }}>
              Shop by Category
            </Text>
            <Pressable onPress={() => router.push('/shop')}>
              <Text style={{ color: '#0EA5E9', fontSize: 12, fontWeight: '600' }}>See all</Text>
            </Pressable>
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
            {categories.map((cat) => (
              <Pressable
                key={cat.name}
                style={{
                  width: '31%',
                  backgroundColor: '#FFFFFF',
                  borderRadius: 12,
                  padding: 14,
                  marginBottom: 10,
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: '#E2E8F0',
                }}
                onPress={() => router.push('/shop')}
              >
                <View style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: cat.color + '15',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 8,
                }}>
                  <Text style={{ fontSize: 22 }}>{cat.icon}</Text>
                </View>
                <Text style={{ fontSize: 12, fontWeight: '600', color: '#1E293B' }}>
                  {cat.name}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* ─── Featured Products ─── */}
        <View style={{ paddingBottom: 20 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginBottom: 12 }}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: '#0F172A' }}>
              Featured Products
            </Text>
            <Pressable onPress={() => router.push('/shop')}>
              <Text style={{ color: '#0EA5E9', fontSize: 12, fontWeight: '600' }}>See all</Text>
            </Pressable>
          </View>

          {error ? (
            <View style={{ paddingHorizontal: 16, alignItems: 'center' }}>
              <Text style={{ color: '#DC2626', marginBottom: 8 }}>⚠️ {error}</Text>
              <Pressable
                style={{ backgroundColor: '#0EA5E9', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 8 }}
                onPress={loadProducts}
              >
                <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>Retry</Text>
              </Pressable>
            </View>
          ) : loading ? (
            <View style={{ paddingVertical: 40, alignItems: 'center' }}>
              <ActivityIndicator size="large" color="#0EA5E9" />
            </View>
          ) : products.length === 0 ? (
            <View style={{ paddingHorizontal: 16, paddingVertical: 40, alignItems: 'center' }}>
              <Text style={{ color: '#64748B' }}>No products available</Text>
            </View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
              {products.map(renderProduct)}
            </ScrollView>
          )}
        </View>

        {/* ─── Services CTA ─── */}
        <View style={{ paddingHorizontal: 16, paddingBottom: 24 }}>
          <Pressable
            style={{
              backgroundColor: '#0F172A',
              borderRadius: 12,
              padding: 20,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
            onPress={() => router.push('/(tabs)/services')}
          >
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: '#FFFFFF' }}>
                Need Electrical Services?
              </Text>
              <Text style={{ color: '#94A3B8', fontSize: 13, marginTop: 4 }}>
                Book professional electricians
              </Text>
            </View>
            <View style={{
              backgroundColor: '#0EA5E9',
              borderRadius: 8,
              paddingHorizontal: 14,
              paddingVertical: 8,
              flexDirection: 'row',
              alignItems: 'center',
            }}>
              <Text style={{ color: '#FFFFFF', fontWeight: '600', fontSize: 13, marginRight: 4 }}>
                Book
              </Text>
              <ArrowRight size={14} color="#FFFFFF" />
            </View>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
