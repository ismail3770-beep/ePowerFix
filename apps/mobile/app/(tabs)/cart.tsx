// Cart screen — shows cart items
import React from 'react';
import { View, Text, Pressable, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCartStore } from '@epowerfix/store';
import { formatPrice } from '@epowerfix/utils';

export default function CartScreen() {
  const items = useCartStore((s) => s.items);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const clearCart = useCartStore((s) => s.clearCart);
  const getTotal = useCartStore((s) => s.getTotal);
  const getItemCount = useCartStore((s) => s.getItemCount);

  const renderItem = ({ item }: { item: any }) => (
    <View className="bg-white border border-slate-200 rounded-xl p-3 m-2 flex-row">
      <View className="bg-slate-100 rounded-lg w-16 h-16 items-center justify-center mr-3">
        <Text className="text-2xl">📦</Text>
      </View>
      <View className="flex-1">
        <Text className="font-semibold text-slate-900" numberOfLines={2}>
          {item.productName}
        </Text>
        <Text className="text-primary-600 font-bold mt-1">
          {formatPrice(item.price)}
        </Text>
        <View className="flex-row items-center mt-2">
          <Pressable
            className="bg-slate-100 rounded w-8 h-8 items-center justify-center"
            onPress={() => updateQuantity(item.id, item.quantity - 1)}
          >
            <Text className="text-slate-700 font-bold">−</Text>
          </Pressable>
          <Text className="mx-3 font-semibold">{item.quantity}</Text>
          <Pressable
            className="bg-slate-100 rounded w-8 h-8 items-center justify-center"
            onPress={() => updateQuantity(item.id, item.quantity + 1)}
          >
            <Text className="text-slate-700 font-bold">+</Text>
          </Pressable>
          <Pressable
            className="ml-auto bg-red-50 rounded px-3 py-1.5"
            onPress={() => removeItem(item.id)}
          >
            <Text className="text-red-600 text-xs font-semibold">Remove</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );

  if (items.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <Text className="text-6xl mb-4">🛒</Text>
        <Text className="text-xl font-bold text-slate-900">Cart is empty</Text>
        <Text className="text-slate-500 mt-1">Add products to get started</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <View className="p-4 bg-white border-b border-slate-200 flex-row justify-between items-center">
        <Text className="text-2xl font-bold text-slate-900">Cart</Text>
        <Pressable onPress={clearCart}>
          <Text className="text-red-500 text-sm">Clear all</Text>
        </Pressable>
      </View>

      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 4 }}
      />

      <View className="bg-white border-t border-slate-200 p-4">
        <View className="flex-row justify-between mb-1">
          <Text className="text-slate-500">Items: {getItemCount()}</Text>
          <Text className="font-bold text-lg text-slate-900">
            {formatPrice(getTotal())}
          </Text>
        </View>
        <Pressable className="bg-primary-500 rounded-xl py-3.5 mt-3 items-center">
          <Text className="text-white font-bold text-base">Checkout</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
