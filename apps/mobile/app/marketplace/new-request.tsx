// New service request screen — matches web CreateRequestDialog
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator, KeyboardAvoidingView, Platform,
  Pressable, ScrollView, Text, TextInput, View, Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { AlertTriangle, ArrowLeft, ArrowRight, CalendarDays, MapPin, Wrench } from 'lucide-react-native';
import { marketplaceCatalogApi, marketplaceRequestsApi } from '@epowerfix/api-client';
import type { MarketplaceServiceZone, MarketplaceSkill } from '@epowerfix/types';
import { Colors, Radius, Typography } from '../../src/theme/design-system';

export default function NewRequestScreen() {
  const router = useRouter();
  const [skills, setSkills] = useState<MarketplaceSkill[]>([]);
  const [zones, setZones] = useState<MarketplaceServiceZone[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [skillId, setSkillId] = useState('');
  const [serviceZoneId, setServiceZoneId] = useState('');
  const [problemSummary, setProblemSummary] = useState('');
  const [description, setDescription] = useState('');
  const [serviceAddress, setServiceAddress] = useState('');
  const [areaName, setAreaName] = useState('');
  const [isEmergency, setIsEmergency] = useState(false);
  const [emergencySurchargeAccepted, setEmergencySurchargeAccepted] = useState(false);

  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        const [skillsRes, zonesRes] = await Promise.all([
          marketplaceCatalogApi.skills(),
          marketplaceCatalogApi.serviceZones(),
        ]);
        setSkills(skillsRes.data ?? []);
        setZones(zonesRes.data ?? []);
        if (zonesRes.data?.[0]) setServiceZoneId(zonesRes.data[0].id);
      } catch {
        setError('Failed to load catalog');
      } finally {
        setLoadingCatalog(false);
      }
    };
    void fetchCatalog();
  }, []);

  const handleSubmit = async () => {
    if (!problemSummary.trim()) { setError('Please describe the problem'); return; }
    if (!serviceAddress.trim()) { setError('Please enter the service address'); return; }
    if (!serviceZoneId) { setError('Please select a service zone'); return; }
    if (isEmergency && !emergencySurchargeAccepted) {
      setError('Please accept the emergency surcharge to continue');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      const res = await marketplaceRequestsApi.create({
        skillId: skillId || null,
        serviceZoneId,
        problemSummary: problemSummary.trim(),
        description: description.trim() || null,
        serviceAddress: serviceAddress.trim(),
        areaName: areaName.trim() || null,
        isEmergency,
        emergencySurchargeAccepted,
      });
      router.replace(`/marketplace/request/${res.data.id}` as never);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create request');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg.secondary }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        {/* Header */}
        <View style={{ backgroundColor: Colors.bg.primary, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: Colors.slate[200] }}>
          <Pressable onPress={() => router.back()} style={{ padding: 4, marginRight: 10 }}>
            <ArrowLeft size={22} color={Colors.slate[800]} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={{ color: Colors.slate[900], fontSize: 18, fontWeight: Typography.bold }}>New Service Request</Text>
            <Text style={{ color: Colors.slate[500], fontSize: 12, marginTop: 2 }}>Tell us what you need fixed</Text>
          </View>
          <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: Colors.epf[50], alignItems: 'center', justifyContent: 'center' }}>
            <Wrench size={18} color={Colors.epf[500]} />
          </View>
        </View>

        {loadingCatalog ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator size="large" color={Colors.epf[500]} />
          </View>
        ) : (
          <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            {error ? (
              <View style={{ backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA', borderRadius: Radius.lg, padding: 12, marginBottom: 14, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <AlertTriangle size={16} color={Colors.danger} />
                <Text style={{ flex: 1, color: Colors.danger, fontSize: 13 }}>{error}</Text>
              </View>
            ) : null}

            {/* Skill */}
            <FieldLabel label="Service Type" required={false} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', gap: 8, paddingRight: 4 }}>
                <Pressable
                  onPress={() => setSkillId('')}
                  style={{ paddingHorizontal: 14, paddingVertical: 9, borderRadius: Radius.full, borderWidth: 1, borderColor: !skillId ? Colors.epf[500] : Colors.slate[200], backgroundColor: !skillId ? Colors.epf[50] : Colors.bg.primary }}
                >
                  <Text style={{ color: !skillId ? Colors.epf[600] : Colors.slate[600], fontSize: 13, fontWeight: Typography.medium }}>Any</Text>
                </Pressable>
                {skills.map((s) => (
                  <Pressable
                    key={s.id}
                    onPress={() => setSkillId(s.id)}
                    style={{ paddingHorizontal: 14, paddingVertical: 9, borderRadius: Radius.full, borderWidth: 1, borderColor: skillId === s.id ? Colors.epf[500] : Colors.slate[200], backgroundColor: skillId === s.id ? Colors.epf[50] : Colors.bg.primary }}
                  >
                    <Text style={{ color: skillId === s.id ? Colors.epf[600] : Colors.slate[600], fontSize: 13, fontWeight: Typography.medium }}>{s.name}</Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>

            {/* Service Zone */}
            <FieldLabel label="Service Area" required />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', gap: 8, paddingRight: 4 }}>
                {zones.map((z) => (
                  <Pressable
                    key={z.id}
                    onPress={() => setServiceZoneId(z.id)}
                    style={{ paddingHorizontal: 14, paddingVertical: 9, borderRadius: Radius.full, borderWidth: 1, borderColor: serviceZoneId === z.id ? Colors.epf[500] : Colors.slate[200], backgroundColor: serviceZoneId === z.id ? Colors.epf[50] : Colors.bg.primary }}
                  >
                    <Text style={{ color: serviceZoneId === z.id ? Colors.epf[600] : Colors.slate[600], fontSize: 13, fontWeight: Typography.medium }}>{z.name}</Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>

            {/* Problem summary */}
            <FieldLabel label="Problem Summary" required />
            <TextInput
              value={problemSummary}
              onChangeText={setProblemSummary}
              placeholder="e.g. Power outlet not working in bedroom"
              placeholderTextColor={Colors.slate[400]}
              style={{ backgroundColor: Colors.bg.primary, borderWidth: 1, borderColor: Colors.slate[200], borderRadius: Radius.lg, padding: 13, color: Colors.slate[900], fontSize: 14, marginBottom: 16 }}
              maxLength={200}
            />

            {/* Description */}
            <FieldLabel label="Additional Details" required={false} />
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="More context about the issue (optional)"
              placeholderTextColor={Colors.slate[400]}
              multiline
              numberOfLines={3}
              style={{ backgroundColor: Colors.bg.primary, borderWidth: 1, borderColor: Colors.slate[200], borderRadius: Radius.lg, padding: 13, color: Colors.slate[900], fontSize: 14, marginBottom: 16, minHeight: 80, textAlignVertical: 'top' }}
              maxLength={1000}
            />

            {/* Service Address */}
            <FieldLabel label="Service Address" required />
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.bg.primary, borderWidth: 1, borderColor: Colors.slate[200], borderRadius: Radius.lg, paddingHorizontal: 12, marginBottom: 10 }}>
              <MapPin size={16} color={Colors.slate[400]} />
              <TextInput
                value={serviceAddress}
                onChangeText={setServiceAddress}
                placeholder="Full address where service is needed"
                placeholderTextColor={Colors.slate[400]}
                style={{ flex: 1, padding: 13, color: Colors.slate[900], fontSize: 14 }}
              />
            </View>

            {/* Area name */}
            <TextInput
              value={areaName}
              onChangeText={setAreaName}
              placeholder="Area / neighbourhood (optional)"
              placeholderTextColor={Colors.slate[400]}
              style={{ backgroundColor: Colors.bg.primary, borderWidth: 1, borderColor: Colors.slate[200], borderRadius: Radius.lg, padding: 13, color: Colors.slate[900], fontSize: 14, marginBottom: 16 }}
            />

            {/* Emergency toggle */}
            <View style={{ backgroundColor: isEmergency ? '#FFF7ED' : Colors.bg.primary, borderWidth: 1, borderColor: isEmergency ? '#FED7AA' : Colors.slate[200], borderRadius: Radius.xl, padding: 14, marginBottom: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flex: 1, marginRight: 12 }}>
                  <Text style={{ color: Colors.slate[900], fontSize: 14, fontWeight: Typography.semibold }}>Emergency request</Text>
                  <Text style={{ color: Colors.slate[500], fontSize: 12, marginTop: 3, lineHeight: 17 }}>Faster dispatch with priority matching. An emergency surcharge applies.</Text>
                </View>
                <Switch
                  value={isEmergency}
                  onValueChange={setIsEmergency}
                  trackColor={{ false: Colors.slate[200], true: '#FED7AA' }}
                  thumbColor={isEmergency ? '#C2410C' : Colors.slate[400]}
                />
              </View>
              {isEmergency && (
                <Pressable
                  onPress={() => setEmergencySurchargeAccepted((v) => !v)}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 }}
                >
                  <View style={{ width: 20, height: 20, borderRadius: 5, borderWidth: 1.5, borderColor: emergencySurchargeAccepted ? '#C2410C' : Colors.slate[300], backgroundColor: emergencySurchargeAccepted ? '#C2410C' : Colors.bg.primary, alignItems: 'center', justifyContent: 'center' }}>
                    {emergencySurchargeAccepted ? <Text style={{ color: '#fff', fontSize: 12, fontWeight: Typography.bold }}>✓</Text> : null}
                  </View>
                  <Text style={{ flex: 1, color: '#9A3412', fontSize: 12, lineHeight: 17 }}>I accept the emergency surcharge fee</Text>
                </Pressable>
              )}
            </View>

            {/* Submit */}
            <Pressable
              onPress={handleSubmit}
              disabled={submitting}
              style={({ pressed }) => ({
                backgroundColor: pressed ? Colors.epf[600] : Colors.epf[500],
                borderRadius: Radius.xl,
                paddingVertical: 15,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                marginTop: 6,
                opacity: submitting ? 0.7 : 1,
              })}
            >
              {submitting
                ? <ActivityIndicator color="#fff" />
                : <>
                    <Text style={{ color: '#fff', fontWeight: Typography.bold, fontSize: 15 }}>Create Request</Text>
                    <ArrowRight size={17} color="#fff" />
                  </>
              }
            </Pressable>
          </ScrollView>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function FieldLabel({ label, required }: { label: string; required: boolean }) {
  return (
    <Text style={{ color: Colors.slate[800], fontSize: 13, fontWeight: Typography.semibold, marginBottom: 7 }}>
      {label}{required ? <Text style={{ color: Colors.danger }}> *</Text> : ''}
    </Text>
  );
}
