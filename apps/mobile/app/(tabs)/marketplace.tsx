// ═══════════════════════════════════════════════════════════════════════════
// Marketplace Tab — Real tab with quick actions, active requests, emergency
// ═══════════════════════════════════════════════════════════════════════════

import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Zap, Wrench, ClipboardList, Plus, ArrowRight, Phone,
  MapPin, Star, Clock, ChevronRight, User,
} from 'lucide-react-native';
import { marketplaceRequestsApi } from '@epowerfix/api-client';
import type { MarketplaceCustomerRequest } from '@epowerfix/types';
import { useAuthStore } from '../../src/store/auth';
import { Colors, Radius, Typography } from '../../src/theme/design-system';

const STATUS_STYLE: Record<string, { bg: string; text: string; label: string }> = {
  DRAFT:       { bg: '#F1F5F9', text: '#64748B', label: 'Draft' },
  SUBMITTED:   { bg: '#FFF7ED', text: '#C2410C', label: 'Submitted' },
  DISPATCHING: { bg: '#EFF6FF', text: '#1D4ED8', label: 'Dispatching' },
  ASSIGNED:    { bg: '#EFF6FF', text: '#1D4ED8', label: 'Assigned' },
  IN_SERVICE:  { bg: '#ECFDF5', text: '#065F46', label: 'In Service' },
  COMPLETED:   { bg: '#ECFDF5', text: '#065F46', label: 'Completed' },
  CANCELLED:   { bg: '#FEF2F2', text: '#991B1B', label: 'Cancelled' },
};

export default function MarketplaceTab() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const [requests, setRequests] = useState<MarketplaceCustomerRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    try {
      const res = await marketplaceRequestsApi.list();
      setRequests(Array.isArray(res.data) ? res.data : []);
    } catch { /* silent */ }
    finally { setLoading(false); setRefreshing(false); }
  }, [user]);

  useEffect(() => { void load(); }, [load]);

  const activeRequests = requests.filter((r) => !['COMPLETED', 'CANCELLED'].includes(r.status));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg.secondary }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} tintColor={Colors.epf[500]} />}
      >
        {/* Header */}
        <View style={{ backgroundColor: Colors.dark[900], paddingHorizontal: 18, paddingVertical: 20 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: Colors.epf[500], alignItems: 'center', justifyContent: 'center' }}>
              <Zap size={20} color="#fff" strokeWidth={2.5} />
            </View>
            <View>
              <Text style={{ color: '#fff', fontSize: 20, fontWeight: Typography.bold }}>Electrician</Text>
              <Text style={{ color: Colors.epf[300], fontSize: 12 }}>Marketplace</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={{ padding: 16 }}>
          <Text style={{ fontSize: 16, fontWeight: Typography.bold, color: Colors.slate[900], marginBottom: 12 }}>Quick Actions</Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Pressable
              onPress={() => router.push('/service-booking' as never)}
              style={{ flex: 1, backgroundColor: Colors.epf[500], borderRadius: Radius.xl, padding: 16, alignItems: 'center' }}
            >
              <Plus size={22} color="#fff" />
              <Text style={{ color: '#fff', fontSize: 12, fontWeight: Typography.semibold, marginTop: 6, textAlign: 'center' }}>Book Electrician</Text>
            </Pressable>
            <Pressable
              onPress={() => router.push('/marketplace/index' as never)}
              style={{ flex: 1, backgroundColor: Colors.bg.primary, borderRadius: Radius.xl, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: Colors.slate[200] }}
            >
              <ClipboardList size={22} color={Colors.epf[600]} />
              <Text style={{ color: Colors.slate[700], fontSize: 12, fontWeight: Typography.semibold, marginTop: 6, textAlign: 'center' }}>Track Requests</Text>
            </Pressable>
            <Pressable
              onPress={() => router.push('/marketplace/electricians' as never)}
              style={{ flex: 1, backgroundColor: Colors.bg.primary, borderRadius: Radius.xl, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: Colors.slate[200] }}
            >
              <User size={22} color={Colors.epf[600]} />
              <Text style={{ color: Colors.slate[700], fontSize: 12, fontWeight: Typography.semibold, marginTop: 6, textAlign: 'center' }}>Browse Pros</Text>
            </Pressable>
          </View>
        </View>

        {/* Emergency Call */}
        <View style={{ marginHorizontal: 16, marginBottom: 16 }}>
          <Pressable
            style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF2F2', borderRadius: Radius.xl, padding: 16, borderWidth: 1, borderColor: '#FECACA' }}
          >
            <View style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: '#DC2626', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
              <Phone size={20} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: Typography.bold, color: '#991B1B' }}>Emergency Service</Text>
              <Text style={{ fontSize: 12, color: '#B91C1C', marginTop: 2 }}>24/7 urgent electrical support</Text>
            </View>
            <ArrowRight size={18} color="#DC2626" />
          </Pressable>
        </View>

        {/* Active Requests */}
        {user && (
          <View style={{ paddingHorizontal: 16, paddingBottom: 24 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <Text style={{ fontSize: 16, fontWeight: Typography.bold, color: Colors.slate[900] }}>Active Requests</Text>
              {requests.length > 0 && (
                <Pressable onPress={() => router.push('/marketplace/index' as never)} style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                  <Text style={{ color: Colors.epf[600], fontSize: 13, fontWeight: Typography.medium }}>View All</Text>
                  <ChevronRight size={14} color={Colors.epf[600]} />
                </Pressable>
              )}
            </View>

            {loading ? (
              <View style={{ paddingVertical: 30, alignItems: 'center' }}>
                <ActivityIndicator size="small" color={Colors.epf[500]} />
              </View>
            ) : activeRequests.length === 0 ? (
              <View style={{ backgroundColor: Colors.bg.primary, borderRadius: Radius.xl, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: Colors.slate[200] }}>
                <Wrench size={32} color={Colors.slate[300]} />
                <Text style={{ fontSize: 14, color: Colors.slate[600], marginTop: 10, textAlign: 'center' }}>No active requests</Text>
                <Pressable
                  onPress={() => router.push('/service-booking' as never)}
                  style={{ marginTop: 14, backgroundColor: Colors.epf[500], borderRadius: Radius.lg, paddingHorizontal: 20, paddingVertical: 10 }}
                >
                  <Text style={{ color: '#fff', fontSize: 13, fontWeight: Typography.semibold }}>Book a Service</Text>
                </Pressable>
              </View>
            ) : (
              activeRequests.slice(0, 3).map((req) => {
                const status = STATUS_STYLE[req.status] || STATUS_STYLE.DRAFT;
                return (
                  <Pressable
                    key={req.id}
                    onPress={() => router.push(`/marketplace/job/${req.id}` as never)}
                    style={{ backgroundColor: Colors.bg.primary, borderRadius: Radius.xl, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: Colors.slate[200], flexDirection: 'row', alignItems: 'center' }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 14, fontWeight: Typography.semibold, color: Colors.slate[900] }} numberOfLines={1}>
                        {(req as any).skillName || (req as any).title || 'Service Request'}
                      </Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                        <Clock size={12} color={Colors.slate[400]} />
                        <Text style={{ fontSize: 12, color: Colors.slate[500] }}>
                          {new Date(req.createdAt).toLocaleDateString('en-BD', { day: 'numeric', month: 'short' })}
                        </Text>
                      </View>
                    </View>
                    <View style={{ backgroundColor: status.bg, borderRadius: Radius.full, paddingHorizontal: 10, paddingVertical: 4 }}>
                      <Text style={{ fontSize: 11, fontWeight: Typography.semibold, color: status.text }}>{status.label}</Text>
                    </View>
                  </Pressable>
                );
              })
            )}
          </View>
        )}

        {/* Login prompt if not authenticated */}
        {!user && (
          <View style={{ paddingHorizontal: 16, paddingBottom: 24 }}>
            <View style={{ backgroundColor: Colors.bg.primary, borderRadius: Radius.xl, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: Colors.slate[200] }}>
              <Wrench size={36} color={Colors.epf[400]} />
              <Text style={{ fontSize: 16, fontWeight: Typography.bold, color: Colors.slate[900], marginTop: 12 }}>Book a certified electrician</Text>
              <Text style={{ fontSize: 13, color: Colors.slate[500], textAlign: 'center', marginTop: 6, lineHeight: 20 }}>
                Sign in to request services, track jobs, and approve quotes.
              </Text>
              <Pressable
                onPress={() => router.push('/login')}
                style={{ marginTop: 16, backgroundColor: Colors.epf[500], borderRadius: Radius.lg, paddingHorizontal: 28, paddingVertical: 12 }}
              >
                <Text style={{ color: '#fff', fontSize: 14, fontWeight: Typography.semibold }}>Sign In</Text>
              </Pressable>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
