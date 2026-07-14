// Login screen — matches website design
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
import { Zap, Mail, Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react-native';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please fill all fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const apiUrl = process.env.EXPO_PUBLIC_API_BASE_URL || '';
      const res = await fetch(`${apiUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json?.error || 'Login failed');
      }

      // TODO: Save token to SecureStore
      router.back();
    } catch (e: any) {
      setError(e?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F1F5F9' }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          {/* Back button */}
          <Pressable
            style={{ padding: 16, flexDirection: 'row', alignItems: 'center' }}
            onPress={() => router.back()}
          >
            <ArrowLeft size={20} color="#0EA5E9" />
            <Text style={{ color: '#0EA5E9', marginLeft: 6, fontWeight: '500' }}>Back</Text>
          </Pressable>

          <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 24, paddingBottom: 40 }}>
            {/* Logo */}
            <View style={{ alignItems: 'center', marginBottom: 32 }}>
              <View style={{
                width: 64,
                height: 64,
                borderRadius: 16,
                backgroundColor: '#0EA5E9',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
              }}>
                <Zap size={32} color="#FFFFFF" />
              </View>
              <Text style={{ fontSize: 24, fontWeight: '800', color: '#0F172A' }}>
                Welcome to ePowerFix
              </Text>
              <Text style={{ color: '#64748B', fontSize: 14, marginTop: 4 }}>
                Login to your account
              </Text>
            </View>

            {/* Error */}
            {error ? (
              <View style={{
                backgroundColor: '#FEF2F2',
                borderWidth: 1,
                borderColor: '#FECACA',
                borderRadius: 8,
                padding: 12,
                marginBottom: 16,
              }}>
                <Text style={{ color: '#DC2626', fontSize: 13 }}>{error}</Text>
              </View>
            ) : null}

            {/* Email */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{ color: '#1E293B', fontWeight: '600', fontSize: 14, marginBottom: 8 }}>
                Email
              </Text>
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                borderWidth: 1,
                borderColor: '#E2E8F0',
                borderRadius: 8,
                backgroundColor: '#FFFFFF',
                paddingHorizontal: 12,
              }}>
                <Mail size={18} color="#94A3B8" />
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="you@example.com"
                  placeholderTextColor="#94A3B8"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={{ flex: 1, paddingVertical: 14, color: '#0F172A', marginLeft: 10 }}
                />
              </View>
            </View>

            {/* Password */}
            <View style={{ marginBottom: 24 }}>
              <Text style={{ color: '#1E293B', fontWeight: '600', fontSize: 14, marginBottom: 8 }}>
                Password
              </Text>
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                borderWidth: 1,
                borderColor: '#E2E8F0',
                borderRadius: 8,
                backgroundColor: '#FFFFFF',
                paddingHorizontal: 12,
              }}>
                <Lock size={18} color="#94A3B8" />
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Enter password"
                  placeholderTextColor="#94A3B8"
                  secureTextEntry={!showPassword}
                  style={{ flex: 1, paddingVertical: 14, color: '#0F172A', marginLeft: 10 }}
                />
                <Pressable onPress={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff size={18} color="#94A3B8" /> : <Eye size={18} color="#94A3B8" />}
                </Pressable>
              </View>
            </View>

            {/* Login Button */}
            <Pressable
              style={{
                backgroundColor: '#0EA5E9',
                borderRadius: 8,
                paddingVertical: 16,
                alignItems: 'center',
              }}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 16 }}>
                  Login
                </Text>
              )}
            </Pressable>

            {/* Register link */}
            <Pressable style={{ marginTop: 20, alignItems: 'center' }}>
              <Text style={{ color: '#64748B', fontSize: 14 }}>
                Don't have an account?{' '}
                <Text style={{ color: '#0EA5E9', fontWeight: '600' }}>Register</Text>
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
