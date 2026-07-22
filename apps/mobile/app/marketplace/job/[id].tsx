// Job detail screen — tracking, quote decision, confirm completion
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, Pressable, RefreshControl,
  ScrollView, Text, TextInput, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowLeft, BadgeCheck, CheckCircle2, Clock3, FileText,
  MapPin, ThumbsDown, ThumbsUp, Truck, User, Wrench,
} from 'lucide-react-native';
import { marketplaceJobsApi } from '@epowerfix/api-client';
import type { MarketplaceCustomerJob } from '@epowerfix/types';
import { Colors, Radius, Typography } from '../../../src/theme/design-system';

const JOB_STATUS_STYLE: Record<string, { bg: string; text: string; label: string }> = {
  ASSIGNED:                     { bg: '#EFF6FF', text: '#1D4ED8', label: 'Assigned' },
  ACCEPTED:                     { bg: '#EFF6FF', text: '#1D4ED8', label: 'Accepted' },
  EN_ROUTE:                     { bg: '#F0F9FF', text: '#0369A1', label: 'En Route' },
  ARRIVED:                      { bg: '#F0FDF4', text: '#166534', label: 'Arrived' },
  INSPECTION:                   { bg: '#FFF7ED', text: '#9A3412', label: 'Inspection' },
  QUOTE_PENDING:                { bg: '#F5F3FF', text: '#5B21B6', label: 'Quote Pending' },
  QUOTE_APPROVED:               { bg: '#ECFDF5', text: '#065F46', label: 'Quote Approved' },
  QUOTE_REJECTED:               { bg: '#FEF2F2', text: '#991B1B', label: 'Quote Rejected' },
  IN_PROGRESS:                  { bg: '#EFF6FF', text: '#1D4ED8', label: 'In Progress' },
  COMPLETED_PENDING_CONFIRMATION: { bg: '#FFF7ED', text: '#92400E', label: 'Pending Confirmation' },
  COMPLETED:                    { bg: '#ECFDF5', text: '#065F46', label: 'Completed' },
  CANCELLED:                    { bg: '#FEF2F2', text: '#991B1B', label: 'Cancelled' },
  DISPUTED:                     { bg: '#FFF7ED', text: '#9A3412', label: 'Disputed' },
  RESOLVED:                     { bg: '#F5F3FF', text: '#5B21B6', label: 'Resolved' },
};

function money(value: string) {
  return `৳${Number(value || 0).toLocaleString()}`;
}

function formatDate(value?: string | null) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-BD', { dateStyle: 'medium' });
}

export default function JobDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [job, setJob] = useState<MarketplaceCustomerJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [quoteNote, setQuoteNote] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async (refresh = false) => {
    if (!id) return;
    refresh ? setRefreshing(true) : setLoading(true);
    try {
      const res = await marketplaceJobsApi.get(id);
      setJob(res.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  useEffect(() => { void load(); }, [load]);

  const handleQuoteDecision = async (decision: 'APPROVE' | 'REJECT') => {
    if (!id) return;
    const label = decision === 'APPROVE' ? 'Approve' : 'Reject';
    Alert.alert(`${label} Quote`, `Are you sure you want to ${label.toLowerCase()} this quote?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: label,
        style: decision === 'REJECT' ? 'destructive' : 'default',
        onPress: async () => {
          setActionLoading(`quote-${decision}`);
          setError('');
          try {
            const res = await marketplaceJobsApi.decideQuote(id, decision, quoteNote || undefined);
            setJob(res.data);
            setQuoteNote('');
          } catch (e) {
            setError(e instanceof Error ? e.message : `Failed to ${label.toLowerCase()} quote`);
          } finally {
            setActionLoading(null);
          }
        },
      },
    ]);
  };

  const handleConfirmCompletion = async () => {
    if (!id) return;
    Alert.alert('Confirm Completion', 'Are you happy with the work done?', [
      { text: 'Not yet', style: 'cancel' },
      {
        text: 'Yes, confirm',
        onPress: async () => {
          setActionLoading('confirm');
          setError('');
          try {
            const res = await marketplaceJobsApi.confirmCompletion(id);
            setJob(res.data);
          } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to confirm completion');
          } finally {
            setActionLoading(null);
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg.secondary, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={Colors.epf[500]} />
      </SafeAreaView>
    );
  }

  if (!job) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg.secondary, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <Text style={{ color: Colors.slate[500], fontSize: 15 }}>{error || 'Job not found'}</Text>
        <Pressable onPress={() => router.back()} style={{ marginTop: 16 }}>
          <Text style={{ color: Colors.epf[500], fontWeight: Typography.semibold }}>Go back</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const statusStyle = JOB_STATUS_STYLE[job.status] ?? JOB_STATUS_STYLE.ASSIGNED;
  const activeQuote = job.quotes.find((q) => q.status === 'SUBMITTED');
  const showQuoteDecision = job.status === 'QUOTE_PENDING' && !!activeQuote;
  const showConfirmCompletion = job.status === 'COMPLETED_PENDING_CONFIRMATION';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg.secondary }}>
      {/* Header */}
      <View style={{ backgroundColor: Colors.bg.primary, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: Colors.slate[200] }}>
        <Pressable onPress={() => router.back()} style={{ padding: 4, marginRight: 10 }}>
          <ArrowLeft size={22} color={Colors.slate[800]} />
        </Pressable>
        <Text style={{ flex: 1, color: Colors.slate[900], fontSize: 17, fontWeight: Typography.bold }}>Job Details</Text>
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

        {/* Request summary */}
        <View style={{ backgroundColor: Colors.bg.primary, borderRadius: Radius['2xl'], borderWidth: 1, borderColor: Colors.slate[200], padding: 16 }}>
          <Text style={{ color: Colors.slate[500], fontSize: 12, fontWeight: Typography.medium, marginBottom: 6 }}>SERVICE REQUEST</Text>
          <Text style={{ color: Colors.slate[900], fontSize: 16, fontWeight: Typography.bold, lineHeight: 22 }}>{job.request.problemSummary}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 8 }}>
            <MapPin size={13} color={Colors.slate[400]} />
            <Text style={{ color: Colors.slate[600], fontSize: 13 }}>{job.request.districtName}{job.request.areaName ? `, ${job.request.areaName}` : ''}</Text>
          </View>
          {job.request.scheduledFor && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 5 }}>
              <Clock3 size={13} color={Colors.slate[400]} />
              <Text style={{ color: Colors.slate[600], fontSize: 13 }}>Scheduled: {formatDate(job.request.scheduledFor)}</Text>
            </View>
          )}
        </View>

        {/* Provider card */}
        {job.provider && (
          <View style={{ backgroundColor: Colors.bg.primary, borderRadius: Radius['2xl'], borderWidth: 1, borderColor: Colors.slate[200], padding: 16 }}>
            <Text style={{ color: Colors.slate[500], fontSize: 12, fontWeight: Typography.medium, marginBottom: 8 }}>ASSIGNED ELECTRICIAN</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ width: 46, height: 46, borderRadius: 15, backgroundColor: Colors.epf[50], alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.epf[100] }}>
                <User size={22} color={Colors.epf[500]} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: Colors.slate[900], fontSize: 15, fontWeight: Typography.bold }}>{job.provider.displayName}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 }}>
                  <BadgeCheck size={13} color={Colors.epf[500]} />
                  <Text style={{ color: Colors.slate[500], fontSize: 12 }}>Rating {job.provider.rating} · {job.provider.jobsCompleted} jobs</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Job timeline */}
        <View style={{ backgroundColor: Colors.bg.primary, borderRadius: Radius['2xl'], borderWidth: 1, borderColor: Colors.slate[200], padding: 16 }}>
          <Text style={{ color: Colors.slate[500], fontSize: 12, fontWeight: Typography.medium, marginBottom: 12 }}>JOB TIMELINE</Text>
          {[
            { icon: <Wrench size={14} color={Colors.epf[500]} />, label: 'Assigned', value: job.assignedAt },
            { icon: <Truck size={14} color={Colors.epf[500]} />, label: 'En Route', value: job.enRouteAt },
            { icon: <MapPin size={14} color={Colors.epf[500]} />, label: 'Arrived', value: job.arrivedAt },
            { icon: <CheckCircle2 size={14} color={Colors.epf[500]} />, label: 'Accepted', value: job.acceptedAt },
            { icon: <CheckCircle2 size={14} color='#065F46' />, label: 'Completed', value: job.completedAt },
          ].map((step, i) => step.value ? (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              {step.icon}
              <Text style={{ color: Colors.slate[700], fontSize: 13, flex: 1 }}>{step.label}</Text>
              <Text style={{ color: Colors.slate[500], fontSize: 12 }}>{formatDate(step.value)}</Text>
            </View>
          ) : null)}
        </View>

        {/* Quote decision */}
        {showQuoteDecision && activeQuote && (
          <View style={{ backgroundColor: '#F5F3FF', borderRadius: Radius['2xl'], borderWidth: 1, borderColor: '#DDD6FE', padding: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 }}>
              <FileText size={16} color='#5B21B6' />
              <Text style={{ color: '#5B21B6', fontSize: 14, fontWeight: Typography.bold }}>Quote Ready for Decision</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
              <Text style={{ color: Colors.slate[600], fontSize: 13 }}>Subtotal</Text>
              <Text style={{ color: Colors.slate[900], fontWeight: Typography.semibold, fontSize: 13 }}>{money(activeQuote.subtotal)}</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
              <Text style={{ color: Colors.slate[600], fontSize: 13 }}>Tax</Text>
              <Text style={{ color: Colors.slate[900], fontWeight: Typography.semibold, fontSize: 13 }}>{money(activeQuote.taxTotal)}</Text>
            </View>
            <View style={{ height: 1, backgroundColor: '#DDD6FE', marginVertical: 8 }} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
              <Text style={{ color: Colors.slate[900], fontSize: 15, fontWeight: Typography.bold }}>Total</Text>
              <Text style={{ color: '#5B21B6', fontSize: 18, fontWeight: Typography.bold }}>{money(activeQuote.total)}</Text>
            </View>
            <TextInput
              value={quoteNote}
              onChangeText={setQuoteNote}
              placeholder="Add a note (optional)"
              placeholderTextColor={Colors.slate[400]}
              style={{ backgroundColor: Colors.bg.primary, borderWidth: 1, borderColor: '#DDD6FE', borderRadius: Radius.lg, padding: 11, fontSize: 13, color: Colors.slate[900], marginBottom: 12 }}
            />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Pressable
                onPress={() => void handleQuoteDecision('REJECT')}
                disabled={!!actionLoading}
                style={({ pressed }) => ({ flex: 1, backgroundColor: pressed ? '#FEE2E2' : Colors.bg.primary, borderWidth: 1, borderColor: '#FECACA', borderRadius: Radius.xl, paddingVertical: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, opacity: actionLoading === 'quote-REJECT' ? 0.7 : 1 })}
              >
                {actionLoading === 'quote-REJECT' ? <ActivityIndicator size="small" color={Colors.danger} /> : <><ThumbsDown size={15} color={Colors.danger} /><Text style={{ color: Colors.danger, fontWeight: Typography.semibold }}>Reject</Text></>}
              </Pressable>
              <Pressable
                onPress={() => void handleQuoteDecision('APPROVE')}
                disabled={!!actionLoading}
                style={({ pressed }) => ({ flex: 1, backgroundColor: pressed ? '#7C3AED' : '#5B21B6', borderRadius: Radius.xl, paddingVertical: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, opacity: actionLoading === 'quote-APPROVE' ? 0.7 : 1 })}
              >
                {actionLoading === 'quote-APPROVE' ? <ActivityIndicator size="small" color="#fff" /> : <><ThumbsUp size={15} color="#fff" /><Text style={{ color: '#fff', fontWeight: Typography.bold }}>Approve</Text></>}
              </Pressable>
            </View>
          </View>
        )}

        {/* Confirm completion */}
        {showConfirmCompletion && (
          <Pressable
            onPress={handleConfirmCompletion}
            disabled={!!actionLoading}
            style={({ pressed }) => ({
              backgroundColor: pressed ? '#059669' : '#10B981',
              borderRadius: Radius.xl,
              paddingVertical: 15,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              opacity: actionLoading === 'confirm' ? 0.7 : 1,
            })}
          >
            {actionLoading === 'confirm'
              ? <ActivityIndicator color="#fff" />
              : <><CheckCircle2 size={18} color="#fff" /><Text style={{ color: '#fff', fontWeight: Typography.bold, fontSize: 15 }}>Confirm Job Completed</Text></>
            }
          </Pressable>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
