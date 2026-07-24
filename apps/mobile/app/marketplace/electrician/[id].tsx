// ═══════════════════════════════════════════════════════════════════════════
// Electrician Profile — Full profile with skills, reviews, book button
// ═══════════════════════════════════════════════════════════════════════════

import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Star, MapPin, CheckCircle2, Briefcase, Phone, Shield, Clock } from 'lucide-react-native';
import { Colors, Typography, Radius } from '../../../src/theme/design-system';

const PROFILE = {
  id: '1',
  name: 'Md. Karim Uddin',
  area: 'Mirpur, Dhaka',
  rating: 4.8,
  reviews: 156,
  jobs: 234,
  experience: '8 years',
  specialty: 'Wiring & Installation',
  verified: true,
  bio: 'Certified electrician with 8+ years of experience in residential and commercial electrical work. Specialized in new wiring, rewiring, and electrical installation.',
  skills: ['Home Wiring', 'Switch Board', 'Fan Installation', 'Circuit Repair', 'MCB Installation'],
  availability: 'Sat - Thu, 9AM - 7PM',
};

export default function ElectricianProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg.secondary }}>
      {/* Header */}
      <View style={{ backgroundColor: Colors.bg.primary, flexDirection: 'row', alignItems: 'center', padding: 14, borderBottomWidth: 1, borderBottomColor: Colors.slate[200] }}>
        <Pressable onPress={() => router.back()} style={{ padding: 4, marginRight: 12 }}>
          <ArrowLeft size={22} color={Colors.slate[900]} />
        </Pressable>
        <Text style={{ fontSize: 18, fontWeight: Typography.bold, color: Colors.slate[900] }}>Electrician Profile</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Profile header */}
        <View style={{ backgroundColor: Colors.bg.primary, padding: 20, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: Colors.slate[200] }}>
          <View style={{ width: 72, height: 72, borderRadius: 22, backgroundColor: Colors.epf[50], alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: Colors.epf[200] }}>
            <Text style={{ fontSize: 28, fontWeight: Typography.bold, color: Colors.epf[600] }}>{PROFILE.name.charAt(0)}</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12 }}>
            <Text style={{ fontSize: 20, fontWeight: Typography.bold, color: Colors.slate[900] }}>{PROFILE.name}</Text>
            {PROFILE.verified && <CheckCircle2 size={18} color={Colors.epf[500]} />}
          </View>
          <Text style={{ fontSize: 13, color: Colors.epf[600], fontWeight: Typography.medium, marginTop: 4 }}>{PROFILE.specialty}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Star size={14} color={Colors.badge.rating} fill={Colors.badge.rating} />
              <Text style={{ fontSize: 13, fontWeight: Typography.semibold, color: Colors.slate[700] }}>{PROFILE.rating}</Text>
              <Text style={{ fontSize: 12, color: Colors.slate[400] }}>({PROFILE.reviews})</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Briefcase size={14} color={Colors.slate[400]} />
              <Text style={{ fontSize: 13, color: Colors.slate[600] }}>{PROFILE.jobs} jobs</Text>
            </View>
          </View>
        </View>

        {/* Stats row */}
        <View style={{ flexDirection: 'row', backgroundColor: Colors.bg.primary, marginHorizontal: 16, marginTop: 16, borderRadius: Radius.xl, borderWidth: 1, borderColor: Colors.slate[200], padding: 14 }}>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={{ fontSize: 16, fontWeight: Typography.bold, color: Colors.slate[900] }}>{PROFILE.experience}</Text>
            <Text style={{ fontSize: 11, color: Colors.slate[500], marginTop: 2 }}>Experience</Text>
          </View>
          <View style={{ width: 1, backgroundColor: Colors.slate[200] }} />
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={{ fontSize: 16, fontWeight: Typography.bold, color: Colors.slate[900] }}>{PROFILE.jobs}</Text>
            <Text style={{ fontSize: 11, color: Colors.slate[500], marginTop: 2 }}>Jobs Done</Text>
          </View>
          <View style={{ width: 1, backgroundColor: Colors.slate[200] }} />
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={{ fontSize: 16, fontWeight: Typography.bold, color: Colors.slate[900] }}>{PROFILE.rating}</Text>
            <Text style={{ fontSize: 11, color: Colors.slate[500], marginTop: 2 }}>Rating</Text>
          </View>
        </View>

        {/* About */}
        <View style={{ backgroundColor: Colors.bg.primary, marginHorizontal: 16, marginTop: 12, borderRadius: Radius.xl, borderWidth: 1, borderColor: Colors.slate[200], padding: 16 }}>
          <Text style={{ fontSize: 15, fontWeight: Typography.bold, color: Colors.slate[900], marginBottom: 8 }}>About</Text>
          <Text style={{ fontSize: 13, color: Colors.slate[600], lineHeight: 20 }}>{PROFILE.bio}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12 }}>
            <MapPin size={14} color={Colors.slate[400]} />
            <Text style={{ fontSize: 13, color: Colors.slate[600] }}>{PROFILE.area}</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 }}>
            <Clock size={14} color={Colors.slate[400]} />
            <Text style={{ fontSize: 13, color: Colors.slate[600] }}>{PROFILE.availability}</Text>
          </View>
        </View>

        {/* Skills */}
        <View style={{ backgroundColor: Colors.bg.primary, marginHorizontal: 16, marginTop: 12, borderRadius: Radius.xl, borderWidth: 1, borderColor: Colors.slate[200], padding: 16 }}>
          <Text style={{ fontSize: 15, fontWeight: Typography.bold, color: Colors.slate[900], marginBottom: 10 }}>Skills</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {PROFILE.skills.map((skill) => (
              <View key={skill} style={{ backgroundColor: Colors.epf[50], borderRadius: Radius.full, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: Colors.epf[200] }}>
                <Text style={{ fontSize: 12, color: Colors.epf[700], fontWeight: Typography.medium }}>{skill}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Bottom Book Button */}
      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: Colors.bg.primary, borderTopWidth: 1, borderTopColor: Colors.slate[200], padding: 16 }}>
        <Pressable
          onPress={() => router.push('/service-booking' as never)}
          style={{ backgroundColor: Colors.epf[500], borderRadius: Radius.lg, paddingVertical: 15, alignItems: 'center' }}
        >
          <Text style={{ color: '#fff', fontSize: 16, fontWeight: Typography.bold }}>Book Now</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
