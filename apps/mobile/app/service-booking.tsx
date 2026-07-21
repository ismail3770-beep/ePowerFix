import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, CalendarDays, CheckCircle2, Clock3, MapPin, Phone, Wrench } from 'lucide-react-native';
import { servicesApi } from '@epowerfix/api-client';
import { useAuthStore } from '../src/store/auth';
import { Colors, Typography, Radius } from '../src/theme/design-system';

const TIME_SLOTS = ['09:00 AM', '11:00 AM', '01:00 PM', '03:00 PM', '05:00 PM'];

function dateAfterDays(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function firstParam(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] || '' : value || '';
}

export default function ServiceBookingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ serviceId?: string; serviceName?: string; basePrice?: string }>();
  const user = useAuthStore((state) => state.user);
  const serviceId = firstParam(params.serviceId);
  const serviceName = firstParam(params.serviceName) || 'Electrical service';
  const basePrice = firstParam(params.basePrice);
  const [bookingDate, setBookingDate] = useState(dateAfterDays(1));
  const [bookingTime, setBookingTime] = useState(TIME_SLOTS[0]);
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!user) return;
    setAddress((current) => current || [user.address, user.area, user.city].filter(Boolean).join(', '));
    setPhone((current) => current || user.phone || '');
  }, [user]);

  const displayDate = useMemo(() => {
    const parsed = new Date(`${bookingDate}T00:00:00`);
    return Number.isNaN(parsed.getTime()) ? '' : parsed.toLocaleDateString();
  }, [bookingDate]);

  const submit = async () => {
    const selectedDate = new Date(`${bookingDate}T00:00:00`);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (!serviceId) {
      setError('This service is unavailable. Please return and select it again.');
      return;
    }
    if (!bookingDate || Number.isNaN(selectedDate.getTime()) || selectedDate < today) {
      setError('Please choose today or a future date using YYYY-MM-DD.');
      return;
    }
    if (address.trim().length < 3 || phone.trim().length < 6) {
      setError('Please enter a valid service address and phone number.');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      await servicesApi.book({
        customerName: user?.name || undefined,
        customerEmail: user?.email || undefined,
        serviceId,
        bookingDate,
        bookingTime,
        address: address.trim(),
        phone: phone.trim(),
        notes: notes.trim() || undefined,
      });
      setSuccess(true);
    } catch (bookingError) {
      setError(bookingError instanceof Error ? bookingError.message : 'Unable to create booking. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg.secondary }}>
        <View style={{ flex: 1, justifyContent: 'center', padding: 24 }}>
          <View style={{ backgroundColor: Colors.bg.primary, borderRadius: Radius.xl, borderWidth: 1, borderColor: Colors.slate[200], padding: 24, alignItems: 'center' }}>
            <View style={{ width: 70, height: 70, borderRadius: 35, backgroundColor: '#ECFDF5', alignItems: 'center', justifyContent: 'center', marginBottom: 17 }}><CheckCircle2 size={39} color={Colors.success} /></View>
            <Text style={{ color: Colors.slate[900], fontSize: 22, fontWeight: Typography.bold, textAlign: 'center' }}>Booking request sent</Text>
            <Text style={{ color: Colors.slate[500], fontSize: 14, lineHeight: 21, textAlign: 'center', marginTop: 8 }}>Our team will call you to confirm your appointment.</Text>
            <View style={{ backgroundColor: Colors.slate[50], borderRadius: Radius.md, padding: 12, width: '100%', marginTop: 17 }}>
              <Text style={{ color: Colors.slate[900], fontWeight: Typography.semibold, fontSize: 14 }}>{serviceName}</Text>
              <Text style={{ color: Colors.slate[500], fontSize: 13, marginTop: 5 }}>{displayDate} · {bookingTime}</Text>
            </View>
            <Pressable style={{ backgroundColor: Colors.epf[500], borderRadius: Radius.base, paddingVertical: 14, width: '100%', alignItems: 'center', marginTop: 20 }} onPress={() => router.replace('/(tabs)/services')}>
              <Text style={{ color: Colors.text.inverse, fontWeight: Typography.bold }}>Back to services</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg.secondary }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ paddingBottom: 32 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={{ backgroundColor: Colors.bg.primary, padding: 16, borderBottomWidth: 1, borderBottomColor: Colors.slate[200], flexDirection: 'row', alignItems: 'center' }}>
            <Pressable onPress={() => router.back()} style={{ padding: 4, marginRight: 10 }}><ArrowLeft size={21} color={Colors.slate[800]} /></Pressable>
            <View style={{ flex: 1 }}><Text style={{ color: Colors.slate[900], fontSize: 21, fontWeight: Typography.bold }}>Book a service</Text><Text style={{ color: Colors.slate[500], fontSize: 13, marginTop: 3 }}>Choose a convenient appointment time</Text></View>
          </View>

          <View style={{ padding: 14 }}>
            <View style={{ backgroundColor: Colors.slate[900], borderRadius: Radius.xl, padding: 17, flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <View style={{ width: 44, height: 44, borderRadius: Radius.md, backgroundColor: 'rgba(14,165,233,0.18)', alignItems: 'center', justifyContent: 'center' }}><Wrench size={22} color={Colors.epf[400]} /></View>
              <View style={{ flex: 1, marginLeft: 11 }}><Text style={{ color: Colors.text.inverse, fontSize: 16, fontWeight: Typography.bold }}>{serviceName}</Text><Text style={{ color: Colors.slate[300], fontSize: 13, marginTop: 4 }}>{basePrice ? `Starting from ৳${Number(basePrice).toLocaleString()}` : 'Our team will confirm the final quote'}</Text></View>
            </View>

            {error ? <View style={{ backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA', borderRadius: Radius.base, padding: 12, marginBottom: 12 }}><Text style={{ color: Colors.danger, fontSize: 13, lineHeight: 19 }}>{error}</Text></View> : null}

            <View style={cardStyle}>
              <View style={sectionTitle}><View style={iconBox}><CalendarDays size={17} color={Colors.epf[600]} /></View><Text style={titleStyle}>Appointment details</Text></View>
              <Text style={labelStyle}>Date (YYYY-MM-DD)</Text>
              <View style={inputWrap}><CalendarDays size={16} color={Colors.slate[400]} /><TextInput value={bookingDate} onChangeText={setBookingDate} placeholder="2026-07-16" placeholderTextColor={Colors.slate[400]} keyboardType="numbers-and-punctuation" style={inputStyle} /></View>
              <Text style={labelStyle}>Preferred time</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 3 }}>
                {TIME_SLOTS.map((time) => <Pressable key={time} onPress={() => setBookingTime(time)} style={{ borderWidth: 1, borderColor: bookingTime === time ? Colors.epf[500] : Colors.slate[200], backgroundColor: bookingTime === time ? Colors.epf[50] : Colors.bg.primary, borderRadius: Radius.base, paddingHorizontal: 11, paddingVertical: 9, flexDirection: 'row', alignItems: 'center' }}><Clock3 size={14} color={bookingTime === time ? Colors.epf[600] : Colors.slate[500]} /><Text style={{ color: bookingTime === time ? Colors.epf[700] : Colors.slate[600], fontSize: 12, fontWeight: Typography.medium, marginLeft: 5 }}>{time}</Text></Pressable>)}
              </View>
            </View>

            <View style={cardStyle}>
              <View style={sectionTitle}><View style={iconBox}><MapPin size={17} color={Colors.epf[600]} /></View><Text style={titleStyle}>Visit details</Text></View>
              <Text style={labelStyle}>Service address</Text>
              <TextInput value={address} onChangeText={setAddress} placeholder="House, road, area, city" placeholderTextColor={Colors.slate[400]} multiline textAlignVertical="top" style={[inputBaseStyle, { minHeight: 74 }]} />
              <Text style={labelStyle}>Phone number</Text>
              <View style={inputWrap}><Phone size={16} color={Colors.slate[400]} /><TextInput value={phone} onChangeText={setPhone} placeholder="01XXXXXXXXX" placeholderTextColor={Colors.slate[400]} keyboardType="phone-pad" style={inputStyle} /></View>
              <Text style={labelStyle}>Notes (optional)</Text>
              <TextInput value={notes} onChangeText={setNotes} placeholder="Tell us what help you need" placeholderTextColor={Colors.slate[400]} multiline textAlignVertical="top" style={[inputBaseStyle, { minHeight: 74 }]} />
            </View>

            <Pressable onPress={submit} disabled={submitting} style={({ pressed }) => ({ backgroundColor: pressed ? Colors.epf[600] : Colors.epf[500], borderRadius: Radius.base, paddingVertical: 16, alignItems: 'center', opacity: submitting ? 0.7 : 1 })}>{submitting ? <ActivityIndicator color={Colors.text.inverse} /> : <Text style={{ color: Colors.text.inverse, fontWeight: Typography.bold, fontSize: 15 }}>Request booking</Text>}</Pressable>
            <Text style={{ color: Colors.slate[400], fontSize: 11, textAlign: 'center', lineHeight: 17, marginTop: 11 }}>Booking requests are confirmed by our support team before the visit.</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const cardStyle = { backgroundColor: Colors.bg.primary, borderWidth: 1, borderColor: Colors.slate[200], borderRadius: Radius.lg, padding: 15, marginBottom: 12 };
const sectionTitle = { flexDirection: 'row' as const, alignItems: 'center' as const, marginBottom: 14 };
const iconBox = { width: 30, height: 30, borderRadius: Radius.md, backgroundColor: Colors.epf[50], alignItems: 'center' as const, justifyContent: 'center' as const };
const titleStyle = { color: Colors.slate[900], fontWeight: Typography.semibold as '600', fontSize: 16, marginLeft: 9 };
const labelStyle = { color: Colors.slate[700], fontSize: 13, fontWeight: Typography.medium as '500', marginBottom: 7, marginTop: 2 };
const inputWrap = { flexDirection: 'row' as const, alignItems: 'center' as const, borderWidth: 1, borderColor: Colors.slate[200], borderRadius: Radius.base, paddingHorizontal: 10, marginBottom: 13 };
const inputStyle = { flex: 1, paddingVertical: 12, marginLeft: 7, color: Colors.slate[900], fontSize: 14 };
const inputBaseStyle = { borderWidth: 1, borderColor: Colors.slate[200], borderRadius: Radius.base, paddingHorizontal: 11, paddingVertical: 11, color: Colors.slate[900], fontSize: 14, marginBottom: 13 };
