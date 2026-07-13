// Profile screen — user account, login/logout
import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors } from '../../src/theme/colors';

export default function ProfileScreen() {
  const router = useRouter();

  // TODO: Get auth state from store
  const isLoggedIn = false;

  const menuItems = [
    { label: 'My Orders', icon: '📦', action: () => {} },
    { label: 'Wishlist', icon: '❤️', action: () => {} },
    { label: 'Addresses', icon: '📍', action: () => {} },
    { label: 'Downloads', icon: '⬇️', action: () => {} },
    { label: 'Track Order', icon: '🚚', action: () => {} },
    { label: 'Help & Support', icon: '💬', action: () => {} },
    { label: 'Settings', icon: '⚙️', action: () => {} },
  ];

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <ScrollView>
        <View className="bg-white p-6 items-center border-b border-slate-200">
          <View className="bg-primary-100 rounded-full w-20 h-20 items-center justify-center mb-3">
            <Text className="text-4xl">{isLoggedIn ? '👤' : '👋'}</Text>
          </View>
          {isLoggedIn ? (
            <>
              <Text className="text-xl font-bold text-slate-900">
                Welcome back!
              </Text>
              <Text className="text-slate-500 mt-1">user@example.com</Text>
            </>
          ) : (
            <>
              <Text className="text-xl font-bold text-slate-900">
                Welcome to ePowerFix
              </Text>
              <Text className="text-slate-500 mt-1 text-center">
                Login to access your account, orders, and wishlist
              </Text>
              <Pressable
                className="bg-primary-500 rounded-xl px-6 py-3 mt-4"
                onPress={() => router.push('/login')}
              >
                <Text className="text-white font-bold">Login / Register</Text>
              </Pressable>
            </>
          )}
        </View>

        <View className="p-4">
          {menuItems.map((item, index) => (
            <Pressable
              key={index}
              className="bg-white border border-slate-200 rounded-xl p-4 mb-2 flex-row items-center"
              onPress={item.action}
            >
              <Text className="text-2xl mr-3">{item.icon}</Text>
              <Text className="flex-1 font-medium text-slate-700">
                {item.label}
              </Text>
              <Text className="text-slate-400">→</Text>
            </Pressable>
          ))}
        </View>

        <View className="p-4">
          <Text className="text-slate-400 text-center text-sm">
            ePowerFix v1.0.0
          </Text>
          <Text className="text-slate-400 text-center text-xs mt-1">
            Electrical services & products in Bangladesh
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
