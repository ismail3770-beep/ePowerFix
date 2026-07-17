import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Eye, EyeOff, Lock, Mail, Phone, User, Zap } from 'lucide-react-native';
import { Colors, Typography, Radius } from '../src/theme/design-system';
import { useAuthStore } from '../src/store/auth';

export default function RegisterScreen() {
  const router = useRouter();
  const register = useAuthStore((state) => state.register);
  const loading = useAuthStore((state) => state.loading);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async () => {
    if (!name.trim() || !phone.trim() || !email.trim() || !password || !confirmPassword) {
      setError('Please complete all fields.');
      return;
    }
    if (name.trim().length < 2) {
      setError('Name must be at least 2 characters.');
      return;
    }
    if (phone.trim().length < 6) {
      setError('Please enter a valid phone number.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setError('');
    try {
      await register({
        name,
        phone,
        email,
        password,
      });
      router.replace('/(tabs)');
    } catch (registerError) {
      setError(registerError instanceof Error ? registerError.message : 'Registration failed');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg.secondary }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ paddingBottom: 36 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Pressable
            style={{ padding: 16, flexDirection: 'row', alignItems: 'center' }}
            onPress={() => router.back()}
          >
            <ArrowLeft size={20} color={Colors.epf[600]} />
            <Text style={{ color: Colors.epf[600], marginLeft: 6, fontWeight: Typography.medium }}>
              Back to login
            </Text>
          </Pressable>

          <View style={{ paddingHorizontal: 24, paddingTop: 18 }}>
            <View style={{ alignItems: 'center', marginBottom: 24 }}>
              <View
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: Radius['2xl'],
                  backgroundColor: Colors.epf[100],
                  borderWidth: 1,
                  borderColor: Colors.epf[200],
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 14,
                }}
              >
                <Zap size={30} color={Colors.epf[600]} strokeWidth={2.5} />
              </View>
              <Text style={{ fontSize: 24, fontWeight: Typography.bold, color: Colors.slate[900] }}>
                Create your account
              </Text>
              <Text style={{ color: Colors.slate[500], fontSize: 14, marginTop: 5, textAlign: 'center' }}>
                Join ePowerFix for easier shopping and service bookings
              </Text>
            </View>

            {error ? (
              <View
                style={{
                  backgroundColor: '#FEF2F2',
                  borderWidth: 1,
                  borderColor: '#FECACA',
                  borderRadius: Radius.base,
                  padding: 12,
                  marginBottom: 16,
                }}
              >
                <Text style={{ color: Colors.danger, fontSize: 13 }}>{error}</Text>
              </View>
            ) : null}

            <Field label="Full name" icon={<User size={18} color={Colors.slate[400]} />}>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Your full name"
                placeholderTextColor={Colors.slate[400]}
                autoCapitalize="words"
                editable={!loading}
                style={inputStyle}
              />
            </Field>

            <Field label="Phone number" icon={<Phone size={18} color={Colors.slate[400]} />}>
              <TextInput
                value={phone}
                onChangeText={setPhone}
                placeholder="01XXXXXXXXX"
                placeholderTextColor={Colors.slate[400]}
                keyboardType="phone-pad"
                editable={!loading}
                style={inputStyle}
              />
            </Field>

            <Field label="Email" icon={<Mail size={18} color={Colors.slate[400]} />}>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                placeholderTextColor={Colors.slate[400]}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
                style={inputStyle}
              />
            </Field>

            <Field label="Password" icon={<Lock size={18} color={Colors.slate[400]} />} last>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="At least 6 characters"
                placeholderTextColor={Colors.slate[400]}
                secureTextEntry={!showPassword}
                editable={!loading}
                style={inputStyle}
              />
              <Pressable onPress={() => setShowPassword((visible) => !visible)} hitSlop={10}>
                {showPassword ? <EyeOff size={18} color={Colors.slate[400]} /> : <Eye size={18} color={Colors.slate[400]} />}
              </Pressable>
            </Field>

            <View style={{ marginBottom: 24 }}>
              <Text style={{ color: Colors.slate[800], fontWeight: Typography.semibold, fontSize: 14, marginBottom: 8 }}>
                Confirm password
              </Text>
              <View style={inputContainerStyle}>
                <Lock size={18} color={Colors.slate[400]} />
                <TextInput
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Repeat your password"
                  placeholderTextColor={Colors.slate[400]}
                  secureTextEntry={!showPassword}
                  editable={!loading}
                  onSubmitEditing={handleRegister}
                  style={inputStyle}
                />
              </View>
            </View>

            <Pressable
              style={({ pressed }) => ({
                backgroundColor: pressed ? Colors.epf[600] : Colors.epf[500],
                borderRadius: Radius.base,
                paddingVertical: 16,
                alignItems: 'center',
                opacity: loading ? 0.7 : 1,
              })}
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={Colors.text.inverse} />
              ) : (
                <Text style={{ color: Colors.text.inverse, fontWeight: Typography.bold, fontSize: 16 }}>
                  Create account
                </Text>
              )}
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const inputContainerStyle = {
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
  borderWidth: 1,
  borderColor: Colors.slate[200],
  borderRadius: Radius.base,
  backgroundColor: Colors.bg.primary,
  paddingHorizontal: 12,
};

const inputStyle = {
  flex: 1,
  paddingVertical: 14,
  color: Colors.slate[900],
  marginLeft: 10,
};

function Field({
  label,
  icon,
  children,
  last = false,
}: {
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  last?: boolean;
}) {
  return (
    <View style={{ marginBottom: last ? 0 : 16 }}>
      <Text style={{ color: Colors.slate[800], fontWeight: Typography.semibold, fontSize: 14, marginBottom: 8 }}>
        {label}
      </Text>
      <View style={inputContainerStyle}>
        {icon}
        {children}
      </View>
    </View>
  );
}
