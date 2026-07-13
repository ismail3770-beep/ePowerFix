// Login screen
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
import { authApi } from '@epowerfix/api-client';
import { Colors } from '../src/theme/colors';

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
      const res = await authApi.login(email, password);
      if (res.data?.user) {
        // TODO: Save user to auth store
        router.back();
      }
    } catch (e: any) {
      setError(e?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <View className="flex-1 justify-center px-6">
          <View className="items-center mb-8">
            <View className="bg-primary-500 rounded-2xl w-16 h-16 items-center justify-center mb-3">
              <Text className="text-3xl">⚡</Text>
            </View>
            <Text className="text-2xl font-bold text-slate-900">
              Welcome to ePowerFix
            </Text>
            <Text className="text-slate-500 mt-1">Login to your account</Text>
          </View>

          {error ? (
            <View className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <Text className="text-red-700 text-sm">{error}</Text>
            </View>
          ) : null}

          <View className="mb-4">
            <Text className="text-slate-700 font-medium mb-1.5">Email</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              className="border border-slate-200 rounded-lg px-4 py-3 text-slate-900"
            />
          </View>

          <View className="mb-6">
            <Text className="text-slate-700 font-medium mb-1.5">Password</Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Enter password"
              secureTextEntry
              className="border border-slate-200 rounded-lg px-4 py-3 text-slate-900"
            />
          </View>

          <Pressable
            className="bg-primary-500 rounded-xl py-3.5 items-center"
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-bold text-base">Login</Text>
            )}
          </Pressable>

          <Pressable
            className="mt-4 items-center"
            onPress={() => router.back()}
          >
            <Text className="text-slate-500">← Back to home</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
