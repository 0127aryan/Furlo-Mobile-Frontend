import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  LayoutAnimation,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { followPet } from '@/api/auth';
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '@/api/notifications';
import { ScreenBackButton } from '@/components/common/ScreenBackButton';
import { NotificationListSkeleton } from '@/components/skeletons';
import { CategoryFilterPills } from '@/components/notifications/CategoryFilterPills';
import { NotificationCard } from '@/components/notifications/NotificationCard';
import { PushPermissionSheet } from '@/components/notifications/PushPermissionSheet';
import { AppFonts, palette, TapTarget } from '@/constants/theme';
import {
  getNotificationDevicePrefs,
  saveNotificationDevicePrefs,
} from '@/lib/notificationDevicePrefs';
import { requestPushPermission, shouldShowPushPermissionSheet } from '@/lib/pushNotifications';
import { notificationMatchesFilter } from '@/lib/notificationFilters';
import { subscribeNotifications } from '@/lib/subscribeNotifications';
import { useAuthStore } from '@/store/useAuthStore';
import type { NotificationCategory, NotificationItem } from '@/types/api';

function isToday(iso: string) {
  const age = Date.now() - new Date(iso).getTime();
  return age < 1000 * 60 * 60 * 20;
}

export default function NotificationsScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const activePet = useAuthStore((s) => s.activePet);

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState<NotificationCategory>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({});
  const [pushSheetOpen, setPushSheetOpen] = useState(false);
  const filterRef = useRef(filter);
  filterRef.current = filter;

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await getNotifications(filter);
      setNotifications(res.notifications || []);
      setUnreadCount(res.unreadCount || 0);
      setLoadError(null);
    } catch {
      if (!silent) {
        setNotifications([]);
        setUnreadCount(0);
        setLoadError('Could not load notifications. Pull to refresh or try again.');
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      load(true);
      const poll = setInterval(() => {
        load(true);
      }, 12000);

      void shouldShowPushPermissionSheet().then((show) => {
        if (show) setPushSheetOpen(true);
      });

      return () => clearInterval(poll);
    }, [load])
  );

  useEffect(() => {
    if (!user?.id) return;
    return subscribeNotifications(user.id, (item) => {
      setUnreadCount((c) => c + 1);
      if (!notificationMatchesFilter(item, filterRef.current)) return;
      setNotifications((prev) => (prev.some((n) => n.id === item.id) ? prev : [item, ...prev]));
    });
  }, [user?.id]);

  async function onRefresh() {
    setRefreshing(true);
    await load(true);
    setRefreshing(false);
  }

  async function handleMarkAllRead() {
    if (unreadCount === 0) return;
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
    try {
      await markAllNotificationsRead();
    } catch {
      Alert.alert('Notifications', 'Could not mark all as read.');
    }
  }

  function handleDismiss(id: string) {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setNotifications((prev) => {
      const removed = prev.find((n) => n.id === id);
      if (removed && !removed.is_read) setUnreadCount((c) => Math.max(0, c - 1));
      return prev.filter((n) => n.id !== id);
    });
  }

  async function handleOpen(item: NotificationItem) {
    if (!item.is_read) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === item.id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
      markNotificationRead(item.id).catch(() => {});
    }

    if (item.entity_type === 'post' && item.entity_id) {
      router.push(`/qa/${item.entity_id}`);
      return;
    }
    if (item.entity_type === 'pet' && item.entity_id) {
      router.push(`/pet/${item.entity_id}`);
      return;
    }
    if (item.actor_pet_id) {
      router.push(`/pet/${item.actor_pet_id}`);
    }
  }

  async function handleFollowBack(petId: string) {
    if (!activePet?.id) {
      Alert.alert('Follow', 'Set up a Paw Print before following back.');
      return;
    }
    const next = !followingMap[petId];
    setFollowingMap((prev) => ({ ...prev, [petId]: next }));
    try {
      const res = await followPet(petId, activePet.id);
      setFollowingMap((prev) => ({ ...prev, [petId]: res.following }));
    } catch {
      setFollowingMap((prev) => ({ ...prev, [petId]: !next }));
      Alert.alert('Follow', 'Could not update follow status.');
    }
  }

  async function handleEnablePush() {
    setPushSheetOpen(false);
    await requestPushPermission();
  }

  async function handleLaterPush() {
    setPushSheetOpen(false);
    const prefs = await getNotificationDevicePrefs();
    await saveNotificationDevicePrefs({ ...prefs, pushPermissionAsked: true, pushPermissionDismissed: true });
  }

  const todayItems = notifications.filter((n) => isToday(n.created_at));
  const earlierItems = notifications.filter((n) => !isToday(n.created_at));

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.topSection}>
        <View style={styles.header}>
          <ScreenBackButton />
          <Text style={styles.title}>Notifications</Text>
          <View style={styles.headerActions}>
            <Pressable
              onPress={handleMarkAllRead}
              disabled={unreadCount === 0}
              hitSlop={8}
              style={[styles.iconBtn, unreadCount === 0 && styles.iconBtnDisabled]}>
              <Ionicons name="checkmark-done" size={20} color={palette.evergreenSoft} />
            </Pressable>
            <Pressable
              onPress={() => router.push('/notifications/settings')}
              hitSlop={8}
              style={styles.iconBtn}>
              <Ionicons name="options-outline" size={20} color={palette.evergreenSoft} />
            </Pressable>
          </View>
        </View>

        <View style={styles.subHeader}>
          <View style={styles.unreadPill}>
            {unreadCount > 0 ? <View style={styles.pulseDot} /> : null}
            <Text style={[styles.unreadText, unreadCount > 0 && styles.unreadTextActive]}>
              {unreadCount} New
            </Text>
          </View>
        </View>

        <CategoryFilterPills active={filter} onChange={setFilter} />
      </View>

      {loadError ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{loadError}</Text>
        </View>
      ) : null}

      {loading ? (
        <View style={styles.skeletonWrap}>
          <NotificationListSkeleton />
        </View>
      ) : notifications.length === 0 ? (
        <View style={styles.emptyWrap}>
          <View style={styles.emptyCard}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="paw" size={36} color={palette.amber} />
              <View style={styles.emptyCheck}>
                <Ionicons name="checkmark" size={12} color="#15803D" />
              </View>
            </View>
            <Text style={styles.emptyTitle}>All caught up!</Text>
            <Text style={styles.emptyBody}>
              No new sniff-worthy updates in this category right now. Your pack is happily snoozing.
            </Text>
            <View style={styles.emptyActions}>
              <Pressable onPress={() => router.push('/feed')} style={styles.primaryCta}>
                <Text style={styles.primaryCtaLabel}>Explore Pack Feed</Text>
              </Pressable>
              <Pressable onPress={() => router.push('/qa')} style={styles.secondaryCta}>
                <Text style={styles.secondaryCtaLabel}>Browse Community Q&A</Text>
              </Pressable>
            </View>
          </View>
        </View>
      ) : (
        <ScrollView
          style={styles.listScroll}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={palette.amber} />
          }>
          {todayItems.length > 0 ? (
            <View style={styles.section}>
              <SectionHeader title="Today" subtitle="Recent sniffs & wags" />
              {todayItems.map((item, idx) => (
                <NotificationCard
                  key={item.id}
                  item={item}
                  index={idx}
                  isFollowing={Boolean(followingMap[item.actor_pet_id || ''])}
                  onPress={() => handleOpen(item)}
                  onDismiss={() => handleDismiss(item.id)}
                  onFollowBack={
                    item.type === 'follow' && item.actor_pet_id
                      ? () => handleFollowBack(item.actor_pet_id!)
                      : undefined
                  }
                />
              ))}
            </View>
          ) : null}

          {earlierItems.length > 0 ? (
            <View style={styles.section}>
              <SectionHeader title="Earlier This Week" subtitle="Pack announcements & events" />
              {earlierItems.map((item, idx) => (
                <NotificationCard
                  key={item.id}
                  item={item}
                  index={todayItems.length + idx}
                  isFollowing={Boolean(followingMap[item.actor_pet_id || ''])}
                  onPress={() => handleOpen(item)}
                  onDismiss={() => handleDismiss(item.id)}
                  onFollowBack={
                    item.type === 'follow' && item.actor_pet_id
                      ? () => handleFollowBack(item.actor_pet_id!)
                      : undefined
                  }
                />
              ))}
            </View>
          ) : null}
        </ScrollView>
      )}

      <PushPermissionSheet
        visible={pushSheetOpen}
        onEnable={handleEnablePush}
        onLater={handleLaterPush}
      />
    </SafeAreaView>
  );
}

function SectionHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title.toUpperCase()}</Text>
      <Text style={styles.sectionDot}>•</Text>
      <Text style={styles.sectionSubtitle}>{subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FAF7F2' },
  topSection: {
    flexGrow: 0,
    flexShrink: 0,
    borderBottomWidth: 1,
    borderBottomColor: palette.cardLine,
    paddingBottom: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingTop: 4,
    paddingBottom: 8,
    gap: 4,
  },
  title: {
    flex: 1,
    fontFamily: AppFonts.heading,
    fontSize: 24,
    color: palette.evergreen,
  },
  subHeader: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  unreadPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: palette.cardLine,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: palette.amber,
  },
  unreadText: { fontFamily: AppFonts.bodySemi, fontSize: 11, color: '#727974' },
  unreadTextActive: { color: palette.amber },
  headerActions: { flexDirection: 'row', gap: 4 },
  iconBtn: {
    width: TapTarget,
    height: TapTarget,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: palette.cardLine,
  },
  iconBtnDisabled: { opacity: 0.5 },
  errorBanner: {
    marginHorizontal: 16,
    marginTop: 8,
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  errorText: { fontFamily: AppFonts.body, fontSize: 12, color: '#B91C1C' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  skeletonWrap: { flex: 1, paddingHorizontal: 16, paddingTop: 8 },
  loadingText: { fontFamily: AppFonts.body, fontSize: 12, color: '#727974' },
  listScroll: { flex: 1 },
  list: { paddingHorizontal: 16, paddingBottom: 32, gap: 16, paddingTop: 8 },
  section: { gap: 12 },
  sectionHeader: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6, paddingHorizontal: 2 },
  sectionTitle: {
    fontFamily: AppFonts.bodySemi,
    fontSize: 11,
    color: '#727974',
    letterSpacing: 1.2,
  },
  sectionDot: { color: '#C1C8C3', fontSize: 10 },
  sectionSubtitle: { fontFamily: AppFonts.body, fontSize: 11, color: palette.faded },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'flex-start', padding: 24, paddingTop: 32 },
  emptyCard: {
    backgroundColor: '#fff',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: palette.cardLine,
    padding: 28,
    alignItems: 'center',
    gap: 10,
    maxWidth: 360,
    width: '100%',
  },
  emptyIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FAF7F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCheck: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  emptyTitle: { fontFamily: AppFonts.heading, fontSize: 20, color: palette.evergreen },
  emptyBody: {
    fontFamily: AppFonts.body,
    fontSize: 12,
    color: '#727974',
    textAlign: 'center',
    lineHeight: 18,
  },
  emptyActions: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10, marginTop: 8 },
  primaryCta: {
    backgroundColor: palette.amber,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 999,
  },
  primaryCtaLabel: { fontFamily: AppFonts.bodySemi, fontSize: 12, color: '#fff' },
  secondaryCta: {
    backgroundColor: '#F5F2ED',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 999,
  },
  secondaryCtaLabel: { fontFamily: AppFonts.bodySemi, fontSize: 12, color: palette.evergreen },
});
