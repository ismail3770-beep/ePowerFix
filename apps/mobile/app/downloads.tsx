import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Download, FileText, Lock, Package } from 'lucide-react-native';
import { downloadsApi } from '@epowerfix/api-client';
import { useAuthStore } from '../src/store/auth';
import { Colors, Typography, Radius } from '../src/theme/design-system';

export default function DownloadsScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const [downloads, setDownloads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [openingId, setOpeningId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    try {
      setError('');
      const response = await downloadsApi.list();
      setDownloads(Array.isArray(response.data) ? response.data : []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load downloads');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { void load(); }, [load]);

  const openDownload = async (item: any) => {
    setOpeningId(item.orderItemId);
    setError('');
    try {
      const url = await downloadsApi.open(item.orderItemId);
      if (!url || !(await Linking.canOpenURL(url))) throw new Error('The file could not be opened on this device.');
      await Linking.openURL(url);
    } catch (openError) {
      setError(openError instanceof Error ? openError.message : 'Unable to open download');
    } finally {
      setOpeningId(null);
    }
  };

  if (!user) {
    return <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg.secondary, justifyContent: 'center', alignItems: 'center', padding: 24 }}><Lock size={42} color={Colors.slate[300]} /><Text style={{ color: Colors.slate[900], fontSize: 19, fontWeight: Typography.semibold, marginTop: 14 }}>Sign in to view downloads</Text><Pressable style={{ backgroundColor: Colors.epf[500], borderRadius: Radius.base, paddingHorizontal: 24, paddingVertical: 13, marginTop: 18 }} onPress={() => router.push('/login')}><Text style={{ color: Colors.text.inverse, fontWeight: Typography.bold }}>Login / Register</Text></Pressable></SafeAreaView>;
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg.secondary }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 30 }}>
        <View style={{ backgroundColor: Colors.bg.primary, padding: 16, borderBottomWidth: 1, borderBottomColor: Colors.slate[200], flexDirection: 'row', alignItems: 'center' }}><Pressable onPress={() => router.back()} style={{ padding: 4, marginRight: 10 }}><ArrowLeft size={21} color={Colors.slate[800]} /></Pressable><View><Text style={{ color: Colors.slate[900], fontSize: 22, fontWeight: Typography.bold }}>Downloads</Text><Text style={{ color: Colors.slate[500], fontSize: 13, marginTop: 3 }}>Your purchased digital products</Text></View></View>
        <View style={{ padding: 14 }}>
          {error ? <View style={{ backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA', borderRadius: Radius.base, padding: 12, marginBottom: 12 }}><Text style={{ color: Colors.danger, fontSize: 13 }}>{error}</Text></View> : null}
          {loading ? <ActivityIndicator size="large" color={Colors.epf[500]} style={{ marginTop: 35 }} /> : downloads.length === 0 ? <View style={{ alignItems: 'center', paddingVertical: 60 }}><FileText size={40} color={Colors.slate[300]} /><Text style={{ color: Colors.slate[800], fontSize: 17, fontWeight: Typography.semibold, marginTop: 13 }}>No digital downloads</Text><Text style={{ color: Colors.slate[500], fontSize: 13, textAlign: 'center', marginTop: 6 }}>Purchased digital products will appear here after payment.</Text></View> : downloads.map((item) => <View key={item.orderItemId} style={{ backgroundColor: Colors.bg.primary, borderWidth: 1, borderColor: Colors.slate[200], borderRadius: Radius.lg, padding: 15, marginBottom: 11 }}><View style={{ flexDirection: 'row', alignItems: 'center' }}><View style={{ width: 40, height: 40, borderRadius: Radius.md, backgroundColor: Colors.epf[50], alignItems: 'center', justifyContent: 'center' }}><Package size={19} color={Colors.epf[600]} /></View><View style={{ flex: 1, marginLeft: 10 }}><Text style={{ color: Colors.slate[900], fontWeight: Typography.semibold, fontSize: 15 }} numberOfLines={2}>{item.productName}</Text><Text style={{ color: Colors.slate[500], fontSize: 12, marginTop: 4 }}>Order #{item.orderNumber}</Text></View></View><View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, paddingTop: 11, borderTopWidth: 1, borderTopColor: Colors.slate[100] }}><Text style={{ color: item.unlocked && item.hasFile ? Colors.success : Colors.slate[500], fontSize: 12 }}>{item.unlocked && item.hasFile ? `${item.remaining} download${item.remaining === 1 ? '' : 's'} remaining` : 'Unavailable until payment is confirmed'}</Text><Pressable disabled={!item.unlocked || !item.hasFile || item.remaining <= 0 || openingId === item.orderItemId} onPress={() => void openDownload(item)} style={{ borderWidth: 1, borderColor: item.unlocked && item.hasFile ? Colors.epf[500] : Colors.slate[200], borderRadius: Radius.base, paddingHorizontal: 12, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', opacity: item.unlocked && item.hasFile ? 1 : 0.6 }}>{openingId === item.orderItemId ? <ActivityIndicator size="small" color={Colors.epf[500]} /> : <><Download size={14} color={Colors.epf[600]} /><Text style={{ color: Colors.epf[600], fontSize: 12, fontWeight: Typography.semibold, marginLeft: 5 }}>Open file</Text></>}</Pressable></View></View>)}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
