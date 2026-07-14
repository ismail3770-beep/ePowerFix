// Root layout — NativeWind v4 compatible
import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import '../global.css';

export default function RootLayout() {
  return (
    <>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="product/[id]"
          options={{ title: 'Product' }}
        />
        <Stack.Screen
          name="login"
          options={{ title: 'Login' }}
        />
      </Stack>
      <StatusBar style="auto" />
    </>
  );
}
