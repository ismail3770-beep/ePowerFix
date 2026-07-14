// Premium Product Card — matches website PremiumCard design exactly
// Web: apps/web/src/components/epf/PremiumCard.tsx

import React, { useState } from 'react';
import { View, Text, Pressable, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { ShoppingCart, Heart, Check, Star } from 'lucide-react-native';

export interface PremiumCardData {
  id: string;
  name: string;
  slug?: string;
  price: number;
  salePrice?: number | null;
  comparePrice?: number | null;
  images?: string[];
  image?: string;
  coverImage?: string | null;
  isFeatured?: boolean;
  isBestDeal?: boolean;
  isActive?: boolean;
  stock?: number;
  sku?: string;
  category?: string | null;
  badge?: string;
  rating?: number;
  reviewCount?: number;
  itemType?: 'PRODUCT' | 'PROJECT';
}

interface PremiumCardProps {
  data: PremiumCardData;
  onAddToCart?: (data: PremiumCardData) => void;
}

export function PremiumCard({ data, onAddToCart }: PremiumCardProps) {
  const router = useRouter();
  const [imgError, setImgError] = useState(false);
  const [added, setAdded] = useState(false);
  const [wished, setWished] = useState(false);

  const imageUrl = data.images?.[0] || data.image || data.coverImage;
  const displayPrice = data.salePrice ?? data.price;
  const originalPrice = data.comparePrice ?? data.salePrice ?? null;
  const showOriginal = originalPrice != null && originalPrice > displayPrice;
  const inStock = data.stock == null || data.stock > 0;
  const rating = data.rating || 0;
  const reviewCount = data.reviewCount || 0;
  const discountPercent =
    originalPrice && originalPrice > displayPrice
      ? Math.round(((originalPrice - displayPrice) / originalPrice) * 100)
      : 0;

  const handleClick = () => {
    router.push(`/product/${data.id}`);
  };

  const handleAddToCart = () => {
    if (!inStock) return;
    if (onAddToCart) {
      onAddToCart(data);
      return;
    }
    // TODO: Add to shared cart store
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  const handleWishlist = () => {
    setWished((v) => !v);
  };

  return (
    <Pressable
      onPress={handleClick}
      style={{
        flex: 1,
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        margin: 4,
      }}
    >
      {/* ─── Image Area — square, soft bg ─── */}
      <View style={{ position: 'relative', aspectRatio: 1, backgroundColor: '#F8FAFC' }}>
        {imageUrl && !imgError ? (
          <Image
            source={{ uri: imageUrl }}
            style={{ width: '100%', height: '100%', resizeMode: 'contain' }}
            onError={() => setImgError(true)}
          />
        ) : (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <View style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: '#F1F5F9',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <ShoppingCart size={24} color="#CBD5E1" />
            </View>
          </View>
        )}

        {/* Discount badge — top-left, emerald (matches website) */}
        {discountPercent > 0 && (
          <View style={{
            position: 'absolute',
            top: 8,
            left: 8,
            zIndex: 10,
            paddingHorizontal: 8,
            paddingVertical: 2,
            borderRadius: 4,
            backgroundColor: '#10B981', // emerald-500
          }}>
            <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '700' }}>
              -{discountPercent}%
            </Text>
          </View>
        )}

        {/* Out of stock badge */}
        {!inStock && (
          <View style={{
            position: 'absolute',
            top: 8,
            right: discountPercent > 0 ? 8 : undefined,
            left: discountPercent > 0 ? undefined : 8,
            zIndex: 10,
            paddingHorizontal: 8,
            paddingVertical: 2,
            borderRadius: 4,
            backgroundColor: '#EF4444', // red-500
          }}>
            <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '700' }}>
              Out of Stock
            </Text>
          </View>
        )}

        {/* Featured badge — epf-500 */}
        {data.isFeatured && discountPercent === 0 && inStock && (
          <View style={{
            position: 'absolute',
            top: 8,
            left: 8,
            zIndex: 10,
            paddingHorizontal: 8,
            paddingVertical: 2,
            borderRadius: 4,
            backgroundColor: '#0EA5E9', // epf-500
          }}>
            <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '700' }}>
              Featured
            </Text>
          </View>
        )}

        {/* Wishlist — top-right */}
        <Pressable
          onPress={handleWishlist}
          style={{
            position: 'absolute',
            top: 6,
            right: 6,
            zIndex: 10,
            width: 28,
            height: 28,
            borderRadius: 6,
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            borderWidth: 1,
            borderColor: '#E2E8F0',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Heart
            size={14}
            color={wished ? '#EF4444' : '#64748B'}
            fill={wished ? '#EF4444' : 'none'}
          />
        </Pressable>

        {/* Add to cart — bottom-right */}
        {inStock && (
          <Pressable
            onPress={handleAddToCart}
            style={{
              position: 'absolute',
              bottom: 8,
              right: 8,
              zIndex: 10,
              width: 32,
              height: 32,
              borderRadius: 8,
              backgroundColor: added ? '#10B981' : '#F1F5F9',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {added ? (
              <Check size={16} color="#FFFFFF" strokeWidth={2.5} />
            ) : (
              <ShoppingCart size={16} color="#334155" />
            )}
          </Pressable>
        )}
      </View>

      {/* ─── Content Area ─── */}
      <View style={{ padding: 12, gap: 4 }}>
        {/* Category label */}
        {data.category && (
          <Text
            style={{
              fontSize: 10,
              fontWeight: '500',
              color: '#0EA5E9',
              textTransform: 'uppercase',
              letterSpacing: 0.5,
            }}
            numberOfLines={1}
          >
            {data.category}
          </Text>
        )}

        {/* Title */}
        <Text
          style={{
            fontSize: 13,
            fontWeight: '500',
            color: '#1E293B',
            lineHeight: 18,
            minHeight: 36,
          }}
          numberOfLines={2}
        >
          {data.name}
        </Text>

        {/* Rating */}
        {rating > 0 && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <View style={{ flexDirection: 'row', gap: 2 }}>
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  size={12}
                  color={s <= Math.round(rating) ? '#F59E0B' : '#E2E8F0'}
                  fill={s <= Math.round(rating) ? '#F59E0B' : '#E2E8F0'}
                />
              ))}
            </View>
            <Text style={{ fontSize: 11, color: '#94A3B8' }}>
              ({reviewCount})
            </Text>
          </View>
        )}

        {/* Price */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
          <Text style={{ fontSize: 15, fontWeight: '700', color: '#0F172A' }}>
            ৳{Number(displayPrice).toLocaleString()}
          </Text>
          {showOriginal && (
            <Text style={{
              fontSize: 12,
              color: '#94A3B8',
              textDecorationLine: 'line-through',
            }}>
              ৳{Number(originalPrice).toLocaleString()}
            </Text>
          )}
        </View>
      </View>
    </Pressable>
  );
}

// Skeleton loader
export function PremiumCardSkeleton() {
  return (
    <View style={{
      flex: 1,
      backgroundColor: '#FFFFFF',
      borderRadius: 8,
      borderWidth: 1,
      borderColor: '#E2E8F0',
      overflow: 'hidden',
      margin: 4,
    }}>
      <View style={{ aspectRatio: 1, backgroundColor: '#F1F5F9' }} />
      <View style={{ padding: 12, gap: 8 }}>
        <View style={{ height: 8, backgroundColor: '#F1F5F9', borderRadius: 4, width: '33%' }} />
        <View style={{ height: 12, backgroundColor: '#F1F5F9', borderRadius: 4, width: '75%' }} />
        <View style={{ height: 12, backgroundColor: '#F1F5F9', borderRadius: 4, width: '50%' }} />
        <View style={{ height: 16, backgroundColor: '#F1F5F9', borderRadius: 4, width: '33%' }} />
      </View>
    </View>
  );
}
