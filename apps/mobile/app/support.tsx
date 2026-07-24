// ═══════════════════════════════════════════════════════════════════════════
// Support & Help Screen — FAQ, contact options, emergency
// ═══════════════════════════════════════════════════════════════════════════

import React, { useState } from 'react';
import { Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowLeft, Phone, Mail, MessageCircle, ChevronDown, ChevronUp,
  Zap, Shield, Truck, Wrench, HelpCircle, AlertTriangle,
} from 'lucide-react-native';
import { Colors, Typography, Radius } from '../src/theme/design-system';

const FAQS = [
  {
    q: 'How do I track my order?',
    a: 'Go to Profile → My Orders → Track. You can also use the order number and phone number to track any order.',
  },
  {
    q: 'What payment methods do you accept?',
    a: 'We accept Cash on Delivery (COD), bKash, Nagad, and SSLCommerz (card/mobile banking).',
  },
  {
    q: 'How long does delivery take?',
    a: 'Delivery usually takes 2-5 business days inside Dhaka and 3-7 days outside Dhaka.',
  },
  {
    q: 'Can I return a product?',
    a: 'Yes, you can return unused products within 7 days of delivery. Contact support for return instructions.',
  },
  {
    q: 'How do I book an electrician?',
    a: 'Go to Services tab → Select a service → Book. Our team will call you to confirm the appointment.',
  },
  {
    q: 'Is there a warranty on products?',
    a: 'Most products come with manufacturer warranty. Check the product page for specific warranty details.',
  },
];

const CONTACT_OPTIONS = [
  {
    icon: Phone,
    label: 'Call Support',
    description: '09612-345678 (9AM-9PM)',
    color: Colors.success,
    action: () => void Linking.openURL('tel:09612345678'),
  },
  {
    icon: MessageCircle,
    label: 'WhatsApp',
    description: 'Chat with our team',
    color: '#25D366',
    action: () => void Linking.openURL('https://wa.me/8801712345678'),
  },
  {
    icon: Mail,
    label: 'Email Support',
    description: 'support@epowerfix.com',
    color: Colors.epf[500],
    action: () => void Linking.openURL('mailto:support@epowerfix.com'),
  },
];

export default function SupportScreen() {
  const router = useRouter();
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg.secondary }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={{ backgroundColor: Colors.bg.primary, padding: 16, borderBottomWidth: 1, borderBottomColor: Colors.slate[200], flexDirection: 'row', alignItems: 'center' }}>
          <Pressable onPress={() => router.back()} style={{ padding: 4, marginRight: 10 }}>
            <ArrowLeft size={21} color={Colors.slate[800]} />
          </Pressable>
          <View>
            <Text style={{ color: Colors.slate[900], fontSize: 22, fontWeight: Typography.bold }}>Help & Support</Text>
            <Text style={{ color: Colors.slate[500], fontSize: 13, marginTop: 3 }}>We're here to help you</Text>
          </View>
        </View>

        {/* Emergency banner */}
        <Pressable
          onPress={() => void Linking.openURL('tel:09612345678')}
          style={{ margin: 14, backgroundColor: '#FEF2F2', borderRadius: Radius.xl, borderWidth: 1, borderColor: '#FECACA', padding: 16, flexDirection: 'row', alignItems: 'center' }}
        >
          <View style={{ width: 44, height: 44, borderRadius: Radius.lg, backgroundColor: '#FEE2E2', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
            <AlertTriangle size={22} color={Colors.danger} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: Colors.danger, fontWeight: Typography.bold, fontSize: 15 }}>Electrical Emergency?</Text>
            <Text style={{ color: Colors.slate[600], fontSize: 13, marginTop: 3 }}>Call our 24/7 emergency hotline</Text>
          </View>
          <Phone size={20} color={Colors.danger} />
        </Pressable>

        {/* Contact options */}
        <View style={{ paddingHorizontal: 14, marginBottom: 8 }}>
          <Text style={{ color: Colors.slate[500], fontSize: 12, fontWeight: Typography.semibold, textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 10 }}>Contact us</Text>
          {CONTACT_OPTIONS.map((option) => {
            const Icon = option.icon;
            return (
              <Pressable
                key={option.label}
                onPress={option.action}
                style={{ backgroundColor: Colors.bg.primary, borderRadius: Radius.xl, borderWidth: 1, borderColor: Colors.slate[200], padding: 15, marginBottom: 10, flexDirection: 'row', alignItems: 'center' }}
              >
                <View style={{ width: 42, height: 42, borderRadius: Radius.lg, backgroundColor: `${option.color}15`, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                  <Icon size={20} color={option.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: Colors.slate[900], fontWeight: Typography.semibold, fontSize: 15 }}>{option.label}</Text>
                  <Text style={{ color: Colors.slate[500], fontSize: 13, marginTop: 2 }}>{option.description}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>

        {/* FAQ section */}
        <View style={{ paddingHorizontal: 14, paddingBottom: 32 }}>
          <Text style={{ color: Colors.slate[500], fontSize: 12, fontWeight: Typography.semibold, textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 10, marginTop: 8 }}>Frequently asked questions</Text>
          {FAQS.map((faq, index) => (
            <Pressable
              key={index}
              onPress={() => setExpandedFaq(expandedFaq === index ? null : index)}
              style={{ backgroundColor: Colors.bg.primary, borderRadius: Radius.xl, borderWidth: 1, borderColor: Colors.slate[200], marginBottom: 8, overflow: 'hidden' }}
            >
              <View style={{ padding: 15, flexDirection: 'row', alignItems: 'center' }}>
                <HelpCircle size={18} color={Colors.epf[500]} style={{ marginRight: 10 }} />
                <Text style={{ flex: 1, color: Colors.slate[900], fontWeight: Typography.medium, fontSize: 14 }}>{faq.q}</Text>
                {expandedFaq === index ? <ChevronUp size={18} color={Colors.slate[400]} /> : <ChevronDown size={18} color={Colors.slate[400]} />}
              </View>
              {expandedFaq === index && (
                <View style={{ paddingHorizontal: 15, paddingBottom: 15, paddingLeft: 43 }}>
                  <Text style={{ color: Colors.slate[600], fontSize: 13, lineHeight: 20 }}>{faq.a}</Text>
                </View>
              )}
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
