import { Ionicons } from '@expo/vector-icons';
import { Stack, usePathname } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getAdminReports, getAdminStats } from '@/api/admin';
import { ApiError } from '@/api/client';
import { AdminAccessDenied } from '@/components/admin/AdminAccessDenied';
import { AdminDrawer } from '@/components/admin/AdminDrawer';
import { adminColors } from '@/constants/adminTheme';
import { AppFonts, TapTarget } from '@/constants/theme';
import { isAdminUser } from '@/lib/isAdminUser';
import { subscribeModerationQueue } from '@/lib/subscribeModerationQueue';
import { useAdminStore } from '@/store/useAdminStore';
import { useAuthStore } from '@/store/useAuthStore';

function sectionTitle(pathname: string) {
  if (pathname === '/admin') return 'Overview';
  const slug = pathname.split('/admin/')[1] || '';
  return slug.replace(/-/g, ' ') || 'Overview';
}

export default function AdminLayout() {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const setBadgeCounts = useAdminStore((s) => s.setBadgeCounts);
  const bumpOpenReports = useAdminStore((s) => s.bumpOpenReports);
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const refreshBadgeCounts = useCallback(async () => {
    const [statsRes, reportsRes] = await Promise.all([
      getAdminStats().catch(() => null),
      getAdminReports().catch(() => null),
    ]);
    const openFromReports = reportsRes?.reports
      ? reportsRes.reports.filter((r) => r.status === 'open').length
      : undefined;
    setBadgeCounts({
      pendingApprovals: statsRes?.stats?.pendingApprovals ?? 0,
      openReports: openFromReports ?? statsRes?.stats?.openReports ?? 0,
    });
  }, [setBadgeCounts]);

  useEffect(() => {
    let cancelled = false;

    async function verify() {
      if (!isAdminUser(user)) {
        setAuthorized(false);
        return;
      }

      try {
        const data = await getAdminStats();
        if (cancelled) return;
        const reports = await getAdminReports().catch(() => null);
        const openFromReports = reports?.reports
          ? reports.reports.filter((r) => r.status === 'open').length
          : undefined;
        setBadgeCounts({
          pendingApprovals: data.stats?.pendingApprovals ?? 0,
          openReports: openFromReports ?? data.stats?.openReports ?? 0,
        });
        setAuthorized(true);
      } catch (err) {
        if (cancelled) return;
        if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
          setAuthorized(false);
          return;
        }
        setAuthorized(isAdminUser(user));
      }
    }

    void verify();
    return () => {
      cancelled = true;
    };
  }, [user, setBadgeCounts]);

  useEffect(() => {
    if (!authorized) return;
    return subscribeModerationQueue((payload) => {
      if (payload.type === 'report_created') bumpOpenReports(1);
      if (payload.type === 'report_action') bumpOpenReports(-1);
      void refreshBadgeCounts();
    });
  }, [authorized, bumpOpenReports, refreshBadgeCounts]);

  if (authorized === null) {
    return (
      <SafeAreaView style={styles.verify} edges={['top', 'bottom']}>
        <ActivityIndicator color={adminColors.accent} size="large" />
        <Text style={styles.verifyLabel}>Verifying Admin Privileges...</Text>
      </SafeAreaView>
    );
  }

  if (!authorized) {
    return <AdminAccessDenied />;
  }

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']} style={styles.headerSafe}>
        <View style={styles.header}>
          <Pressable onPress={() => setDrawerOpen(true)} hitSlop={8} style={styles.iconBtn}>
            <Ionicons name="menu" size={22} color={adminColors.evergreen} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerKicker}>Super Admin Operations Center</Text>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {sectionTitle(pathname)}
            </Text>
          </View>
          <View style={styles.liveChip}>
            <View style={styles.liveDot} />
            <Text style={styles.liveLabel}>Live</Text>
          </View>
        </View>
      </SafeAreaView>

      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: adminColors.cream } }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="moderation" />
        <Stack.Screen name="communities" />
        <Stack.Screen name="pets" />
        <Stack.Screen name="banners" />
        <Stack.Screen name="broadcast" />
      </Stack>

      <AdminDrawer visible={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: adminColors.cream },
  verify: {
    flex: 1,
    backgroundColor: adminColors.evergreen,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  verifyLabel: {
    fontFamily: AppFonts.bodySemi,
    fontSize: 11,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    color: adminColors.sidebarMuted,
  },
  headerSafe: { backgroundColor: adminColors.card, borderBottomWidth: 1, borderBottomColor: adminColors.line },
  header: {
    minHeight: TapTarget + 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconBtn: { width: TapTarget, height: TapTarget, alignItems: 'center', justifyContent: 'center' },
  headerKicker: {
    fontFamily: AppFonts.bodySemi,
    fontSize: 10,
    color: adminColors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  headerTitle: {
    fontFamily: AppFonts.heading,
    fontSize: 16,
    color: adminColors.evergreen,
    textTransform: 'capitalize',
  },
  liveChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#E4F5EB',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: adminColors.emeraldBadge },
  liveLabel: { fontFamily: AppFonts.bodySemi, fontSize: 11, color: '#166534' },
});
