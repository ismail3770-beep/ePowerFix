// Product detail screen — simple version
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

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    const load = async () => {
      try {
        const apiUrl = process.env.EXPO_PUBLIC_API_BASE_URL || '';
        const res = await fetch(`${apiUrl}/api/products/${id}`);
        const json = await res.json();
        setProduct(json?.data?.product);
      } catch (e: any) {
        setError(e?.message || 'Failed to load');
      } finally {
        setLoading(false);
      }
    };
    if (id) load();
  }, [id]);

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: 'white', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#f59e0b" />
      </SafeAreaView>
    );
  }

  if (error || !product) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: 'white', alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: '#64748b', fontSize: 18 }}>{error || 'Product not found'}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={{ backgroundColor: '#f1f5f9', height: 320, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 64 }}>📦</Text>
        </View>

        <View style={{ padding: 20 }}>
          <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#0f172a' }}>
            {product.name}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
            <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#d97706' }}>
              ৳{product.salePrice ?? product.price}
            </Text>
            {product.salePrice ? (
              <Text style={{ color: '#94a3b8', textDecorationLine: 'line-through', marginLeft: 8 }}>
                ৳{product.price}
              </Text>
            ) : null}
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
            <Text style={{ color: '#eab308', fontSize: 16 }}>★★★★★</Text>
            <Text style={{ color: '#64748b', marginLeft: 4 }}>
              ({product.reviewCount || 0} reviews)
            </Text>
          </View>

          <View style={{ backgroundColor: '#f8fafc', borderRadius: 8, padding: 12, marginTop: 16 }}>
            <Text style={{ color: '#334155' }}>
              {product.shortDesc || product.description || 'No description available'}
            </Text>
          </View>

          {/* Quantity Selector */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 16 }}>
            <Text style={{ fontWeight: '600', color: '#334155', marginRight: 16 }}>Quantity:</Text>
            <Pressable
              style={{ backgroundColor: '#f1f5f9', borderRadius: 8, width: 36, height: 36, alignItems: 'center', justifyContent: 'center' }}
              onPress={() => setQuantity(Math.max(1, quantity - 1))}
            >
              <Text style={{ color: '#334155', fontWeight: 'bold' }}>−</Text>
            </Pressable>
            <Text style={{ marginHorizontal: 16, fontWeight: '600', fontSize: 18 }}>{quantity}</Text>
            <Pressable
              style={{ backgroundColor: '#f1f5f9', borderRadius: 8, width: 36, height: 36, alignItems: 'center', justifyContent: 'center' }}
              onPress={() => setQuantity(quantity + 1)}
            >
              <Text style={{ color: '#334155', fontWeight: 'bold' }}>+</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>

      <View style={{ backgroundColor: 'white', borderTopWidth: 1, borderTopColor: '#e2e8f0', padding: 16, flexDirection: 'row' }}>
        <Pressable
          style={{ flex: 1, backgroundColor: '#f59e0b', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginRight: 8 }}
          onPress={() => router.push('/(tabs)/cart')}
        >
          <Text style={{ color: 'white', fontWeight: 'bold' }}>Add to Cart</Text>
        </Pressable>
        <Pressable
          style={{ flex: 1, backgroundColor: '#0f172a', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginLeft: 8 }}
        >
          <Text style={{ color: 'white', fontWeight: 'bold' }}>Buy Now</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
