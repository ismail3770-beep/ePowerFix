// ═══════════════════════════════════════════════════════════════════════════
// Order Success — Confirmation with order number, delivery estimate, actions
// ═══════════════════════════════════════════════════════════════════════════

import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CheckCircle2, Package, Truck, ShoppingBag } from 'lucide-react-native';
import { Colors, Typography, Radius } from '../src/theme/design-system';

export default function OrderSuccessScreen() {
  const router = useRouter();
  const { orderNumber, orderId } = useLocalSearchParams<{ orderNumber?: string; orderId?: string }>();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg.primary }}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
        {/* Success icon */}
        <View style={{ width: 88, height: 88, borderRadius: 44, backgroundColor: '#ECFDF5', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
          <CheckCircle2 size={44} color="#059669" />
        </View>

        <Text style={{ fontSize: 24, fontWeight: Typography.bold, color: Colors.slate[900], textAlign: 'center' }}>
          Order Confirmed!
        </Text>
        <Text style={{ fontSize: 14, color: Colors.slate[500], textAlign: 'center', marginTop: 8, lineHeight: 21 }}>
          Thank you for your purchase. Your order has been placed successfully.
        </Text>

        {/* Order number */}
        {orderNumber ? (
          <View style={{ marginTop: 24, backgroundColor: Colors.slate[50], borderRadius: Radius.xl, padding: 16, width: '100%', alignItems: 'center', borderWidth: 1, borderColor: Colors.slate[200] }}>
            <Text style={{ fontSize: 12, color: Colors.slate[500], textTransform: 'uppercase', letterSpacing: 1 }}>Order Number</Text>
            <Text style={{ fontSize: 20, fontWeight: Typography.bold, color: Colors.epf[600], marginTop: 4 }}>{orderNumber}</Text>
          </View>
        ) : null}

        {/* Delivery estimate */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 20, gap: 8 }}>
          <Truck size={16} color={Colors.slate[400]} />
          <Text style={{ fontSize: 13, color: Colors.slate[500] }}>Estimated delivery: 2-4 business days</Text>
        </View>

        {/* Actions */}
        <View style={{ width: '100%', marginTop: 36, gap: 12 }}>
          <Pressable
            onPress={() => router.push('/orders' as never)}
            style={{ backgroundColor: Colors.epf[500], borderRadius: Radius.lg, paddingVertical: 15, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}
          >
            <Package size={18} color="#fff" />
            <Text style={{ color: '#fff', fontSize: 15, fontWeight: Typography.semibold }}>Track Order</Text>
          </Pressable>
          <Pressable
            onPress={() => router.push('/(tabs)/shop')}
            style={{ backgroundColor: Colors.slate[100], borderRadius: Radius.lg, paddingVertical: 15, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8, borderWidth: 1, borderColor: Colors.slate[200] }}
          >
            <ShoppingBag size={18} color={Colors.slate[700]} />
            <Text style={{ color: Colors.slate[700], fontSize: 15, fontWeight: Typography.semibold }}>Continue Shopping</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
