// ═══════════════════════════════════════════════════════════════════════════
// Cart Screen — Enhanced with coupon, delivery calc, free delivery threshold
// ═══════════════════════════════════════════════════════════════════════════

import React, { useState } from 'react';
import { Image, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowRight, Minus, PackageOpen, Plus, ShieldCheck,
  ShoppingBag, Trash2, Truck, Tag, CheckCircle2,
} from 'lucide-react-native';
import { useCartStore } from '@epowerfix/store';
import { couponsApi } from '@epowerfix/api-client';
import { Colors, Typography, Radius } from '../../src/theme/design-system';

const FREE_DELIVERY_THRESHOLD = 5000;
const DELIVERY_CHARGE_INSIDE_DHAKA = 60;
const DELIVERY_CHARGE_OUTSIDE_DHAKA = 120;

export default function CartScreen() {
  const router = useRouter();
  const items = useCartStore((state) => state.items);
  const removeItem = useCartStore((state) => state.removeItem);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [couponApplied, setCouponApplied] = useState<{ code: string; discount: number } | null>(null);
  const [couponError, setCouponError] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);

  const deliveryCharge = subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_CHARGE_INSIDE_DHAKA;
  const discount = couponApplied?.discount || 0;
  const total = Math.max(0, subtotal - discount) + deliveryCharge;
  const remainingForFree = FREE_DELIVERY_THRESHOLD - subtotal;

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    setCouponError('');
    try {
      const res = await couponsApi.validate(couponCode.trim(), subtotal);
      const coupon = res.data;
      if (coupon && coupon.valid) {
        const discountAmount = coupon.discountType === 'PERCENTAGE'
          ? Math.round(subtotal * (coupon.discountValue / 100))
          : coupon.discountValue;
        setCouponApplied({ code: couponCode.trim(), discount: discountAmount });
      } else {
        setCouponError('Invalid or expired coupon code');
      }
    } catch {
      setCouponError('Could not validate coupon. Try again.');
    } finally {
      setCouponLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg.secondary }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: Colors.bg.primary, borderWidth: 1, borderColor: Colors.slate[200], alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
            <PackageOpen size={34} color={Colors.slate[300]} strokeWidth={1.5} />
          </View>
          <Text style={{ fontSize: 19, fontWeight: Typography.semibold, color: Colors.slate[800] }}>Your cart is empty</Text>
          <Text style={{ color: Colors.slate[400], fontSize: 14, marginTop: 8, textAlign: 'center', maxWidth: 300, lineHeight: 21 }}>
            Browse our products and add the items you need for your next project.
          </Text>
          <Pressable
            style={({ pressed }) => ({ backgroundColor: pressed ? Colors.epf[600] : Colors.epf[500], borderRadius: Radius.lg, paddingHorizontal: 24, paddingVertical: 12, marginTop: 20, flexDirection: 'row', alignItems: 'center' })}
            onPress={() => router.push('/(tabs)/shop')}
          >
            <ShoppingBag size={16} color="#fff" />
            <Text style={{ color: '#fff', fontWeight: Typography.semibold, marginLeft: 7 }}>Start Shopping</Text>
            <ArrowRight size={16} color="#fff" style={{ marginLeft: 6 }} />
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg.secondary }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 28 }}>
        {/* Header */}
        <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 14, backgroundColor: Colors.bg.primary, borderBottomWidth: 1, borderBottomColor: Colors.slate[200] }}>
          <Text style={{ fontSize: 23, fontWeight: Typography.bold, color: Colors.slate[900] }}>Your Cart</Text>
          <Text style={{ color: Colors.slate[500], fontSize: 13, marginTop: 4 }}>
            {itemCount} {itemCount === 1 ? 'item' : 'items'} ready for checkout
          </Text>
        </View>

        {/* Free delivery progress */}
        {remainingForFree > 0 ? (
          <View style={{ marginHorizontal: 12, marginTop: 12, backgroundColor: Colors.epf[50], borderRadius: Radius.lg, padding: 12, borderWidth: 1, borderColor: Colors.epf[200] }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Truck size={15} color={Colors.epf[600]} />
              <Text style={{ fontSize: 12, color: Colors.epf[700], fontWeight: Typography.medium }}>
                Add ৳{remainingForFree.toLocaleString()} more for FREE delivery
              </Text>
            </View>
            <View style={{ height: 5, borderRadius: 3, backgroundColor: Colors.epf[200], marginTop: 8, overflow: 'hidden' }}>
              <View style={{ height: '100%', borderRadius: 3, backgroundColor: Colors.epf[500], width: `${Math.min(100, (subtotal / FREE_DELIVERY_THRESHOLD) * 100)}%` }} />
            </View>
          </View>
        ) : (
          <View style={{ marginHorizontal: 12, marginTop: 12, backgroundColor: '#ECFDF5', borderRadius: Radius.lg, padding: 12, borderWidth: 1, borderColor: '#A7F3D0' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <CheckCircle2 size={15} color="#059669" />
              <Text style={{ fontSize: 12, color: '#065F46', fontWeight: Typography.medium }}>
                Congratulations! You've unlocked FREE delivery
              </Text>
            </View>
          </View>
        )}

        {/* Cart items */}
        <View style={{ padding: 12 }}>
          {items.map((item) => (
            <View key={item.id} style={{ backgroundColor: Colors.bg.primary, borderWidth: 1, borderColor: Colors.slate[200], borderRadius: Radius.lg, padding: 12, marginBottom: 10, flexDirection: 'row' }}>
              <View style={{ width: 76, height: 76, borderRadius: Radius.md, backgroundColor: Colors.slate[50], alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                {item.productImage ? (
                  <Image source={{ uri: item.productImage }} style={{ width: '100%', height: '100%', resizeMode: 'contain' }} />
                ) : (
                  <ShoppingBag size={24} color={Colors.slate[300]} />
                )}
              </View>
              <View style={{ flex: 1, marginLeft: 12, minWidth: 0 }}>
                <Text style={{ color: Colors.slate[900], fontSize: 14, fontWeight: Typography.medium, lineHeight: 19 }} numberOfLines={2}>
                  {item.productName}
                </Text>
                {item.variantLabel ? (
                  <Text style={{ color: Colors.slate[500], fontSize: 12, marginTop: 3 }}>{item.variantLabel}</Text>
                ) : null}
                <Text style={{ color: Colors.epf[600], fontSize: 15, fontWeight: Typography.bold, marginTop: 7 }}>
                  ৳{Number(item.price).toLocaleString()}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: Colors.slate[200], borderRadius: Radius.base }}>
                    <Pressable onPress={() => updateQuantity(item.id, item.quantity - 1)} style={{ width: 30, height: 30, alignItems: 'center', justifyContent: 'center' }} hitSlop={4}>
                      <Minus size={14} color={Colors.slate[700]} />
                    </Pressable>
                    <Text style={{ width: 28, textAlign: 'center', color: Colors.slate[900], fontWeight: Typography.semibold, fontSize: 13 }}>
                      {item.quantity}
                    </Text>
                    <Pressable onPress={() => updateQuantity(item.id, item.quantity + 1)} style={{ width: 30, height: 30, alignItems: 'center', justifyContent: 'center' }} hitSlop={4}>
                      <Plus size={14} color={Colors.slate[700]} />
                    </Pressable>
                  </View>
                  <Text style={{ color: Colors.slate[900], fontWeight: Typography.bold, fontSize: 14 }}>
                    ৳{Number(item.price * item.quantity).toLocaleString()}
                  </Text>
                </View>
              </View>
              <Pressable onPress={() => removeItem(item.id)} style={{ padding: 4, marginLeft: 4 }} hitSlop={6}>
                <Trash2 size={17} color={Colors.danger} />
              </Pressable>
            </View>
          ))}

          {/* Coupon code */}
          <View style={{ backgroundColor: Colors.bg.primary, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.slate[200], padding: 14, marginBottom: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 }}>
              <Tag size={15} color={Colors.epf[600]} />
              <Text style={{ fontSize: 14, fontWeight: Typography.semibold, color: Colors.slate[800] }}>Coupon Code</Text>
            </View>
            {couponApplied ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#ECFDF5', borderRadius: Radius.base, padding: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <CheckCircle2 size={15} color="#059669" />
                  <Text style={{ fontSize: 13, color: '#065F46', fontWeight: Typography.medium }}>{couponApplied.code} applied</Text>
                </View>
                <Pressable onPress={() => { setCouponApplied(null); setCouponCode(''); }}>
                  <Text style={{ fontSize: 12, color: Colors.danger, fontWeight: Typography.medium }}>Remove</Text>
                </Pressable>
              </View>
            ) : (
              <View>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TextInput
                    value={couponCode}
                    onChangeText={(t) => { setCouponCode(t.toUpperCase()); setCouponError(''); }}
                    placeholder="Enter coupon code"
                    placeholderTextColor={Colors.slate[400]}
                    autoCapitalize="characters"
                    style={{ flex: 1, height: 40, borderWidth: 1, borderColor: Colors.slate[200], borderRadius: Radius.base, paddingHorizontal: 12, fontSize: 14, color: Colors.slate[900] }}
                  />
                  <Pressable
                    onPress={applyCoupon}
                    disabled={couponLoading || !couponCode.trim()}
                    style={{ backgroundColor: couponCode.trim() ? Colors.epf[500] : Colors.slate[200], borderRadius: Radius.base, paddingHorizontal: 16, justifyContent: 'center' }}
                  >
                    <Text style={{ color: couponCode.trim() ? '#fff' : Colors.slate[400], fontSize: 13, fontWeight: Typography.semibold }}>
                      {couponLoading ? '...' : 'Apply'}
                    </Text>
                  </Pressable>
                </View>
                {couponError ? <Text style={{ fontSize: 12, color: Colors.danger, marginTop: 6 }}>{couponError}</Text> : null}
              </View>
            )}
          </View>

          {/* Order summary */}
          <View style={{ backgroundColor: Colors.bg.primary, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.slate[200], padding: 16, marginTop: 2 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 9 }}>
              <Text style={{ color: Colors.slate[500], fontSize: 14 }}>Subtotal</Text>
              <Text style={{ color: Colors.slate[900], fontWeight: Typography.semibold, fontSize: 14 }}>৳{subtotal.toLocaleString()}</Text>
            </View>
            {discount > 0 && (
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 9 }}>
                <Text style={{ color: '#059669', fontSize: 14 }}>Coupon Discount</Text>
                <Text style={{ color: '#059669', fontWeight: Typography.semibold, fontSize: 14 }}>-৳{discount.toLocaleString()}</Text>
              </View>
            )}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
              <Text style={{ color: Colors.slate[500], fontSize: 14 }}>Delivery</Text>
              <Text style={{ color: deliveryCharge === 0 ? '#059669' : Colors.slate[900], fontWeight: deliveryCharge === 0 ? Typography.semibold : Typography.normal, fontSize: 14 }}>
                {deliveryCharge === 0 ? 'FREE' : `৳${deliveryCharge}`}
              </Text>
            </View>
            <View style={{ height: 1, backgroundColor: Colors.slate[200], marginBottom: 13 }} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ color: Colors.slate[900], fontWeight: Typography.bold, fontSize: 17 }}>Total</Text>
              <Text style={{ color: Colors.epf[600], fontWeight: Typography.bold, fontSize: 21 }}>৳{total.toLocaleString()}</Text>
            </View>

            <Pressable
              style={({ pressed }) => ({ backgroundColor: pressed ? Colors.epf[600] : Colors.epf[500], borderRadius: Radius.lg, paddingVertical: 15, marginTop: 16, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' })}
              onPress={() => router.push('/checkout' as never)}
            >
              <Text style={{ color: '#fff', fontSize: 15, fontWeight: Typography.bold }}>Proceed to Checkout</Text>
              <ArrowRight size={17} color="#fff" style={{ marginLeft: 7 }} />
            </Pressable>

            <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 16, marginTop: 14 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <ShieldCheck size={14} color={Colors.success} />
                <Text style={{ color: Colors.slate[500], fontSize: 11, marginLeft: 4 }}>Secure checkout</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Truck size={14} color={Colors.epf[500]} />
                <Text style={{ color: Colors.slate[500], fontSize: 11, marginLeft: 4 }}>Fast delivery</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
