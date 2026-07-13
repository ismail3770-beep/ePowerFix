// Root layout for ePowerFix mobile app
// Sets up providers, fonts, and splash screen

import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setStorage } from '@epowerfix/store';
import '../global.css';

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => {
    // Configure shared store to use mobile storage
    setStorage(AsyncStorage as any);

    // Hide splash screen after load
    const hideSplash = async () => {
      try {
        await SplashScreen.hideAsync();
      } catch (e) {
        // Ignore
      }
    };
    hideSplash();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="product/[id]"
            options={{ title: 'Product', headerBackTitle: 'Back' }}
          />
          <Stack.Screen
            name="checkout"
            options={{ title: 'Checkout', headerBackTitle: 'Back' }}
          />
          <Stack.Screen
            name="login"
            options={{ title: 'Login', headerBackTitle: 'Back' }}
          />
          <Stack.Screen
            name="search"
            options={{ title: 'Search', headerBackTitle: 'Back' }}
          />
        </Stack>
        <StatusBar style="auto" />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
