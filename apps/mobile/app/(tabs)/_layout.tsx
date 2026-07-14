// Bottom tab navigation — matches website MobileBottomNav.tsx
// Home tab: headerShown=false (has custom 2-row header)
// Other tabs: show header
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
      }}
    >
      {/* Home — NO header (has custom 2-row header in screen) */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          headerShown: false,
          tabBarIcon: ({ color }) => <Home size={22} color={color} strokeWidth={2} />,
        }}
      />
      {/* Shop — show header */}
      <Tabs.Screen
        name="shop"
        options={{
          title: 'Shop',
          headerShown: false, // Shop screen has its own header
          tabBarIcon: ({ color }) => <ShoppingBag size={22} color={color} strokeWidth={2} />,
        }}
      />
      {/* Services — show header */}
      <Tabs.Screen
        name="services"
        options={{
          title: 'Services',
          headerShown: false, // Services screen has its own header
          tabBarIcon: ({ color }) => <Wrench size={22} color={color} strokeWidth={2} />,
        }}
      />
      {/* Cart — show header */}
      <Tabs.Screen
        name="cart"
        options={{
          title: 'Cart',
          headerShown: false, // Cart screen has its own layout
          tabBarIcon: ({ color }) => <ShoppingCart size={22} color={color} strokeWidth={2} />,
        }}
      />
      {/* Profile — show header */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          headerShown: false, // Profile screen has its own layout
          tabBarIcon: ({ color }) => <User size={22} color={color} strokeWidth={2} />,
        }}
      />
    </Tabs>
  );
}
