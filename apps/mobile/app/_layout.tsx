// Root layout for ePowerFix mobile app
// Simple version with error boundary to debug white screen

import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import '../global.css';

// Error Boundary — catches render errors and shows them
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: any }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.log('🚨 Error Boundary:', error);
    console.log('Error Info:', errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: 'white' }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#ef4444', marginBottom: 10 }}>
            Something went wrong
          </Text>
          <Text style={{ color: '#64748b', textAlign: 'center', marginBottom: 10 }}>
            {String(this.state.error?.message || this.state.error)}
          </Text>
          <Text style={{ color: '#94a3b8', fontSize: 12, textAlign: 'center' }}>
            Check terminal console for full error
          </Text>
        </View>
      );
    }
    return this.props.children;
  }
}

export default function RootLayout() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Small delay to ensure everything is loaded
    const timer = setTimeout(() => setReady(true), 100);
    return () => clearTimeout(timer);
  }, []);

  if (!ready) {
    return (
      <View style={{ flex: 1, backgroundColor: 'white' }}>
        <StatusBar style="dark" />
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen
              name="product/[id]"
              options={{ title: 'Product', headerBackTitle: 'Back' }}
            />
            <Stack.Screen
              name="login"
              options={{ title: 'Login', headerBackTitle: 'Back' }}
            />
          </Stack>
          <StatusBar style="auto" />
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}
