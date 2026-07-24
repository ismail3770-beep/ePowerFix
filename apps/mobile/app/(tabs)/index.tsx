// ═══════════════════════════════════════════════════════════════════════════
// Home Screen — Amazon/Flipkart Style (Clean, Professional)
// White bg, prominent search, category grid, product cards, deals
// ═══════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, Pressable, RefreshControl, Dimensions, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Search, ShoppingCart, Bell, ChevronRight, MapPin,
  Zap, Star, Flame, Truck, Shield, Headphones,
} from 'lucide-react-native';
import { productsApi, servicesApi } from '@epowerfix/api-client';
import { useCartStore } from '@epowerfix/store';
import { Colors } from '../../src/theme/design-system';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - 32) / 2;

// ─── Categories (Amazon-style grid) ────────────────────────────────────────
const CATEGORIES = [
  { name: 'Cables', icon: '🔌', color: '#DBEAFE' },
  { name: 'Breakers', icon: '⚡', color: '#FEF3C7' },
  { name: 'Switches', icon: '🔘', color: '#D1FAE5' },
  { name: 'Lighting', icon: '💡', color: '#FEF9C3' },
  { name: 'Solar', icon: '☀️', color: '#FFEDD5' },
  { name: 'Safety', icon: '🛡️', color: '#FEE2E2' },
  { name: 'Tools', icon: '🔧', color: '#F3E8FF' },
  { name: 'Fans', icon: '🌀', color: '#CFFAFE' },
];

// ─── Promo Banners ─────────────────────────────────────────────────────────
const BANNERS = [
  { id: 1, title: 'Mega Sale', subtitle: 'Up to 50% OFF', bg: '#0EA5E9', textColor: '#fff' },
  { id: 2, title: 'Free Delivery', subtitle: 'Orders ৳500+', bg: '#F59E0B', textColor: '#0F172A' },
  { id: 3, title: 'New Arrivals', subtitle: 'Latest Products', bg: '#10B981', textColor: '#fff' },
];

export default function HomeScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const cartItems = useCartStore((state) => state.items);
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const [products, setProducts] = useState<any[]>([]);
  const [deals, setDeals] = useState<any[]>([]);

  const loadAll = async () => {
    try {
      const [productsRes, dealsRes] = await Promise.allSettled([
        productsApi.list({ limit: 12 }),
        productsApi.list({ limit: 8 }),
      ]);
      if (productsRes.status === 'fulfilled') setProducts(productsRes.value.data?.data || []);
      if (dealsRes.status === 'fulfilled') setDeals(dealsRes.value.data?.data || []);
    } catch { /* silent */ }
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { void loadAll(); }, []);

  const formatPrice = (price: number) => `৳${Number(price).toLocaleString()}`;
  const getDiscount = (p: any) => {
    const compare = p.comparePrice ?? p.price;
    const current = p.salePrice ?? p.price;
    if (compare > current) return Math.round(((compare - current) / compare) * 100);
    return 0;
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void loadAll(); }} tintColor="#0EA5E9" />}
      >
        {/* ═══ HEADER — Amazon style (white, search prominent) ══════════ */}
        <View style={{ backgroundColor: '#fff', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' }}>
          {/* Top row: Logo + Icons */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={{ fontSize: 24, fontWeight: '800', color: '#0F172A' }}>
                e<Text style={{ color: '#0EA5E9' }}>Power</Text>Fix
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
              <Pressable onPress={() => router.push('/notifications' as never)}>
                <Bell size={24} color="#475569" />
              </Pressable>
              <Pressable onPress={() => router.push('/(tabs)/cart')} style={{ position: 'relative' }}>
                <ShoppingCart size={24} color="#475569" />
                {cartCount > 0 && (
                  <View style={{ position: 'absolute', top: -6, right: -8, minWidth: 18, height: 18, borderRadius: 9, backgroundColor: '#0EA5E9', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 }}>
                    <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>{cartCount}</Text>
                  </View>
                )}
              </Pressable>
            </View>
          </View>
          {/* Search bar — Amazon style (rounded, gray bg) */}
          <Pressable onPress={() => router.push('/(tabs)/shop')} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F5F9', borderRadius: 24, paddingHorizontal: 16, height: 44 }}>
            <Search size={20} color="#64748B" />
            <Text style={{ color: '#94A3B8', fontSize: 15, marginLeft: 10, flex: 1 }}>Search products, brands...</Text>
          </Pressable>
        </View>

        {/* ═══ PROMO BANNERS — Horizontal scroll ════════════════════════ */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 16, gap: 12 }}>
          {BANNERS.map((banner) => (
            <Pressable key={banner.id} onPress={() => router.push('/deals' as never)} style={{ width: SCREEN_WIDTH - 64, backgroundColor: banner.bg, borderRadius: 16, padding: 20, justifyContent: 'center' }}>
              <Text style={{ color: banner.textColor, fontSize: 22, fontWeight: '800', marginBottom: 4 }}>{banner.title}</Text>
              <Text style={{ color: banner.textColor, fontSize: 14, opacity: 0.9 }}>{banner.subtitle}</Text>
              <View style={{ position: 'absolute', right: 16, top: 16, bottom: 16, width: 60, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)' }} />
            </Pressable>
          ))}
        </ScrollView>

        {/* ═══ CATEGORIES — Amazon style (2 rows, 4 cols) ═══════════════ */}
        <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
            {CATEGORIES.map((cat) => (
              <Pressable key={cat.name} onPress={() => router.push('/(tabs)/shop')} style={{ width: '22%', alignItems: 'center' }}>
                <View style={{ width: 56, height: 56, borderRadius: 16, backgroundColor: cat.color, alignItems: 'center', justifyContent: 'center', marginBottom: 6 }}>
                  <Text style={{ fontSize: 26 }}>{cat.icon}</Text>
                </View>
                <Text style={{ fontSize: 12, fontWeight: '500', color: '#475569', textAlign: 'center' }}>{cat.name}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* ═══ DEALS SECTION — Amazon style (horizontal cards) ══════════ */}
        <View style={{ backgroundColor: '#F8FAFC', paddingVertical: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Flame size={20} color="#EF4444" />
              <Text style={{ fontSize: 18, fontWeight: '700', color: '#0F172A' }}>Today's Deals</Text>
            </View>
            <Pressable onPress={() => router.push('/deals' as never)} style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ color: '#0EA5E9', fontSize: 14, fontWeight: '600' }}>See All</Text>
              <ChevronRight size={16} color="#0EA5E9" />
            </Pressable>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <View key={i} style={{ width: 140, height: 200, backgroundColor: '#E2E8F0', borderRadius: 12 }} />
              ))
            ) : (
              deals.slice(0, 8).map((p) => {
                const discount = getDiscount(p);
                return (
                  <Pressable key={p.id} onPress={() => router.push(`/product/${p.id}`)} style={{ width: 140, backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#E2E8F0' }}>
                    <View style={{ height: 120, backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center' }}>
                      {p.images?.[0] ? (
                        <Image source={{ uri: p.images[0] }} style={{ width: '100%', height: '100%', resizeMode: 'contain' }} />
                      ) : (
                        <Zap size={40} color="#CBD5E1" />
                      )}
                      {discount > 0 && (
                        <View style={{ position: 'absolute', top: 8, left: 8, backgroundColor: '#EF4444', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 }}>
                          <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>-{discount}%</Text>
                        </View>
                      )}
                    </View>
                    <View style={{ padding: 10 }}>
                      <Text style={{ fontSize: 13, fontWeight: '500', color: '#0F172A', marginBottom: 4 }} numberOfLines={2}>{p.name}</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                        <Star size={12} color="#F59E0B" fill="#F59E0B" />
                        <Text style={{ fontSize: 12, color: '#64748B' }}>{p.rating?.toFixed(1) || '4.5'}</Text>
                      </View>
                      <Text style={{ fontSize: 15, fontWeight: '700', color: '#0F172A' }}>{formatPrice(p.salePrice ?? p.price)}</Text>
                    </View>
                  </Pressable>
                );
              })
            )}
          </ScrollView>
        </View>

        {/* ═══ TRUST BADGES — Amazon style (horizontal) ═════════════════ */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F1F5F9' }}>
          {[
            { icon: Truck, label: 'Free Delivery' },
            { icon: Shield, label: 'Secure Payment' },
            { icon: Headphones, label: '24/7 Support' },
          ].map((item, i) => {
            const Icon = item.icon;
            return (
              <View key={i} style={{ alignItems: 'center', gap: 6 }}>
                <Icon size={24} color="#0EA5E9" />
                <Text style={{ fontSize: 11, color: '#64748B', fontWeight: '500' }}>{item.label}</Text>
              </View>
            );
          })}
        </View>

        {/* ═══ PRODUCTS GRID — Amazon style (2 columns) ═════════════════ */}
        <View style={{ padding: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: '#0F172A' }}>Recommended for You</Text>
            <Pressable onPress={() => router.push('/(tabs)/shop')} style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ color: '#0EA5E9', fontSize: 14, fontWeight: '600' }}>See All</Text>
              <ChevronRight size={16} color="#0EA5E9" />
            </Pressable>
          </View>
          {loading ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
              {Array.from({ length: 4 }).map((_, i) => (
                <View key={i} style={{ width: CARD_WIDTH, height: 240, backgroundColor: '#F1F5F9', borderRadius: 12 }} />
              ))}
            </View>
          ) : (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
              {products.slice(0, 10).map((p) => {
                const discount = getDiscount(p);
                return (
                  <Pressable key={p.id} onPress={() => router.push(`/product/${p.id}`)} style={{ width: CARD_WIDTH, backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#E2E8F0' }}>
                    <View style={{ height: CARD_WIDTH - 20, backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center' }}>
                      {p.images?.[0] ? (
                        <Image source={{ uri: p.images[0] }} style={{ width: '100%', height: '100%', resizeMode: 'contain' }} />
                      ) : (
                        <Zap size={48} color="#CBD5E1" />
                      )}
                      {discount > 0 && (
                        <View style={{ position: 'absolute', top: 8, left: 8, backgroundColor: '#EF4444', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 }}>
                          <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>-{discount}%</Text>
                        </View>
                      )}
                    </View>
                    <View style={{ padding: 12 }}>
                      {p.category?.name && (
                        <Text style={{ fontSize: 11, color: '#0EA5E9', fontWeight: '600', textTransform: 'uppercase', marginBottom: 4 }}>{p.category.name}</Text>
                      )}
                      <Text style={{ fontSize: 14, fontWeight: '500', color: '#0F172A', marginBottom: 6, lineHeight: 18 }} numberOfLines={2}>{p.name}</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 6 }}>
                        <View style={{ flexDirection: 'row' }}>
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star key={s} size={12} color={s <= Math.round(p.rating || 0) ? '#F59E0B' : '#E2E8F0'} fill={s <= Math.round(p.rating || 0) ? '#F59E0B' : '#E2E8F0'} />
                          ))}
                        </View>
                        <Text style={{ fontSize: 11, color: '#94A3B8' }}>({p.reviewCount || 0})</Text>
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={{ fontSize: 16, fontWeight: '700', color: '#0F172A' }}>{formatPrice(p.salePrice ?? p.price)}</Text>
                        {discount > 0 && (
                          <Text style={{ fontSize: 13, color: '#94A3B8', textDecorationLine: 'line-through' }}>{formatPrice(p.comparePrice ?? p.price)}</Text>
                        )}
                      </View>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>

        {/* ═══ SERVICES CTA — Clean banner ══════════════════════════════ */}
        <View style={{ padding: 16, paddingBottom: 24 }}>
          <Pressable onPress={() => router.push('/(tabs)/services')} style={{ backgroundColor: '#0F172A', borderRadius: 16, padding: 20, flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 4 }}>Need an Electrician?</Text>
              <Text style={{ color: '#94A3B8', fontSize: 14 }}>Book verified experts now</Text>
            </View>
            <View style={{ backgroundColor: '#0EA5E9', borderRadius: 12, paddingHorizontal: 20, paddingVertical: 12 }}>
              <Text style={{ color: '#fff', fontWeight: '700' }}>Book Now</Text>
            </View>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
