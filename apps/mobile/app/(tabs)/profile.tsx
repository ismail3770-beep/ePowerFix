// Profile screen — matches website design
import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  User,
  Package,
  Heart,
  MapPin,
  Download,
  Truck,
  MessageCircle,
  Settings,
  ChevronRight,
  LogIn,
} from 'lucide-react-native';

export default function ProfileScreen() {
  const router = useRouter();

  const menuItems = [
    { label: 'My Orders', icon: Package, color: '#0EA5E9' },
    { label: 'Wishlist', icon: Heart, color: '#EC4899' },
    { label: 'Addresses', icon: MapPin, color: '#4D7300' },
    { label: 'Downloads', icon: Download, color: '#8B5CF6' },
    { label: 'Track Order', icon: Truck, color: '#F59E0B' },
    { label: 'Help & Support', icon: MessageCircle, color: '#06B6D4' },
    { label: 'Settings', icon: Settings, color: '#64748B' },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F1F5F9' }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header — Profile card */}
        <View style={{
          backgroundColor: '#FFFFFF',
          padding: 24,
          alignItems: 'center',
          borderBottomWidth: 1,
          borderBottomColor: '#E2E8F0',
        }}>
          <View style={{
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: '#F0F9FF',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 12,
            borderWidth: 2,
            borderColor: '#0EA5E9',
          }}>
            <User size={36} color="#0EA5E9" strokeWidth={1.5} />
          </View>
          <Text style={{ fontSize: 20, fontWeight: '700', color: '#0F172A' }}>
            Welcome to ePowerFix
          </Text>
          <Text style={{ color: '#64748B', fontSize: 14, marginTop: 4, textAlign: 'center' }}>
            Login to access orders, wishlist & more
          </Text>
          <Pressable
            style={{
              backgroundColor: '#0EA5E9',
              borderRadius: 8,
              paddingHorizontal: 28,
              paddingVertical: 12,
              marginTop: 16,
              flexDirection: 'row',
              alignItems: 'center',
            }}
            onPress={() => router.push('/login')}
          >
            <LogIn size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={{ color: '#FFFFFF', fontWeight: '700' }}>Login / Register</Text>
          </Pressable>
        </View>

        {/* Menu */}
        <View style={{ padding: 16 }}>
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <Pressable
                key={index}
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 8,
                  flexDirection: 'row',
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: '#E2E8F0',
                }}
              >
                <View style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  backgroundColor: item.color + '15',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 14,
                }}>
                  <Icon size={20} color={item.color} strokeWidth={2} />
                </View>
                <Text style={{ flex: 1, fontWeight: '500', color: '#1E293B', fontSize: 15 }}>
                  {item.label}
                </Text>
                <ChevronRight size={20} color="#94A3B8" />
              </Pressable>
            );
          })}
        </View>

        {/* Footer */}
        <View style={{ padding: 16, paddingBottom: 32 }}>
          <Text style={{ color: '#94A3B8', textAlign: 'center', fontSize: 13 }}>
            ePowerFix v1.0.0
          </Text>
          <Text style={{ color: '#94A3B8', textAlign: 'center', fontSize: 11, marginTop: 4 }}>
            Electrical services & products in Bangladesh
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
