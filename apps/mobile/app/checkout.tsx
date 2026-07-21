import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Banknote,
  CheckCircle2,
  CreditCard,
  MapPin,
  Package,
  Phone,
  ShieldCheck,
  Smartphone,
  Tag,
  Truck,
  User,
} from 'lucide-react-native';
import { couponsApi, ordersApi, paymentsApi, api } from '@epowerfix/api-client';
import { toOrderItemPayload, useCartStore } from '@epowerfix/store';
import { useAuthStore } from '../src/store/auth';
import { Colors, Typography, Radius } from '../src/theme/design-system';

const AREAS = [
  'Mirpur',
  'Dhanmondi',
  'Gulshan',
  'Banani',
  'Uttara',
  'Mohammadpur',
  'Rampura',
  'Badda',
  'Bashundhara',
  'Wari',
  'Motijheel',
  'Tejgaon',
  'Mohakhali',
  'Cantonment',
  'Outside Dhaka',
];

const PAYMENT_METHODS = [
  { value: 'COD', label: 'Cash on Delivery', description: 'Pay when your order arrives', icon: Banknote },
  { value: 'BKASH', label: 'bKash', description: 'Secure mobile payment', icon: Smartphone },
  { value: 'NAGAD', label: 'Nagad', description: 'Secure mobile payment', icon: Smartphone },
  { value: 'SSLCOMMERZ', label: 'Card / Mobile Banking', description: 'SSLCommerz secure gateway', icon: CreditCard },
] as const;

type CheckoutForm = {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  address: string;
  area: string;
  notes: string;
  paymentMethod: (typeof PAYMENT_METHODS)[number]['value'];
};

type PendingOnlineOrder = {
  orderId: string;
  orderNumber: string;
  paymentMethod: Exclude<CheckoutForm['paymentMethod'], 'COD'>;
};

type RecoverableOnlineOrder = {
  id: string;
  orderNumber: string;
  paymentMethod: string;
};

function isOnlinePaymentMethod(
  value: string,
): value is PendingOnlineOrder['paymentMethod'] {
  return value === 'BKASH' || value === 'NAGAD' || value === 'SSLCOMMERZ';
}

function toPendingOnlineOrder(
  order: RecoverableOnlineOrder | null | undefined,
): PendingOnlineOrder | null {
  if (!order || !isOnlinePaymentMethod(order.paymentMethod)) return null;
  return {
    orderId: order.id,
    orderNumber: order.orderNumber,
    paymentMethod: order.paymentMethod,
  };
}

function createIdempotencyKey(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `mobile-checkout-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export default function CheckoutScreen() {
  const router = useRouter();
  const items = useCartStore((state) => state.items);
  const clearCart = useCartStore((state) => state.clearCart);
  const user = useAuthStore((state) => state.user);
  const authHydrated = useAuthStore((state) => state.hydrated);
  const [form, setForm] = useState<CheckoutForm>({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    address: '',
    area: '',
    notes: '',
    paymentMethod: 'COD',
  });
  const [shippingRates, setShippingRates] = useState({ insideDhaka: 60, outsideDhaka: 120, freeShippingThreshold: 0 });
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [discount, setDiscount] = useState(0);
  const [couponLoading, setCouponLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [checkingPayment, setCheckingPayment] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState<{ orderNumber: string; online: boolean } | null>(null);
  const [idempotencyKey, setIdempotencyKey] = useState<string | null>(null);
  const [pendingOnlineOrder, setPendingOnlineOrder] = useState<PendingOnlineOrder | null>(null);

  const getActivePendingOnlineOrder = useCallback(async (): Promise<PendingOnlineOrder | null> => {
    if (!user?.id) return null;
    const response = await ordersApi.getActivePaymentReservation();
    return toPendingOnlineOrder(response.data);
  }, [user?.id]);

  useEffect(() => {
    if (!authHydrated) return;
    if (!user?.id) {
      setPendingOnlineOrder(null);
      return;
    }

    let active = true;
    void getActivePendingOnlineOrder()
      .then((pending) => {
        if (!active || !pending) return;
        setPendingOnlineOrder(pending);
        setForm((current) => ({ ...current, paymentMethod: pending.paymentMethod }));
      })
      .catch(() => {
        // The server-side create guard still prevents a duplicate reservation
        // if recovery is temporarily unavailable.
      });

    return () => {
      active = false;
    };
  }, [authHydrated, getActivePendingOnlineOrder, user?.id]);

  useEffect(() => {
    if (!user) return;
    setForm((current) => ({
      ...current,
      customerName: current.customerName || user.name || '',
      customerPhone: current.customerPhone || user.phone || '',
      customerEmail: current.customerEmail || user.email || '',
      address: current.address || user.address || '',
      area: current.area || user.area || '',
    }));
  }, [user]);

  useEffect(() => {
    let active = true;
    void api
      .get<{ data: any }>('/api/settings')
      .then((response) => {
        if (!active) return;
        const settings = response.data || {};
        setShippingRates({
          insideDhaka: Number(settings.shippingInsideDhaka ?? 60),
          outsideDhaka: Number(settings.shippingOutsideDhaka ?? 120),
          freeShippingThreshold: Number(settings.freeShippingThreshold ?? 0),
        });
      })
      .catch(() => {
        // Backend order creation applies the same defaults when settings are unavailable.
      });
    return () => {
      active = false;
    };
  }, []);

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items]
  );
  const normalizedArea = form.area.trim().toLowerCase();
  const insideDhaka = normalizedArea === 'dhaka' || AREAS.slice(0, -1).some((area) => area.toLowerCase() === normalizedArea);
  let delivery = subtotal > 0 ? (insideDhaka ? shippingRates.insideDhaka : shippingRates.outsideDhaka) : 0;
  if (shippingRates.freeShippingThreshold > 0 && subtotal >= shippingRates.freeShippingThreshold) {
    delivery = 0;
  }
  const total = Math.max(0, subtotal + delivery - discount);

  const updateForm = <K extends keyof CheckoutForm>(key: K, value: CheckoutForm[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    setError('');
  };

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    setError('');
    try {
      const response = await couponsApi.validate(couponCode.trim(), subtotal);
      const coupon = response.data;
      setAppliedCoupon(coupon.code || couponCode.trim().toUpperCase());
      setDiscount(Math.round(Number(coupon.discount || 0)));
    } catch (couponError) {
      setAppliedCoupon(null);
      setDiscount(0);
      setError(couponError instanceof Error ? couponError.message : 'This coupon is not valid.');
    } finally {
      setCouponLoading(false);
    }
  };

  const openPendingPayment = async (pending: PendingOnlineOrder) => {
    const paymentMethod = pending.paymentMethod === 'SSLCOMMERZ'
      ? 'sslcommerz'
      : pending.paymentMethod.toLowerCase() as 'bkash' | 'nagad';
    const payment = await paymentsApi.initiate({
      orderId: pending.orderId,
      paymentMethod,
    });
    if (!payment.paymentUrl) {
      throw new Error('The payment gateway did not return a checkout link.');
    }
    await Linking.openURL(payment.paymentUrl);
  };

  const placeOrder = async () => {
    if (pendingOnlineOrder) {
      setSubmitting(true);
      setError('');
      try {
        await openPendingPayment(pendingOnlineOrder);
      } catch (paymentError) {
        setError(paymentError instanceof Error ? paymentError.message : 'Unable to reopen payment. Your cart has not been cleared.');
      } finally {
        setSubmitting(false);
      }
      return;
    }

    if (!form.customerName.trim() || form.customerPhone.trim().length < 6 || !form.address.trim() || !form.area.trim()) {
      setError('Please provide your name, a valid phone number, delivery address, and area.');
      return;
    }
    if (items.length === 0) {
      setError('Your cart is empty. Add a product before checkout.');
      return;
    }
    if (form.paymentMethod !== 'COD' && !user) {
      setError('Please log in before using an online payment method.');
      return;
    }

    const nextIdempotencyKey = idempotencyKey || createIdempotencyKey();
    setIdempotencyKey(nextIdempotencyKey);
    setSubmitting(true);
    setError('');
    try {
      const response = await ordersApi.create({
        customerName: form.customerName.trim(),
        customerPhone: form.customerPhone.trim(),
        customerEmail: form.customerEmail.trim() || undefined,
        address: form.address.trim(),
        area: form.area.trim(),
        notes: form.notes.trim() || undefined,
        couponCode: appliedCoupon || undefined,
        paymentMethod: form.paymentMethod,
        idempotencyKey: nextIdempotencyKey,
        items: items.map(toOrderItemPayload),
      });
      const order = response.data;
      if (!order?.id) {
        throw new Error('The order was created without an identifier.');
      }
      const orderNumber = String(order.orderNumber || order.id || '');

      if (form.paymentMethod !== 'COD') {
        const pending: PendingOnlineOrder = {
          orderId: String(order.id),
          orderNumber,
          paymentMethod: form.paymentMethod,
        };
        setPendingOnlineOrder(pending);
        setIdempotencyKey(null);
        await openPendingPayment(pending);
        return;
      }

      clearCart();
      setIdempotencyKey(null);
      setSuccess({ orderNumber, online: false });
    } catch (orderError) {
      let recoveredPending: PendingOnlineOrder | null = null;
      try {
        recoveredPending = await getActivePendingOnlineOrder();
      } catch {
        // Preserve the original checkout error when the recovery lookup is unavailable.
      }

      const recovered = recoveredPending;
      if (recovered) {
        setPendingOnlineOrder(recovered);
        setForm((current) => ({ ...current, paymentMethod: recovered.paymentMethod }));
        setError('Your existing online payment has been restored. Complete or verify it before placing another online order.');
      } else {
        setError(orderError instanceof Error ? orderError.message : 'Unable to place your order. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const checkPendingPayment = async () => {
    if (!pendingOnlineOrder) return;
    setCheckingPayment(true);
    setError('');
    try {
      const response = await ordersApi.getPaymentStatus(pendingOnlineOrder.orderId);
      const payment = response.data;
      if (payment.paymentStatus === 'PAID') {
        clearCart();
        setPendingOnlineOrder(null);
        setSuccess({ orderNumber: payment.orderNumber || pendingOnlineOrder.orderNumber, online: true });
        return;
      }
      if (payment.reservationStatus !== 'ACTIVE') {
        setPendingOnlineOrder(null);
        setError('This payment reservation is no longer active. Your cart is still available to place a new order.');
        return;
      }
      setError('Payment is still pending confirmation. You can reopen the same payment link without creating a duplicate order.');
    } catch (paymentError) {
      setError(paymentError instanceof Error ? paymentError.message : 'Unable to verify payment status. Your cart has not been changed.');
    } finally {
      setCheckingPayment(false);
    }
  };

  if (pendingOnlineOrder) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg.secondary }}>
        <View style={{ flex: 1, justifyContent: 'center', padding: 24 }}>
          <View style={{ backgroundColor: Colors.bg.primary, borderRadius: Radius.xl, borderWidth: 1, borderColor: Colors.slate[200], padding: 24, alignItems: 'center' }}>
            <View style={{ width: 70, height: 70, borderRadius: 35, backgroundColor: Colors.epf[50], alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
              <ShieldCheck size={38} color={Colors.epf[600]} />
            </View>
            <Text style={{ color: Colors.slate[900], fontSize: 22, fontWeight: Typography.bold, textAlign: 'center' }}>
              Complete Your Payment
            </Text>
            <Text style={{ color: Colors.slate[500], fontSize: 14, textAlign: 'center', lineHeight: 21, marginTop: 8 }}>
              Your order is reserved while the gateway confirms payment. Your cart will remain available until payment is verified.
            </Text>
            <Text style={{ color: Colors.epf[600], fontSize: 16, fontWeight: Typography.bold, marginTop: 14 }}>
              Order #{pendingOnlineOrder.orderNumber}
            </Text>
            {error ? <Text style={{ color: Colors.danger, fontSize: 13, lineHeight: 19, marginTop: 12, textAlign: 'center' }}>{error}</Text> : null}
            <View style={{ width: '100%', marginTop: 24, gap: 10 }}>
              <Pressable
                style={{ backgroundColor: Colors.epf[500], borderRadius: Radius.base, paddingVertical: 14, alignItems: 'center', opacity: submitting ? 0.7 : 1 }}
                disabled={submitting}
                onPress={placeOrder}
              >
                {submitting ? <ActivityIndicator color={Colors.text.inverse} /> : <Text style={{ color: Colors.text.inverse, fontWeight: Typography.bold }}>Open Secure Payment</Text>}
              </Pressable>
              <Pressable
                style={{ borderWidth: 1, borderColor: Colors.slate[200], borderRadius: Radius.base, paddingVertical: 14, alignItems: 'center', opacity: checkingPayment ? 0.7 : 1 }}
                disabled={checkingPayment}
                onPress={checkPendingPayment}
              >
                {checkingPayment ? <ActivityIndicator color={Colors.epf[600]} /> : <Text style={{ color: Colors.slate[800], fontWeight: Typography.semibold }}>Check Payment Status</Text>}
              </Pressable>
            </View>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (success) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg.secondary }}>
        <View style={{ flex: 1, justifyContent: 'center', padding: 24 }}>
          <View style={{ backgroundColor: Colors.bg.primary, borderRadius: Radius.xl, borderWidth: 1, borderColor: Colors.slate[200], padding: 24, alignItems: 'center' }}>
            <View style={{ width: 70, height: 70, borderRadius: 35, backgroundColor: '#ECFDF5', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
              <CheckCircle2 size={38} color={Colors.success} />
            </View>
            <Text style={{ color: Colors.slate[900], fontSize: 22, fontWeight: Typography.bold, textAlign: 'center' }}>
              Order placed successfully
            </Text>
            <Text style={{ color: Colors.slate[500], fontSize: 14, textAlign: 'center', lineHeight: 21, marginTop: 8 }}>
              {success.online ? 'Complete payment in your browser. Your order will update after the gateway confirms it.' : 'Thank you for your purchase. We will contact you shortly to confirm delivery.'}
            </Text>
            <Text style={{ color: Colors.epf[600], fontSize: 16, fontWeight: Typography.bold, marginTop: 14 }}>
              Order #{success.orderNumber}
            </Text>
            <View style={{ width: '100%', marginTop: 24, gap: 10 }}>
              <Pressable
                style={{ backgroundColor: Colors.epf[500], borderRadius: Radius.base, paddingVertical: 14, alignItems: 'center' }}
                onPress={() => router.push({ pathname: '/order-track', params: { orderNumber: success.orderNumber, phone: form.customerPhone } } as never)}
              >
                <Text style={{ color: Colors.text.inverse, fontWeight: Typography.bold }}>Track this order</Text>
              </Pressable>
              <Pressable
                style={{ borderWidth: 1, borderColor: Colors.slate[200], borderRadius: Radius.base, paddingVertical: 14, alignItems: 'center' }}
                onPress={() => router.replace('/(tabs)/shop')}
              >
                <Text style={{ color: Colors.slate[800], fontWeight: Typography.semibold }}>Continue shopping</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (items.length === 0) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg.secondary, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
        <Package size={42} color={Colors.slate[300]} />
        <Text style={{ color: Colors.slate[800], fontWeight: Typography.semibold, fontSize: 18, marginTop: 14 }}>Nothing to checkout</Text>
        <Pressable style={{ backgroundColor: Colors.epf[500], paddingHorizontal: 22, paddingVertical: 12, borderRadius: Radius.base, marginTop: 18 }} onPress={() => router.replace('/(tabs)/shop')}>
          <Text style={{ color: Colors.text.inverse, fontWeight: Typography.bold }}>Go to shop</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg.secondary }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ paddingBottom: 32 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={{ backgroundColor: Colors.bg.primary, padding: 16, borderBottomWidth: 1, borderBottomColor: Colors.slate[200], flexDirection: 'row', alignItems: 'center' }}>
            <Pressable onPress={() => router.back()} style={{ padding: 4, marginRight: 10 }}>
              <ArrowLeft size={21} color={Colors.slate[800]} />
            </Pressable>
            <View>
              <Text style={{ color: Colors.slate[900], fontSize: 22, fontWeight: Typography.bold }}>Checkout</Text>
              <Text style={{ color: Colors.slate[500], fontSize: 13, marginTop: 3 }}>{items.length} {items.length === 1 ? 'line item' : 'line items'}</Text>
            </View>
          </View>

          <View style={{ padding: 14 }}>
            {error ? (
              <View style={{ backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA', borderRadius: Radius.base, padding: 12, marginBottom: 12 }}>
                <Text style={{ color: Colors.danger, fontSize: 13, lineHeight: 19 }}>{error}</Text>
              </View>
            ) : null}

            <Section title="Contact information" icon={<User size={17} color={Colors.epf[600]} />}>
              <Field label="Full name" value={form.customerName} placeholder="Your full name" onChangeText={(value) => updateForm('customerName', value)} />
              <Field label="Phone number" value={form.customerPhone} placeholder="01XXXXXXXXX" keyboardType="phone-pad" onChangeText={(value) => updateForm('customerPhone', value)} />
              <Field label="Email (optional)" value={form.customerEmail} placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" onChangeText={(value) => updateForm('customerEmail', value)} />
            </Section>

            <Section title="Delivery address" icon={<MapPin size={17} color={Colors.epf[600]} />}>
              <Field label="Address" value={form.address} placeholder="House, road, block, and area details" onChangeText={(value) => updateForm('address', value)} multiline />
              <Text style={labelStyle}>Delivery area</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 4 }}>
                {AREAS.map((area) => (
                  <Pressable
                    key={area}
                    onPress={() => updateForm('area', area)}
                    style={{ paddingHorizontal: 12, paddingVertical: 9, borderRadius: Radius.full, borderWidth: 1, borderColor: form.area === area ? Colors.epf[500] : Colors.slate[200], backgroundColor: form.area === area ? Colors.epf[50] : Colors.bg.primary, marginRight: 7 }}
                  >
                    <Text style={{ color: form.area === area ? Colors.epf[700] : Colors.slate[600], fontSize: 12, fontWeight: Typography.medium }}>{area}</Text>
                  </Pressable>
                ))}
              </ScrollView>
              <Field label="Order notes (optional)" value={form.notes} placeholder="Any delivery instructions" onChangeText={(value) => updateForm('notes', value)} multiline />
            </Section>

            <Section title="Payment method" icon={<CreditCard size={17} color={Colors.epf[600]} />}>
              {PAYMENT_METHODS.map((method) => {
                const Icon = method.icon;
                const selected = form.paymentMethod === method.value;
                return (
                  <Pressable
                    key={method.value}
                    onPress={() => updateForm('paymentMethod', method.value)}
                    style={{ flexDirection: 'row', alignItems: 'center', padding: 12, borderWidth: 1.5, borderColor: selected ? Colors.epf[500] : Colors.slate[200], backgroundColor: selected ? Colors.epf[50] : Colors.bg.primary, borderRadius: Radius.base, marginBottom: 9 }}
                  >
                    <View style={{ width: 36, height: 36, borderRadius: Radius.md, backgroundColor: selected ? Colors.epf[500] : Colors.slate[100], alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
                      <Icon size={18} color={selected ? Colors.text.inverse : Colors.slate[600]} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: selected ? Colors.epf[700] : Colors.slate[900], fontWeight: Typography.semibold, fontSize: 14 }}>{method.label}</Text>
                      <Text style={{ color: Colors.slate[500], fontSize: 12, marginTop: 2 }}>{method.description}</Text>
                    </View>
                    {selected ? <CheckCircle2 size={19} color={Colors.epf[500]} /> : null}
                  </Pressable>
                );
              })}
              {form.paymentMethod !== 'COD' ? (
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', backgroundColor: Colors.epf[50], borderRadius: Radius.base, padding: 10 }}>
                  <ShieldCheck size={16} color={Colors.epf[600]} />
                  <Text style={{ flex: 1, color: Colors.epf[700], fontSize: 12, lineHeight: 18, marginLeft: 7 }}>You will be redirected to the secure gateway after the order is created.</Text>
                </View>
              ) : null}
            </Section>

            <Section title="Order summary" icon={<Package size={17} color={Colors.epf[600]} />}>
              {items.map((item) => (
                <View key={item.id} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.slate[100] }}>
                  <Text style={{ flex: 1, color: Colors.slate[700], fontSize: 13, paddingRight: 10 }} numberOfLines={2}>{item.productName} × {item.quantity}</Text>
                  <Text style={{ color: Colors.slate[900], fontWeight: Typography.semibold, fontSize: 13 }}>৳{Number(item.price * item.quantity).toLocaleString()}</Text>
                </View>
              ))}
              <View style={{ flexDirection: 'row', marginTop: 14, gap: 8 }}>
                <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: Colors.slate[200], borderRadius: Radius.base, paddingHorizontal: 10 }}>
                  <Tag size={15} color={Colors.slate[400]} />
                  <TextInput value={couponCode} onChangeText={setCouponCode} placeholder="Coupon code" placeholderTextColor={Colors.slate[400]} autoCapitalize="characters" style={{ flex: 1, paddingVertical: 10, marginLeft: 7, color: Colors.slate[900], fontSize: 13 }} />
                </View>
                <Pressable onPress={applyCoupon} disabled={couponLoading} style={{ borderWidth: 1, borderColor: Colors.slate[300], borderRadius: Radius.base, paddingHorizontal: 13, justifyContent: 'center' }}>
                  {couponLoading ? <ActivityIndicator size="small" color={Colors.epf[500]} /> : <Text style={{ color: Colors.slate[700], fontWeight: Typography.semibold, fontSize: 13 }}>Apply</Text>}
                </Pressable>
              </View>
              {appliedCoupon ? <Text style={{ color: Colors.success, fontSize: 12, marginTop: 7 }}>Coupon {appliedCoupon} applied.</Text> : null}
              <View style={{ height: 1, backgroundColor: Colors.slate[200], marginVertical: 13 }} />
              <SummaryRow label="Subtotal" value={`৳${Number(subtotal).toLocaleString()}`} />
              <SummaryRow label={`Delivery${form.area ? insideDhaka ? ' (Inside Dhaka)' : ' (Outside Dhaka)' : ''}`} value={delivery === 0 ? 'Free' : `৳${Number(delivery).toLocaleString()}`} />
              {discount > 0 ? <SummaryRow label="Discount" value={`-৳${Number(discount).toLocaleString()}`} color={Colors.success} /> : null}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 11 }}>
                <Text style={{ color: Colors.slate[900], fontSize: 17, fontWeight: Typography.bold }}>Total</Text>
                <Text style={{ color: Colors.epf[600], fontSize: 21, fontWeight: Typography.bold }}>৳{Number(total).toLocaleString()}</Text>
              </View>
            </Section>

            <Pressable onPress={placeOrder} disabled={submitting} style={({ pressed }) => ({ backgroundColor: pressed ? Colors.epf[600] : Colors.epf[500], borderRadius: Radius.base, paddingVertical: 16, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', opacity: submitting ? 0.7 : 1 })}>
              {submitting ? <ActivityIndicator color={Colors.text.inverse} /> : <><Package size={17} color={Colors.text.inverse} /><Text style={{ color: Colors.text.inverse, fontWeight: Typography.bold, fontSize: 15, marginLeft: 7 }}>Place order · ৳{Number(total).toLocaleString()}</Text></>}
            </Pressable>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 13 }}>
              <Truck size={14} color={Colors.epf[500]} />
              <Text style={{ color: Colors.slate[500], fontSize: 11, marginLeft: 5 }}>Delivery usually takes 2–5 business days</Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <View style={{ backgroundColor: Colors.bg.primary, borderWidth: 1, borderColor: Colors.slate[200], borderRadius: Radius.lg, padding: 15, marginBottom: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
        <View style={{ width: 30, height: 30, borderRadius: Radius.md, backgroundColor: Colors.epf[50], alignItems: 'center', justifyContent: 'center' }}>{icon}</View>
        <Text style={{ color: Colors.slate[900], fontWeight: Typography.semibold, fontSize: 16, marginLeft: 9 }}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

function Field({
  label,
  value,
  placeholder,
  onChangeText,
  keyboardType,
  autoCapitalize,
  multiline = false,
}: {
  label: string;
  value: string;
  placeholder: string;
  onChangeText: (value: string) => void;
  keyboardType?: 'default' | 'email-address' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  multiline?: boolean;
}) {
  return (
    <View style={{ marginBottom: 13 }}>
      <Text style={labelStyle}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.slate[400]}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : 'center'}
        style={{ borderWidth: 1, borderColor: Colors.slate[200], borderRadius: Radius.base, backgroundColor: Colors.bg.primary, paddingHorizontal: 11, paddingVertical: multiline ? 11 : 12, color: Colors.slate[900], fontSize: 14, minHeight: multiline ? 74 : undefined }}
      />
    </View>
  );
}

function SummaryRow({ label, value, color = Colors.slate[900] }: { label: string; value: string; color?: string }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
      <Text style={{ color: Colors.slate[500], fontSize: 14 }}>{label}</Text>
      <Text style={{ color, fontSize: 14, fontWeight: Typography.medium }}>{value}</Text>
    </View>
  );
}

const labelStyle = {
  color: Colors.slate[700],
  fontSize: 13,
  fontWeight: Typography.medium as '500',
  marginBottom: 7,
};
