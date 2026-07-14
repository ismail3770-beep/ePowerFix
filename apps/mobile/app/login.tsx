// Login screen — matches website login page design
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
import { Colors, Typography, Radius } from '../theme/design-system';

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
      if (!res.ok) throw new Error(json?.error || 'Login failed');
      router.back();
    } catch (e: any) {
      setError(e?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg.secondary }}>
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
            <ArrowLeft size={20} color={Colors.epf[500]} />
            <Text style={{ color: Colors.epf[500], marginLeft: 6, fontWeight: Typography.medium }}>
              Back
            </Text>
          </Pressable>

          <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 24, paddingBottom: 40 }}>
            {/* Logo — epf-500 bg */}
            <View style={{ alignItems: 'center', marginBottom: 32 }}>
              <View style={{
                width: 64,
                height: 64,
                borderRadius: Radius['2xl'],
                backgroundColor: Colors.epf[500],
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
              }}>
                <Zap size={32} color={Colors.text.inverse} />
              </View>
              <Text style={{ fontSize: 24, fontWeight: Typography.bold, color: Colors.slate[900] }}>
                Welcome to ePowerFix
              </Text>
              <Text style={{ color: Colors.slate[500], fontSize: 14, marginTop: 4 }}>
                Login to your account
              </Text>
            </View>

            {/* Error */}
            {error && (
              <View style={{
                backgroundColor: '#FEF2F2',
                borderWidth: 1,
                borderColor: '#FECACA',
                borderRadius: Radius.base,
                padding: 12,
                marginBottom: 16,
              }}>
                <Text style={{ color: Colors.danger, fontSize: 13 }}>{error}</Text>
              </View>
            )}

            {/* Email — border, rounded, icon */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{ color: Colors.slate[800], fontWeight: Typography.semibold, fontSize: 14, marginBottom: 8 }}>
                Email
              </Text>
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                borderWidth: 1,
                borderColor: Colors.slate[200],
                borderRadius: Radius.base,
                backgroundColor: Colors.bg.primary,
                paddingHorizontal: 12,
              }}>
                <Mail size={18} color={Colors.slate[400]} />
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="you@example.com"
                  placeholderTextColor={Colors.slate[400]}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={{ flex: 1, paddingVertical: 14, color: Colors.slate[900], marginLeft: 10 }}
                />
              </View>
            </View>

            {/* Password */}
            <View style={{ marginBottom: 24 }}>
              <Text style={{ color: Colors.slate[800], fontWeight: Typography.semibold, fontSize: 14, marginBottom: 8 }}>
                Password
              </Text>
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                borderWidth: 1,
                borderColor: Colors.slate[200],
                borderRadius: Radius.base,
                backgroundColor: Colors.bg.primary,
                paddingHorizontal: 12,
              }}>
                <Lock size={18} color={Colors.slate[400]} />
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Enter password"
                  placeholderTextColor={Colors.slate[400]}
                  secureTextEntry={!showPassword}
                  style={{ flex: 1, paddingVertical: 14, color: Colors.slate[900], marginLeft: 10 }}
                />
                <Pressable onPress={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff size={18} color={Colors.slate[400]} /> : <Eye size={18} color={Colors.slate[400]} />}
                </Pressable>
              </View>
            </View>

            {/* Login Button — epf-500 */}
            <Pressable
              style={{
                backgroundColor: Colors.epf[500],
                borderRadius: Radius.base,
                paddingVertical: 16,
                alignItems: 'center',
              }}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={Colors.text.inverse} />
              ) : (
                <Text style={{ color: Colors.text.inverse, fontWeight: Typography.bold, fontSize: 16 }}>
                  Login
                </Text>
              )}
            </Pressable>

            {/* Register link */}
            <Pressable style={{ marginTop: 20, alignItems: 'center' }}>
              <Text style={{ color: Colors.slate[500], fontSize: 14 }}>
                Don't have an account?{' '}
                <Text style={{ color: Colors.epf[500], fontWeight: Typography.semibold }}>Register</Text>
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
