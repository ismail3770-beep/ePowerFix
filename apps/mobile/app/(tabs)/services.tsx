// Services screen — matches website design
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowRight } from 'lucide-react-native';

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
    <Pressable
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        marginHorizontal: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        flexDirection: 'row',
      }}
    >
      {/* Icon */}
      <View style={{
        width: 52,
        height: 52,
        borderRadius: 10,
        backgroundColor: '#F0F9FF',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
      }}>
        <Text style={{ fontSize: 24 }}>⚡</Text>
      </View>

      {/* Content */}
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 15, fontWeight: '700', color: '#0F172A' }}>
          {item.name}
        </Text>
        <Text style={{ color: '#64748B', fontSize: 13, marginTop: 4 }} numberOfLines={2}>
          {item.shortDesc || item.description || 'Professional electrical service'}
        </Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: '#0EA5E9' }}>
            {item.basePrice ? `৳${item.basePrice}` : 'Contact'}
          </Text>
          <Pressable style={{
            backgroundColor: '#0EA5E9',
            borderRadius: 8,
            paddingHorizontal: 14,
            paddingVertical: 8,
            flexDirection: 'row',
            alignItems: 'center',
          }}>
            <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '600', marginRight: 4 }}>
              Book Now
            </Text>
            <ArrowRight size={14} color="#FFFFFF" />
          </Pressable>
        </View>
      </View>
    </Pressable>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F1F5F9' }}>
      {/* Header */}
      <View style={{
        padding: 16,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
      }}>
        <Text style={{ fontSize: 22, fontWeight: '700', color: '#0F172A' }}>
          Services
        </Text>
        <Text style={{ color: '#64748B', fontSize: 14, marginTop: 4 }}>
          Professional electrical services
        </Text>
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#0EA5E9" />
        </View>
      ) : error ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Text style={{ color: '#DC2626' }}>⚠️ {error}</Text>
        </View>
      ) : (
        <FlatList
          data={services}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingVertical: 16 }}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', paddingVertical: 80 }}>
              <Text style={{ color: '#64748B', fontSize: 16, fontWeight: '600' }}>
                No services available
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
