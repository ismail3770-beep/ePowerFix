// Services screen — matches website ServicesSection.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowRight, Wrench } from 'lucide-react-native';
import { Colors, Typography, Radius } from '../../src/theme/design-system';

export default function ServicesScreen() {
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const apiUrl = process.env.EXPO_PUBLIC_API_BASE_URL || '';
        if (!apiUrl) return;
        const res = await fetch(`${apiUrl}/api/services`);
        const json = await res.json();
        setServices(json?.services || json?.data?.services || []);
      } catch (e) {
        // silent
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const renderItem = ({ item }: { item: any }) => (
    <Pressable
      style={{
        backgroundColor: Colors.bg.primary,
        borderRadius: Radius.xl,
        padding: 16,
        marginHorizontal: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: Colors.slate[200],
        flexDirection: 'row',
        // shadow-sm
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
      }}
    >
      {/* Icon — bg-epf-50, rounded-xl, 52x52 */}
      <View style={{
        width: 52,
        height: 52,
        borderRadius: Radius.xl,
        backgroundColor: Colors.epf[50],
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
      }}>
        <Wrench size={24} color={Colors.epf[500]} />
      </View>

      {/* Content */}
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 15, fontWeight: Typography.bold, color: Colors.slate[900] }}>
          {item.name}
        </Text>
        <Text style={{ color: Colors.slate[500], fontSize: 13, marginTop: 4 }} numberOfLines={2}>
          {item.shortDesc || item.description || 'Professional electrical service'}
        </Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
          <Text style={{ fontSize: 16, fontWeight: Typography.bold, color: Colors.epf[500] }}>
            {item.basePrice ? `৳${item.basePrice}` : 'Contact'}
          </Text>
          <Pressable style={{
            backgroundColor: Colors.epf[500],
            borderRadius: Radius.base,
            paddingHorizontal: 14,
            paddingVertical: 8,
            flexDirection: 'row',
            alignItems: 'center',
          }}>
            <Text style={{ color: Colors.text.inverse, fontSize: 12, fontWeight: Typography.semibold, marginRight: 4 }}>
              Book Now
            </Text>
            <ArrowRight size={14} color={Colors.text.inverse} />
          </Pressable>
        </View>
      </View>
    </Pressable>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg.tertiary }}>
      {/* Header — matches website ServicesSection header */}
      <View style={{
        backgroundColor: Colors.bg.primary,
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: Colors.slate[200],
      }}>
        <Text style={{ fontSize: 22, fontWeight: Typography.bold, color: Colors.slate[900] }}>
          Our Services
        </Text>
        <Text style={{ color: Colors.slate[500], fontSize: 14, marginTop: 4 }}>
          Expert electrical solutions at your doorstep
        </Text>
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={Colors.epf[500]} />
        </View>
      ) : (
        <FlatList
          data={services}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingVertical: 16 }}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', paddingVertical: 80 }}>
              <Text style={{ color: Colors.slate[500], fontSize: 16, fontWeight: Typography.semibold }}>
                No services available
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
