// ═══════════════════════════════════════════════════════════════════════════
// Home Screen — EXACT match with website
// Web: Header.tsx + HeroBanner.tsx + TrustBar.tsx + CategoryGrid.tsx + ShopSection.tsx
// ═══════════════════════════════════════════════════════════════════════════

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
  Menu,
  Truck,
  RotateCcw,
  Shield,
  Headphones,
  BadgeCheck,
  ArrowRight,
  Zap,
} from 'lucide-react-native';
import { PremiumCard, PremiumCardData } from '../../src/components/PremiumCard';
import { Footer } from '../../src/components/Footer';
import { productsApi } from '@epowerfix/api-client';
import { useCartStore } from '@epowerfix/store';
import { useAuthStore } from '../../src/store/auth';
import { Colors, Typography, Radius, Layout } from '../../src/theme/design-system';

export default function HomeScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const cartItems = useCartStore((state) => state.items);
  const user = useAuthStore((state) => state.user);
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const [products, setProducts] = useState<any[]>([]);
  const [search, setSearch] = useState('');

  const loadProducts = async () => {
    try {
      const response = await productsApi.list({ limit: 10 });
      setProducts(response.data?.data || []);
    } catch (e) {
      // silent
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

  // Website categories (Bengali names from CategoryGrid.tsx)
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

  // Trust features (from TrustBar.tsx)
  const trustFeatures = [
    { icon: Truck, label: 'Free Delivery', desc: 'Orders over ৳5,000' },
    { icon: RotateCcw, label: 'Easy Returns', desc: '7-day return policy' },
    { icon: Shield, label: 'Secure Payment', desc: '100% secure checkout' },
    { icon: Headphones, label: '24/7 Support', desc: 'Expert help anytime' },
    { icon: BadgeCheck, label: 'Authentic', desc: 'Official warranty' },
  ];

  // Nav links (from Header.tsx)
  const navLinks = ['Home', 'Services', 'Shop', 'Projects', 'Project Kits', 'Blog'];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg.secondary }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* ═══════════════════════════════════════════════════════════════════
            HEADER ROW 1 — White bg, border-b (matches website)
            Logo + Search + Login/Wishlist/Cart
           ═══════════════════════════════════════════════════════════════════ */}
        <View style={{ backgroundColor: Colors.bg.primary, borderBottomWidth: 1, borderBottomColor: Colors.slate[200] }}>
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            height: Layout.headerHeight,
            paddingHorizontal: 16,
            gap: 12,
          }}>
            {/* Logo — matches web: e[Power]Fix, 26px extrabold */}
            <Pressable onPress={() => router.push('/(tabs)')}>
              <View style={{ flexDirection: 'column' }}>
                <Text style={{ fontSize: 24, fontWeight: Typography.extrabold, color: Colors.slate[900], lineHeight: 24 }}>
                  e<Text style={{ color: Colors.epf[500] }}>Power</Text>Fix
                </Text>
                <Text style={{ fontSize: 9, color: Colors.slate[500], fontWeight: Typography.semibold, letterSpacing: 2, marginTop: 2 }}>
                  ELECTRICAL MARKETPLACE
                </Text>
              </View>
            </Pressable>

            {/* Search Bar — matches web: border, rounded, epf-500 button */}
            <View style={{
              flex: 1,
              flexDirection: 'row',
              height: 42,
              borderRadius: Radius.base,
              borderWidth: 1,
              borderColor: Colors.slate[200],
              overflow: 'hidden',
              backgroundColor: Colors.bg.primary,
            }}>
              <View style={{ paddingLeft: 10, justifyContent: 'center' }}>
                <Search size={18} color={Colors.slate[400]} />
              </View>
              <TextInput
                placeholder="Search products..."
                placeholderTextColor={Colors.slate[400]}
                value={search}
                onChangeText={setSearch}
                style={{
                  flex: 1,
                  paddingHorizontal: 8,
                  fontSize: 15,
                  color: Colors.slate[900],
                }}
                onSubmitEditing={() => router.push('/(tabs)/shop')}
              />
              <Pressable
                style={{
                  backgroundColor: Colors.epf[500],
                  paddingHorizontal: 18,
                  justifyContent: 'center',
                }}
                onPress={() => router.push('/(tabs)/shop')}
              >
                <Text style={{ color: Colors.text.inverse, fontSize: 14, fontWeight: Typography.semibold }}>
                  Search
                </Text>
              </Pressable>
            </View>

            {/* Right Icons — Login, Wishlist, Cart */}
            <Pressable onPress={() => router.push(user ? '/(tabs)/profile' : '/login')} style={{ padding: 4 }}>
              <User size={22} color={Colors.slate[700]} />
            </Pressable>
            <Pressable onPress={() => router.push('/wishlist' as never)} style={{ padding: 4 }}>
              <Heart size={22} color={Colors.slate[700]} />
            </Pressable>
            <Pressable
              onPress={() => router.push('/(tabs)/cart')}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: Radius.base,
                borderWidth: 1,
                borderColor: Colors.slate[200],
                position: 'relative',
              }}
            >
              <View style={{ position: 'relative' }}>
                <ShoppingCart size={22} color={Colors.slate[700]} />
                {/* Cart badge — epf-500, matches web */}
                <View style={{
                  position: 'absolute',
                  top: -6,
                  right: -8,
                  minWidth: 15,
                  height: 15,
                  borderRadius: 8,
                  backgroundColor: Colors.epf[500],
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingHorizontal: 2,
                }}>
                  <Text style={{ color: Colors.text.inverse, fontSize: 10, fontWeight: Typography.bold }}>
                    {cartCount}
                  </Text>
                </View>
              </View>
            </Pressable>
          </View>
        </View>

        {/* ═══════════════════════════════════════════════════════════════════
            HEADER ROW 2 — slate-900 bg (matches website)
            Categories dropdown + Nav links + Track Order
           ═══════════════════════════════════════════════════════════════════ */}
        <View style={{
          backgroundColor: Colors.slate[900],
          flexDirection: 'row',
          alignItems: 'center',
          height: Layout.navHeight,
          paddingHorizontal: 16,
        }}>
          {/* Categories button — bg-slate-900, hover:slate-950 */}
          <Pressable style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginRight: 16 }}>
            <Menu size={18} color={Colors.text.inverse} />
            <Text style={{ color: Colors.text.inverse, fontSize: 15, fontWeight: Typography.bold }}>
              Categories
            </Text>
            <ChevronDown size={14} color={Colors.epf[500]} />
          </Pressable>

          {/* Nav links — scrollable */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }}>
            {navLinks.map((link, idx) => (
              <Pressable key={idx} style={{ paddingHorizontal: 10, paddingVertical: 6 }}>
                <Text style={{
                  color: idx === 0 ? Colors.epf[500] : Colors.slate[50],
                  fontSize: 15,
                  fontWeight: Typography.semibold,
                }}>
                  {link}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          {/* Track Order — epf-500 text */}
          <Pressable
            style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginLeft: 8 }}
            onPress={() => router.push('/order-track' as never)}
          >
            <Truck size={16} color={Colors.epf[500]} />
            <Text style={{ color: Colors.epf[500], fontSize: 14, fontWeight: Typography.medium }}>
              Track
            </Text>
          </Pressable>
        </View>

        {/* ═══════════════════════════════════════════════════════════════════
            HERO BANNER — gradient from-epf-50 via-white to-white (matches web)
           ═══════════════════════════════════════════════════════════════════ */}
        <View style={{
          backgroundColor: Colors.epf[50],
          paddingVertical: 32,
          paddingHorizontal: 24,
        }}>
          <View style={{
            backgroundColor: Colors.epf[900],
            borderRadius: Radius['2xl'],
            padding: 24,
            minHeight: 200,
            justifyContent: 'center',
          }}>
            {/* Badge */}
            <View style={{
              alignSelf: 'flex-start',
              paddingHorizontal: 12,
              paddingVertical: 4,
              borderRadius: Radius.full,
              backgroundColor: 'rgba(14, 165, 233, 0.1)',
              marginBottom: 12,
            }}>
              <Text style={{ color: Colors.epf[400], fontSize: 12, fontWeight: Typography.semibold }}>
                Premium Electrical Marketplace
              </Text>
            </View>

            {/* Title */}
            <Text style={{ fontSize: 24, fontWeight: Typography.bold, color: Colors.text.inverse, lineHeight: 30 }}>
              Welcome to ePowerFix
            </Text>

            {/* Subtitle */}
            <Text style={{ color: Colors.slate[300], fontSize: 14, marginTop: 8, lineHeight: 22 }}>
              Your trusted electrical marketplace. Quality products, professional services, and expert solutions.
            </Text>

            {/* CTA Button — epf-500 */}
            <Pressable
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: Colors.epf[500],
                borderRadius: Radius.base,
                paddingHorizontal: 18,
                paddingVertical: 10,
                alignSelf: 'flex-start',
                marginTop: 16,
              }}
              onPress={() => router.push('/(tabs)/shop')}
            >
              <Text style={{ color: Colors.text.inverse, fontWeight: Typography.semibold, fontSize: 14, marginRight: 6 }}>
                Shop Now
              </Text>
              <ArrowRight size={16} color={Colors.text.inverse} />
            </Pressable>
          </View>
        </View>

        {/* ═══════════════════════════════════════════════════════════════════
            TRUST BAR — bg-white, border-y (matches website TrustBar.tsx)
           ═══════════════════════════════════════════════════════════════════ */}
        <View style={{
          backgroundColor: Colors.bg.primary,
          paddingVertical: 20,
          borderTopWidth: 1,
          borderBottomWidth: 1,
          borderColor: Colors.slate[200],
        }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
            {trustFeatures.map((feat, idx) => {
              const Icon = feat.icon;
              return (
                <View key={idx} style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginRight: 24,
                }}>
                  {/* Icon circle — bg-epf-50, text-epf-500, 44x44 */}
                  <View style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    backgroundColor: Colors.epf[50],
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 12,
                  }}>
                    <Icon size={20} color={Colors.epf[500]} strokeWidth={1.75} />
                  </View>
                  <View>
                    <Text style={{ fontSize: 13, fontWeight: Typography.semibold, color: Colors.slate[800] }}>
                      {feat.label}
                    </Text>
                    <Text style={{ fontSize: 12, color: Colors.slate[500], marginTop: 2 }}>
                      {feat.desc}
                    </Text>
                  </View>
                </View>
              );
            })}
          </ScrollView>
        </View>

        {/* ═══════════════════════════════════════════════════════════════════
            CATEGORY GRID — bg-white (matches website CategoryGrid.tsx)
           ═══════════════════════════════════════════════════════════════════ */}
        <View style={{ backgroundColor: Colors.bg.primary, padding: 16 }}>
          {/* Header */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 16 }}>
            <View>
              <Text style={{ fontSize: 20, fontWeight: Typography.bold, color: Colors.slate[900] }}>
                ক্যাটাগরি
              </Text>
              <Text style={{ fontSize: 14, color: Colors.slate[500], marginTop: 4 }}>
                সব ধরনের ইলেকট্রিক্যাল পণ্য খুঁজুন
              </Text>
            </View>
            <Pressable
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                borderWidth: 1,
                borderColor: Colors.epf[500],
                borderRadius: Radius.md,
                paddingHorizontal: 12,
                paddingVertical: 8,
              }}
              onPress={() => router.push('/(tabs)/shop')}
            >
              <Text style={{ color: Colors.epf[500], fontSize: 14, fontWeight: Typography.medium }}>
                সব দেখুন
              </Text>
            </Pressable>
          </View>

          {/* Grid — 4 columns (mobile), matches website grid-cols-8 → mobile 4 */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
            {categories.map((cat) => (
              <Pressable
                key={cat.slug}
                style={{
                  width: '23.5%',
                  alignItems: 'center',
                  paddingVertical: 16,
                  paddingHorizontal: 4,
                  backgroundColor: Colors.bg.primary,
                  borderRadius: Radius.base,
                  marginBottom: 8,
                  // shadow-sm
                  elevation: 1,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.05,
                  shadowRadius: 3,
                }}
                onPress={() => router.push('/(tabs)/shop')}
              >
                {/* Icon area — w-14 h-14, bg-slate-50, text-epf-500 */}
                <View style={{
                  width: 56,
                  height: 56,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: Colors.slate[50],
                  marginBottom: 8,
                }}>
                  <Text style={{ fontSize: 28 }}>{cat.icon}</Text>
                </View>
                <Text style={{ fontSize: 12, fontWeight: Typography.medium, color: Colors.slate[800], textAlign: 'center' }} numberOfLines={2}>
                  {cat.name}
                </Text>
                <Text style={{ fontSize: 10, color: Colors.epf[500], marginTop: 2 }} numberOfLines={1}>
                  {cat.subtitle}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* ═══════════════════════════════════════════════════════════════════
            FEATURED PRODUCTS — bg-white (matches website ShopSection.tsx)
           ═══════════════════════════════════════════════════════════════════ */}
        <View style={{ backgroundColor: Colors.bg.primary, paddingTop: 16, paddingBottom: 24 }}>
          {/* Header — matches RowHeader */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingHorizontal: 16, marginBottom: 16 }}>
            <View>
              <Text style={{ fontSize: 20, fontWeight: Typography.bold, color: Colors.slate[900] }}>
                Featured Products
              </Text>
              <Text style={{ fontSize: 14, color: Colors.slate[500], marginTop: 4 }}>
                Top picks for you
              </Text>
            </View>
            <Pressable onPress={() => router.push('/(tabs)/shop')} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Text style={{ color: Colors.epf[600], fontSize: 14, fontWeight: Typography.medium }}>
                View All
              </Text>
              <ArrowRight size={16} color={Colors.epf[600]} />
            </Pressable>
          </View>

          {/* Products horizontal scroll */}
          {loading ? (
            <View style={{ paddingVertical: 40, alignItems: 'center' }}>
              <ActivityIndicator size="large" color={Colors.epf[500]} />
            </View>
          ) : products.length === 0 ? (
            <View style={{ paddingHorizontal: 16, paddingVertical: 40, alignItems: 'center' }}>
              <Text style={{ color: Colors.slate[500] }}>No products available</Text>
            </View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 12 }}>
              {products.map((product) => {
                const cardData: PremiumCardData = {
                  id: product.id,
                  name: product.name,
                  price: product.price,
                  salePrice: product.salePrice,
                  comparePrice: product.price,
                  images: product.images,
                  isFeatured: product.isFeatured,
                  stock: product.stock,
                  category: product.category?.name,
                  rating: product.rating,
                  reviewCount: product.reviewCount,
                };
                return (
                  <View key={product.id} style={{ width: Layout.cardWidth }}>
                    <PremiumCard data={cardData} />
                  </View>
                );
              })}
            </ScrollView>
          )}
        </View>

        {/* ═══════════════════════════════════════════════════════════════════
            SERVICES CTA — bg-slate-50 (matches website ServicesSection)
           ═══════════════════════════════════════════════════════════════════ */}
        <View style={{ backgroundColor: Colors.bg.tertiary, padding: 16 }}>
          {/* Header */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 16 }}>
            <View>
              <Text style={{ fontSize: 20, fontWeight: Typography.bold, color: Colors.slate[900] }}>
                Our Services
              </Text>
              <Text style={{ fontSize: 14, color: Colors.slate[500], marginTop: 4 }}>
                Expert electrical solutions at your doorstep
              </Text>
            </View>
            <Pressable onPress={() => router.push('/(tabs)/services')} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Text style={{ color: Colors.epf[600], fontSize: 14, fontWeight: Typography.medium }}>
                View All
              </Text>
              <ArrowRight size={16} color={Colors.epf[600]} />
            </Pressable>
          </View>

          {/* CTA Card */}
          <Pressable
            style={{
              backgroundColor: Colors.slate[900],
              borderRadius: Radius.xl,
              padding: 20,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
            onPress={() => router.push('/(tabs)/services')}
          >
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Zap size={20} color={Colors.epf[500]} />
                <Text style={{ fontSize: 16, fontWeight: Typography.bold, color: Colors.text.inverse }}>
                  Need Electrical Services?
                </Text>
              </View>
              <Text style={{ color: Colors.slate[400], fontSize: 13 }}>
                Book professional electricians
              </Text>
            </View>
            <View style={{
              backgroundColor: Colors.epf[500],
              borderRadius: Radius.base,
              paddingHorizontal: 14,
              paddingVertical: 8,
              flexDirection: 'row',
              alignItems: 'center',
            }}>
              <Text style={{ color: Colors.text.inverse, fontWeight: Typography.semibold, fontSize: 13, marginRight: 4 }}>
                Book
              </Text>
              <ArrowRight size={14} color={Colors.text.inverse} />
            </View>
          </Pressable>
        </View>

        {/* ═══════════════════════════════════════════════════════════════════
            FOOTER — matches website Footer.tsx
           ═══════════════════════════════════════════════════════════════════ */}
        <Footer />
      </ScrollView>
    </SafeAreaView>
  );
}
