// Home screen — matches website design exactly
// Web reference: apps/web/src/components/epf/Header.tsx, HeroBanner.tsx, TrustBar.tsx, CategoryGrid.tsx, ShopSection.tsx

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Search,
  ShoppingCart,
  Heart,
  User,
  ChevronDown,
  Zap,
  Truck,
  RotateCcw,
  Shield,
  Headphones,
  BadgeCheck,
  ArrowRight,
} from 'lucide-react-native';
import { PremiumCard, PremiumCardData } from '../../src/components/PremiumCard';

export default function HomeScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [search, setSearch] = useState('');

  const loadProducts = async () => {
    try {
      const apiUrl = process.env.EXPO_PUBLIC_API_BASE_URL || '';
      if (!apiUrl) return;
      const res = await fetch(`${apiUrl}/api/products?limit=10`);
      const json = await res.json();
      setProducts(json?.data?.data || []);
    } catch (e) {
      // silent fail
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadCategories = async () => {
    try {
      const apiUrl = process.env.EXPO_PUBLIC_API_BASE_URL || '';
      if (!apiUrl) return;
      const res = await fetch(`${apiUrl}/api/categories?counts=true`);
      const json = await res.json();
      setCategories(json?.categories || []);
    } catch (e) {
      // silent fail
    }
  };

  useEffect(() => {
    loadProducts();
    loadCategories();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadProducts();
  };

  // Website categories with icons (matching fallback list)
  const fallbackCategories = [
    { id: '1', name: 'Cables & Wires', slug: 'cables-wires', icon: '🔌' },
    { id: '2', name: 'Circuit Breakers', slug: 'circuit-breakers', icon: '🛡️' },
    { id: '3', name: 'LED & Lighting', slug: 'led-lighting', icon: '💡' },
    { id: '4', name: 'Switches & Sockets', slug: 'switches-sockets', icon: '⚡' },
    { id: '5', name: 'Testing Tools', slug: 'testing-tools', icon: '🔧' },
    { id: '6', name: 'Safety Equipment', slug: 'safety-equipment', icon: '👷' },
    { id: '7', name: 'Motors & Drives', slug: 'motors-drives', icon: '🔌' },
    { id: '8', name: 'Solar Equipment', slug: 'solar-equipment', icon: '☀️' },
  ];

  const displayCategories = categories.length > 0 ? categories : fallbackCategories;

  const trustFeatures = [
    { icon: Truck, label: 'Free Delivery', desc: 'Orders over ৳5,000' },
    { icon: RotateCcw, label: 'Easy Returns', desc: '7-day return policy' },
    { icon: Shield, label: 'Secure Payment', desc: '100% secure checkout' },
    { icon: Headphones, label: '24/7 Support', desc: 'Expert help anytime' },
    { icon: BadgeCheck, label: 'Authentic Products', desc: 'Official warranty' },
  ];

  const formatPrice = (price: number) => `৳${Number(price).toLocaleString()}`;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F1F5F9' }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* ═══ Header Row 1 — White (logo + search + actions) ═══ */}
        <View style={{ backgroundColor: '#FFFFFF' }}>
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 16,
            paddingVertical: 12,
            gap: 12,
          }}>
            {/* Logo */}
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
              <View style={{ marginLeft: 8 }}>
                <Text style={{ fontSize: 16, fontWeight: '800', color: '#0F172A' }}>
                  ePowerFix
                </Text>
                <Text style={{ fontSize: 9, color: '#64748B', letterSpacing: 1 }}>
                  ELECTRICAL & DIGITAL TECH
                </Text>
              </View>
            </View>

            {/* Search Bar */}
            <View style={{
              flex: 1,
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
                placeholder="Search products..."
                placeholderTextColor="#94A3B8"
                value={search}
                onChangeText={setSearch}
                style={{ flex: 1, paddingHorizontal: 8, paddingVertical: 8, fontSize: 14, color: '#0F172A' }}
                onSubmitEditing={() => router.push('/(tabs)/shop')}
              />
              <Pressable
                style={{
                  backgroundColor: '#0EA5E9',
                  paddingHorizontal: 14,
                  paddingVertical: 9,
                  alignSelf: 'stretch',
                  justifyContent: 'center',
                }}
                onPress={() => router.push('/(tabs)/shop')}
              >
                <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '600' }}>Search</Text>
              </Pressable>
            </View>

            {/* Actions */}
            <Pressable onPress={() => router.push('/login')}>
              <User size={22} color="#0F172A" />
            </Pressable>
            <Pressable>
              <Heart size={22} color="#0F172A" />
            </Pressable>
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

          {/* ═══ Header Row 2 — Dark (Navigation) ═══ */}
          <View style={{
            backgroundColor: '#0F172A',
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 16,
            paddingVertical: 12,
          }}>
            <Pressable style={{ flexDirection: 'row', alignItems: 'center', marginRight: 16 }}>
              <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '500' }}>Categories</Text>
              <ChevronDown size={16} color="#FFFFFF" style={{ marginLeft: 4 }} />
            </Pressable>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {['Home', 'Services', 'Shop', 'Projects', 'Project Kits', 'Blog'].map((item, idx) => (
                <Pressable key={idx} style={{ marginRight: 16 }}>
                  <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '500' }}>{item}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>

        {/* ═══ Hero Banner ═══ */}
        <View style={{
          backgroundColor: '#0C4A6E',
          padding: 24,
          paddingVertical: 32,
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
              borderRadius: 6,
              paddingHorizontal: 18,
              paddingVertical: 10,
              alignSelf: 'flex-start',
              marginTop: 16,
            }}
            onPress={() => router.push('/(tabs)/shop')}
          >
            <Text style={{ color: '#FFFFFF', fontWeight: '600', fontSize: 14, marginRight: 6 }}>
              Shop Now
            </Text>
            <ArrowRight size={16} color="#FFFFFF" />
          </Pressable>
        </View>

        {/* ═══ Trust Bar (horizontal scroll) ═══ */}
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
                  marginRight: 16,
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

        {/* ═══ Categories Grid ═══ */}
        <View style={{ padding: 16 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: '#0F172A' }}>
              Shop by Category
            </Text>
            <Pressable onPress={() => router.push('/(tabs)/shop')}>
              <Text style={{ color: '#0EA5E9', fontSize: 12, fontWeight: '600' }}>See all</Text>
            </Pressable>
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
            {displayCategories.slice(0, 8).map((cat) => (
              <Pressable
                key={cat.id}
                style={{
                  width: '23.5%',
                  backgroundColor: '#FFFFFF',
                  borderRadius: 8,
                  padding: 10,
                  marginBottom: 8,
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: '#E2E8F0',
                }}
                onPress={() => router.push('/(tabs)/shop')}
              >
                <View style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: '#F0F9FF',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 6,
                }}>
                  <Text style={{ fontSize: 20 }}>{cat.icon || '📦'}</Text>
                </View>
                <Text style={{ fontSize: 10, fontWeight: '600', color: '#1E293B', textAlign: 'center' }} numberOfLines={2}>
                  {cat.name}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* ═══ Featured Products ═══ */}
        <View style={{ paddingBottom: 20 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginBottom: 12 }}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: '#0F172A' }}>
              Featured Products
            </Text>
            <Pressable onPress={() => router.push('/(tabs)/shop')}>
              <Text style={{ color: '#0EA5E9', fontSize: 12, fontWeight: '600' }}>See all</Text>
            </Pressable>
          </View>

          {loading ? (
            <View style={{ paddingVertical: 40, alignItems: 'center' }}>
              <ActivityIndicator size="large" color="#0EA5E9" />
            </View>
          ) : products.length === 0 ? (
            <View style={{ paddingHorizontal: 16, paddingVertical: 40, alignItems: 'center' }}>
              <Text style={{ color: '#64748B' }}>No products available</Text>
            </View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 12 }}>
              {products.map((product) => {
                const cardData: PremiumCardData = {
                  id: product.id,
                  name: product.name,
                  price: product.price,
                  salePrice: product.salePrice,
                  comparePrice: product.salePrice,
                  images: product.images,
                  isFeatured: product.isFeatured,
                  stock: product.stock,
                  category: product.category?.name,
                  rating: product.rating,
                  reviewCount: product.reviewCount,
                };
                return (
                  <View key={product.id} style={{ width: 170 }}>
                    <PremiumCard data={cardData} />
                  </View>
                );
              })}
            </ScrollView>
          )}
        </View>

        {/* ═══ Services CTA ═══ */}
        <View style={{ paddingHorizontal: 16, paddingBottom: 24 }}>
          <Pressable
            style={{
              backgroundColor: '#0F172A',
              borderRadius: 8,
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
              borderRadius: 6,
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
