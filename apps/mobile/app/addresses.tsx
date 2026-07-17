import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Check, Edit3, MapPin, Plus, Trash2 } from 'lucide-react-native';
import { addressesApi } from '@epowerfix/api-client';
import { useAuthStore } from '../src/store/auth';
import { Colors, Typography, Radius } from '../src/theme/design-system';

type AddressForm = { fullName: string; phone: string; address: string; area: string; city: string; postalCode: string; label: string; isDefault: boolean };
const emptyForm: AddressForm = { fullName: '', phone: '', address: '', area: '', city: 'Dhaka', postalCode: '', label: 'Home', isDefault: false };

export default function AddressesScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [form, setForm] = useState<AddressForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const loadAddresses = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    try {
      setError('');
      const response = await addressesApi.list();
      setAddresses(Array.isArray(response.data) ? response.data : []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load addresses');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { void loadAddresses(); }, [loadAddresses]);

  const update = <K extends keyof AddressForm>(key: K, value: AddressForm[K]) => setForm((current) => ({ ...current, [key]: value }));

  const openNew = () => {
    setEditingId(null);
    setForm({ ...emptyForm, fullName: user?.name || '', phone: user?.phone || '', isDefault: addresses.length === 0 });
    setShowForm(true);
    setError('');
  };

  const openEdit = (address: any) => {
    setEditingId(address.id);
    setForm({ fullName: address.fullName || '', phone: address.phone || '', address: address.address || '', area: address.area || '', city: address.city || '', postalCode: address.postalCode || '', label: address.label || 'Home', isDefault: Boolean(address.isDefault) });
    setShowForm(true);
    setError('');
  };

  const save = async () => {
    if (form.fullName.trim().length < 2 || form.phone.trim().length < 6 || form.address.trim().length < 3 || form.city.trim().length < 2) {
      setError('Please complete name, phone, address, and city.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload = { ...form, fullName: form.fullName.trim(), phone: form.phone.trim(), address: form.address.trim(), area: form.area.trim() || undefined, city: form.city.trim(), postalCode: form.postalCode.trim() || undefined, label: form.label.trim() || undefined };
      if (editingId) await addressesApi.update(editingId, payload);
      else await addressesApi.create(payload);
      setShowForm(false);
      setEditingId(null);
      setForm(emptyForm);
      await loadAddresses();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to save address');
    } finally {
      setSaving(false);
    }
  };

  const remove = (address: any) => {
    Alert.alert('Delete address', `Remove ${address.label || 'this address'}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { try { await addressesApi.remove(address.id); await loadAddresses(); } catch (removeError) { setError(removeError instanceof Error ? removeError.message : 'Unable to delete address'); } } },
    ]);
  };

  const makeDefault = async (address: any) => {
    try {
      await addressesApi.update(address.id, { isDefault: true });
      await loadAddresses();
    } catch (defaultError) {
      setError(defaultError instanceof Error ? defaultError.message : 'Unable to update default address');
    }
  };

  if (!user) {
    return <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg.secondary, justifyContent: 'center', alignItems: 'center', padding: 24 }}><MapPin size={42} color={Colors.slate[300]} /><Text style={{ color: Colors.slate[900], fontSize: 19, fontWeight: Typography.semibold, marginTop: 14 }}>Sign in to manage addresses</Text><Pressable style={{ backgroundColor: Colors.epf[500], borderRadius: Radius.base, paddingHorizontal: 24, paddingVertical: 13, marginTop: 18 }} onPress={() => router.push('/login')}><Text style={{ color: Colors.text.inverse, fontWeight: Typography.bold }}>Login / Register</Text></Pressable></SafeAreaView>;
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg.secondary }}>
      <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 30 }}>
        <View style={{ backgroundColor: Colors.bg.primary, padding: 16, borderBottomWidth: 1, borderBottomColor: Colors.slate[200], flexDirection: 'row', alignItems: 'center' }}><Pressable onPress={() => router.back()} style={{ padding: 4, marginRight: 10 }}><ArrowLeft size={21} color={Colors.slate[800]} /></Pressable><View style={{ flex: 1 }}><Text style={{ color: Colors.slate[900], fontSize: 22, fontWeight: Typography.bold }}>Addresses</Text><Text style={{ color: Colors.slate[500], fontSize: 13, marginTop: 3 }}>Saved delivery locations</Text></View><Pressable onPress={openNew} style={{ width: 36, height: 36, borderRadius: Radius.md, backgroundColor: Colors.epf[500], alignItems: 'center', justifyContent: 'center' }}><Plus size={19} color={Colors.text.inverse} /></Pressable></View>
        <View style={{ padding: 14 }}>
          {error ? <View style={{ backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA', borderRadius: Radius.base, padding: 12, marginBottom: 12 }}><Text style={{ color: Colors.danger, fontSize: 13 }}>{error}</Text></View> : null}

          {showForm ? <View style={cardStyle}><View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 13 }}><Text style={{ color: Colors.slate[900], fontSize: 16, fontWeight: Typography.semibold }}>{editingId ? 'Edit address' : 'Add address'}</Text><Pressable onPress={() => setShowForm(false)}><Text style={{ color: Colors.slate[500], fontSize: 13 }}>Cancel</Text></Pressable></View><Field label="Label" value={form.label} placeholder="Home or Office" onChangeText={(value) => update('label', value)} /><Field label="Full name" value={form.fullName} placeholder="Recipient name" onChangeText={(value) => update('fullName', value)} /><Field label="Phone" value={form.phone} placeholder="01XXXXXXXXX" keyboardType="phone-pad" onChangeText={(value) => update('phone', value)} /><Field label="Address" value={form.address} placeholder="House, road, block" onChangeText={(value) => update('address', value)} multiline /><View style={{ flexDirection: 'row', gap: 9 }}><View style={{ flex: 1 }}><Field label="Area" value={form.area} placeholder="Area" onChangeText={(value) => update('area', value)} /></View><View style={{ flex: 1 }}><Field label="City" value={form.city} placeholder="City" onChangeText={(value) => update('city', value)} /></View></View><Field label="Postal code (optional)" value={form.postalCode} placeholder="Postal code" keyboardType="numeric" onChangeText={(value) => update('postalCode', value)} /><Pressable onPress={() => update('isDefault', !form.isDefault)} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}><View style={{ width: 20, height: 20, borderRadius: 4, borderWidth: 1, borderColor: form.isDefault ? Colors.epf[500] : Colors.slate[300], backgroundColor: form.isDefault ? Colors.epf[500] : Colors.bg.primary, alignItems: 'center', justifyContent: 'center' }}>{form.isDefault ? <Check size={14} color={Colors.text.inverse} /> : null}</View><Text style={{ color: Colors.slate[700], fontSize: 13, marginLeft: 8 }}>Make this my default address</Text></Pressable><Pressable onPress={save} disabled={saving} style={{ backgroundColor: Colors.epf[500], borderRadius: Radius.base, paddingVertical: 14, alignItems: 'center' }}>{saving ? <ActivityIndicator color={Colors.text.inverse} /> : <Text style={{ color: Colors.text.inverse, fontWeight: Typography.bold }}>{editingId ? 'Save changes' : 'Add address'}</Text>}</Pressable></View> : null}

          {loading ? <ActivityIndicator size="large" color={Colors.epf[500]} style={{ marginTop: 35 }} /> : addresses.length === 0 && !showForm ? <View style={{ alignItems: 'center', paddingVertical: 60 }}><MapPin size={40} color={Colors.slate[300]} /><Text style={{ color: Colors.slate[800], fontSize: 17, fontWeight: Typography.semibold, marginTop: 13 }}>No saved addresses</Text><Text style={{ color: Colors.slate[500], fontSize: 13, marginTop: 6 }}>Add an address to speed up checkout.</Text><Pressable onPress={openNew} style={{ backgroundColor: Colors.epf[500], borderRadius: Radius.base, paddingHorizontal: 20, paddingVertical: 11, marginTop: 17 }}><Text style={{ color: Colors.text.inverse, fontWeight: Typography.semibold }}>Add address</Text></Pressable></View> : addresses.map((address) => <View key={address.id} style={cardStyle}><View style={{ flexDirection: 'row', alignItems: 'center' }}><View style={{ width: 36, height: 36, borderRadius: Radius.md, backgroundColor: Colors.epf[50], alignItems: 'center', justifyContent: 'center' }}><MapPin size={18} color={Colors.epf[600]} /></View><View style={{ flex: 1, marginLeft: 10 }}><View style={{ flexDirection: 'row', alignItems: 'center' }}><Text style={{ color: Colors.slate[900], fontWeight: Typography.semibold, fontSize: 15 }}>{address.label || 'Address'}</Text>{address.isDefault ? <View style={{ backgroundColor: '#ECFDF5', borderRadius: Radius.full, paddingHorizontal: 7, paddingVertical: 3, marginLeft: 8 }}><Text style={{ color: Colors.success, fontSize: 10, fontWeight: Typography.bold }}>DEFAULT</Text></View> : null}</View><Text style={{ color: Colors.slate[500], fontSize: 12, marginTop: 3 }}>{address.fullName} · {address.phone}</Text></View></View><Text style={{ color: Colors.slate[700], fontSize: 13, lineHeight: 19, marginTop: 12 }}>{[address.address, address.area, address.city, address.postalCode].filter(Boolean).join(', ')}</Text><View style={{ flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginTop: 13, paddingTop: 11, borderTopWidth: 1, borderTopColor: Colors.slate[100], gap: 15 }}>{!address.isDefault ? <Pressable onPress={() => void makeDefault(address)}><Text style={{ color: Colors.epf[600], fontSize: 12, fontWeight: Typography.semibold }}>Make default</Text></Pressable> : null}<Pressable onPress={() => openEdit(address)} style={{ flexDirection: 'row', alignItems: 'center' }}><Edit3 size={14} color={Colors.slate[600]} /><Text style={{ color: Colors.slate[700], fontSize: 12, fontWeight: Typography.semibold, marginLeft: 4 }}>Edit</Text></Pressable><Pressable onPress={() => remove(address)} style={{ flexDirection: 'row', alignItems: 'center' }}><Trash2 size={14} color={Colors.danger} /><Text style={{ color: Colors.danger, fontSize: 12, fontWeight: Typography.semibold, marginLeft: 4 }}>Delete</Text></Pressable></View></View>)}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Field({ label, value, placeholder, onChangeText, keyboardType, multiline = false }: { label: string; value: string; placeholder: string; onChangeText: (value: string) => void; keyboardType?: 'default' | 'phone-pad' | 'numeric'; multiline?: boolean }) {
  return <View style={{ marginBottom: 12 }}><Text style={labelStyle}>{label}</Text><TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={Colors.slate[400]} keyboardType={keyboardType} multiline={multiline} textAlignVertical={multiline ? 'top' : 'center'} style={[inputBase, multiline ? { minHeight: 70 } : undefined]} /></View>;
}

const cardStyle = { backgroundColor: Colors.bg.primary, borderWidth: 1, borderColor: Colors.slate[200], borderRadius: Radius.lg, padding: 15, marginBottom: 12 };
const labelStyle = { color: Colors.slate[700], fontSize: 13, fontWeight: Typography.medium as '500', marginBottom: 6 };
const inputBase = { borderWidth: 1, borderColor: Colors.slate[200], borderRadius: Radius.base, paddingHorizontal: 11, paddingVertical: 11, color: Colors.slate[900], fontSize: 14 };
