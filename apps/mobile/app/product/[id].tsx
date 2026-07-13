// Product detail screen
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { productsApi } from '@epowerfix/api-client';
import { formatPrice } from '@epowerfix/utils';
import { useCartStore } from '@epowerfix/store';
import { Colors } from '../src/theme/colors';

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [product, setProduct] = useState<any>(null);
  const [related, setRelated] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);

  const addItem = useCartStore((s) => s.addItem);

  useEffect(() => {
    if (id) {
      productsApi
        .getById(id)
        .then((res) => {
          setProduct(res.data?.product);
          setRelated(res.data?.related || []);
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [id]);

  const handleAddToCart = () => {
    if (!product) return;
    addItem({
      productId: product.id,
      productName: product.name,
      productImage: '',
      price: product.salePrice ?? product.price,
      quantity,
    });
    router.push('/(tabs)/cart');
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color={Colors.primary} />
      </SafeAreaView>
    );
  }

  if (!product) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <Text className="text-slate-500 text-lg">Product not found</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Product Image Placeholder */}
        <View className="bg-slate-100 h-80 items-center justify-center">
          <Text className="text-6xl">📦</Text>
        </View>

        <View className="p-5">
          <Text className="text-2xl font-bold text-slate-900">
            {product.name}
          </Text>
          <View className="flex-row items-center mt-2">
            <Text className="text-2xl font-bold text-primary-600">
              {formatPrice(product.salePrice ?? product.price)}
            </Text>
            {product.salePrice && (
              <Text className="text-slate-400 line-through ml-2">
                {formatPrice(product.price)}
              </Text>
            )}
          </View>

          <View className="flex-row items-center mt-2">
            <Text className="text-yellow-500">★★★★★</Text>
            <Text className="text-slate-500 ml-1">
              ({product.reviewCount || 0} reviews)
            </Text>
          </View>

          <View className="bg-slate-50 rounded-lg p-3 mt-4">
            <Text className="text-slate-700">
              {product.shortDesc || product.description || 'No description available'}
            </Text>
          </View>

          {/* Quantity Selector */}
          <View className="flex-row items-center mt-4">
            <Text className="font-semibold text-slate-700 mr-4">Quantity:</Text>
            <Pressable
              className="bg-slate-100 rounded w-9 h-9 items-center justify-center"
              onPress={() => setQuantity(Math.max(1, quantity - 1))}
            >
              <Text className="text-slate-700 font-bold">−</Text>
            </Pressable>
            <Text className="mx-4 font-semibold text-lg">{quantity}</Text>
            <Pressable
              className="bg-slate-100 rounded w-9 h-9 items-center justify-center"
              onPress={() => setQuantity(quantity + 1)}
            >
              <Text className="text-slate-700 font-bold">+</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>

      <View className="bg-white border-t border-slate-200 p-4 flex-row">
        <Pressable
          className="flex-1 bg-primary-500 rounded-xl py-3.5 items-center mr-2"
          onPress={handleAddToCart}
        >
          <Text className="text-white font-bold">Add to Cart</Text>
        </Pressable>
        <Pressable className="flex-1 bg-slate-900 rounded-xl py-3.5 items-center ml-2">
          <Text className="text-white font-bold">Buy Now</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
