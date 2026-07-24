// ═══════════════════════════════════════════════════════════════════════════
// Services Tab — Enhanced with categories, featured, how it works
// ═══════════════════════════════════════════════════════════════════════════

import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowRight, CalendarDays, Wrench, Shield, Clock, Star, Zap } from 'lucide-react-native';
import { servicesApi } from '@epowerfix/api-client';
import { Colors, Typography, Radius } from '../../src/theme/design-system';

const SERVICE_CATEGORIES = [
  { label: 'All', value: '' },
  { label: 'Wiring', value: 'wiring' },
  { label: 'Repair', value: 'repair' },
  { label: 'Installation', value: 'installation' },
  { label: 'Maintenance', value: 'maintenance' },
];

const HOW_IT_WORKS = [
  { icon: CalendarDays, title: 'Book Service', desc: 'Choose date & time' },
  { icon: Zap, title: 'Get Matched', desc: 'Verified electrician assigned' },
  { icon: Shield, title: 'Get It Done', desc: 'Quality work guaranteed' },
];

export default function ServicesScreen() {
  const router = useRouter();
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [activeCategory, setActiveCategory] = useState('');

  const loadServices = useCallback(async () => {
    try {
      setError('');
      const response = await servicesApi.list();
      setServices(Array.isArray(response.data?.services) ? response.data.services : []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load services');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { void loadServices(); }, [loadServices]);

  const filteredServices = activeCategory
    ? services.filter((s) => (s.category || s.type || '').toLowerCase().includes(activeCategory))
    : services;

  const openBooking = (service: any) => {
    router.push({
      pathname: '/service-booking',
      params: {
        serviceId: String(service.id),
        serviceName: String(service.name || 'Electrical service'),
        basePrice: String(service.basePrice ?? ''),
      },
    } as never);
  };

  const renderServiceCard = ({ item }: { item: any }) => (
    <View style={{
      backgroundColor: Colors.bg.primary, borderRadius: Radius.xl, padding: 16,
      marginHorizontal: 16, marginBottom: 12, borderWidth: 1, borderColor: Colors.slate[200],
      flexDirection: 'row',
    }}>
      <View style={{ width: 50, height: 50, borderRadius: 14, backgroundColor: Colors.epf[50], alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
        <Wrench size={22} color={Colors.epf[500]} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 15, fontWeight: Typography.bold, color: Colors.slate[900] }}>{item.name}</Text>
        <Text style={{ color: Colors.slate[500], fontSize: 13, marginTop: 3, lineHeight: 18 }} numberOfLines={2}>
          {item.shortDesc || item.description || 'Professional electrical service'}
        </Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
          <View>
            <Text style={{ color: Colors.slate[400], fontSize: 11 }}>Starting from</Text>
            <Text style={{ fontSize: 16, fontWeight: Typography.bold, color: Colors.epf[600], marginTop: 1 }}>
              {item.basePrice ? `৳${Number(item.basePrice).toLocaleString()}` : 'Contact us'}
            </Text>
          </View>
          <Pressable
            onPress={() => openBooking(item)}
            style={({ pressed }) => ({ backgroundColor: pressed ? Colors.epf[600] : Colors.epf[500], borderRadius: Radius.lg, paddingHorizontal: 14, paddingVertical: 9, flexDirection: 'row', alignItems: 'center', gap: 5 })}
          >
            <CalendarDays size={14} color="#fff" />
            <Text style={{ color: '#fff', fontSize: 12, fontWeight: Typography.semibold }}>Book</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg.secondary }}>
      {/* Header */}
      <View style={{ backgroundColor: Colors.bg.primary, padding: 16, borderBottomWidth: 1, borderBottomColor: Colors.slate[200] }}>
        <Text style={{ fontSize: 22, fontWeight: Typography.bold, color: Colors.slate[900] }}>Our Services</Text>
        <Text style={{ color: Colors.slate[500], fontSize: 13, marginTop: 3 }}>Expert electrical solutions at your doorstep</Text>
        {/* Category filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12 }} contentContainerStyle={{ gap: 8 }}>
          {SERVICE_CATEGORIES.map((cat) => {
            const active = activeCategory === cat.value;
            return (
              <Pressable
                key={cat.value}
                onPress={() => setActiveCategory(cat.value)}
                style={{
                  paddingHorizontal: 14, paddingVertical: 7, borderRadius: Radius.full,
                  backgroundColor: active ? Colors.epf[500] : Colors.slate[100],
                  borderWidth: 1, borderColor: active ? Colors.epf[500] : Colors.slate[200],
                }}
              >
                <Text style={{ fontSize: 13, color: active ? '#fff' : Colors.slate[600], fontWeight: active ? Typography.semibold : Typography.normal }}>
                  {cat.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={Colors.epf[500]} />
        </View>
      ) : (
        <FlatList
          data={filteredServices}
          renderItem={renderServiceCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingVertical: 16, flexGrow: filteredServices.length === 0 ? 1 : undefined }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void loadServices(); }} tintColor={Colors.epf[500]} />}
          ListHeaderComponent={
            /* How it works section */
            <View style={{ marginHorizontal: 16, marginBottom: 16, backgroundColor: Colors.epf[50], borderRadius: Radius.xl, padding: 16 }}>
              <Text style={{ fontSize: 15, fontWeight: Typography.bold, color: Colors.slate[900], marginBottom: 12 }}>How it works</Text>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                {HOW_IT_WORKS.map((step, idx) => (
                  <View key={idx} style={{ alignItems: 'center', flex: 1 }}>
                    <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: Colors.bg.primary, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.epf[200] }}>
                      <step.icon size={18} color={Colors.epf[600]} />
                    </View>
                    <Text style={{ fontSize: 11, fontWeight: Typography.semibold, color: Colors.slate[800], marginTop: 6, textAlign: 'center' }}>{step.title}</Text>
                    <Text style={{ fontSize: 10, color: Colors.slate[500], textAlign: 'center', marginTop: 2 }}>{step.desc}</Text>
                  </View>
                ))}
              </View>
            </View>
          }
          ListEmptyComponent={
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
              <Wrench size={40} color={Colors.slate[300]} />
              <Text style={{ color: Colors.slate[800], fontSize: 17, fontWeight: Typography.semibold, marginTop: 13 }}>No services available</Text>
              <Text style={{ color: Colors.slate[500], fontSize: 13, textAlign: 'center', marginTop: 6 }}>{error || 'Please check back soon.'}</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
