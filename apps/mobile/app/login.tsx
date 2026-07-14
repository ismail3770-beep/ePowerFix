// Login screen — simple version
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
    <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 24 }}>
          <View style={{ alignItems: 'center', marginBottom: 32 }}>
            <View style={{ backgroundColor: '#f59e0b', borderRadius: 16, width: 64, height: 64, alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
              <Text style={{ fontSize: 32 }}>⚡</Text>
            </View>
            <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#0f172a' }}>
              Welcome to ePowerFix
            </Text>
            <Text style={{ color: '#64748b', marginTop: 4 }}>Login to your account</Text>
          </View>

          {error ? (
            <View style={{ backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fecaca', borderRadius: 8, padding: 12, marginBottom: 16 }}>
              <Text style={{ color: '#dc2626', fontSize: 14 }}>{error}</Text>
            </View>
          ) : null}

          <View style={{ marginBottom: 16 }}>
            <Text style={{ color: '#334155', fontWeight: '500', marginBottom: 6 }}>Email</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              style={{ borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 12, color: '#0f172a' }}
            />
          </View>

          <View style={{ marginBottom: 24 }}>
            <Text style={{ color: '#334155', fontWeight: '500', marginBottom: 6 }}>Password</Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Enter password"
              secureTextEntry
              style={{ borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 12, color: '#0f172a' }}
            />
          </View>

          <Pressable
            style={{ backgroundColor: '#f59e0b', borderRadius: 12, paddingVertical: 14, alignItems: 'center' }}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>Login</Text>
            )}
          </Pressable>

          <Pressable style={{ marginTop: 16, alignItems: 'center' }} onPress={() => router.back()}>
            <Text style={{ color: '#64748b' }}>← Back to home</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
