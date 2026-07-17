import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowRight, CalendarDays, Wrench } from 'lucide-react-native';
import { servicesApi } from '@epowerfix/api-client';
import { Colors, Typography, Radius } from '../../src/theme/design-system';

export default function ServicesScreen() {
  const router = useRouter();
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

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

  useEffect(() => {
    void loadServices();
  }, [loadServices]);

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

  const renderItem = ({ item }: { item: any }) => (
    <View
      style={{
        backgroundColor: Colors.bg.primary,
        borderRadius: Radius.xl,
        padding: 16,
        marginHorizontal: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: Colors.slate[200],
        flexDirection: 'row',
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
      }}
    >
      <View style={{ width: 52, height: 52, borderRadius: Radius.xl, backgroundColor: Colors.epf[50], alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
        <Wrench size={24} color={Colors.epf[500]} />
      </View>

      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 15, fontWeight: Typography.bold, color: Colors.slate[900] }}>{item.name}</Text>
        <Text style={{ color: Colors.slate[500], fontSize: 13, marginTop: 4, lineHeight: 19 }} numberOfLines={2}>
          {item.shortDesc || item.description || 'Professional electrical service at your doorstep'}
        </Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 11 }}>
          <View>
            <Text style={{ color: Colors.slate[400], fontSize: 11 }}>Starting from</Text>
            <Text style={{ fontSize: 16, fontWeight: Typography.bold, color: Colors.epf[600], marginTop: 2 }}>
              {item.basePrice ? `৳${Number(item.basePrice).toLocaleString()}` : 'Contact us'}
            </Text>
          </View>
          <Pressable
            onPress={() => openBooking(item)}
            style={({ pressed }) => ({ backgroundColor: pressed ? Colors.epf[600] : Colors.epf[500], borderRadius: Radius.base, paddingHorizontal: 13, paddingVertical: 9, flexDirection: 'row', alignItems: 'center' })}
          >
            <CalendarDays size={14} color={Colors.text.inverse} />
            <Text style={{ color: Colors.text.inverse, fontSize: 12, fontWeight: Typography.semibold, marginLeft: 5 }}>Book now</Text>
            <ArrowRight size={14} color={Colors.text.inverse} style={{ marginLeft: 3 }} />
          </Pressable>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg.tertiary }}>
      <View style={{ backgroundColor: Colors.bg.primary, padding: 16, borderBottomWidth: 1, borderBottomColor: Colors.slate[200] }}>
        <Text style={{ fontSize: 22, fontWeight: Typography.bold, color: Colors.slate[900] }}>Our Services</Text>
        <Text style={{ color: Colors.slate[500], fontSize: 14, marginTop: 4, lineHeight: 20 }}>Expert electrical solutions at your doorstep</Text>
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator size="large" color={Colors.epf[500]} /></View>
      ) : (
        <FlatList
          data={services}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingVertical: 16, flexGrow: services.length === 0 ? 1 : undefined }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void loadServices(); }} tintColor={Colors.epf[500]} />}
          ListEmptyComponent={<View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}><Wrench size={40} color={Colors.slate[300]} /><Text style={{ color: Colors.slate[800], fontSize: 17, fontWeight: Typography.semibold, marginTop: 13 }}>No services available</Text><Text style={{ color: Colors.slate[500], fontSize: 13, textAlign: 'center', marginTop: 6 }}>{error || 'Please check back soon.'}</Text></View>}
        />
      )}
      {error && services.length > 0 ? <Text style={{ color: Colors.danger, fontSize: 12, textAlign: 'center', paddingHorizontal: 16, paddingBottom: 10 }}>{error}</Text> : null}
    </SafeAreaView>
  );
}
