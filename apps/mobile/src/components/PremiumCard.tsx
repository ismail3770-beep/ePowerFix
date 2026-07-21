// ═══════════════════════════════════════════════════════════════════════════
// Premium Product Card — EXACT replica of web PremiumCard
// Web source: apps/web/src/components/epf/PremiumCard.tsx
// ═══════════════════════════════════════════════════════════════════════════

import React, { useState } from 'react';
import { View, Text, Pressable, Image, GestureResponderEvent } from 'react-native';
import { useRouter } from 'expo-router';
import { ShoppingCart, Heart, Check, Star } from 'lucide-react-native';
import { useCartStore } from '@epowerfix/store';
import { useAuthStore } from '../store/auth';
import { useWishlistStore } from '../store/wishlist';
import { Colors, Typography, Radius, Shadows } from '../theme/design-system';

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
  itemType?: 'PRODUCT' | 'PROJECT' | 'PROJECT_KIT';
}

interface PremiumCardProps {
  data: PremiumCardData;
  onAddToCart?: (data: PremiumCardData) => void;
}

export function PremiumCard({ data, onAddToCart }: PremiumCardProps) {
  const router = useRouter();
  const addItem = useCartStore((state) => state.addItem);
  const user = useAuthStore((state) => state.user);
  const wishlistItems = useWishlistStore((state) => state.items);
  const toggleWishlist = useWishlistStore((state) => state.toggle);
  const [imgError, setImgError] = useState(false);
  const [added, setAdded] = useState(false);
  const [wishlistBusy, setWishlistBusy] = useState(false);

  const images = data.images || [];
  const imageUrl = data.image || data.coverImage || images[0] || '';

  // Pricing logic — exact match with web PremiumCard
  const hasDiscount = data.comparePrice != null && data.comparePrice > data.price;
  const discountPercent = hasDiscount
    ? Math.round(((data.comparePrice! - data.price) / data.comparePrice!) * 100)
    : 0;
  const displayPrice = data.salePrice ?? data.price;
  const originalPrice = data.comparePrice ?? data.salePrice ?? null;
  const showOriginal = originalPrice != null && originalPrice > displayPrice;
  const inStock = data.stock == null || data.stock > 0;
  const rating = data.rating || 0;
  const reviewCount = data.reviewCount || 0;
  const wished = wishlistItems.some((item) => item.productId === data.id);

  const handleClick = () => {
    router.push(`/product/${data.id}`);
  };

  const handleAddToCart = (event?: GestureResponderEvent) => {
    event?.stopPropagation();
    if (!inStock) return;

    if (onAddToCart) {
      onAddToCart(data);
    } else {
      addItem({
        itemType: data.itemType ?? 'PRODUCT',
        ...(data.itemType === 'PROJECT_KIT'
          ? { projectKitId: data.id }
          : data.itemType === 'PROJECT'
          ? { projectId: data.id }
          : { productId: data.id }),
        productName: data.name,
        productImage: imageUrl,
        price: Number(displayPrice),
        quantity: 1,
      });
    }

    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  const handleWishlist = async (event?: GestureResponderEvent) => {
    event?.stopPropagation();
    if (!user) {
      router.push('/login');
      return;
    }
    if (wishlistBusy) return;

    setWishlistBusy(true);
    try {
      await toggleWishlist(data.id);
    } catch {
      // The wishlist store retains the error; the card stays in its last
      // server-confirmed state instead of showing a false optimistic change.
    } finally {
      setWishlistBusy(false);
    }
  };

  return (
    <Pressable
      onPress={handleClick}
      style={{
        flex: 1,
        backgroundColor: Colors.bg.primary,
        borderRadius: Radius.lg,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: Colors.slate[200],
        margin: 4,
        // shadow-sm equivalent
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
      }}
    >
      {/* ─── Image Area — square, soft bg (bg-slate-50) ─── */}
      <View style={{
        position: 'relative',
        aspectRatio: 1,
        backgroundColor: Colors.slate[50],
        overflow: 'hidden',
      }}>
        {imageUrl && !imgError ? (
          <Image
            source={{ uri: imageUrl }}
            style={{ width: '100%', height: '100%', resizeMode: 'contain' }}
            onError={() => setImgError(true)}
          />
        ) : (
          // Fallback — shopping cart icon in circle (matches web)
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <View style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: Colors.slate[100],
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <ShoppingCart size={24} color={Colors.slate[300]} />
            </View>
          </View>
        )}

        {/* Discount badge — top-left, emerald-500 (matches web) */}
        {discountPercent > 0 && (
          <View style={{
            position: 'absolute',
            top: 8,
            left: 8,
            zIndex: 10,
            paddingHorizontal: 8,
            paddingVertical: 2,
            borderRadius: Radius.base,
            backgroundColor: Colors.badge.discount,
          }}>
            <Text style={{
              color: Colors.text.inverse,
              fontSize: Typography.xs,
              fontWeight: Typography.bold,
              lineHeight: 14,
            }}>
              -{discountPercent}%
            </Text>
          </View>
        )}

        {/* Out of stock badge — top-right if discount, else top-left (matches web) */}
        {!inStock && (
          <View style={{
            position: 'absolute',
            top: 8,
            right: discountPercent > 0 ? 8 : undefined,
            left: discountPercent > 0 ? undefined : 8,
            zIndex: 10,
            paddingHorizontal: 8,
            paddingVertical: 2,
            borderRadius: Radius.base,
            backgroundColor: Colors.badge.outOfStock,
          }}>
            <Text style={{
              color: Colors.text.inverse,
              fontSize: Typography.xs,
              fontWeight: Typography.bold,
              lineHeight: 14,
            }}>
              Out of Stock
            </Text>
          </View>
        )}

        {/* Featured badge — top-left, epf-500 (matches web) */}
        {data.isFeatured && discountPercent === 0 && inStock && (
          <View style={{
            position: 'absolute',
            top: 8,
            left: 8,
            zIndex: 10,
            paddingHorizontal: 8,
            paddingVertical: 2,
            borderRadius: Radius.base,
            backgroundColor: Colors.badge.featured,
          }}>
            <Text style={{
              color: Colors.text.inverse,
              fontSize: Typography.xs,
              fontWeight: Typography.bold,
              lineHeight: 14,
            }}>
              Featured
            </Text>
          </View>
        )}

        {/* Wishlist button — top-right (matches web: bg-white/80, border) */}
        <Pressable
          onPress={handleWishlist}
          style={{
            position: 'absolute',
            top: 6,
            right: 6,
            zIndex: 10,
            width: 28,
            height: 28,
            borderRadius: Radius.md,
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            borderWidth: 1,
            borderColor: Colors.slate[200],
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Heart
            size={14}
            color={wished ? Colors.danger : Colors.slate[500]}
            fill={wished ? Colors.danger : 'none'}
          />
        </Pressable>

        {/* Add to cart button — bottom-right (matches web: bg-slate-100, 8x8 rounded-lg) */}
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
              borderRadius: Radius.lg,
              backgroundColor: added ? Colors.badge.discount : Colors.slate[100],
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {added ? (
              <Check size={16} color={Colors.text.inverse} strokeWidth={2.5} />
            ) : (
              <ShoppingCart size={16} color={Colors.slate[700]} />
            )}
          </Pressable>
        )}
      </View>

      {/* ─── Content Area — p-3, gap-1 (matches web) ─── */}
      <View style={{ padding: 12, gap: 4 }}>
        {/* Category label — text-[10px], uppercase, epf-500 */}
        {data.category && (
          <Text
            style={{
              fontSize: Typography.xs,
              fontWeight: Typography.medium,
              color: Colors.epf[500],
              textTransform: 'uppercase',
              letterSpacing: 0.5,
            }}
            numberOfLines={1}
          >
            {data.category}
          </Text>
        )}

        {/* Title — text-[13px], font-medium, slate-800, line-clamp-2 */}
        <Text
          style={{
            fontSize: 13,
            fontWeight: Typography.medium,
            color: Colors.slate[800],
            lineHeight: 18,
            minHeight: 36,
          }}
          numberOfLines={2}
        >
          {data.name}
        </Text>

        {/* Rating — stars + review count (matches web) */}
        {rating > 0 && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
            <View style={{ flexDirection: 'row', gap: 1 }}>
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  size={12}
                  color={s <= Math.round(rating) ? Colors.badge.rating : Colors.slate[200]}
                  fill={s <= Math.round(rating) ? Colors.badge.rating : Colors.slate[200]}
                />
              ))}
            </View>
            <Text style={{ fontSize: Typography.sm, color: Colors.slate[400], marginLeft: 4 }}>
              ({reviewCount})
            </Text>
          </View>
        )}

        {/* Price — text-[15px], font-bold, slate-900 + strikethrough */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
          <Text style={{ fontSize: 15, fontWeight: Typography.bold, color: Colors.slate[900] }}>
            ৳{Number(displayPrice).toLocaleString()}
          </Text>
          {showOriginal && (
            <Text style={{
              fontSize: Typography.sm,
              color: Colors.slate[400],
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

// Skeleton loader — matches web PremiumCardSkeleton
export function PremiumCardSkeleton() {
  return (
    <View style={{
      flex: 1,
      backgroundColor: Colors.bg.primary,
      borderRadius: Radius.lg,
      borderWidth: 1,
      borderColor: Colors.slate[200],
      overflow: 'hidden',
      margin: 4,
    }}>
      <View style={{ aspectRatio: 1, backgroundColor: Colors.slate[100] }} />
      <View style={{ padding: 12, gap: 8 }}>
        <View style={{ height: 8, backgroundColor: Colors.slate[100], borderRadius: Radius.base, width: '33%' }} />
        <View style={{ height: 12, backgroundColor: Colors.slate[100], borderRadius: Radius.base, width: '75%' }} />
        <View style={{ height: 12, backgroundColor: Colors.slate[100], borderRadius: Radius.base, width: '50%' }} />
        <View style={{ height: 16, backgroundColor: Colors.slate[100], borderRadius: Radius.base, width: '33%' }} />
      </View>
    </View>
  );
}
