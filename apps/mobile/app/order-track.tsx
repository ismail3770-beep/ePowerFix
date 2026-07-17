import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, CheckCircle2, Package, Search, Truck } from 'lucide-react-native';
import { ordersApi } from '@epowerfix/api-client';
import { Colors, Typography, Radius } from '../src/theme/design-system';

function firstParam(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] || '' : value || '';
}

export default function OrderTrackScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ orderNumber?: string; phone?: string }>();
  const [orderNumber, setOrderNumber] = useState(firstParam(params.orderNumber));
  const [phone, setPhone] = useState(firstParam(params.phone));
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const number = firstParam(params.orderNumber);
    const customerPhone = firstParam(params.phone);
    if (number && customerPhone) {
      setOrderNumber(number);
      setPhone(customerPhone);
      void track(number, customerPhone);
    }
    // Track only the incoming route values; manual searches call track directly.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.orderNumber, params.phone]);

  const track = async (number = orderNumber, customerPhone = phone) => {
    if (!number.trim() || !customerPhone.trim()) {
      setError('Enter both your order number and phone number.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const response = await ordersApi.track(number.trim(), customerPhone.trim());
      setOrder(response.data);
    } catch (trackError) {
      setOrder(null);
      setError(trackError instanceof Error ? trackError.message : 'Order not found. Check your details and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg.secondary }}>
      <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 28 }}>
        <View style={{ backgroundColor: Colors.bg.primary, padding: 16, borderBottomWidth: 1, borderBottomColor: Colors.slate[200], flexDirection: 'row', alignItems: 'center' }}>
          <Pressable onPress={() => router.back()} style={{ padding: 4, marginRight: 10 }}><ArrowLeft size={21} color={Colors.slate[800]} /></Pressable>
          <View>
            <Text style={{ color: Colors.slate[900], fontSize: 22, fontWeight: Typography.bold }}>Track Order</Text>
            <Text style={{ color: Colors.slate[500], fontSize: 13, marginTop: 3 }}>See the latest delivery status</Text>
          </View>
        </View>

        <View style={{ padding: 14 }}>
          <View style={{ backgroundColor: Colors.bg.primary, borderWidth: 1, borderColor: Colors.slate[200], borderRadius: Radius.lg, padding: 15 }}>
            <Text style={{ color: Colors.slate[900], fontWeight: Typography.semibold, fontSize: 16, marginBottom: 12 }}>Find your order</Text>
            <Text style={labelStyle}>Order number</Text>
            <View style={inputWrap}>
              <Package size={16} color={Colors.slate[400]} />
              <TextInput value={orderNumber} onChangeText={setOrderNumber} placeholder="e.g. EPF-20260715-0001" placeholderTextColor={Colors.slate[400]} autoCapitalize="characters" style={inputStyle} />
            </View>
            <Text style={labelStyle}>Phone number</Text>
            <View style={inputWrap}>
              <Truck size={16} color={Colors.slate[400]} />
              <TextInput value={phone} onChangeText={setPhone} placeholder="The phone used at checkout" placeholderTextColor={Colors.slate[400]} keyboardType="phone-pad" style={inputStyle} />
            </View>
            <Pressable onPress={() => void track()} disabled={loading} style={{ backgroundColor: Colors.epf[500], borderRadius: Radius.base, paddingVertical: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', opacity: loading ? 0.7 : 1 }}>
              {loading ? <ActivityIndicator color={Colors.text.inverse} /> : <><Search size={17} color={Colors.text.inverse} /><Text style={{ color: Colors.text.inverse, fontWeight: Typography.bold, marginLeft: 7 }}>Track order</Text></>}
            </Pressable>
          </View>

          {error ? <View style={{ backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA', borderRadius: Radius.base, padding: 12, marginTop: 12 }}><Text style={{ color: Colors.danger, fontSize: 13 }}>{error}</Text></View> : null}

          {order ? (
            <View style={{ backgroundColor: Colors.bg.primary, borderWidth: 1, borderColor: Colors.slate[200], borderRadius: Radius.lg, padding: 15, marginTop: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 13 }}>
                <View style={{ width: 40, height: 40, borderRadius: Radius.md, backgroundColor: Colors.epf[50], alignItems: 'center', justifyContent: 'center' }}><Truck size={20} color={Colors.epf[600]} /></View>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={{ color: Colors.slate[900], fontWeight: Typography.bold, fontSize: 16 }}>#{order.orderNumber}</Text>
                  <Text style={{ color: Colors.slate[500], fontSize: 12, marginTop: 3 }}>{order.createdAt ? new Date(order.createdAt).toLocaleString() : ''}</Text>
                </View>
                <View style={{ backgroundColor: Colors.epf[50], borderRadius: Radius.full, paddingHorizontal: 9, paddingVertical: 5 }}><Text style={{ color: Colors.epf[700], fontWeight: Typography.bold, fontSize: 11 }}>{String(order.status || 'PENDING').replace('_', ' ')}</Text></View>
              </View>

              <View style={{ backgroundColor: Colors.slate[50], borderRadius: Radius.md, padding: 12, marginBottom: 13 }}>
                <InfoRow label="Payment" value={`${order.paymentMethod || 'COD'} · ${order.paymentStatus || 'PENDING'}`} />
                <InfoRow label="Total" value={`৳${Number(order.total || 0).toLocaleString()}`} />
                <InfoRow label="Items" value={Array.isArray(order.items) ? `${order.items.length} line item${order.items.length === 1 ? '' : 's'}` : '—'} last />
              </View>

              <Text style={{ color: Colors.slate[900], fontWeight: Typography.semibold, fontSize: 15, marginBottom: 10 }}>Order progress</Text>
              {Array.isArray(order.histories) && order.histories.length > 0 ? order.histories.map((history: any, index: number) => (
                <View key={history.id || `${history.status}-${index}`} style={{ flexDirection: 'row', marginBottom: index === order.histories.length - 1 ? 0 : 12 }}>
                  <View style={{ alignItems: 'center', width: 24 }}>
                    <CheckCircle2 size={18} color={index === order.histories.length - 1 ? Colors.epf[500] : Colors.success} />
                    {index < order.histories.length - 1 ? <View style={{ width: 1, flex: 1, backgroundColor: Colors.slate[200], marginTop: 3 }} /> : null}
                  </View>
                  <View style={{ flex: 1, marginLeft: 9 }}>
                    <Text style={{ color: Colors.slate[800], fontWeight: Typography.semibold, fontSize: 13 }}>{String(history.status || '').replace('_', ' ')}</Text>
                    <Text style={{ color: Colors.slate[500], fontSize: 12, marginTop: 2 }}>{history.note || 'Order status updated'}{history.createdAt ? ` · ${new Date(history.createdAt).toLocaleString()}` : ''}</Text>
                  </View>
                </View>
              )) : (
                <Text style={{ color: Colors.slate[500], fontSize: 13 }}>Your order has been received and is waiting for confirmation.</Text>
              )}
            </View>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({ label, value, last = false }: { label: string; value: string; last?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingBottom: last ? 0 : 8, marginBottom: last ? 0 : 8, borderBottomWidth: last ? 0 : 1, borderBottomColor: Colors.slate[200] }}>
      <Text style={{ color: Colors.slate[500], fontSize: 13 }}>{label}</Text>
      <Text style={{ color: Colors.slate[800], fontWeight: Typography.semibold, fontSize: 13 }}>{value}</Text>
    </View>
  );
}

const labelStyle = { color: Colors.slate[700], fontSize: 13, fontWeight: Typography.medium as '500', marginBottom: 6 };
const inputWrap = { flexDirection: 'row' as const, alignItems: 'center' as const, borderWidth: 1, borderColor: Colors.slate[200], borderRadius: Radius.base, paddingHorizontal: 10, marginBottom: 12 };
const inputStyle = { flex: 1, paddingVertical: 12, marginLeft: 7, color: Colors.slate[900], fontSize: 14 };
