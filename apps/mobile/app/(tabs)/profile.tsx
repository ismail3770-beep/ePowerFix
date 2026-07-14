// Profile screen — simple version
import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

export default function ProfileScreen() {
  const router = useRouter();

  const menuItems = [
    { label: 'My Orders', icon: '📦' },
    { label: 'Wishlist', icon: '❤️' },
    { label: 'Addresses', icon: '📍' },
    { label: 'Downloads', icon: '⬇️' },
    { label: 'Track Order', icon: '🚚' },
    { label: 'Help & Support', icon: '💬' },
    { label: 'Settings', icon: '⚙️' },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      <ScrollView>
        <View style={{ backgroundColor: 'white', padding: 24, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' }}>
          <View style={{ backgroundColor: '#fef3c7', borderRadius: 40, width: 80, height: 80, alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
            <Text style={{ fontSize: 36 }}>👋</Text>
          </View>
          <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#0f172a' }}>
            Welcome to ePowerFix
          </Text>
          <Text style={{ color: '#64748b', marginTop: 4, textAlign: 'center' }}>
            Login to access your account, orders, and wishlist
          </Text>
          <Pressable
            style={{ backgroundColor: '#f59e0b', borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12, marginTop: 16 }}
            onPress={() => router.push('/login')}
          >
            <Text style={{ color: 'white', fontWeight: 'bold' }}>Login / Register</Text>
          </Pressable>
        </View>

        <View style={{ padding: 16 }}>
          {menuItems.map((item, index) => (
            <Pressable
              key={index}
              style={{ backgroundColor: 'white', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, padding: 16, marginBottom: 8, flexDirection: 'row', alignItems: 'center' }}
            >
              <Text style={{ fontSize: 24, marginRight: 12 }}>{item.icon}</Text>
              <Text style={{ flex: 1, fontWeight: '500', color: '#334155' }}>{item.label}</Text>
              <Text style={{ color: '#94a3b8' }}>→</Text>
            </Pressable>
          ))}
        </View>

        <View style={{ padding: 16 }}>
          <Text style={{ color: '#94a3b8', textAlign: 'center', fontSize: 14 }}>
            ePowerFix v1.0.0
          </Text>
          <Text style={{ color: '#94a3b8', textAlign: 'center', fontSize: 12, marginTop: 4 }}>
            Electrical services & products in Bangladesh
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
