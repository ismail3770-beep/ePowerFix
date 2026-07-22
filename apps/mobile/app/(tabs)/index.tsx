// ═══════════════════════════════════════════════════════════════════════════
// Home Screen — EXACT match with website
// Web: Header + HeroBanner + TrustBar + CategoryGrid + FlashDeals +
//      ShopSection + BestDeals + ServicesSection + ServicesBanner +
//      BrandStrip + ProjectsSection + RecentlyViewed + Footer
// ═══════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, Pressable, ActivityIndicator,
  RefreshControl, TextInput, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Search, ShoppingCart, Heart, User, ChevronDown, Menu,
  Truck, RotateCcw, Shield, Headphones, BadgeCheck,
  ArrowRight, Zap, Cpu, Star, Tag,
} from 'lucide-react-native';
import { PremiumCard, PremiumCardData, PremiumCardSkeleton } from '../../src/components/PremiumCard';
import { Footer } from '../../src/components/Footer';
import { productsApi, servicesApi } from '@epowerfix/api-client';
import { useCartStore } from '@epowerfix/store';
import { useAuthStore } from '../../src/store/auth';
import { Colors, Typography, Radius, Layout } from '../../src/theme/design-system';

// ─── Countdown Timer (matches FlashDeals.tsx) ─────────────────────────────
function CountdownTimer() {
  const [time, setTime] = useState({ d: 2, h: 10, m: 28, s: 39 });
  useEffect(() => {
    const id = setInterval(() => {
      setTime((prev) => {
        let { d, h, m, s } = prev;
        s -= 1;
        if (s < 0) { s = 59; m -= 1; }
        if (m < 0) { m = 59; h -= 1; }
        if (h < 0) { h = 23; d = Math.max(0, d - 1); }
        return { d, h, m, s };
      });
    }, 1000);
    return () => clearInterval(id);
  }, []);
  const pad = (n: number) => String(n).padStart(2, '0');
  const cells = [pad(time.d), pad(time.h), pad(time.m), pad(time.s)];
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      {cells.map((v, i) => (
        <React.Fragment key={i}>
          <View style={{ backgroundColor: '#5B21B6', borderRadius: 4, paddingHorizontal: 7, paddingVertical: 4, minWidth: 30, alignItems: 'center' }}>
            <Text style={{ color: '#fff', fontSize: 13, fontWeight: Typography.bold, fontVariant: ['tabular-nums'] }}>{v}</Text>
          </View>
          {i < 3 && <Text style={{ color: Colors.slate[900], fontWeight: Typography.bold, fontSize: 13 }}>:</Text>}
        </React.Fragment>
      ))}
    </View>
  );
}

// ─── Section Header ────────────────────────────────────────────────────────
function SectionHeader({ title, subtitle, onViewAll }: { title: string; subtitle: string; onViewAll?: () => void }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingHorizontal: 16, marginBottom: 14 }}>
      <View>
        <Text style={{ fontSize: 20, fontWeight: Typography.bold, color: Colors.slate[900] }}>{title}</Text>
        <Text style={{ fontSize: 13, color: Colors.slate[500], marginTop: 3 }}>{subtitle}</Text>
      </View>
      {onViewAll && (
        <Pressable onPress={onViewAll} style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
          <Text style={{ color: Colors.epf[600], fontSize: 13, fontWeight: Typography.medium }}>View All</Text>
          <ArrowRight size={14} color={Colors.epf[600]} />
        </Pressable>
      )}
    </View>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const cartItems = useCartStore((state) => state.items);
  const user = useAuthStore((state) => state.user);
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const [products, setProducts] = useState<any[]>([]);
  const [bestDeals, setBestDeals] = useState<any[]>([]);
  const [flashDeals, setFlashDeals] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [search, setSearch] = useState('');

  const loadAll = async () => {
    try {
      const [productsRes, bestRes, flashRes, servicesRes] = await Promise.allSettled([
        productsApi.list({ limit: 10 }),
        productsApi.list({ limit: 10 }),
        productsApi.list({ limit: 8 }),
        servicesApi.list(),
      ]);
      if (productsRes.status === 'fulfilled') setProducts(productsRes.value.data?.data || []);
      if (bestRes.status === 'fulfilled') setBestDeals(bestRes.value.data?.data || []);
      if (flashRes.status === 'fulfilled') setFlashDeals(flashRes.value.data?.data || []);
      if (servicesRes.status === 'fulfilled') setServices(Array.isArray(servicesRes.value.data?.services) ? servicesRes.value.data.services.slice(0, 4) : []);
    } catch {
      // silent
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { void loadAll(); }, []);
  const onRefresh = () => { setRefreshing(true); void loadAll(); };

  const categories = [
    { name: 'কেবল ও ওয়্যার', subtitle: 'সেরা দামে', icon: '🔌', slug: 'cable' },
    { name: 'সার্কিট ব্রেকার', subtitle: 'জরুরি সুরক্ষা', icon: '🛡️', slug: 'breaker' },
    { name: 'সুইচ ও সকেট', subtitle: '১০০% আসল', icon: '⚡', slug: 'switch' },
    { name: 'লাইটিং', subtitle: 'LED ও সোলার', icon: '💡', slug: 'lighting' },
    { name: 'সোলার প্যানেল', subtitle: 'আপটু ৩০% ছাড়', icon: '☀️', slug: 'solar' },
    { name: 'সেফটি সরঞ্জাম', subtitle: 'শ্রমিক সুরক্ষা', icon: '👷', slug: 'safety' },
    { name: 'ইন্ডাস্ট্রিয়াল', subtitle: 'অটোমেশন', icon: '🏭', slug: 'industrial' },
    { name: 'টুলস ও মিটার', subtitle: 'ডিজিটাল', icon: '📐', slug: 'tools' },
  ];

  const trustFeatures = [
    { icon: Truck, label: 'Free Delivery', desc: 'Orders over ৳5,000' },
    { icon: RotateCcw, label: 'Easy Returns', desc: '7-day return policy' },
    { icon: Shield, label: 'Secure Payment', desc: '100% secure checkout' },
    { icon: Headphones, label: '24/7 Support', desc: 'Expert help anytime' },
    { icon: BadgeCheck, label: 'Authentic', desc: 'Official warranty' },
  ];

  const brands = ['Siemens', 'Schneider', 'ABB', 'Legrand', 'Havells', 'Philips', 'Osram', 'Bosch', 'Fluke', 'Eaton'];
  const navLinks = ['Home', 'Services', 'Shop', 'Projects', 'Project Kits', 'Blog'];

  const toCard = (product: any): PremiumCardData => ({
    id: product.id,
    name: product.name,
    price: product.price,
    salePrice: product.salePrice,
    comparePrice: product.comparePrice ?? product.price,
    images: product.images,
    isFeatured: product.isFeatured,
    stock: product.stock,
    category: product.category?.name,
    rating: product.rating,
    reviewCount: product.reviewCount,
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg.secondary }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.epf[500]} />}
      >
        {/* ═══ HEADER ROW 1 — White ═══════════════════════════════════════ */}
        <View style={{ backgroundColor: Colors.bg.primary, borderBottomWidth: 1, borderBottomColor: Colors.slate[200] }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', height: Layout.headerHeight, paddingHorizontal: 16, gap: 10 }}>
            {/* Logo */}
            <Pressable onPress={() => router.push('/(tabs)')}>
              <View>
                <Text style={{ fontSize: 22, fontWeight: Typography.extrabold, color: Colors.slate[900], lineHeight: 22 }}>
                  e<Text style={{ color: Colors.epf[500] }}>Power</Text>Fix
                </Text>
                <Text style={{ fontSize: 8, color: Colors.slate[500], fontWeight: Typography.semibold, letterSpacing: 2, marginTop: 2 }}>
                  ELECTRICAL MARKETPLACE
                </Text>
              </View>
            </Pressable>
            {/* Search */}
            <View style={{ flex: 1, flexDirection: 'row', height: 40, borderRadius: Radius.base, borderWidth: 1, borderColor: Colors.slate[200], overflow: 'hidden', backgroundColor: Colors.bg.primary }}>
              <View style={{ paddingLeft: 10, justifyContent: 'center' }}>
                <Search size={16} color={Colors.slate[400]} />
              </View>
              <TextInput
                placeholder="Search products..."
                placeholderTextColor={Colors.slate[400]}
                value={search}
                onChangeText={setSearch}
                style={{ flex: 1, paddingHorizontal: 8, fontSize: 14, color: Colors.slate[900] }}
                onSubmitEditing={() => router.push('/(tabs)/shop')}
              />
              <Pressable style={{ backgroundColor: Colors.epf[500], paddingHorizontal: 14, justifyContent: 'center' }} onPress={() => router.push('/(tabs)/shop')}>
                <Text style={{ color: '#fff', fontSize: 13, fontWeight: Typography.semibold }}>Search</Text>
              </Pressable>
            </View>
            {/* Icons */}
            <Pressable onPress={() => router.push(user ? '/(tabs)/profile' : '/login')} style={{ padding: 4 }}>
              <User size={21} color={Colors.slate[700]} />
            </Pressable>
            <Pressable onPress={() => router.push('/wishlist' as never)} style={{ padding: 4 }}>
              <Heart size={21} color={Colors.slate[700]} />
            </Pressable>
            <Pressable onPress={() => router.push('/(tabs)/cart')} style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 7, borderRadius: Radius.base, borderWidth: 1, borderColor: Colors.slate[200] }}>
              <View style={{ position: 'relative' }}>
                <ShoppingCart size={21} color={Colors.slate[700]} />
                <View style={{ position: 'absolute', top: -6, right: -8, minWidth: 15, height: 15, borderRadius: 8, backgroundColor: Colors.epf[500], alignItems: 'center', justifyContent: 'center', paddingHorizontal: 2 }}>
                  <Text style={{ color: '#fff', fontSize: 9, fontWeight: Typography.bold }}>{cartCount}</Text>
                </View>
              </View>
            </Pressable>
          </View>
        </View>

        {/* ═══ HEADER ROW 2 — Dark Nav ════════════════════════════════════ */}
        <View style={{ backgroundColor: Colors.slate[900], flexDirection: 'row', alignItems: 'center', height: Layout.navHeight, paddingHorizontal: 16 }}>
          <Pressable style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginRight: 14 }}>
            <Menu size={17} color='#fff' />
            <Text style={{ color: '#fff', fontSize: 14, fontWeight: Typography.bold }}>Categories</Text>
            <ChevronDown size={13} color={Colors.epf[400]} />
          </Pressable>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }}>
            {navLinks.map((link, idx) => (
              <Pressable key={idx} style={{ paddingHorizontal: 10, paddingVertical: 6 }}>
                <Text style={{ color: idx === 0 ? Colors.epf[400] : Colors.slate[100], fontSize: 14, fontWeight: Typography.medium }}>{link}</Text>
              </Pressable>
            ))}
          </ScrollView>
          <Pressable style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }} onPress={() => router.push('/order-track' as never)}>
            <Truck size={14} color={Colors.epf[400]} />
            <Text style={{ color: Colors.epf[400], fontSize: 13, fontWeight: Typography.medium }}>Track</Text>
          </Pressable>
        </View>

        {/* ═══ HERO BANNER ════════════════════════════════════════════════ */}
        <View style={{ backgroundColor: Colors.epf[50], paddingVertical: 28, paddingHorizontal: 20 }}>
          <View style={{ backgroundColor: Colors.epf[900], borderRadius: Radius['2xl'], padding: 24, minHeight: 190, justifyContent: 'center', overflow: 'hidden' }}>
            {/* Decorative circle */}
            <View style={{ position: 'absolute', width: 180, height: 180, borderRadius: 90, backgroundColor: Colors.epf[700], opacity: 0.3, right: -40, top: -40 }} />
            <View style={{ position: 'absolute', width: 100, height: 100, borderRadius: 50, backgroundColor: Colors.epf[500], opacity: 0.2, right: 20, bottom: -20 }} />
            {/* Badge */}
            <View style={{ alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 3, borderRadius: Radius.full, backgroundColor: 'rgba(14,165,233,0.15)', marginBottom: 10 }}>
              <Text style={{ color: Colors.epf[300], fontSize: 11, fontWeight: Typography.semibold }}>Premium Electrical Marketplace</Text>
            </View>
            <Text style={{ fontSize: 26, fontWeight: Typography.bold, color: '#fff', lineHeight: 32, marginBottom: 8 }}>
              বাংলাদেশের বিশ্বস্ত{'\n'}ইলেকট্রিক্যাল মার্কেটপ্লেস
            </Text>
            <Text style={{ color: Colors.slate[300], fontSize: 13, lineHeight: 20, marginBottom: 16 }}>
              Quality products · Professional services · Expert solutions
            </Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Pressable style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: Colors.epf[500], borderRadius: Radius.base, paddingHorizontal: 16, paddingVertical: 10 }} onPress={() => router.push('/(tabs)/shop')}>
                <Text style={{ color: '#fff', fontWeight: Typography.semibold, fontSize: 13 }}>Shop Now</Text>
                <ArrowRight size={14} color='#fff' />
              </Pressable>
              <Pressable style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', borderRadius: Radius.base, paddingHorizontal: 16, paddingVertical: 10 }} onPress={() => router.push('/(tabs)/marketplace' as never)}>
                <Zap size={14} color={Colors.epf[400]} />
                <Text style={{ color: '#fff', fontWeight: Typography.semibold, fontSize: 13 }}>Book Electrician</Text>
              </Pressable>
            </View>
          </View>
        </View>

        {/* ═══ TRUST BAR ══════════════════════════════════════════════════ */}
        <View style={{ backgroundColor: Colors.bg.primary, paddingVertical: 18, borderTopWidth: 1, borderBottomWidth: 1, borderColor: Colors.slate[200] }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 20 }}>
            {trustFeatures.map((feat, idx) => {
              const Icon = feat.icon;
              return (
                <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.epf[50], alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={18} color={Colors.epf[500]} strokeWidth={1.75} />
                  </View>
                  <View>
                    <Text style={{ fontSize: 12, fontWeight: Typography.semibold, color: Colors.slate[800] }}>{feat.label}</Text>
                    <Text style={{ fontSize: 11, color: Colors.slate[500], marginTop: 1 }}>{feat.desc}</Text>
                  </View>
                </View>
              );
            })}
          </ScrollView>
        </View>

        {/* ═══ CATEGORY GRID ══════════════════════════════════════════════ */}
        <View style={{ backgroundColor: Colors.bg.primary, padding: 16 }}>
          <SectionHeader title="ক্যাটাগরি" subtitle="সব ধরনের ইলেকট্রিক্যাল পণ্য" onViewAll={() => router.push('/(tabs)/shop')} />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
            {categories.map((cat) => (
              <Pressable key={cat.slug} onPress={() => router.push('/(tabs)/shop')}
                style={{ width: '23.5%', alignItems: 'center', paddingVertical: 14, backgroundColor: Colors.bg.primary, borderRadius: Radius.base, marginBottom: 8, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 2 }}>
                <View style={{ width: 50, height: 50, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.slate[50], borderRadius: Radius.lg, marginBottom: 6 }}>
                  <Text style={{ fontSize: 24 }}>{cat.icon}</Text>
                </View>
                <Text style={{ fontSize: 11, fontWeight: Typography.medium, color: Colors.slate[800], textAlign: 'center' }} numberOfLines={2}>{cat.name}</Text>
                <Text style={{ fontSize: 10, color: Colors.epf[500], marginTop: 2 }} numberOfLines={1}>{cat.subtitle}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* ═══ FLASH DEALS — matches FlashDeals.tsx ══════════════════════ */}
        <View style={{ backgroundColor: Colors.bg.primary, paddingVertical: 16, borderTopWidth: 1, borderTopColor: Colors.slate[100] }}>
          {/* Flash header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 14 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={{ backgroundColor: '#7C3AED', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Zap size={13} color='#fff' strokeWidth={2.5} />
                <Text style={{ color: '#fff', fontSize: 13, fontWeight: Typography.bold }}>Flash Deals</Text>
              </View>
              <CountdownTimer />
            </View>
            <Pressable onPress={() => router.push('/(tabs)/shop')} style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
              <Text style={{ color: Colors.epf[600], fontSize: 12, fontWeight: Typography.medium }}>View All</Text>
              <ArrowRight size={13} color={Colors.epf[600]} />
            </Pressable>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 12 }}>
            {loading
              ? Array.from({ length: 4 }).map((_, i) => <View key={i} style={{ width: Layout.cardWidth }}><PremiumCardSkeleton /></View>)
              : flashDeals.map((p) => <View key={p.id} style={{ width: Layout.cardWidth }}><PremiumCard data={toCard(p)} /></View>)
            }
          </ScrollView>
        </View>

        {/* ═══ FEATURED PRODUCTS — matches ShopSection.tsx ═══════════════ */}
        <View style={{ backgroundColor: Colors.bg.primary, paddingVertical: 16, borderTopWidth: 1, borderTopColor: Colors.slate[100] }}>
          <SectionHeader title="Featured Products" subtitle="Top picks for you" onViewAll={() => router.push('/(tabs)/shop')} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 12 }}>
            {loading
              ? Array.from({ length: 4 }).map((_, i) => <View key={i} style={{ width: Layout.cardWidth }}><PremiumCardSkeleton /></View>)
              : products.map((p) => <View key={p.id} style={{ width: Layout.cardWidth }}><PremiumCard data={toCard(p)} /></View>)
            }
          </ScrollView>
        </View>

        {/* ═══ BEST DEALS — matches BestDeals.tsx ════════════════════════ */}
        <View style={{ backgroundColor: Colors.slate[50], paddingVertical: 16, borderTopWidth: 1, borderTopColor: Colors.slate[200] }}>
          <SectionHeader title="Best Deals" subtitle="Don't miss — limited stock!" onViewAll={() => router.push('/(tabs)/shop')} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 12 }}>
            {loading
              ? Array.from({ length: 4 }).map((_, i) => <View key={i} style={{ width: Layout.cardWidth }}><PremiumCardSkeleton /></View>)
              : bestDeals.map((p) => <View key={p.id} style={{ width: Layout.cardWidth }}><PremiumCard data={{ ...toCard(p), isBestDeal: true }} /></View>)
            }
          </ScrollView>
        </View>

        {/* ═══ SERVICES SECTION — matches ServicesSection.tsx ════════════ */}
        <View style={{ backgroundColor: Colors.bg.primary, paddingVertical: 16, borderTopWidth: 1, borderTopColor: Colors.slate[200] }}>
          <SectionHeader title="Our Services" subtitle="Expert electrical solutions at your doorstep" onViewAll={() => router.push('/(tabs)/services')} />
          <View style={{ paddingHorizontal: 16, gap: 10 }}>
            {services.length === 0 && !loading ? (
              <Pressable onPress={() => router.push('/(tabs)/services')} style={{ backgroundColor: Colors.slate[900], borderRadius: Radius.xl, padding: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <Zap size={18} color={Colors.epf[400]} />
                    <Text style={{ fontSize: 15, fontWeight: Typography.bold, color: '#fff' }}>Need Electrical Services?</Text>
                  </View>
                  <Text style={{ color: Colors.slate[400], fontSize: 12 }}>Book professional electricians at your doorstep</Text>
                </View>
                <View style={{ backgroundColor: Colors.epf[500], borderRadius: Radius.base, paddingHorizontal: 12, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Text style={{ color: '#fff', fontWeight: Typography.semibold, fontSize: 13 }}>Book</Text>
                  <ArrowRight size={13} color='#fff' />
                </View>
              </Pressable>
            ) : services.map((svc) => (
              <Pressable key={svc.id} onPress={() => router.push({ pathname: '/service-booking', params: { serviceId: svc.id, serviceName: svc.name, basePrice: svc.basePrice ?? '' } } as never)}
                style={{ backgroundColor: Colors.bg.primary, borderWidth: 1, borderColor: Colors.slate[200], borderRadius: Radius.xl, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={{ width: 48, height: 48, borderRadius: Radius.xl, backgroundColor: Colors.epf[50], alignItems: 'center', justifyContent: 'center' }}>
                  <Zap size={22} color={Colors.epf[500]} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: Typography.bold, color: Colors.slate[900] }}>{svc.name}</Text>
                  <Text style={{ color: Colors.slate[500], fontSize: 12, marginTop: 2 }} numberOfLines={1}>{svc.shortDesc || svc.description || 'Professional service'}</Text>
                  <Text style={{ color: Colors.epf[600], fontSize: 13, fontWeight: Typography.bold, marginTop: 4 }}>
                    {svc.basePrice ? `Starting ৳${Number(svc.basePrice).toLocaleString()}` : 'Contact for price'}
                  </Text>
                </View>
                <View style={{ backgroundColor: Colors.epf[500], borderRadius: Radius.base, paddingHorizontal: 10, paddingVertical: 7 }}>
                  <Text style={{ color: '#fff', fontSize: 11, fontWeight: Typography.semibold }}>Book</Text>
                </View>
              </Pressable>
            ))}
          </View>
        </View>

        {/* ═══ ELECTRICIAN CTA BANNER — matches ServicesBanner.tsx ═══════ */}
        <View style={{ backgroundColor: Colors.bg.primary, paddingHorizontal: 16, paddingVertical: 20, borderTopWidth: 1, borderTopColor: Colors.slate[100] }}>
          <Pressable onPress={() => router.push('/(tabs)/marketplace' as never)}
            style={{ backgroundColor: Colors.epf[900], borderRadius: Radius['2xl'], overflow: 'hidden', padding: 20 }}>
            <View style={{ position: 'absolute', width: 120, height: 120, borderRadius: 60, backgroundColor: Colors.epf[500], opacity: 0.15, right: -20, top: -20 }} />
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: Colors.epf[500], alignItems: 'center', justifyContent: 'center' }}>
                <Zap size={18} color='#fff' strokeWidth={2.5} />
              </View>
              <Text style={{ color: '#fff', fontSize: 17, fontWeight: Typography.bold }}>ePowerFix Marketplace</Text>
            </View>
            <Text style={{ color: Colors.slate[300], fontSize: 13, lineHeight: 20, marginBottom: 14 }}>
              Certified electricians at your doorstep. Fast dispatch, transparent pricing, warranty guaranteed.
            </Text>
            <View style={{ flexDirection: 'row', gap: 16, marginBottom: 14 }}>
              {[{ label: '৫০০+', sub: 'Verified Pros' }, { label: '৪.৮★', sub: 'Average Rating' }, { label: '১০০%', sub: 'Insured Work' }].map((stat, i) => (
                <View key={i}>
                  <Text style={{ color: Colors.epf[400], fontSize: 16, fontWeight: Typography.bold }}>{stat.label}</Text>
                  <Text style={{ color: Colors.slate[400], fontSize: 11 }}>{stat.sub}</Text>
                </View>
              ))}
            </View>
            <Pressable onPress={() => router.push('/(tabs)/marketplace' as never)}
              style={{ alignSelf: 'flex-start', backgroundColor: Colors.epf[500], borderRadius: Radius.base, paddingHorizontal: 18, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={{ color: '#fff', fontWeight: Typography.bold, fontSize: 14 }}>Book an Electrician</Text>
              <ArrowRight size={15} color='#fff' />
            </Pressable>
          </Pressable>
        </View>

        {/* ═══ BRAND STRIP — matches BrandStrip.tsx ══════════════════════ */}
        <View style={{ backgroundColor: Colors.slate[50], paddingVertical: 18, borderTopWidth: 1, borderBottomWidth: 1, borderColor: Colors.slate[200] }}>
          <Text style={{ textAlign: 'center', fontSize: 11, fontWeight: Typography.semibold, color: Colors.slate[400], textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12 }}>
            Trusted brands across Bangladesh
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 28, alignItems: 'center' }}>
            {[...brands, ...brands].map((brand, i) => (
              <Text key={i} style={{ fontSize: 15, fontWeight: Typography.bold, color: Colors.slate[300] }}>{brand}</Text>
            ))}
          </ScrollView>
        </View>

        {/* ═══ PROJECTS SECTION — matches ProjectsSection.tsx ════════════ */}
        <View style={{ backgroundColor: Colors.slate[50], paddingVertical: 16 }}>
          <SectionHeader title="Projects" subtitle="Real-world installations across Bangladesh" />
          <View style={{ paddingHorizontal: 16 }}>
            {projects.length === 0 ? (
              <View style={{ backgroundColor: Colors.bg.primary, borderRadius: Radius.xl, borderWidth: 1, borderColor: Colors.slate[200], paddingVertical: 40, alignItems: 'center' }}>
                <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.slate[50], borderWidth: 1, borderColor: Colors.slate[200], alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                  <Cpu size={26} color={Colors.slate[300]} strokeWidth={1.5} />
                </View>
                <Text style={{ color: Colors.slate[700], fontSize: 15, fontWeight: Typography.medium }}>No projects yet</Text>
                <Text style={{ color: Colors.slate[400], fontSize: 13, marginTop: 4 }}>Case studies coming soon</Text>
              </View>
            ) : (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                {projects.slice(0, 4).map((proj: any) => {
                  const cover = proj.coverImage || proj.images?.[0];
                  return (
                    <View key={proj.id} style={{ width: '48%', backgroundColor: Colors.bg.primary, borderRadius: Radius.xl, borderWidth: 1, borderColor: Colors.slate[200], overflow: 'hidden' }}>
                      <View style={{ height: 110, backgroundColor: Colors.slate[100], alignItems: 'center', justifyContent: 'center' }}>
                        {cover ? <Image source={{ uri: cover }} style={{ width: '100%', height: '100%', resizeMode: 'cover' }} /> : <Cpu size={30} color={Colors.slate[300]} />}
                      </View>
                      <View style={{ padding: 10 }}>
                        <Text style={{ color: Colors.slate[900], fontWeight: Typography.semibold, fontSize: 13 }} numberOfLines={2}>{proj.title}</Text>
                        {proj.location && <Text style={{ color: Colors.slate[500], fontSize: 11, marginTop: 3 }}>{proj.location}</Text>}
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        </View>

        {/* ═══ TRUST SECTION — Social proof ══════════════════════════════ */}
        <View style={{ backgroundColor: Colors.bg.primary, paddingVertical: 20, paddingHorizontal: 16, borderTopWidth: 1, borderTopColor: Colors.slate[200] }}>
          <Text style={{ fontSize: 18, fontWeight: Typography.bold, color: Colors.slate[900], textAlign: 'center', marginBottom: 4 }}>
            Why Choose ePowerFix?
          </Text>
          <Text style={{ color: Colors.slate[500], fontSize: 13, textAlign: 'center', marginBottom: 16 }}>
            বাংলাদেশের ১০,০০০+ গ্রাহকের বিশ্বাস
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {[
              { icon: '✅', title: 'Verified Electricians', desc: 'NID + document verified' },
              { icon: '💰', title: 'Money-back Guarantee', desc: 'সন্তুষ্ট না হলে টাকা ফেরত' },
              { icon: '⚡', title: 'Fast Dispatch', desc: 'Same day service available' },
              { icon: '🛡️', title: 'Warranty on Work', desc: 'Service warranty included' },
            ].map((item, i) => (
              <View key={i} style={{ width: '48%', backgroundColor: Colors.slate[50], borderRadius: Radius.xl, borderWidth: 1, borderColor: Colors.slate[200], padding: 14 }}>
                <Text style={{ fontSize: 22, marginBottom: 6 }}>{item.icon}</Text>
                <Text style={{ color: Colors.slate[900], fontWeight: Typography.semibold, fontSize: 13 }}>{item.title}</Text>
                <Text style={{ color: Colors.slate[500], fontSize: 11, marginTop: 3, lineHeight: 16 }}>{item.desc}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ═══ FOOTER ══════════════════════════════════════════════════════ */}
        <Footer />
      </ScrollView>
    </SafeAreaView>
  );
}
