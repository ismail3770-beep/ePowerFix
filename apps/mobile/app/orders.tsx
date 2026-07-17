import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, ChevronRight, Package, Truck } from 'lucide-react-native';
import { ordersApi } from '@epowerfix/api-client';
import { useAuthStore } from '../src/store/auth';
import { Colors, Typography, Radius } from '../src/theme/design-system';

export default function OrdersScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadOrders = useCallback(async () => {
    if (!user) {
      setLoading(false);
      setOrders([]);
      return;
    }
    try {
      setError('');
      const response = await ordersApi.list();
      setOrders(Array.isArray(response.data) ? response.data : []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load orders');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  if (!user) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg.secondary }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <Package size={42} color={Colors.slate[300]} />
          <Text style={{ color: Colors.slate[900], fontSize: 19, fontWeight: Typography.semibold, marginTop: 14 }}>Sign in to view orders</Text>
          <Text style={{ color: Colors.slate[500], fontSize: 14, textAlign: 'center', marginTop: 7, lineHeight: 20 }}>Your order history is securely linked to your ePowerFix account.</Text>
          <Pressable style={{ backgroundColor: Colors.epf[500], borderRadius: Radius.base, paddingHorizontal: 24, paddingVertical: 13, marginTop: 18 }} onPress={() => router.push('/login')}>
            <Text style={{ color: Colors.text.inverse, fontWeight: Typography.bold }}>Login / Register</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg.secondary }}>
      <View style={{ backgroundColor: Colors.bg.primary, padding: 16, borderBottomWidth: 1, borderBottomColor: Colors.slate[200], flexDirection: 'row', alignItems: 'center' }}>
        <Pressable onPress={() => router.back()} style={{ padding: 4, marginRight: 10 }}>
          <ArrowLeft size={21} color={Colors.slate[800]} />
        </Pressable>
        <View>
          <Text style={{ color: Colors.slate[900], fontSize: 22, fontWeight: Typography.bold }}>My Orders</Text>
          <Text style={{ color: Colors.slate[500], fontSize: 13, marginTop: 3 }}>{orders.length} {orders.length === 1 ? 'order' : 'orders'}</Text>
        </View>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator size="large" color={Colors.epf[500]} /></View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 14, flexGrow: orders.length === 0 ? 1 : undefined }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void loadOrders(); }} tintColor={Colors.epf[500]} />}
          ListEmptyComponent={
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
              <Package size={40} color={Colors.slate[300]} />
              <Text style={{ color: Colors.slate[800], fontSize: 17, fontWeight: Typography.semibold, marginTop: 13 }}>No orders yet</Text>
              <Text style={{ color: Colors.slate[500], fontSize: 13, textAlign: 'center', marginTop: 6 }}>Your completed purchases will appear here.</Text>
              <Pressable style={{ backgroundColor: Colors.epf[500], borderRadius: Radius.base, paddingHorizontal: 20, paddingVertical: 11, marginTop: 17 }} onPress={() => router.replace('/(tabs)/shop')}>
                <Text style={{ color: Colors.text.inverse, fontWeight: Typography.semibold }}>Browse products</Text>
              </Pressable>
            </View>
          }
          renderItem={({ item }) => {
            const status = String(item.status || 'PENDING');
            const statusColor = status === 'DELIVERED' ? Colors.success : status === 'CANCELLED' ? Colors.danger : Colors.epf[600];
            const date = item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '';
            const itemCount = Array.isArray(item.items) ? item.items.reduce((sum: number, line: any) => sum + Number(line.quantity || 0), 0) : 0;
            const phone = item.customerPhone || user.phone || '';
            return (
              <View style={{ backgroundColor: Colors.bg.primary, borderWidth: 1, borderColor: Colors.slate[200], borderRadius: Radius.lg, padding: 15, marginBottom: 11 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ width: 38, height: 38, borderRadius: Radius.md, backgroundColor: Colors.epf[50], alignItems: 'center', justifyContent: 'center' }}><Package size={19} color={Colors.epf[600]} /></View>
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={{ color: Colors.slate[900], fontWeight: Typography.semibold, fontSize: 15 }}>#{item.orderNumber || item.id}</Text>
                    <Text style={{ color: Colors.slate[500], fontSize: 12, marginTop: 3 }}>{date}{itemCount ? ` · ${itemCount} item${itemCount === 1 ? '' : 's'}` : ''}</Text>
                  </View>
                  <View style={{ backgroundColor: `${statusColor}18`, borderRadius: Radius.full, paddingHorizontal: 9, paddingVertical: 5 }}>
                    <Text style={{ color: statusColor, fontSize: 11, fontWeight: Typography.bold }}>{status.replace('_', ' ')}</Text>
                  </View>
                </View>
                {Array.isArray(item.items) ? (
                  <Text style={{ color: Colors.slate[600], fontSize: 13, lineHeight: 19, marginTop: 13 }} numberOfLines={2}>
                    {item.items.map((line: any) => `${line.productName || 'Item'} ×${line.quantity}`).join(' · ')}
                  </Text>
                ) : null}
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 13, paddingTop: 11, borderTopWidth: 1, borderTopColor: Colors.slate[100] }}>
                  <Text style={{ color: Colors.slate[500], fontSize: 13 }}>Total <Text style={{ color: Colors.slate[900], fontWeight: Typography.bold }}>৳{Number(item.total || 0).toLocaleString()}</Text></Text>
                  <Pressable style={{ flexDirection: 'row', alignItems: 'center' }} onPress={() => router.push({ pathname: '/order-track', params: { orderNumber: String(item.orderNumber || ''), phone } } as never)}>
                    <Truck size={15} color={Colors.epf[600]} />
                    <Text style={{ color: Colors.epf[600], fontSize: 13, fontWeight: Typography.semibold, marginLeft: 5 }}>Track</Text>
                    <ChevronRight size={16} color={Colors.epf[600]} />
                  </Pressable>
                </View>
              </View>
            );
          }}
        />
      )}
      {error ? <Text style={{ color: Colors.danger, fontSize: 12, textAlign: 'center', paddingHorizontal: 16, paddingBottom: 10 }}>{error}</Text> : null}
    </SafeAreaView>
  );
}
