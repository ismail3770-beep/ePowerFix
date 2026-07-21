import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Bell,
  BriefcaseBusiness,
  CheckCheck,
  CircleDollarSign,
  FileText,
  RefreshCw,
  ShieldAlert,
} from 'lucide-react-native';
import { marketplaceNotificationsApi } from '@epowerfix/api-client';
import type { MarketplaceNotification } from '@epowerfix/types';
import { useAuthStore } from '../src/store/auth';
import { Colors, Radius, Typography } from '../src/theme/design-system';

function timeAgo(value: string): string {
  const elapsed = Math.max(0, Date.now() - new Date(value).getTime());
  const minutes = Math.floor(elapsed / 60_000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(value).toLocaleDateString('en-BD', { day: 'numeric', month: 'short' });
}

function notificationTheme(template: string) {
  if (template.includes('PAYMENT')) {
    return { Icon: CircleDollarSign, color: '#059669', background: '#ECFDF5' };
  }
  if (template.includes('QUOTE')) {
    return { Icon: FileText, color: '#7C3AED', background: '#F5F3FF' };
  }
  if (template.includes('WARRANTY') || template.includes('DISPUTE')) {
    return { Icon: ShieldAlert, color: '#EA580C', background: '#FFF7ED' };
  }
  if (template.includes('ASSIGNED') || template.includes('WORK') || template.includes('COMPLETION')) {
    return { Icon: BriefcaseBusiness, color: Colors.epf[600], background: Colors.epf[50] };
  }
  return { Icon: Bell, color: Colors.epf[600], background: Colors.epf[50] };
}

export default function NotificationsScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const [notifications, setNotifications] = useState<MarketplaceNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const [error, setError] = useState('');

  const loadNotifications = useCallback(async (refresh = false) => {
    if (!user) {
      setLoading(false);
      return;
    }
    refresh ? setRefreshing(true) : setLoading(true);
    setError('');
    try {
      const response = await marketplaceNotificationsApi.list({ page: 1, limit: 50 });
      setNotifications(response.data.data);
      setUnreadCount(response.unreadCount);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load your service inbox.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    void loadNotifications();
  }, [loadNotifications]);

  const markRead = useCallback(async (notification: MarketplaceNotification) => {
    if (notification.readAt) return;
    const readAt = new Date().toISOString();
    setNotifications((items) => items.map((item) => item.id === notification.id ? { ...item, readAt } : item));
    setUnreadCount((count) => Math.max(0, count - 1));
    try {
      await marketplaceNotificationsApi.markRead(notification.id);
    } catch (markError) {
      setNotifications((items) => items.map((item) => item.id === notification.id ? { ...item, readAt: null } : item));
      setUnreadCount((count) => count + 1);
      setError(markError instanceof Error ? markError.message : 'Unable to mark this update as read.');
    }
  }, []);

  const markAllRead = useCallback(async () => {
    if (!unreadCount || markingAll) return;
    setMarkingAll(true);
    setError('');
    try {
      await marketplaceNotificationsApi.markAllRead();
      const readAt = new Date().toISOString();
      setNotifications((items) => items.map((item) => item.readAt ? item : { ...item, readAt }));
      setUnreadCount(0);
    } catch (markError) {
      setError(markError instanceof Error ? markError.message : 'Unable to mark all updates as read.');
    } finally {
      setMarkingAll(false);
    }
  }, [markingAll, unreadCount]);

  const headerSubtitle = useMemo(
    () => unreadCount ? `${unreadCount} update${unreadCount === 1 ? '' : 's'} waiting for you` : 'Everything is up to date',
    [unreadCount],
  );

  if (!user) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg.secondary }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16 }}>
          <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => router.back()} style={{ padding: 6 }}>
            <ArrowLeft size={22} color={Colors.slate[800]} />
          </Pressable>
        </View>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28 }}>
          <View style={{ width: 68, height: 68, borderRadius: 24, backgroundColor: Colors.epf[50], alignItems: 'center', justifyContent: 'center' }}>
            <Bell size={30} color={Colors.epf[600]} />
          </View>
          <Text style={{ marginTop: 18, fontSize: 20, fontWeight: Typography.bold, color: Colors.slate[900] }}>Sign in to view your inbox</Text>
          <Text style={{ marginTop: 7, textAlign: 'center', color: Colors.slate[500], lineHeight: 20 }}>Service assignments, quotes, payments and case updates stay private to your account.</Text>
          <Pressable accessibilityRole="button" onPress={() => router.push('/login')} style={{ marginTop: 22, borderRadius: Radius.xl, backgroundColor: Colors.epf[500], paddingHorizontal: 26, paddingVertical: 13 }}>
            <Text style={{ color: Colors.text.inverse, fontWeight: Typography.bold }}>Login / Register</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg.secondary }}>
      <View style={{ backgroundColor: Colors.slate[950], paddingHorizontal: 18, paddingTop: 10, paddingBottom: 24, overflow: 'hidden' }}>
        <View style={{ position: 'absolute', width: 150, height: 150, borderRadius: 75, backgroundColor: Colors.epf[500], opacity: 0.18, right: -42, top: -62 }} />
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => router.back()} style={{ width: 40, height: 40, borderRadius: Radius.xl, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' }}>
            <ArrowLeft size={21} color={Colors.text.inverse} />
          </Pressable>
          <View style={{ flex: 1, marginLeft: 13 }}>
            <Text style={{ color: Colors.text.inverse, fontSize: 22, fontWeight: Typography.bold }}>Service inbox</Text>
            <Text style={{ color: Colors.epf[200], fontSize: 12, marginTop: 3 }}>{headerSubtitle}</Text>
          </View>
          {unreadCount > 0 ? (
            <Pressable accessibilityRole="button" accessibilityLabel="Mark all notifications as read" disabled={markingAll} onPress={() => void markAllRead()} style={{ flexDirection: 'row', alignItems: 'center', borderRadius: Radius.xl, backgroundColor: 'rgba(14,165,233,0.2)', paddingHorizontal: 11, paddingVertical: 9, opacity: markingAll ? 0.6 : 1 }}>
              {markingAll ? <ActivityIndicator size="small" color={Colors.epf[200]} /> : <CheckCheck size={16} color={Colors.epf[200]} />}
              <Text style={{ color: Colors.epf[100], fontSize: 11, fontWeight: Typography.semibold, marginLeft: 5 }}>Read all</Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      {error ? (
        <View style={{ marginHorizontal: 14, marginTop: 12, padding: 12, borderRadius: Radius.xl, borderWidth: 1, borderColor: '#FED7AA', backgroundColor: '#FFF7ED', flexDirection: 'row', alignItems: 'center' }}>
          <ShieldAlert size={17} color="#EA580C" />
          <Text style={{ flex: 1, marginLeft: 8, color: '#9A3412', fontSize: 12, lineHeight: 18 }}>{error}</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Retry loading notifications" onPress={() => void loadNotifications()} style={{ padding: 5 }}>
            <RefreshCw size={17} color="#EA580C" />
          </Pressable>
        </View>
      ) : null}

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={Colors.epf[500]} />
          <Text style={{ marginTop: 12, color: Colors.slate[500], fontSize: 13 }}>Loading secure updates…</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 14, paddingBottom: 34, flexGrow: notifications.length ? undefined : 1 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void loadNotifications(true)} tintColor={Colors.epf[500]} colors={[Colors.epf[500]]} />}
          ItemSeparatorComponent={() => <View style={{ height: 9 }} />}
          ListEmptyComponent={(
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28 }}>
              <View style={{ width: 64, height: 64, borderRadius: 22, backgroundColor: Colors.epf[50], alignItems: 'center', justifyContent: 'center' }}><Bell size={28} color={Colors.epf[500]} /></View>
              <Text style={{ marginTop: 16, color: Colors.slate[900], fontSize: 18, fontWeight: Typography.bold }}>You’re all caught up</Text>
              <Text style={{ marginTop: 6, color: Colors.slate[500], textAlign: 'center', lineHeight: 20 }}>Assignments, quotes, payment confirmations and support decisions will appear here.</Text>
            </View>
          )}
          renderItem={({ item }) => {
            const { Icon, color, background } = notificationTheme(item.template);
            const unread = !item.readAt;
            return (
              <Pressable accessibilityRole="button" accessibilityLabel={`${unread ? 'Unread. ' : ''}${item.title}`} onPress={() => void markRead(item)} style={({ pressed }) => ({ borderRadius: Radius['2xl'], borderWidth: 1, borderColor: unread ? Colors.epf[200] : Colors.slate[200], backgroundColor: pressed ? Colors.slate[50] : Colors.bg.primary, padding: 15, flexDirection: 'row', opacity: pressed ? 0.88 : 1 })}>
                <View style={{ width: 43, height: 43, borderRadius: 15, backgroundColor: background, alignItems: 'center', justifyContent: 'center' }}><Icon size={20} color={color} /></View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                    <Text style={{ flex: 1, color: Colors.slate[900], fontSize: 14, lineHeight: 20, fontWeight: unread ? Typography.bold : Typography.semibold }}>{item.title}</Text>
                    {unread ? <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.epf[500], marginLeft: 8, marginTop: 5 }} /> : null}
                  </View>
                  <Text style={{ color: Colors.slate[600], fontSize: 12, lineHeight: 18, marginTop: 4 }}>{item.message}</Text>
                  <Text style={{ color: Colors.slate[400], fontSize: 11, marginTop: 9 }}>{timeAgo(item.createdAt)}</Text>
                </View>
              </Pressable>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}
