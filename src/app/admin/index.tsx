import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { getAdminStats } from '@/api/admin';
import { adminColors } from '@/constants/adminTheme';
import { AppFonts, TapTarget } from '@/constants/theme';
import { petHref } from '@/lib/petHref';
import { subscribeModerationQueue } from '@/lib/subscribeModerationQueue';
import { useAdminStore } from '@/store/useAdminStore';
import type { AdminRecentPet, AdminStats } from '@/types/admin';

const EMPTY_STATS: AdminStats = {
  totalUsers: 0,
  totalPets: 0,
  totalPosts: 0,
  totalCommunities: 0,
  pendingApprovals: 0,
  openReports: 0,
};

export default function AdminOverviewScreen() {
  const router = useRouter();
  const setBadgeCounts = useAdminStore((s) => s.setBadgeCounts);
  const [stats, setStats] = useState<AdminStats>(EMPTY_STATS);
  const [recentPets, setRecentPets] = useState<AdminRecentPet[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getAdminStats()
      .then((res) => {
        if (cancelled) return;
        if (res.stats) {
          setStats(res.stats);
          setBadgeCounts({
            pendingApprovals: res.stats.pendingApprovals,
            openReports: res.stats.openReports,
          });
        }
        setRecentPets(res.recentPets ?? []);
      })
      .catch(() => null)
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    const unsub = subscribeModerationQueue((payload) => {
      if (payload.type === 'report_created') {
        setStats((prev) => ({ ...prev, openReports: prev.openReports + 1 }));
      } else if (payload.type === 'report_action') {
        setStats((prev) => ({ ...prev, openReports: Math.max(0, prev.openReports - 1) }));
      }
    });

    return () => {
      cancelled = true;
      unsub();
    };
  }, [setBadgeCounts]);

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <View style={styles.titleRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.h1}>Platform Overview</Text>
          <Text style={styles.sub}>
            Real-time platform metrics, pet registrations, and active operations shortcuts.
          </Text>
        </View>
        <Pressable onPress={() => router.push('/admin/broadcast')} style={styles.broadcastBtn}>
          <Ionicons name="send" size={14} color="#fff" />
          <Text style={styles.broadcastLabel}>Broadcast</Text>
        </Pressable>
      </View>

      <View style={styles.grid}>
        <KpiCard
          label="Total Users"
          value={loading ? '...' : stats.totalUsers.toLocaleString()}
          hint="Registered Users"
          icon="people-outline"
          tone="neutral"
        />
        <KpiCard
          label="Registered Pets"
          value={loading ? '...' : stats.totalPets.toLocaleString()}
          hint="Active Pup Profiles"
          icon="paw-outline"
          tone="amber"
        />
        <KpiCard
          label="Total Barks / Posts"
          value={loading ? '...' : stats.totalPosts.toLocaleString()}
          hint="Published content"
          icon="chatbubble-ellipses-outline"
          tone="neutral"
        />
        <KpiCard
          label="Active Communities"
          value={loading ? '...' : stats.totalCommunities.toLocaleString()}
          hint={
            stats.pendingApprovals > 0
              ? `${stats.pendingApprovals} Pending Approval`
              : 'All Packs Approved'
          }
          icon="people-circle-outline"
          tone="green"
          pulse={stats.pendingApprovals > 0}
        />
        <KpiCard
          label="Pending Pack Approvals"
          value={loading ? '...' : stats.pendingApprovals.toLocaleString()}
          hint={stats.pendingApprovals > 0 ? 'Action Required' : 'Queue clear'}
          icon="hourglass-outline"
          tone="amber"
          pulse={stats.pendingApprovals > 0}
        />
        <KpiCard
          label="Moderation Reports"
          value={loading ? '...' : stats.openReports.toLocaleString()}
          hint={stats.openReports > 0 ? 'Action Required' : 'Clean Queue'}
          icon="shield-outline"
          tone="red"
          pulse={stats.openReports > 0}
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.h2}>Quick Operations Shortcuts</Text>
        <Shortcut
          icon="people-outline"
          color={adminColors.accent}
          title="Approve Communities"
          body="Review queue of pending pet packs submitted by users."
          onPress={() => router.push('/admin/communities')}
        />
        <Shortcut
          icon="checkmark-circle-outline"
          color={adminColors.emeraldBadge}
          title="Manage Pet Badges"
          body="Issue Verified Checkmarks & Founding Pet crowns."
          onPress={() => router.push('/admin/pets')}
        />
        <Shortcut
          icon="megaphone-outline"
          color={adminColors.evergreen}
          title="Create Announcement"
          body="Publish top site-wide announcement banners."
          onPress={() => router.push('/admin/banners')}
        />
      </View>

      <View style={styles.card}>
        <View style={styles.rowBetween}>
          <View>
            <Text style={styles.h2}>Recent Pet Registrations</Text>
            <Text style={styles.sub}>Latest pet profiles added to the Furlo network.</Text>
          </View>
          <Pressable onPress={() => router.push('/admin/pets')}>
            <Text style={styles.link}>View All</Text>
          </Pressable>
        </View>
        {loading ? (
          <ActivityIndicator color={adminColors.accent} style={{ marginVertical: 24 }} />
        ) : recentPets.length === 0 ? (
          <Text style={styles.empty}>No recent pet registrations found.</Text>
        ) : (
          recentPets.map((pet) => (
            <Pressable
              key={pet.id}
              onPress={() => router.push(petHref(pet))}
              style={styles.petRow}>
              {pet.profile_image_url ? (
                <Image source={{ uri: pet.profile_image_url }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarEmpty]}>
                  <Ionicons name="paw" size={16} color={adminColors.accent} />
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text style={styles.petName}>{pet.name}</Text>
                <Text style={styles.petMeta}>
                  @{pet.username || 'pet'} · {pet.email || '—'}
                </Text>
              </View>
              <Text style={styles.petBreed}>{pet.breed || 'Dog'}</Text>
            </Pressable>
          ))
        )}
      </View>
    </ScrollView>
  );
}

function KpiCard({
  label,
  value,
  hint,
  icon,
  tone,
  pulse,
}: {
  label: string;
  value: string;
  hint: string;
  icon: keyof typeof Ionicons.glyphMap;
  tone: 'neutral' | 'amber' | 'green' | 'red';
  pulse?: boolean;
}) {
  const iconBg =
    tone === 'amber' ? '#FFF9F2' : tone === 'green' ? '#E4F5EB' : tone === 'red' ? '#FEE2E2' : '#F5F2ED';
  const iconColor =
    tone === 'amber'
      ? adminColors.accent
      : tone === 'green'
        ? '#166534'
        : tone === 'red'
          ? adminColors.redBadge
          : adminColors.evergreen;
  const hintColor =
    tone === 'red' && pulse
      ? adminColors.redBadge
      : tone === 'amber' && pulse
        ? adminColors.accent
        : tone === 'green'
          ? adminColors.emeraldBadge
          : adminColors.muted;

  return (
    <View style={styles.kpi}>
      <View style={styles.kpiTop}>
        <Text style={styles.kpiLabel}>{label}</Text>
        <View style={[styles.kpiIcon, { backgroundColor: iconBg }]}>
          <Ionicons name={icon} size={18} color={iconColor} />
        </View>
      </View>
      <Text style={styles.kpiValue}>{value}</Text>
      <View style={styles.hintRow}>
        {pulse ? <View style={[styles.pulseDot, { backgroundColor: hintColor }]} /> : null}
        <Text style={[styles.kpiHint, { color: hintColor }]}>{hint}</Text>
      </View>
    </View>
  );
}

function Shortcut({
  icon,
  color,
  title,
  body,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  title: string;
  body: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.shortcut}>
      <Ionicons name={icon} size={20} color={color} />
      <View style={{ flex: 1 }}>
        <Text style={styles.shortcutTitle}>{title}</Text>
        <Text style={styles.shortcutBody}>{body}</Text>
      </View>
      <Ionicons name="arrow-forward" size={16} color={adminColors.muted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 40, gap: 16 },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  h1: { fontFamily: AppFonts.heading, fontSize: 26, color: adminColors.evergreen },
  h2: { fontFamily: AppFonts.heading, fontSize: 18, color: adminColors.evergreen },
  sub: { fontFamily: AppFonts.body, fontSize: 12, color: adminColors.muted, marginTop: 4 },
  broadcastBtn: {
    minHeight: TapTarget - 4,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: adminColors.accent,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  broadcastLabel: { fontFamily: AppFonts.bodySemi, fontSize: 12, color: '#fff' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  kpi: {
    width: '48%',
    flexGrow: 1,
    backgroundColor: adminColors.card,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: adminColors.line,
    padding: 16,
    gap: 8,
  },
  kpiTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  kpiLabel: {
    fontFamily: AppFonts.bodySemi,
    fontSize: 10,
    color: adminColors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    flex: 1,
    paddingRight: 8,
  },
  kpiIcon: { width: 36, height: 36, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  kpiValue: { fontFamily: AppFonts.heading, fontSize: 28, color: adminColors.evergreen },
  hintRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  pulseDot: { width: 8, height: 8, borderRadius: 4 },
  kpiHint: { fontFamily: AppFonts.bodySemi, fontSize: 11 },
  card: {
    backgroundColor: adminColors.card,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: adminColors.line,
    padding: 16,
    gap: 12,
  },
  shortcut: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 16,
    backgroundColor: adminColors.cream,
  },
  shortcutTitle: { fontFamily: AppFonts.bodySemi, fontSize: 13, color: adminColors.evergreen },
  shortcutBody: { fontFamily: AppFonts.body, fontSize: 11, color: adminColors.muted, marginTop: 2 },
  rowBetween: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  link: { fontFamily: AppFonts.bodySemi, fontSize: 12, color: adminColors.accent },
  empty: { fontFamily: AppFonts.body, fontSize: 12, color: adminColors.muted, textAlign: 'center', paddingVertical: 16 },
  petRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
  avatar: { width: 40, height: 40, borderRadius: 20 },
  avatarEmpty: { backgroundColor: adminColors.cream, alignItems: 'center', justifyContent: 'center' },
  petName: { fontFamily: AppFonts.bodySemi, fontSize: 13, color: adminColors.evergreen },
  petMeta: { fontFamily: AppFonts.body, fontSize: 11, color: adminColors.muted, marginTop: 2 },
  petBreed: { fontFamily: AppFonts.bodyMedium, fontSize: 11, color: adminColors.evergreen },
});
