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
import { Colors, Typography, Radius } from '../../src/theme/design-system';

export default function ProfileScreen() {
  const router = useRouter();

  const menuItems = [
    { label: 'My Orders', icon: Package, color: Colors.epf[500] },
    { label: 'Wishlist', icon: Heart, color: '#EC4899' },
    { label: 'Addresses', icon: MapPin, color: Colors.success },
    { label: 'Downloads', icon: Download, color: '#8B5CF6' },
    { label: 'Track Order', icon: Truck, color: Colors.warning },
    { label: 'Help & Support', icon: MessageCircle, color: '#06B6D4' },
    { label: 'Settings', icon: Settings, color: Colors.slate[500] },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg.secondary }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Card — bg-white, centered */}
        <View style={{
          backgroundColor: Colors.bg.primary,
          padding: 24,
          alignItems: 'center',
          borderBottomWidth: 1,
          borderBottomColor: Colors.slate[200],
        }}>
          {/* Avatar — epf-50 bg, epf-500 border */}
          <View style={{
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: Colors.epf[50],
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 12,
            borderWidth: 2,
            borderColor: Colors.epf[500],
          }}>
            <User size={36} color={Colors.epf[500]} strokeWidth={1.5} />
          </View>
          <Text style={{ fontSize: 20, fontWeight: Typography.bold, color: Colors.slate[900] }}>
            Welcome to ePowerFix
          </Text>
          <Text style={{ color: Colors.slate[500], fontSize: 14, marginTop: 4, textAlign: 'center' }}>
            Login to access orders, wishlist & more
          </Text>
          <Pressable
            style={{
              backgroundColor: Colors.epf[500],
              borderRadius: Radius.base,
              paddingHorizontal: 28,
              paddingVertical: 12,
              marginTop: 16,
              flexDirection: 'row',
              alignItems: 'center',
            }}
            onPress={() => router.push('/login')}
          >
            <LogIn size={18} color={Colors.text.inverse} style={{ marginRight: 8 }} />
            <Text style={{ color: Colors.text.inverse, fontWeight: Typography.bold }}>
              Login / Register
            </Text>
          </Pressable>
        </View>

        {/* Menu — matches website user dropdown items */}
        <View style={{ padding: 16 }}>
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <Pressable
                key={index}
                style={{
                  backgroundColor: Colors.bg.primary,
                  borderRadius: Radius.xl,
                  padding: 16,
                  marginBottom: 8,
                  flexDirection: 'row',
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: Colors.slate[200],
                }}
              >
                <View style={{
                  width: 40,
                  height: 40,
                  borderRadius: Radius.xl,
                  backgroundColor: item.color + '15',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 14,
                }}>
                  <Icon size={20} color={item.color} strokeWidth={2} />
                </View>
                <Text style={{ flex: 1, fontWeight: Typography.medium, color: Colors.slate[800], fontSize: 15 }}>
                  {item.label}
                </Text>
                <ChevronRight size={20} color={Colors.slate[400]} />
              </Pressable>
            );
          })}
        </View>

        {/* Footer */}
        <View style={{ padding: 16, paddingBottom: 32 }}>
          <Text style={{ color: Colors.slate[400], textAlign: 'center', fontSize: 13 }}>
            ePowerFix v1.0.0
          </Text>
          <Text style={{ color: Colors.slate[400], textAlign: 'center', fontSize: 11, marginTop: 4 }}>
            Electrical services & products in Bangladesh
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
