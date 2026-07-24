// ═══════════════════════════════════════════════════════════════════════════
// Categories Screen — Full category list with icons + product count
// ═══════════════════════════════════════════════════════════════════════════

import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, ChevronRight } from 'lucide-react-native';
import { getCategoryIcon } from '../src/components/icons/CategoryIcons';
import { Colors, Typography, Radius } from '../src/theme/design-system';

const CATEGORIES = [
  { name: 'কেবল ও ওয়্যার', nameEn: 'Cable & Wire', slug: 'cable', desc: 'Copper, aluminum, flexible cables' },
  { name: 'সার্কিট ব্রেকার', nameEn: 'Circuit Breaker', slug: 'breaker', desc: 'MCB, MCCB, RCCB protection' },
  { name: 'সুইচ ও সকেট', nameEn: 'Switch & Socket', slug: 'switch', desc: 'Modular switches, sockets, plates' },
  { name: 'লাইটিং', nameEn: 'Lighting', slug: 'lighting', desc: 'LED bulbs, panels, flood lights' },
  { name: 'সোলার প্যানেল', nameEn: 'Solar Panel', slug: 'solar', desc: 'Panels, inverters, batteries' },
  { name: 'সেফটি সরঞ্জাম', nameEn: 'Safety Equipment', slug: 'safety', desc: 'Gloves, helmets, guards' },
  { name: 'ইন্ডাস্ট্রিয়াল', nameEn: 'Industrial', slug: 'industrial', desc: 'Contactors, relays, automation' },
  { name: 'টুলস ও মিটার', nameEn: 'Tools & Meter', slug: 'tools', desc: 'Multimeters, pliers, testers' },
  { name: 'ফ্যান ও ভেন্টিলেশন', nameEn: 'Fan & Ventilation', slug: 'fan', desc: 'Ceiling, exhaust, table fans' },
];

export default function CategoriesScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg.secondary }}>
      {/* Header */}
      <View style={{ backgroundColor: Colors.bg.primary, flexDirection: 'row', alignItems: 'center', padding: 14, borderBottomWidth: 1, borderBottomColor: Colors.slate[200] }}>
        <Pressable onPress={() => router.back()} style={{ padding: 4, marginRight: 12 }}>
          <ArrowLeft size={22} color={Colors.slate[900]} />
        </Pressable>
        <Text style={{ fontSize: 20, fontWeight: Typography.bold, color: Colors.slate[900] }}>Categories</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16 }} showsVerticalScrollIndicator={false}>
        {CATEGORIES.map((cat) => {
          const IconComp = getCategoryIcon(cat.slug);
          return (
            <Pressable
              key={cat.slug}
              onPress={() => router.push({ pathname: '/(tabs)/shop', params: { category: cat.slug } } as never)}
              style={{
                flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.bg.primary,
                borderRadius: Radius.xl, padding: 16, marginBottom: 10,
                borderWidth: 1, borderColor: Colors.slate[200],
              }}
            >
              <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: Colors.epf[50], alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
                <IconComp size={24} color={Colors.epf[600]} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: Typography.semibold, color: Colors.slate[900] }}>{cat.name}</Text>
                <Text style={{ fontSize: 12, color: Colors.slate[500], marginTop: 2 }}>{cat.desc}</Text>
              </View>
              <ChevronRight size={18} color={Colors.slate[400]} />
            </Pressable>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}
