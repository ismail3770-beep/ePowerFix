import React, { useEffect, useState } from 'react';
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
import { Zap, Mail, Lock, Eye, EyeOff, ArrowLeft, UserPlus } from 'lucide-react-native';
import { Colors, Typography, Radius } from '../src/theme/design-system';
import { useAuthStore } from '../src/store/auth';

export default function LoginScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const hydrated = useAuthStore((state) => state.hydrated);
  const loading = useAuthStore((state) => state.loading);
  const login = useAuthStore((state) => state.login);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (hydrated && user) {
      router.replace('/(tabs)');
    }
  }, [hydrated, router, user]);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      setError('Please fill in your email and password.');
      return;
    }

    setError('');
    try {
      await login(email, password);
      router.back();
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : 'Login failed');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg.secondary }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 32 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Pressable
            style={{ padding: 16, flexDirection: 'row', alignItems: 'center' }}
            onPress={() => router.back()}
          >
            <ArrowLeft size={20} color={Colors.epf[600]} />
            <Text style={{ color: Colors.epf[600], marginLeft: 6, fontWeight: Typography.medium }}>
              Back
            </Text>
          </Pressable>

          <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 24, paddingTop: 24 }}>
            <View style={{ alignItems: 'center', marginBottom: 28 }}>
              <View
                style={{
                  width: 68,
                  height: 68,
                  borderRadius: Radius['2xl'],
                  backgroundColor: Colors.epf[500],
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 16,
                  shadowColor: Colors.epf[700],
                  shadowOffset: { width: 0, height: 6 },
                  shadowOpacity: 0.2,
                  shadowRadius: 12,
                  elevation: 4,
                }}
              >
                <Zap size={34} color={Colors.text.inverse} strokeWidth={2.5} />
              </View>
              <Text style={{ fontSize: 25, fontWeight: Typography.bold, color: Colors.slate[900] }}>
                Welcome back
              </Text>
              <Text style={{ color: Colors.slate[500], fontSize: 14, marginTop: 5 }}>
                Sign in to continue with ePowerFix
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

            <View style={{ marginBottom: 16 }}>
              <Text style={{ color: Colors.slate[800], fontWeight: Typography.semibold, fontSize: 14, marginBottom: 8 }}>
                Email
              </Text>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: Colors.slate[200],
                  borderRadius: Radius.base,
                  backgroundColor: Colors.bg.primary,
                  paddingHorizontal: 12,
                }}
              >
                <Mail size={18} color={Colors.slate[400]} />
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="you@example.com"
                  placeholderTextColor={Colors.slate[400]}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading}
                  returnKeyType="next"
                  style={{ flex: 1, paddingVertical: 14, color: Colors.slate[900], marginLeft: 10 }}
                />
              </View>
            </View>

            <View style={{ marginBottom: 24 }}>
              <Text style={{ color: Colors.slate[800], fontWeight: Typography.semibold, fontSize: 14, marginBottom: 8 }}>
                Password
              </Text>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: Colors.slate[200],
                  borderRadius: Radius.base,
                  backgroundColor: Colors.bg.primary,
                  paddingHorizontal: 12,
                }}
              >
                <Lock size={18} color={Colors.slate[400]} />
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Enter password"
                  placeholderTextColor={Colors.slate[400]}
                  secureTextEntry={!showPassword}
                  editable={!loading}
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
                  style={{ flex: 1, paddingVertical: 14, color: Colors.slate[900], marginLeft: 10 }}
                />
                <Pressable onPress={() => setShowPassword((visible) => !visible)} hitSlop={10}>
                  {showPassword ? <EyeOff size={18} color={Colors.slate[400]} /> : <Eye size={18} color={Colors.slate[400]} />}
                </Pressable>
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

            <Pressable
              style={{
                marginTop: 20,
                padding: 14,
                borderRadius: Radius.base,
                borderWidth: 1,
                borderColor: Colors.epf[200],
                backgroundColor: Colors.epf[50],
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onPress={() => router.push('/register' as never)}
              disabled={loading}
            >
              <UserPlus size={17} color={Colors.epf[600]} />
              <Text style={{ color: Colors.epf[700], fontSize: 14, fontWeight: Typography.semibold, marginLeft: 8 }}>
                Create a new account
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
