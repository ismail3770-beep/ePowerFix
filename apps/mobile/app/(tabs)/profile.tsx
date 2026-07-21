import React from 'react';
import { Alert, Image, Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Bell,
  ChevronRight,
  Download,
  Heart,
  LogIn,
  LogOut,
  MapPin,
  MessageCircle,
  Package,
  Settings,
  Truck,
  User,
} from 'lucide-react-native';
import { useAuthStore } from '../../src/store/auth';
import { Colors, Typography, Radius } from '../../src/theme/design-system';

export default function ProfileScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const loading = useAuthStore((state) => state.loading);
  const logout = useAuthStore((state) => state.logout);

  const menuItems = [
    { label: 'My Orders', icon: Package, color: Colors.epf[500], action: () => router.push('/orders' as never) },
    { label: 'Service Inbox', icon: Bell, color: '#F97316', action: () => router.push('/notifications' as never) },
    { label: 'Wishlist', icon: Heart, color: '#EC4899', action: () => router.push('/wishlist' as never) },
    { label: 'Addresses', icon: MapPin, color: Colors.success, action: () => router.push('/addresses' as never) },
    { label: 'Downloads', icon: Download, color: '#8B5CF6', action: () => router.push('/downloads' as never) },
    { label: 'Track Order', icon: Truck, color: Colors.warning, action: () => router.push('/order-track' as never) },
    { label: 'Help & Support', icon: MessageCircle, color: '#06B6D4', action: () => void Linking.openURL('mailto:support@epowerfix.com') },
    { label: 'Settings', icon: Settings, color: Colors.slate[500], action: () => router.push('/account' as never) },
  ];

  const handleLogout = () => {
    Alert.alert('Log out', 'Are you sure you want to log out of ePowerFix?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log out', style: 'destructive', onPress: () => void logout() },
    ]);
  };

  const initials = user?.name
    ? user.name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()
    : '';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg.secondary }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={{ backgroundColor: Colors.bg.primary, padding: 22, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: Colors.slate[200] }}>
          <View style={{ width: 82, height: 82, borderRadius: 41, backgroundColor: Colors.epf[50], alignItems: 'center', justifyContent: 'center', marginBottom: 12, borderWidth: 2, borderColor: Colors.epf[500], overflow: 'hidden' }}>
            {user?.avatar ? <Image source={{ uri: user.avatar }} style={{ width: '100%', height: '100%' }} /> : user ? <Text style={{ color: Colors.epf[600], fontSize: 25, fontWeight: Typography.bold }}>{initials}</Text> : <User size={36} color={Colors.epf[500]} strokeWidth={1.5} />}
          </View>

          {user ? (
            <>
              <Text style={{ fontSize: 20, fontWeight: Typography.bold, color: Colors.slate[900] }}>{user.name}</Text>
              <Text style={{ color: Colors.slate[500], fontSize: 13, marginTop: 4 }}>{user.email}</Text>
              {user.phone ? <Text style={{ color: Colors.slate[500], fontSize: 13, marginTop: 3 }}>{user.phone}</Text> : null}
              <View style={{ flexDirection: 'row', gap: 9, marginTop: 16 }}>
                <Pressable style={{ backgroundColor: Colors.epf[500], borderRadius: Radius.base, paddingHorizontal: 17, paddingVertical: 10, flexDirection: 'row', alignItems: 'center' }} onPress={() => router.push('/account' as never)}>
                  <Settings size={15} color={Colors.text.inverse} /><Text style={{ color: Colors.text.inverse, fontWeight: Typography.semibold, fontSize: 13, marginLeft: 6 }}>Edit profile</Text>
                </Pressable>
                <Pressable style={{ borderWidth: 1, borderColor: Colors.slate[200], borderRadius: Radius.base, paddingHorizontal: 15, paddingVertical: 10, flexDirection: 'row', alignItems: 'center' }} onPress={handleLogout} disabled={loading}>
                  <LogOut size={15} color={Colors.danger} /><Text style={{ color: Colors.danger, fontWeight: Typography.semibold, fontSize: 13, marginLeft: 6 }}>Log out</Text>
                </Pressable>
              </View>
            </>
          ) : (
            <>
              <Text style={{ fontSize: 20, fontWeight: Typography.bold, color: Colors.slate[900] }}>Welcome to ePowerFix</Text>
              <Text style={{ color: Colors.slate[500], fontSize: 14, marginTop: 4, textAlign: 'center' }}>Login to access orders, wishlist & more</Text>
              <Pressable style={{ backgroundColor: Colors.epf[500], borderRadius: Radius.base, paddingHorizontal: 28, paddingVertical: 12, marginTop: 16, flexDirection: 'row', alignItems: 'center' }} onPress={() => router.push('/login')}>
                <LogIn size={18} color={Colors.text.inverse} /><Text style={{ color: Colors.text.inverse, fontWeight: Typography.bold, marginLeft: 8 }}>Login / Register</Text>
              </Pressable>
            </>
          )}
        </View>

        <View style={{ padding: 16 }}>
          <Text style={{ color: Colors.slate[500], fontSize: 12, fontWeight: Typography.semibold, textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 9 }}>Account & support</Text>
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Pressable key={item.label} onPress={item.action} style={({ pressed }) => ({ backgroundColor: pressed ? Colors.slate[50] : Colors.bg.primary, borderRadius: Radius.xl, padding: 15, marginBottom: 8, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: Colors.slate[200] })}>
                <View style={{ width: 40, height: 40, borderRadius: Radius.xl, backgroundColor: `${item.color}15`, alignItems: 'center', justifyContent: 'center', marginRight: 14 }}><Icon size={20} color={item.color} strokeWidth={2} /></View>
                <Text style={{ flex: 1, fontWeight: Typography.medium, color: Colors.slate[800], fontSize: 15 }}>{item.label}</Text>
                <ChevronRight size={20} color={Colors.slate[400]} />
              </Pressable>
            );
          })}
        </View>

        <View style={{ padding: 16, paddingBottom: 32 }}>
          <Text style={{ color: Colors.slate[400], textAlign: 'center', fontSize: 13 }}>ePowerFix v1.0.0</Text>
          <Text style={{ color: Colors.slate[400], textAlign: 'center', fontSize: 11, marginTop: 4 }}>Electrical services & products in Bangladesh</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
