import React, { useEffect, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, CheckCircle2, Lock, Save, User } from 'lucide-react-native';
import { useAuthStore } from '../src/store/auth';
import { Colors, Typography, Radius } from '../src/theme/design-system';

export default function AccountScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const loading = useAuthStore((state) => state.loading);
  const updateProfile = useAuthStore((state) => state.updateProfile);
  const changePassword = useAuthStore((state) => state.changePassword);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [area, setArea] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!user) return;
    setName(user.name || '');
    setPhone(user.phone || '');
    setEmail(user.email || '');
    setAddress(user.address || '');
    setArea(user.area || '');
    setCity(user.city || '');
    setPostalCode(user.postalCode || '');
  }, [user]);

  const saveProfile = async () => {
    if (!name.trim() || phone.trim().length < 6) {
      setError('Please provide your name and a valid phone number.');
      return;
    }
    setError('');
    setSuccess('');
    try {
      await updateProfile({
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        currentPassword: email.trim().toLowerCase() !== user?.email.toLowerCase() ? currentPassword : undefined,
        address: address.trim(),
        area: area.trim(),
        city: city.trim(),
        postalCode: postalCode.trim(),
      });
      setSuccess('Profile updated successfully.');
    } catch (profileError) {
      setError(profileError instanceof Error ? profileError.message : 'Unable to update profile');
    }
  };

  const savePassword = async () => {
    if (!currentPassword || newPassword.length < 8 || newPassword !== confirmPassword) {
      setError('Enter your current password, a new password of at least 8 characters, and matching confirmation.');
      return;
    }
    setError('');
    setSuccess('');
    try {
      await changePassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setSuccess('Password changed successfully.');
    } catch (passwordError) {
      setError(passwordError instanceof Error ? passwordError.message : 'Unable to change password');
    }
  };

  if (!user) {
    return <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg.secondary, justifyContent: 'center', alignItems: 'center', padding: 24 }}><User size={42} color={Colors.slate[300]} /><Text style={{ color: Colors.slate[900], fontSize: 19, fontWeight: Typography.semibold, marginTop: 14 }}>Sign in to edit your account</Text><Pressable style={{ backgroundColor: Colors.epf[500], borderRadius: Radius.base, paddingHorizontal: 24, paddingVertical: 13, marginTop: 18 }} onPress={() => router.push('/login')}><Text style={{ color: Colors.text.inverse, fontWeight: Typography.bold }}>Login / Register</Text></Pressable></SafeAreaView>;
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg.secondary }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ paddingBottom: 32 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={{ backgroundColor: Colors.bg.primary, padding: 16, borderBottomWidth: 1, borderBottomColor: Colors.slate[200], flexDirection: 'row', alignItems: 'center' }}><Pressable onPress={() => router.back()} style={{ padding: 4, marginRight: 10 }}><ArrowLeft size={21} color={Colors.slate[800]} /></Pressable><View><Text style={{ color: Colors.slate[900], fontSize: 22, fontWeight: Typography.bold }}>Account settings</Text><Text style={{ color: Colors.slate[500], fontSize: 13, marginTop: 3 }}>Manage your profile and security</Text></View></View>
          <View style={{ padding: 14 }}>
            {error ? <View style={{ backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA', borderRadius: Radius.base, padding: 12, marginBottom: 12 }}><Text style={{ color: Colors.danger, fontSize: 13, lineHeight: 19 }}>{error}</Text></View> : null}
            {success ? <View style={{ backgroundColor: '#ECFDF5', borderWidth: 1, borderColor: '#A7F3D0', borderRadius: Radius.base, padding: 12, marginBottom: 12, flexDirection: 'row', alignItems: 'center' }}><CheckCircle2 size={16} color={Colors.success} /><Text style={{ color: Colors.success, fontSize: 13, marginLeft: 7 }}>{success}</Text></View> : null}

            <View style={cardStyle}><View style={sectionTitle}><View style={iconBox}><User size={17} color={Colors.epf[600]} /></View><Text style={titleStyle}>Personal information</Text></View><Field label="Full name" value={name} placeholder="Your name" onChangeText={setName} /><Field label="Phone" value={phone} placeholder="01XXXXXXXXX" keyboardType="phone-pad" onChangeText={setPhone} /><Field label="Email" value={email} placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" onChangeText={setEmail} /><Field label="Address" value={address} placeholder="House, road, block" onChangeText={setAddress} multiline /><View style={{ flexDirection: 'row', gap: 9 }}><View style={{ flex: 1 }}><Field label="Area" value={area} placeholder="Area" onChangeText={setArea} /></View><View style={{ flex: 1 }}><Field label="City" value={city} placeholder="City" onChangeText={setCity} /></View></View><Field label="Postal code" value={postalCode} placeholder="Postal code" keyboardType="numeric" onChangeText={setPostalCode} />{email.trim().toLowerCase() !== user.email.toLowerCase() ? <Field label="Current password (required for email change)" value={currentPassword} placeholder="Current password" secureTextEntry onChangeText={setCurrentPassword} /> : null}<Pressable onPress={saveProfile} disabled={loading} style={{ backgroundColor: Colors.epf[500], borderRadius: Radius.base, paddingVertical: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', opacity: loading ? 0.7 : 1 }}>{loading ? <ActivityIndicator color={Colors.text.inverse} /> : <><Save size={16} color={Colors.text.inverse} /><Text style={{ color: Colors.text.inverse, fontWeight: Typography.bold, marginLeft: 7 }}>Save profile</Text></>}</Pressable></View>

            <View style={cardStyle}><View style={sectionTitle}><View style={iconBox}><Lock size={17} color={Colors.epf[600]} /></View><Text style={titleStyle}>Change password</Text></View><Field label="Current password" value={currentPassword} placeholder="Current password" secureTextEntry onChangeText={setCurrentPassword} /><Field label="New password" value={newPassword} placeholder="At least 8 characters" secureTextEntry onChangeText={setNewPassword} /><Field label="Confirm new password" value={confirmPassword} placeholder="Repeat new password" secureTextEntry onChangeText={setConfirmPassword} /><Pressable onPress={savePassword} disabled={loading} style={{ borderWidth: 1, borderColor: Colors.epf[500], borderRadius: Radius.base, paddingVertical: 14, alignItems: 'center', opacity: loading ? 0.7 : 1 }}><Text style={{ color: Colors.epf[600], fontWeight: Typography.bold }}>Change password</Text></Pressable></View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field({ label, value, placeholder, onChangeText, keyboardType, autoCapitalize, multiline = false, secureTextEntry = false }: { label: string; value: string; placeholder: string; onChangeText: (value: string) => void; keyboardType?: 'default' | 'phone-pad' | 'numeric' | 'email-address'; autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters'; multiline?: boolean; secureTextEntry?: boolean }) {
  return <View style={{ marginBottom: 12 }}><Text style={labelStyle}>{label}</Text><TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={Colors.slate[400]} keyboardType={keyboardType} autoCapitalize={autoCapitalize} multiline={multiline} secureTextEntry={secureTextEntry} textAlignVertical={multiline ? 'top' : 'center'} style={[inputBase, multiline ? { minHeight: 70 } : undefined]} /></View>;
}

const cardStyle = { backgroundColor: Colors.bg.primary, borderWidth: 1, borderColor: Colors.slate[200], borderRadius: Radius.lg, padding: 15, marginBottom: 12 };
const sectionTitle = { flexDirection: 'row' as const, alignItems: 'center' as const, marginBottom: 14 };
const iconBox = { width: 30, height: 30, borderRadius: Radius.md, backgroundColor: Colors.epf[50], alignItems: 'center' as const, justifyContent: 'center' as const };
const titleStyle = { color: Colors.slate[900], fontWeight: Typography.semibold as '600', fontSize: 16, marginLeft: 9 };
const labelStyle = { color: Colors.slate[700], fontSize: 13, fontWeight: Typography.medium as '500', marginBottom: 6 };
const inputBase = { borderWidth: 1, borderColor: Colors.slate[200], borderRadius: Radius.base, paddingHorizontal: 11, paddingVertical: 11, color: Colors.slate[900], fontSize: 14 };
