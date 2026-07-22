// Service request detail screen
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowLeft, ArrowRight, Calendar, CheckCircle2, MapPin, Send, XCircle, Zap,
} from 'lucide-react-native';
import { marketplaceRequestsApi } from '@epowerfix/api-client';
import type { MarketplaceCustomerRequest } from '@epowerfix/types';
import { Colors, Radius, Typography } from '../../../src/theme/design-system';

const STATUS_STYLE: Record<string, { bg: string; text: string; label: string }> = {
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
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-BD', { dateStyle: 'medium' });
}

export default function RequestDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [request, setRequest] = useState<MarketplaceCustomerRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async (refresh = false) => {
    if (!id) return;
    refresh ? setRefreshing(true) : setLoading(true);
    try {
      const res = await marketplaceRequestsApi.get(id);
      setRequest(res.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  useEffect(() => { void load(); }, [load]);

  const handleSubmit = async () => {
    if (!id) return;
    setSubmitting(true);
    setError('');
    try {
      const res = await marketplaceRequestsApi.submit(id);
      setRequest(res.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to submit');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async () => {
    if (!id) return;
    setCancelling(true);
    setError('');
    try {
      const res = await marketplaceRequestsApi.cancel(id, 'Cancelled by customer');
      setRequest(res.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to cancel');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg.secondary, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={Colors.epf[500]} />
      </SafeAreaView>
    );
  }

  if (!request) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg.secondary, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <Text style={{ color: Colors.slate[500], fontSize: 15 }}>{error || 'Request not found'}</Text>
        <Pressable onPress={() => router.back()} style={{ marginTop: 16 }}>
          <Text style={{ color: Colors.epf[500], fontWeight: Typography.semibold }}>Go back</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const statusStyle = STATUS_STYLE[request.status] ?? STATUS_STYLE.DRAFT;
  const hasJob = !!request.job;
  const canSubmit = request.status === 'DRAFT';
  const canCancel = ['DRAFT', 'SUBMITTED'].includes(request.status);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg.secondary }}>
      {/* Header */}
      <View style={{ backgroundColor: Colors.bg.primary, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: Colors.slate[200] }}>
        <Pressable onPress={() => router.back()} style={{ padding: 4, marginRight: 10 }}>
          <ArrowLeft size={22} color={Colors.slate[800]} />
        </Pressable>
        <Text style={{ flex: 1, color: Colors.slate[900], fontSize: 17, fontWeight: Typography.bold }}>Request Detail</Text>
        <View style={{ backgroundColor: statusStyle.bg, borderRadius: Radius.full, paddingHorizontal: 11, paddingVertical: 5 }}>
          <Text style={{ color: statusStyle.text, fontSize: 12, fontWeight: Typography.bold }}>{statusStyle.label}</Text>
        </View>
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} tintColor={Colors.epf[500]} />}
        contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {error ? (
          <View style={{ backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA', borderRadius: Radius.lg, padding: 12 }}>
            <Text style={{ color: Colors.danger, fontSize: 13 }}>{error}</Text>
          </View>
        ) : null}

        {/* Summary card */}
        <View style={{ backgroundColor: Colors.bg.primary, borderRadius: Radius['2xl'], borderWidth: 1, borderColor: Colors.slate[200], padding: 16 }}>
          <Text style={{ color: Colors.slate[900], fontSize: 17, fontWeight: Typography.bold, lineHeight: 24 }}>{request.problemSummary}</Text>
          {request.isEmergency && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 }}>
              <Zap size={13} color="#C2410C" strokeWidth={2.5} />
              <Text style={{ color: '#C2410C', fontSize: 12, fontWeight: Typography.bold }}>Emergency</Text>
            </View>
          )}
          <InfoRow icon={<MapPin size={14} color={Colors.slate[400]} />} label={`${request.districtName}${request.areaName ? `, ${request.areaName}` : ''}`} />
          {request.scheduledFor && (
            <InfoRow icon={<Calendar size={14} color={Colors.slate[400]} />} label={`Scheduled: ${formatDate(request.scheduledFor)}`} />
          )}
          {request.service?.name && (
            <InfoRow icon={<ArrowRight size={14} color={Colors.slate[400]} />} label={`Service: ${request.service.name}`} />
          )}
        </View>

        {/* Job card */}
        {hasJob && request.job && (
          <Pressable
            onPress={() => router.push(`/marketplace/job/${request.job!.id}` as never)}
            style={({ pressed }) => ({
              backgroundColor: pressed ? Colors.epf[50] : Colors.bg.primary,
              borderRadius: Radius['2xl'],
              borderWidth: 1,
              borderColor: Colors.epf[200],
              padding: 16,
            })}
          >
            <Text style={{ color: Colors.epf[700], fontSize: 13, fontWeight: Typography.semibold, marginBottom: 6 }}>Active Job</Text>
            <Text style={{ color: Colors.slate[900], fontSize: 15, fontWeight: Typography.bold }}>
              Status: {request.job.status.replaceAll('_', ' ')}
            </Text>
            {request.job.provider && (
              <Text style={{ color: Colors.slate[600], fontSize: 13, marginTop: 4 }}>
                Provider: {request.job.provider.displayName}
              </Text>
            )}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 10 }}>
              <Text style={{ color: Colors.epf[600], fontSize: 13, fontWeight: Typography.semibold }}>View job details</Text>
              <ArrowRight size={14} color={Colors.epf[600]} />
            </View>
          </Pressable>
        )}

        {/* Actions */}
        {canSubmit && (
          <Pressable
            onPress={handleSubmit}
            disabled={submitting}
            style={({ pressed }) => ({
              backgroundColor: pressed ? Colors.epf[600] : Colors.epf[500],
              borderRadius: Radius.xl,
              paddingVertical: 14,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              opacity: submitting ? 0.7 : 1,
            })}
          >
            {submitting
              ? <ActivityIndicator color="#fff" />
              : <>
                  <Send size={16} color="#fff" />
                  <Text style={{ color: '#fff', fontWeight: Typography.bold, fontSize: 15 }}>Submit Request</Text>
                </>
            }
          </Pressable>
        )}

        {canCancel && (
          <Pressable
            onPress={handleCancel}
            disabled={cancelling}
            style={({ pressed }) => ({
              backgroundColor: pressed ? '#FEF2F2' : Colors.bg.primary,
              borderRadius: Radius.xl,
              paddingVertical: 14,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              borderWidth: 1,
              borderColor: '#FECACA',
              opacity: cancelling ? 0.7 : 1,
            })}
          >
            {cancelling
              ? <ActivityIndicator color={Colors.danger} />
              : <>
                  <XCircle size={16} color={Colors.danger} />
                  <Text style={{ color: Colors.danger, fontWeight: Typography.semibold, fontSize: 14 }}>Cancel Request</Text>
                </>
            }
          </Pressable>
        )}

        {request.status === 'COMPLETED' && (
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, padding: 14, backgroundColor: '#ECFDF5', borderRadius: Radius.xl, borderWidth: 1, borderColor: '#A7F3D0' }}>
            <CheckCircle2 size={18} color='#065F46' />
            <Text style={{ color: '#065F46', fontWeight: Typography.semibold, fontSize: 14 }}>This request has been completed</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 }}>
      {icon}
      <Text style={{ color: Colors.slate[600], fontSize: 13 }}>{label}</Text>
    </View>
  );
}
