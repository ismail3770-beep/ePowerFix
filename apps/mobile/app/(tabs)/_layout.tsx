// Bottom tab navigation — matches website MobileBottomNav.tsx
import React from 'react';
import { Tabs } from 'expo-router';
import { Home, ShoppingBag, Wrench, ShoppingCart, User } from 'lucide-react-native';
import { Colors, Typography } from '../../src/theme/design-system';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.epf[500],
        tabBarInactiveTintColor: Colors.slate[400],
        tabBarStyle: {
          backgroundColor: Colors.bg.primary,
          borderTopWidth: 1,
          borderTopColor: Colors.slate[200],
          paddingBottom: 4,
          paddingTop: 4,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: Typography.sm,
          fontWeight: Typography.medium,
        },
        headerStyle: {
          backgroundColor: Colors.bg.primary,
          borderBottomWidth: 1,
          borderBottomColor: Colors.slate[200],
        },
        headerTitleStyle: {
          fontWeight: Typography.bold,
          color: Colors.slate[900],
        },
        headerTintColor: Colors.epf[500],
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <Home size={22} color={color} strokeWidth={2} />,
        }}
      />
      <Tabs.Screen
        name="shop"
        options={{
          title: 'Shop',
          tabBarIcon: ({ color }) => <ShoppingBag size={22} color={color} strokeWidth={2} />,
        }}
      />
      <Tabs.Screen
        name="services"
        options={{
          title: 'Services',
          tabBarIcon: ({ color }) => <Wrench size={22} color={color} strokeWidth={2} />,
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: 'Cart',
          tabBarIcon: ({ color }) => <ShoppingCart size={22} color={color} strokeWidth={2} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <User size={22} color={color} strokeWidth={2} />,
        }}
      />
    </Tabs>
  );
}
