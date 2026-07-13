// Services screen — list electrical services
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { servicesApi } from '@epowerfix/api-client';
import { formatPrice } from '@epowerfix/utils';
import { Colors } from '../../src/theme/colors';

export default function ServicesScreen() {
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    servicesApi
      .list()
      .then((res) => setServices(res.data?.services || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const renderItem = ({ item }: { item: any }) => (
    <Pressable className="bg-white border border-slate-200 rounded-xl p-4 m-2">
      <View className="flex-row">
        <View className="bg-primary-50 rounded-lg w-14 h-14 items-center justify-center mr-3">
          <Text className="text-2xl">⚡</Text>
        </View>
        <View className="flex-1">
          <Text className="font-bold text-slate-900 text-base">{item.name}</Text>
          <Text className="text-slate-500 text-sm mt-1" numberOfLines={2}>
            {item.shortDesc || item.description}
          </Text>
          <View className="flex-row justify-between items-center mt-2">
            <Text className="text-primary-600 font-bold">
              {item.basePrice ? formatPrice(item.basePrice) : 'Contact'}
            </Text>
            <Pressable className="bg-primary-500 px-3 py-1.5 rounded-lg">
              <Text className="text-white text-xs font-semibold">Book Now</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Pressable>
  );

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <View className="p-4 bg-white border-b border-slate-200">
        <Text className="text-2xl font-bold text-slate-900">Services</Text>
        <Text className="text-slate-500 mt-1">
          Professional electrical services
        </Text>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={services}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 4 }}
          ListEmptyComponent={
            <View className="items-center py-20">
              <Text className="text-slate-500 text-lg">No services available</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
