// ═══════════════════════════════════════════════════════════════════════════
// Cost Estimator Screen — Estimate electrical project costs
// ═══════════════════════════════════════════════════════════════════════════

import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Calculator, Home, Building2, Factory, Zap, Info } from 'lucide-react-native';
import { Colors, Typography, Radius } from '../src/theme/design-system';

const PROJECT_TYPES = [
  { value: 'residential', label: 'Residential', icon: Home, description: 'House, apartment, flat' },
  { value: 'commercial', label: 'Commercial', icon: Building2, description: 'Shop, office, restaurant' },
  { value: 'industrial', label: 'Industrial', icon: Factory, description: 'Factory, warehouse' },
] as const;

const WORK_ITEMS = [
  { id: 'wiring', label: 'New Wiring', unit: 'point', rate: 350 },
  { id: 'switches', label: 'Switches & Sockets', unit: 'piece', rate: 250 },
  { id: 'lights', label: 'Lighting Installation', unit: 'point', rate: 300 },
  { id: 'fan', label: 'Fan Installation', unit: 'piece', rate: 400 },
  { id: 'ac', label: 'AC Wiring', unit: 'point', rate: 1500 },
  { id: 'breaker', label: 'Breaker Panel', unit: 'unit', rate: 2500 },
  { id: 'earthing', label: 'Earthing/Grounding', unit: 'job', rate: 3000 },
  { id: 'inverter', label: 'IPS/Inverter Setup', unit: 'job', rate: 5000 },
];

type WorkQuantities = Record<string, number>;

export default function CostEstimatorScreen() {
  const router = useRouter();
  const [projectType, setProjectType] = useState<string>('residential');
  const [quantities, setQuantities] = useState<WorkQuantities>({});

  const updateQuantity = (id: string, delta: number) => {
    setQuantities((prev) => ({
      ...prev,
      [id]: Math.max(0, (prev[id] || 0) + delta),
    }));
  };

  const estimate = useMemo(() => {
    let subtotal = 0;
    const breakdown: { label: string; qty: number; amount: number }[] = [];

    for (const item of WORK_ITEMS) {
      const qty = quantities[item.id] || 0;
      if (qty > 0) {
        const amount = qty * item.rate;
        subtotal += amount;
        breakdown.push({ label: item.label, qty, amount });
      }
    }

    // Project type multiplier
    const multiplier = projectType === 'industrial' ? 1.5 : projectType === 'commercial' ? 1.25 : 1;
    const adjustedSubtotal = Math.round(subtotal * multiplier);
    const labor = Math.round(adjustedSubtotal * 0.2); // 20% labor estimate
    const total = adjustedSubtotal + labor;

    return { breakdown, subtotal: adjustedSubtotal, labor, total, multiplier };
  }, [quantities, projectType]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg.secondary }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={{ backgroundColor: Colors.bg.primary, padding: 16, borderBottomWidth: 1, borderBottomColor: Colors.slate[200], flexDirection: 'row', alignItems: 'center' }}>
          <Pressable onPress={() => router.back()} style={{ padding: 4, marginRight: 10 }}>
            <ArrowLeft size={21} color={Colors.slate[800]} />
          </Pressable>
          <View>
            <Text style={{ color: Colors.slate[900], fontSize: 22, fontWeight: Typography.bold }}>Cost Estimator</Text>
            <Text style={{ color: Colors.slate[500], fontSize: 13, marginTop: 3 }}>Plan your electrical project budget</Text>
          </View>
        </View>

        <View style={{ padding: 14 }}>
          {/* Project type selection */}
          <Text style={{ color: Colors.slate[700], fontWeight: Typography.semibold, fontSize: 14, marginBottom: 10 }}>Project type</Text>
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 18 }}>
            {PROJECT_TYPES.map((type) => {
              const Icon = type.icon;
              const selected = projectType === type.value;
              return (
                <Pressable
                  key={type.value}
                  onPress={() => setProjectType(type.value)}
                  style={{
                    flex: 1,
                    backgroundColor: selected ? Colors.epf[50] : Colors.bg.primary,
                    borderRadius: Radius.xl,
                    borderWidth: 1.5,
                    borderColor: selected ? Colors.epf[500] : Colors.slate[200],
                    padding: 14,
                    alignItems: 'center',
                  }}
                >
                  <Icon size={24} color={selected ? Colors.epf[600] : Colors.slate[400]} />
                  <Text style={{ color: selected ? Colors.epf[700] : Colors.slate[700], fontWeight: Typography.semibold, fontSize: 13, marginTop: 8 }}>{type.label}</Text>
                  <Text style={{ color: Colors.slate[500], fontSize: 10, marginTop: 3, textAlign: 'center' }}>{type.description}</Text>
                </Pressable>
              );
            })}
          </View>

          {/* Work items */}
          <Text style={{ color: Colors.slate[700], fontWeight: Typography.semibold, fontSize: 14, marginBottom: 10 }}>Select work items</Text>
          {WORK_ITEMS.map((item) => {
            const qty = quantities[item.id] || 0;
            return (
              <View
                key={item.id}
                style={{
                  backgroundColor: Colors.bg.primary,
                  borderRadius: Radius.xl,
                  borderWidth: 1,
                  borderColor: qty > 0 ? Colors.epf[200] : Colors.slate[200],
                  padding: 14,
                  marginBottom: 10,
                  flexDirection: 'row',
                  alignItems: 'center',
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text style={{ color: Colors.slate[900], fontWeight: Typography.medium, fontSize: 14 }}>{item.label}</Text>
                  <Text style={{ color: Colors.slate[500], fontSize: 12, marginTop: 3 }}>৳{item.rate.toLocaleString()} / {item.unit}</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <Pressable
                    onPress={() => updateQuantity(item.id, -1)}
                    disabled={qty === 0}
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: Radius.md,
                      backgroundColor: qty > 0 ? Colors.slate[100] : Colors.slate[50],
                      alignItems: 'center',
                      justifyContent: 'center',
                      opacity: qty > 0 ? 1 : 0.5,
                    }}
                  >
                    <Text style={{ color: Colors.slate[700], fontSize: 18, fontWeight: Typography.bold }}>−</Text>
                  </Pressable>
                  <Text style={{ color: Colors.slate[900], fontWeight: Typography.bold, fontSize: 16, minWidth: 24, textAlign: 'center' }}>{qty}</Text>
                  <Pressable
                    onPress={() => updateQuantity(item.id, 1)}
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: Radius.md,
                      backgroundColor: Colors.epf[50],
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text style={{ color: Colors.epf[600], fontSize: 18, fontWeight: Typography.bold }}>+</Text>
                  </Pressable>
                </View>
              </View>
            );
          })}

          {/* Estimate summary */}
          {estimate.total > 0 && (
            <View style={{ backgroundColor: Colors.slate[900], borderRadius: Radius.xl, padding: 18, marginTop: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
                <Calculator size={20} color={Colors.epf[400]} />
                <Text style={{ color: '#fff', fontWeight: Typography.bold, fontSize: 17, marginLeft: 10 }}>Estimated Cost</Text>
              </View>

              {estimate.breakdown.map((item, index) => (
                <View key={index} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text style={{ color: Colors.slate[300], fontSize: 13 }}>{item.label} × {item.qty}</Text>
                  <Text style={{ color: Colors.slate[300], fontSize: 13 }}>৳{item.amount.toLocaleString()}</Text>
                </View>
              ))}

              <View style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.15)', marginVertical: 12 }} />

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                <Text style={{ color: Colors.slate[400], fontSize: 13 }}>Materials ({estimate.multiplier > 1 ? `${Math.round((estimate.multiplier - 1) * 100)}% ${projectType} markup` : 'Standard rate'})</Text>
                <Text style={{ color: Colors.slate[300], fontSize: 13 }}>৳{estimate.subtotal.toLocaleString()}</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                <Text style={{ color: Colors.slate[400], fontSize: 13 }}>Labor (estimated 20%)</Text>
                <Text style={{ color: Colors.slate[300], fontSize: 13 }}>৳{estimate.labor.toLocaleString()}</Text>
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(14,165,233,0.15)', borderRadius: Radius.lg, padding: 14 }}>
                <Text style={{ color: '#fff', fontWeight: Typography.bold, fontSize: 16 }}>Total Estimate</Text>
                <Text style={{ color: Colors.epf[400], fontWeight: Typography.bold, fontSize: 22 }}>৳{estimate.total.toLocaleString()}</Text>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginTop: 14 }}>
                <Info size={14} color={Colors.slate[400]} style={{ marginTop: 2 }} />
                <Text style={{ color: Colors.slate[400], fontSize: 11, lineHeight: 16, marginLeft: 6, flex: 1 }}>
                  This is an approximate estimate. Actual costs may vary based on site conditions, material quality, and specific requirements. Contact us for a detailed quotation.
                </Text>
              </View>
            </View>
          )}

          {/* CTA */}
          <Pressable
            onPress={() => router.push('/(tabs)/marketplace' as never)}
            style={{ backgroundColor: Colors.epf[500], borderRadius: Radius.lg, paddingVertical: 16, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', marginTop: 18, marginBottom: 32 }}
          >
            <Zap size={18} color="#fff" />
            <Text style={{ color: '#fff', fontWeight: Typography.bold, fontSize: 15, marginLeft: 8 }}>Get Exact Quote from Experts</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
