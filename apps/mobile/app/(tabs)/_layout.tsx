// Bottom tab navigation — 5 tabs: Home, Shop, Services, Cart, Profile
import React from 'react';
import { Tabs } from 'expo-router';
import { Home, ShoppingBag, Wrench, ShoppingCart, User } from 'lucide-react-native';
import { Colors } from '../../src/theme/design-system';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.epf[500],
        tabBarInactiveTintColor: '#94A3B8',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#F1F5F9',
          paddingBottom: 6,
          paddingTop: 8,
          height: 64,
          elevation: 0,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.05,
          shadowRadius: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          headerShown: false,
          tabBarIcon: ({ color, focused }) => <Home size={22} color={color} strokeWidth={focused ? 2.5 : 2} />,
        }}
      />
      <Tabs.Screen
        name="shop"
        options={{
          title: 'Shop',
          headerShown: false,
          tabBarIcon: ({ color, focused }) => <ShoppingBag size={22} color={color} strokeWidth={focused ? 2.5 : 2} />,
        }}
      />
      <Tabs.Screen
        name="services"
        options={{
          title: 'Services',
          headerShown: false,
          tabBarIcon: ({ color, focused }) => <Wrench size={26} color={color} strokeWidth={focused ? 2.5 : 2} />,
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: 'Cart',
          headerShown: false,
          tabBarIcon: ({ color, focused }) => <ShoppingCart size={22} color={color} strokeWidth={focused ? 2.5 : 2} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          headerShown: false,
          tabBarIcon: ({ color, focused }) => <User size={22} color={color} strokeWidth={focused ? 2.5 : 2} />,
        }}
      />
      {/* Marketplace hidden from tab bar — accessible via Home/Services */}
      <Tabs.Screen
        name="marketplace"
        options={{
          href: null,
          headerShown: false,
        }}
      />
    </Tabs>
  );
}
