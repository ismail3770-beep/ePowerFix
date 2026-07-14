// ═══════════════════════════════════════════════════════════════════════════
// Footer — EXACT match with website Footer.tsx
// Web source: apps/web/src/components/epf/Footer.tsx
// ═══════════════════════════════════════════════════════════════════════════

import React from 'react';
import { View, Text, Pressable, ScrollView, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { Facebook, Youtube, Instagram, Phone, Mail, MapPin } from 'lucide-react-native';
import { Colors, Typography, Radius } from '../theme/design-system';

// Website footer links
const infoLinks = ['About Us', 'Delivery Info', 'Terms', 'Help Center', 'Returns'];
const serviceLinks = ['Home Wiring', 'Industrial Setup', 'Solar Panel', 'Generator', 'Inspection'];
const extrasLinks = ['Shop', 'Projects', 'Project Kits', 'Order Track', 'Blog'];
const accountLinks = ['My Account', 'Order History', 'Wishlist', 'Contact Us', 'Get a Quote'];

export function Footer() {
  const router = useRouter();

  const FooterHeading = ({ children }: { children: React.ReactNode }) => (
    <Text style={{
      fontSize: 15,
      fontWeight: Typography.semibold,
      color: Colors.text.inverse,
      marginBottom: 16,
      paddingBottom: 10,
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(255,255,255,0.1)',
    }}>
      {children}
    </Text>
  );

  const FooterItem = ({ label, onPress }: { label: string; onPress?: () => void }) => (
    <Pressable onPress={onPress} style={{ paddingVertical: 4 }}>
      <Text style={{
        fontSize: 14,
        color: 'rgba(255,255,255,0.5)',
        lineHeight: 22,
      }}>
        {label}
      </Text>
    </Pressable>
  );

  const socials = [
    { icon: Facebook, label: 'Facebook', color: '#1877F2' },
    { icon: Youtube, label: 'YouTube', color: '#FF0000' },
    { icon: Instagram, label: 'Instagram', color: '#E4405F' },
  ];

  return (
    <View style={{ backgroundColor: Colors.slate[900] }}>
      {/* ─── Main Footer Content ─── */}
      <View style={{ padding: 20 }}>
        {/* Brand Column */}
        <View style={{ marginBottom: 24 }}>
          {/* Logo — matches website */}
          <View style={{ flexDirection: 'column', marginBottom: 12 }}>
            <Text style={{ fontSize: 28, fontWeight: Typography.extrabold, color: Colors.text.inverse, lineHeight: 28 }}>
              e<Text style={{ color: Colors.epf[500] }}>Power</Text>Fix
            </Text>
            <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontWeight: Typography.semibold, letterSpacing: 2, marginTop: 4 }}>
              ELECTRICAL MARKETPLACE
            </Text>
          </View>

          {/* Description */}
          <Text style={{
            fontSize: 14,
            color: 'rgba(255,255,255,0.5)',
            lineHeight: 22,
            marginBottom: 16,
          }}>
            Your trusted partner for professional electrical services, quality components and engineering project kits in Bangladesh.
          </Text>

          {/* Contact Info */}
          <View style={{ gap: 8, marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <MapPin size={16} color={Colors.epf[500]} />
              <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)' }}>
                Dhaka, Bangladesh
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Phone size={16} color={Colors.epf[500]} />
              <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)' }}>
                +880 1234 567890
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Mail size={16} color={Colors.epf[500]} />
              <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)' }}>
                support@epowerfix.com
              </Text>
            </View>
          </View>

          {/* Social Icons */}
          <View style={{ flexDirection: 'row', gap: 12 }}>
            {socials.map((s) => {
              const Icon = s.icon;
              return (
                <Pressable
                  key={s.label}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    borderWidth: 1,
                    borderColor: 'rgba(255,255,255,0.1)',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon size={16} color={'rgba(255,255,255,0.5)'} />
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Link Columns — 2 columns on mobile */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
          {/* Information */}
          <View style={{ width: '47%', marginBottom: 20 }}>
            <FooterHeading>Information</FooterHeading>
            {infoLinks.map((label) => (
              <FooterItem key={label} label={label} onPress={() => router.push('/(tabs)/shop')} />
            ))}
          </View>

          {/* Customer Service */}
          <View style={{ width: '47%', marginBottom: 20 }}>
            <FooterHeading>Services</FooterHeading>
            {serviceLinks.map((label) => (
              <FooterItem key={label} label={label} onPress={() => router.push('/(tabs)/services')} />
            ))}
          </View>

          {/* Extras */}
          <View style={{ width: '47%', marginBottom: 20 }}>
            <FooterHeading>Extras</FooterHeading>
            {extrasLinks.map((label) => (
              <FooterItem key={label} label={label} onPress={() => router.push('/(tabs)/shop')} />
            ))}
          </View>

          {/* My Account */}
          <View style={{ width: '47%', marginBottom: 20 }}>
            <FooterHeading>My Account</FooterHeading>
            {accountLinks.map((label) => (
              <FooterItem key={label} label={label} onPress={() => router.push('/login')} />
            ))}
          </View>
        </View>
      </View>

      {/* ─── Bottom Bar ─── */}
      <View style={{
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.05)',
        paddingHorizontal: 20,
        paddingVertical: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 8,
      }}>
        {/* Copyright */}
        <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>
          © {new Date().getFullYear()} ePowerFix. All rights reserved.
        </Text>

        {/* Payment Icons */}
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
          <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>Safe Payments:</Text>
          {/* bKash */}
          <View style={{
            height: 24,
            width: 40,
            borderRadius: 4,
            backgroundColor: '#E2136E',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Text style={{ color: 'white', fontSize: 14, fontWeight: Typography.bold }}>b</Text>
          </View>
          {/* Nagad */}
          <View style={{
            height: 24,
            width: 40,
            borderRadius: 4,
            backgroundColor: '#F6921E',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Text style={{ color: 'white', fontSize: 13, fontWeight: Typography.bold }}>N</Text>
          </View>
        </View>
      </View>
    </View>
  );
}
