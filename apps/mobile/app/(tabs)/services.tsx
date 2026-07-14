// Services screen — simple version
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ServicesScreen() {
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const apiUrl = process.env.EXPO_PUBLIC_API_BASE_URL || '';
        if (!apiUrl) {
          setError('API URL not configured');
          return;
        }
        const res = await fetch(`${apiUrl}/api/services`);
        const json = await res.json();
        setServices(json?.services || json?.data?.services || []);
      } catch (e: any) {
        setError(e?.message || 'Failed to load');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const renderItem = ({ item }: { item: any }) => (
    <View style={{ backgroundColor: 'white', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, padding: 16, margin: 8 }}>
      <View style={{ flexDirection: 'row' }}>
        <View style={{ backgroundColor: '#fef3c7', borderRadius: 8, width: 56, height: 56, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
          <Text style={{ fontSize: 24 }}>⚡</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontWeight: 'bold', color: '#0f172a', fontSize: 16 }}>{item.name}</Text>
          <Text style={{ color: '#64748b', fontSize: 14, marginTop: 4 }} numberOfLines={2}>
            {item.shortDesc || item.description || ''}
          </Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
            <Text style={{ color: '#d97706', fontWeight: 'bold' }}>
              {item.basePrice ? `৳${item.basePrice}` : 'Contact'}
            </Text>
            <Pressable style={{ backgroundColor: '#f59e0b', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 }}>
              <Text style={{ color: 'white', fontSize: 12, fontWeight: '600' }}>Book Now</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      <View style={{ padding: 16, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' }}>
        <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#0f172a' }}>Services</Text>
        <Text style={{ color: '#64748b', marginTop: 4 }}>Professional electrical services</Text>
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#f59e0b" />
        </View>
      ) : error ? (
        <View style={{ padding: 20, alignItems: 'center' }}>
          <Text style={{ color: '#ef4444' }}>⚠️ {error}</Text>
        </View>
      ) : (
        <FlatList
          data={services}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 4 }}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', paddingVertical: 80 }}>
              <Text style={{ color: '#64748b', fontSize: 18 }}>No services available</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
