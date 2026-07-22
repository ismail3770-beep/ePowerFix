// Marketplace home — lists customer's service requests + quick actions
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowRight, Bell, ClipboardList, Plus, Wrench, Zap,
} from 'lucide-react-native';
import { marketplaceRequestsApi } from '@epowerfix/api-client';
import type { MarketplaceCustomerRequest } from '@epowerfix/types';
import { useAuthStore } from '../../src/store/auth';
import { Colors, Radius, Typography } from '../../src/theme/design-system';

const REQUEST_STATUS_STYLE: Record<string, { bg: string; text: string; label: string }> = {
  DRAFT:       { bg: '#F1F5F9', text: '#64748B', label: 'Draft' },
  SUBMITTED:   { bg: '#FFF7ED', text: '#C2410C', label: 'Submitted' },
  DISPATCHING: { bg: '#EFF6FF', text: '#1D4ED8', label: 'Dispatching' },
  ASSIGNED:    { bg: '#EFF6FF', text: '#1D4ED8', label: 'Assigned' },
  IN_SERVICE:  { bg: '#ECFDF5', text: '#065F46', label: 'In Service' },
  COMPLETED:   { bg: '#ECFDF5', text: '#065F46', label: 'Completed' },
  CANCELLED:   { bg: '#FEF2F2', text: '#991B1B', label: 'Cancelled' },
  DISPUTED:    { bg: '#FFF7ED', text: '#9A3412', label: 'Disputed' },
  RESOLVED:    { bg: '#F5F3FF', text: '#5B21B6', label: 'Resolved' },
};

function formatDate(value?: string | null) {
  if (!value) return '';
  return new Date(value).toLocaleDateString('en-BD', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function MarketplaceScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const [requests, setRequests] = useState<MarketplaceCustomerRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async (refresh = false) => {
    if (!user) { setLoading(false); return; }
    refresh ? setRefreshing(true) : setLoading(true);
    setError('');
    try {
      const res = await marketplaceRequestsApi.list();
      setRequests(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to load requests');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => { void load(); }, [load]);

  if (!user) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg.secondary }}>
        <View style={{ backgroundColor: Colors.dark[900], paddingHorizontal: 18, paddingVertical: 22 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: Colors.epf[500], alignItems: 'center', justifyContent: 'center' }}>
              <Zap size={20} color="#fff" strokeWidth={2.5} />
            </View>
            <View>
              <Text style={{ color: '#fff', fontSize: 20, fontWeight: Typography.bold }}>ePowerFix</Text>
              <Text style={{ color: Colors.epf[300], fontSize: 12 }}>Electrician Marketplace</Text>
            </View>
          </View>
        </View>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28 }}>
          <View style={{ width: 68, height: 68, borderRadius: 22, backgroundColor: Colors.epf[50], alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
            <Wrench size={30} color={Colors.epf[500]} />
          </View>
          <Text style={{ fontSize: 20, fontWeight: Typography.bold, color: Colors.slate[900], textAlign: 'center' }}>Book a certified electrician</Text>
          <Text style={{ color: Colors.slate[500], fontSize: 14, textAlign: 'center', lineHeight: 22, marginTop: 8 }}>
            Sign in to request electrical services, track your jobs, and approve quotes.
          </Text>
          <Pressable
            style={{ marginTop: 22, backgroundColor: Colors.epf[500], borderRadius: Radius.xl, paddingHorizontal: 28, paddingVertical: 14 }}
            onPress={() => router.push('/login')}
          >
            <Text style={{ color: '#fff', fontWeight: Typography.bold, fontSize: 15 }}>Login / Register</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg.secondary }}>
      {/* Header */}
      <View style={{ backgroundColor: Colors.dark[900], paddingHorizontal: 18, paddingTop: 10, paddingBottom: 20, overflow: 'hidden' }}>
        <View style={{ position: 'absolute', width: 130, height: 130, borderRadius: 65, backgroundColor: Colors.epf[500], opacity: 0.15, right: -30, top: -50 }} />
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={{ width: 36, height: 36, borderRadius: 11, backgroundColor: Colors.epf[500], alignItems: 'center', justifyContent: 'center' }}>
              <Zap size={18} color="#fff" strokeWidth={2.5} />
            </View>
            <View>
              <Text style={{ color: '#fff', fontSize: 18, fontWeight: Typography.bold }}>Marketplace</Text>
              <Text style={{ color: Colors.epf[300], fontSize: 12 }}>Your service requests</Text>
            </View>
          </View>
          <Pressable
            onPress={() => router.push('/notifications')}
            style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' }}
          >
            <Bell size={19} color="#fff" />
          </Pressable>
        </View>
      </View>

      {/* New request button */}
      <View style={{ padding: 14, paddingBottom: 6 }}>
        <Pressable
          onPress={() => router.push('/marketplace/new-request' as never)}
          style={({ pressed }) => ({
            backgroundColor: pressed ? Colors.epf[600] : Colors.epf[500],
            borderRadius: Radius.xl,
            paddingVertical: 14,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          })}
        >
          <Plus size={18} color="#fff" strokeWidth={2.5} />
          <Text style={{ color: '#fff', fontWeight: Typography.bold, fontSize: 15 }}>New Service Request</Text>
        </Pressable>
      </View>

      {error ? (
        <Text style={{ color: Colors.danger, fontSize: 12, textAlign: 'center', paddingHorizontal: 16, marginBottom: 8 }}>{error}</Text>
      ) : null}

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={Colors.epf[500]} />
        </View>
      ) : (
        <FlatList
          data={requests}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 14, paddingTop: 8, flexGrow: requests.length === 0 ? 1 : undefined }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} tintColor={Colors.epf[500]} />}
          ListHeaderComponent={requests.length > 0 ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 }}>
              <ClipboardList size={15} color={Colors.slate[500]} />
              <Text style={{ color: Colors.slate[500], fontSize: 13, fontWeight: Typography.medium }}>
                {requests.length} request{requests.length === 1 ? '' : 's'}
              </Text>
            </View>
          ) : null}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          ListEmptyComponent={(
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28 }}>
              <View style={{ width: 64, height: 64, borderRadius: 22, backgroundColor: Colors.epf[50], alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                <Wrench size={28} color={Colors.epf[500]} />
              </View>
              <Text style={{ color: Colors.slate[900], fontSize: 18, fontWeight: Typography.bold }}>No requests yet</Text>
              <Text style={{ color: Colors.slate[500], fontSize: 13, textAlign: 'center', lineHeight: 20, marginTop: 6 }}>
                Create a service request to get matched with a certified electrician.
              </Text>
            </View>
          )}
          renderItem={({ item }) => {
            const style = REQUEST_STATUS_STYLE[item.status] ?? REQUEST_STATUS_STYLE.DRAFT;
            return (
              <Pressable
                onPress={() => router.push(`/marketplace/request/${item.id}` as never)}
                style={({ pressed }) => ({
                  backgroundColor: pressed ? Colors.slate[50] : Colors.bg.primary,
                  borderRadius: Radius['2xl'],
                  borderWidth: 1,
                  borderColor: Colors.slate[200],
                  padding: 15,
                })}
              >
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <View style={{ flex: 1, marginRight: 10 }}>
                    <Text style={{ color: Colors.slate[900], fontSize: 15, fontWeight: Typography.semibold, lineHeight: 21 }} numberOfLines={2}>
                      {item.problemSummary}
                    </Text>
                    <Text style={{ color: Colors.slate[500], fontSize: 12, marginTop: 4 }}>
                      {item.districtName}{item.areaName ? ` · ${item.areaName}` : ''}
                      {item.scheduledFor ? ` · ${formatDate(item.scheduledFor)}` : ''}
                    </Text>
                  </View>
                  <View style={{ backgroundColor: style.bg, borderRadius: Radius.full, paddingHorizontal: 10, paddingVertical: 4 }}>
                    <Text style={{ color: style.text, fontSize: 11, fontWeight: Typography.bold }}>{style.label}</Text>
                  </View>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: Colors.slate[100] }}>
                  {item.isEmergency ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FFF7ED', borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 3 }}>
                      <Zap size={11} color="#C2410C" strokeWidth={2.5} />
                      <Text style={{ color: '#C2410C', fontSize: 11, fontWeight: Typography.bold }}>Emergency</Text>
                    </View>
                  ) : <View />}
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Text style={{ color: Colors.epf[600], fontSize: 13, fontWeight: Typography.semibold }}>View details</Text>
                    <ArrowRight size={14} color={Colors.epf[600]} />
                  </View>
                </View>
              </Pressable>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}
