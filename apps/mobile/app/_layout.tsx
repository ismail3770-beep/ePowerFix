// Root layout — simple, no NativeWind
import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

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
