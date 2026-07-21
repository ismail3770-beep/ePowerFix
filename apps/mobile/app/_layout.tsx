// Root layout — initializes mobile persistence before rendering the app shell.
import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setStorage, useCartStore } from '@epowerfix/store';
import { CartSyncProvider } from '../src/components/CartSyncProvider';
import { useAuthStore } from '../src/store/auth';
import { useWishlistStore } from '../src/store/wishlist';

export default function RootLayout() {
  const hydrateAuth = useAuthStore((state) => state.hydrate);
  const authHydrated = useAuthStore((state) => state.hydrated);
  const user = useAuthStore((state) => state.user);
  const hydrateCart = useCartStore((state) => state.hydrate);
  const loadWishlist = useWishlistStore((state) => state.load);

  useEffect(() => {
    void hydrateAuth();
  }, [hydrateAuth]);

  useEffect(() => {
    // The adapter is installed before cart hydration and is also available to
    // every later cart mutation in the app.
    setStorage(AsyncStorage);
    void hydrateCart();
  }, [hydrateCart]);

  useEffect(() => {
    if (authHydrated) {
      void loadWishlist();
    }
  }, [authHydrated, loadWishlist, user?.id]);

  return (
    <>
      <CartSyncProvider />
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="product/[id]"
          options={{ title: 'Product' }}
        />
        <Stack.Screen
          name="login"
          options={{ title: 'Login', presentation: 'card' }}
        />
        <Stack.Screen
          name="register"
          options={{ title: 'Create account', presentation: 'card' }}
        />
        <Stack.Screen name="checkout" options={{ title: 'Checkout' }} />
        <Stack.Screen name="orders" options={{ title: 'My orders' }} />
        <Stack.Screen name="notifications" options={{ headerShown: false }} />
        <Stack.Screen name="wishlist" options={{ title: 'Wishlist' }} />
        <Stack.Screen name="order-track" options={{ title: 'Track order' }} />
        <Stack.Screen name="service-booking" options={{ title: 'Book a service' }} />
        <Stack.Screen name="addresses" options={{ title: 'Addresses' }} />
        <Stack.Screen name="downloads" options={{ title: 'Downloads' }} />
        <Stack.Screen name="account" options={{ title: 'Account settings' }} />
      </Stack>
      <StatusBar style="dark" />
    </>
  );
}
