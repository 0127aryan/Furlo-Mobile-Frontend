import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import {
  approveAdminCommunity,
  deleteAdminCommunity,
  getAdminCommunitiesPending,
  rejectAdminCommunity,
  suspendAdminCommunity,
} from '@/api/admin';
import { AdminCommunityDetailSheet } from '@/components/admin/AdminCommunityDetailSheet';
import { AdminSegmentedTabs } from '@/components/admin/AdminSegmentedTabs';
import { AdminSheet } from '@/components/admin/AdminSheet';
import { adminColors } from '@/constants/adminTheme';
import { AppFonts, TapTarget } from '@/constants/theme';
import { useAdminStore } from '@/store/useAdminStore';
import { applyPackStatusToItem, applyPackStatusToList, subscribePackStatus } from '@/lib/subscribePackStatus';
import type { AdminCommunityItem } from '@/types/admin';

type Filter = 'pending' | 'approved' | 'rejected' | 'all';

export default function AdminCommunitiesScreen() {
  const bumpPendingApprovals = useAdminStore((s) => s.bumpPendingApprovals);
  const [communities, setCommunities] = useState<AdminCommunityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('pending');
  const [selected, setSelected] = useState<AdminCommunityItem | null>(null);
  const [rejecting, setRejecting] = useState<AdminCommunityItem | null>(null);
  const [reason, setReason] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAdminCommunitiesPending();
      setCommunities(res.communities ?? []);
    } catch {
      Alert.alert('Communities', 'Failed to load communities queue');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    return subscribePackStatus((payload) => {
      setCommunities((prev) => {
        const current = prev.find((c) => c.id === payload.communityId);
        if (current?.status === 'pending' && payload.status !== 'pending') {
          bumpPendingApprovals(-1);
        } else if (current && current.status !== 'pending' && payload.status === 'pending' && !payload.deleted) {
          bumpPendingApprovals(1);
        }
        return applyPackStatusToList(prev, payload);
      });
      setSelected((prev) => {
        if (!prev) return prev;
        if (payload.deleted && prev.id === payload.communityId) return null;
        return applyPackStatusToItem(prev, payload);
      });
    });
  }, [bumpPendingApprovals]);

  async function handleApprove(item: AdminCommunityItem) {
    setBusyId(item.id);
    try {
      const res = await approveAdminCommunity(item.id);
      if (res.success) {
        setCommunities((prev) =>
          prev.map((c) => (c.id === item.id ? { ...c, status: 'approved' } : c))
        );
        if (item.status === 'pending') bumpPendingApprovals(-1);
        setSelected(null);
      }
    } catch (err) {
      Alert.alert('Communities', err instanceof Error ? err.message : 'Failed to approve pack');
    } finally {
      setBusyId(null);
    }
  }

  async function handleReject() {
    if (!rejecting) return;
    setBusyId(rejecting.id);
    try {
      const res = await rejectAdminCommunity(rejecting.id, reason.trim());
      if (res.success) {
        setCommunities((prev) =>
          prev.map((c) =>
            c.id === rejecting.id ? { ...c, status: 'rejected', rejection_reason: reason.trim() } : c
          )
        );
        if (rejecting.status === 'pending') bumpPendingApprovals(-1);
        setRejecting(null);
        setSelected(null);
        setReason('');
      }
    } catch (err) {
      Alert.alert('Communities', err instanceof Error ? err.message : 'Failed to reject community');
    } finally {
      setBusyId(null);
    }
  }

  async function handleSuspend(item: AdminCommunityItem) {
    const nextSuspended = item.is_active !== false;
    setBusyId(item.id);
    try {
      const res = await suspendAdminCommunity(item.id, nextSuspended);
      if (res.success) {
        const nextActive = !nextSuspended;
        setCommunities((prev) =>
          prev.map((c) => (c.id === item.id ? { ...c, is_active: nextActive } : c))
        );
        setSelected((prev) => (prev && prev.id === item.id ? { ...prev, is_active: nextActive } : prev));
      }
    } catch (err) {
      Alert.alert('Communities', err instanceof Error ? err.message : 'Failed to update pack');
    } finally {
      setBusyId(null);
    }
  }

  function confirmDelete(item: AdminCommunityItem) {
    Alert.alert('Delete pack', `Permanently delete "${item.name}"? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => void handleDelete(item) },
    ]);
  }

  async function handleDelete(item: AdminCommunityItem) {
    setBusyId(item.id);
    try {
      const res = await deleteAdminCommunity(item.id);
      if (res.success) {
        setCommunities((prev) => prev.filter((c) => c.id !== item.id));
        if (item.status === 'pending') bumpPendingApprovals(-1);
        setSelected(null);
      }
    } catch (err) {
      Alert.alert('Communities', err instanceof Error ? err.message : 'Failed to delete pack');
    } finally {
      setBusyId(null);
    }
  }

  const filtered = communities.filter((c) => (filter === 'all' ? true : c.status === filter));
  const pendingCount = communities.filter((c) => c.status === 'pending').length;

  return (
    <>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.h1}>Community Approvals Queue</Text>
        <Text style={styles.sub}>
          Review new pet packs created by community leads, then approve or reject.
        </Text>

        <AdminSegmentedTabs
          value={filter}
          onChange={setFilter}
          tabs={[
            { id: 'pending', label: 'Pending', count: pendingCount },
            { id: 'approved', label: 'Approved', count: communities.filter((c) => c.status === 'approved').length },
            { id: 'rejected', label: 'Rejected', count: communities.filter((c) => c.status === 'rejected').length },
            { id: 'all', label: 'All Packs', count: communities.length },
          ]}
        />

        {loading ? (
          <ActivityIndicator color={adminColors.accent} style={{ marginTop: 32 }} />
        ) : filtered.length === 0 ? (
          <Text style={styles.empty}>No communities in this queue.</Text>
        ) : (
          filtered.map((item) => {
            const cover = item.cover_image_url || item.banner_url || item.image_url;
            const avatar = item.avatar_url || cover;
            return (
              <View key={item.id} style={styles.card}>
                <Pressable onPress={() => setSelected(item)} style={styles.cardBody}>
                  {avatar ? (
                    <Image source={{ uri: avatar }} style={styles.avatar} />
                  ) : (
                    <View style={[styles.avatar, styles.avatarEmpty]}>
                      <Ionicons name="people" size={18} color={adminColors.accent} />
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={styles.name}>{item.name}</Text>
                    <Text style={styles.meta}>
                      {item.category || 'Pack'} · {item.creator?.name || 'Unknown creator'}
                      {item.is_active === false ? ' · Suspended' : ''}
                    </Text>
                    {item.description ? (
                      <Text style={styles.desc} numberOfLines={2}>
                        {item.description}
                      </Text>
                    ) : null}
                  </View>
                </Pressable>
                {item.status === 'pending' ? (
                  <View style={styles.rowBtns}>
                    <Pressable
                      disabled={busyId === item.id}
                      onPress={() => void handleApprove(item)}
                      style={styles.approveBtn}>
                      {busyId === item.id ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <Text style={styles.approveLabel}>Approve</Text>
                      )}
                    </Pressable>
                    <Pressable
                      onPress={() => {
                        setRejecting(item);
                        setReason('');
                      }}
                      style={styles.rejectBtn}>
                      <Text style={styles.rejectLabel}>Reject</Text>
                    </Pressable>
                  </View>
                ) : (
                  <Text style={styles.statusLine}>{item.status}</Text>
                )}
                <View style={styles.rowBtns}>
                  <Pressable
                    disabled={busyId === item.id}
                    onPress={() => void handleSuspend(item)}
                    style={styles.suspendBtn}>
                    <Text style={styles.suspendLabel}>
                      {item.is_active === false ? 'Restore' : 'Suspend'}
                    </Text>
                  </Pressable>
                  <Pressable
                    disabled={busyId === item.id}
                    onPress={() => confirmDelete(item)}
                    style={styles.deleteBtn}>
                    <Text style={styles.deleteLabel}>Delete</Text>
                  </Pressable>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      <AdminCommunityDetailSheet
        community={selected}
        visible={Boolean(selected)}
        busy={Boolean(selected && busyId === selected.id)}
        onClose={() => setSelected(null)}
        onApprove={() => {
          if (selected) void handleApprove(selected);
        }}
        onReject={() => {
          if (!selected) return;
          setRejecting(selected);
          setReason('');
          setSelected(null);
        }}
        onSuspend={() => {
          if (selected) void handleSuspend(selected);
        }}
        onDelete={() => {
          if (selected) confirmDelete(selected);
        }}
      />

      <AdminSheet
        visible={Boolean(rejecting)}
        title="Reject community"
        onClose={() => setRejecting(null)}
        footer={
          <Pressable disabled={!rejecting || busyId === rejecting?.id} onPress={handleReject} style={styles.approveBtn}>
            <Text style={styles.approveLabel}>Send rejection</Text>
          </Pressable>
        }>
        <Text style={styles.sub}>Share a short reason the creator will see.</Text>
        <TextInput
          value={reason}
          onChangeText={setReason}
          placeholder="Rejection reason"
          placeholderTextColor={adminColors.muted}
          multiline
          style={styles.input}
        />
      </AdminSheet>
    </>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 40, gap: 12 },
  h1: { fontFamily: AppFonts.heading, fontSize: 26, color: adminColors.evergreen },
  sub: { fontFamily: AppFonts.body, fontSize: 12, color: adminColors.muted },
  empty: { fontFamily: AppFonts.body, fontSize: 13, color: adminColors.muted, textAlign: 'center', marginTop: 32 },
  card: {
    backgroundColor: adminColors.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: adminColors.line,
    padding: 14,
    gap: 10,
  },
  cardBody: { flexDirection: 'row', gap: 10 },
  avatar: { width: 48, height: 48, borderRadius: 16 },
  avatarEmpty: { backgroundColor: adminColors.cream, alignItems: 'center', justifyContent: 'center' },
  name: { fontFamily: AppFonts.bodySemi, fontSize: 15, color: adminColors.evergreen },
  meta: { fontFamily: AppFonts.body, fontSize: 12, color: adminColors.muted, marginTop: 2 },
  desc: { fontFamily: AppFonts.body, fontSize: 12, color: adminColors.evergreen, marginTop: 4, lineHeight: 18 },
  rowBtns: { flexDirection: 'row', gap: 8 },
  approveBtn: {
    flex: 1,
    minHeight: TapTarget - 4,
    borderRadius: 999,
    backgroundColor: adminColors.emeraldBadge,
    alignItems: 'center',
    justifyContent: 'center',
  },
  approveLabel: { fontFamily: AppFonts.bodySemi, fontSize: 13, color: '#fff' },
  rejectBtn: {
    flex: 1,
    minHeight: TapTarget - 4,
    borderRadius: 999,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectLabel: { fontFamily: AppFonts.bodySemi, fontSize: 13, color: adminColors.redBadge },
  suspendBtn: {
    flex: 1,
    minHeight: TapTarget - 4,
    borderRadius: 999,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#FDE8D3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  suspendLabel: { fontFamily: AppFonts.bodySemi, fontSize: 13, color: '#C2410C' },
  deleteBtn: {
    flex: 1,
    minHeight: TapTarget - 4,
    borderRadius: 999,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteLabel: { fontFamily: AppFonts.bodySemi, fontSize: 13, color: adminColors.redBadge },
  statusLine: {
    fontFamily: AppFonts.bodySemi,
    fontSize: 11,
    color: adminColors.muted,
    textTransform: 'capitalize',
  },
  input: {
    minHeight: 90,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: adminColors.line,
    backgroundColor: adminColors.cream,
    padding: 12,
    fontFamily: AppFonts.body,
    fontSize: 13,
    color: adminColors.evergreen,
    textAlignVertical: 'top',
    marginVertical: 12,
  },
});
