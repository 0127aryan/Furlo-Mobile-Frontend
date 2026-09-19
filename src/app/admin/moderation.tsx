import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { getAdminReports, postAdminReportAction } from '@/api/admin';
import { AdminSegmentedTabs } from '@/components/admin/AdminSegmentedTabs';
import { AdminSheet } from '@/components/admin/AdminSheet';
import { adminColors } from '@/constants/adminTheme';
import { AppFonts, TapTarget } from '@/constants/theme';
import { subscribeModerationQueue } from '@/lib/subscribeModerationQueue';
import { useAdminStore } from '@/store/useAdminStore';
import type { AdminReportAction, AdminReportItem } from '@/types/admin';

type Filter = 'open' | 'resolved' | 'all';

function snippet(report: AdminReportItem) {
  return (
    report.target_content?.caption ||
    report.description ||
    `ID: ${report.target_id.slice(0, 8)}...`
  );
}

function formatWhen(iso: string) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function formatReportedOn(iso: string) {
  try {
    return new Date(iso).toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' });
  } catch {
    return iso;
  }
}

function formatPostedOn(iso?: string) {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleDateString();
  } catch {
    return iso;
  }
}

function reporterLine(report: AdminReportItem) {
  const name = report.reporter?.name;
  const email = report.reporter?.email;
  if (name && email) return `${name} (${email})`;
  return name || email || 'Anonymous';
}

export default function AdminModerationScreen() {
  const bumpOpenReports = useAdminStore((s) => s.bumpOpenReports);
  const [reports, setReports] = useState<AdminReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('open');
  const [selected, setSelected] = useState<AdminReportItem | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAdminReports();
      setReports(res.reports ?? []);
      setSelected((prev) => {
        if (!prev) return prev;
        return res.reports?.find((r) => r.id === prev.id) ?? prev;
      });
    } catch {
      Alert.alert('Moderation', 'Failed to fetch moderation reports');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchReports();
    return subscribeModerationQueue((payload) => {
      if (payload.type === 'report_created') {
        void fetchReports();
      } else if (payload.type === 'report_action' && payload.reportId) {
        setReports((prev) =>
          prev.map((r) =>
            r.id === payload.reportId
              ? { ...r, status: 'resolved', action_taken: payload.action || r.action_taken }
              : r
          )
        );
        setSelected((prev) =>
          prev && prev.id === payload.reportId
            ? { ...prev, status: 'resolved', action_taken: payload.action || prev.action_taken }
            : prev
        );
      }
    });
  }, [fetchReports]);

  async function handleAction(reportId: string, action: AdminReportAction) {
    setBusyId(reportId);
    try {
      const res = await postAdminReportAction(reportId, action);
      if (res.success) {
        setReports((prev) =>
          prev.map((r) => (r.id === reportId ? { ...r, status: 'resolved', action_taken: action } : r))
        );
        setSelected((prev) =>
          prev && prev.id === reportId ? { ...prev, status: 'resolved', action_taken: action } : prev
        );
        if (reports.find((r) => r.id === reportId)?.status === 'open') {
          bumpOpenReports(-1);
        }
      }
    } catch (err) {
      Alert.alert('Moderation', err instanceof Error ? err.message : 'Failed to apply action');
    } finally {
      setBusyId(null);
    }
  }

  const filtered = reports.filter((r) => (filter === 'all' ? true : r.status === filter));
  const openCount = reports.filter((r) => r.status === 'open').length;
  const resolvedCount = reports.filter((r) => r.status === 'resolved').length;

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <Text style={styles.h1}>Content Moderation Queue</Text>
      <Text style={styles.sub}>
        Review flagged posts, comments, or pet profiles. Tap a card for the full content preview.
      </Text>

      <AdminSegmentedTabs
        value={filter}
        onChange={setFilter}
        tabs={[
          { id: 'open', label: 'Open Reports', count: openCount },
          { id: 'resolved', label: 'Resolved', count: resolvedCount },
          { id: 'all', label: 'All History', count: reports.length },
        ]}
      />

      {loading ? (
        <ActivityIndicator color={adminColors.accent} style={{ marginTop: 32 }} />
      ) : filtered.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="shield-checkmark" size={36} color={adminColors.emeraldBadge} />
          <Text style={styles.emptyTitle}>Queue Clean!</Text>
          <Text style={styles.sub}>No moderation reports match this filter tab.</Text>
        </View>
      ) : (
        filtered.map((report) => (
          <Pressable key={report.id} onPress={() => setSelected(report)} style={styles.card}>
            <View style={styles.cardTop}>
              <View style={styles.typePill}>
                <Text style={styles.typeText}>{report.target_type}</Text>
              </View>
              <View style={[styles.statusPill, report.status === 'open' ? styles.statusOpen : styles.statusDone]}>
                <Text
                  style={[
                    styles.statusText,
                    { color: report.status === 'open' ? adminColors.redBadge : adminColors.emeraldBadge },
                  ]}>
                  {report.status === 'open' ? 'Open' : 'Resolved'}
                </Text>
              </View>
            </View>
            <Text style={styles.caption} numberOfLines={3}>
              {snippet(report)}
            </Text>
            <View style={styles.metaRow}>
              <View style={styles.catPill}>
                <Text style={styles.catText}>{report.reason_category || 'other'}</Text>
              </View>
              <Text style={styles.meta} numberOfLines={1}>
                {report.reporter?.email || report.reporter?.username || 'Anonymous'}
              </Text>
            </View>
            <Text style={styles.date}>{formatWhen(report.created_at)}</Text>
          </Pressable>
        ))
      )}

      <ReportDetailsSheet
        report={selected}
        busy={Boolean(selected && busyId === selected.id)}
        onClose={() => setSelected(null)}
        onAction={handleAction}
      />
    </ScrollView>
  );
}

function ReportDetailsSheet({
  report,
  busy,
  onClose,
  onAction,
}: {
  report: AdminReportItem | null;
  busy: boolean;
  onClose: () => void;
  onAction: (id: string, action: AdminReportAction) => void;
}) {
  const content = report?.target_content;
  const media = content?.media_urls ?? [];
  const author = content?.author;
  const isOpen = report?.status === 'open';
  const postedOn = formatPostedOn(content?.created_at);
  const scrollMax = Math.min(560, Dimensions.get('window').height * 0.58);

  return (
    <AdminSheet
      visible={Boolean(report)}
      onClose={onClose}
      footer={
        report ? (
          <View style={styles.sheetFooter}>
            <Text style={styles.statusLine}>
              Status:{' '}
              <Text style={[styles.statusStrong, { color: isOpen ? adminColors.redBadge : adminColors.emeraldBadge }]}>
                {isOpen ? 'Open (Action Pending)' : `Resolved (${report.action_taken || 'done'})`}
              </Text>
            </Text>
            <View style={styles.footerActions}>
              {isOpen ? (
                <>
                  <Pressable
                    disabled={busy}
                    onPress={() => onAction(report.id, 'remove_content')}
                    style={[styles.actionBtn, styles.removeBtn]}>
                    {busy ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <>
                        <Ionicons name="trash-outline" size={16} color="#fff" />
                        <Text style={styles.actionLabel}>Remove Content</Text>
                      </>
                    )}
                  </Pressable>
                  <Pressable
                    disabled={busy}
                    onPress={() => onAction(report.id, 'dismiss')}
                    style={[styles.actionBtn, styles.dismissBtn]}>
                    <Ionicons name="checkmark-circle-outline" size={16} color={adminColors.evergreen} />
                    <Text style={styles.dismissLabel}>Dismiss Report</Text>
                  </Pressable>
                </>
              ) : null}
              <Pressable onPress={onClose} style={[styles.actionBtn, styles.closeBtn]}>
                <Text style={styles.actionLabel}>Close</Text>
              </Pressable>
            </View>
          </View>
        ) : null
      }>
      {report ? (
        <ScrollView style={{ maxHeight: scrollMax }} contentContainerStyle={styles.sheetBody}>
          <View style={styles.sheetHeader}>
            <View style={styles.headerPills}>
              <View style={styles.typeBadge}>
                <Text style={styles.typeBadgeText}>{report.target_type}</Text>
              </View>
              <View style={styles.catPill}>
                <Text style={styles.catText}>🚨 {report.reason_category || 'other'}</Text>
              </View>
            </View>
            <Pressable onPress={onClose} hitSlop={8} style={styles.headerClose}>
              <Ionicons name="close" size={18} color={adminColors.evergreen} />
            </Pressable>
          </View>

          <View style={styles.infoCard}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="flag" size={16} color={adminColors.redBadge} />
              <Text style={styles.sectionTitle}>Report Information</Text>
            </View>
            <View style={styles.infoGrid}>
              <View style={styles.infoCell}>
                <Text style={styles.infoLabel}>Reported By:</Text>
                <Text style={styles.infoValue}>{reporterLine(report)}</Text>
              </View>
              <View style={styles.infoCell}>
                <Text style={styles.infoLabel}>Reported On:</Text>
                <Text style={styles.infoValue}>{formatReportedOn(report.created_at)}</Text>
              </View>
            </View>
            <Text style={styles.infoLabel}>Reason / Reporter Notes:</Text>
            <View style={styles.notesBox}>
              <Text style={styles.notesText}>
                {report.description || 'No additional details submitted.'}
              </Text>
            </View>
          </View>

          <View style={styles.sectionTitleRow}>
            <Ionicons name="document-text-outline" size={16} color={adminColors.accent} />
            <Text style={styles.sectionTitle}>Reported Content Preview</Text>
          </View>

          {content ? (
            <View style={styles.preview}>
              {author ? (
                <View style={styles.authorRow}>
                  {author.avatar ? (
                    <Image source={{ uri: author.avatar }} style={styles.avatar} />
                  ) : (
                    <View style={[styles.avatar, styles.avatarEmpty]}>
                      <Ionicons name="paw" size={18} color={adminColors.accent} />
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <View style={styles.authorNameRow}>
                      <Text style={styles.authorName}>{author.name || 'Pet Profile'}</Text>
                      {author.breed ? (
                        <View style={styles.breedChip}>
                          <Text style={styles.breedChipText}>{author.breed}</Text>
                        </View>
                      ) : null}
                    </View>
                    <Text style={styles.detailMeta}>@{author.username || 'pet'}</Text>
                  </View>
                </View>
              ) : null}

              <Text style={styles.previewCaption}>{content.caption || 'No text content available.'}</Text>

              {media.length > 0 ? (
                <View style={styles.mediaGrid}>
                  {media.map((url) => (
                    <Image key={url} source={{ uri: url }} style={styles.media} />
                  ))}
                </View>
              ) : null}

              <View style={styles.statsRow}>
                <Text style={styles.statItem}>❤️ {content.like_count ?? 0} Likes</Text>
                <Text style={styles.statItem}>💬 {content.comment_count ?? 0} Comments</Text>
                {content.location_city ? <Text style={styles.statItem}>📍 {content.location_city}</Text> : null}
                {postedOn ? <Text style={styles.statItem}>📅 Posted {postedOn}</Text> : null}
              </View>
            </View>
          ) : (
            <View style={styles.missingCard}>
              <Ionicons name="information-circle-outline" size={26} color={adminColors.muted} />
              <Text style={styles.missingText}>
                Target content ID ({report.target_id}) has been removed or is unavailable.
              </Text>
            </View>
          )}
        </ScrollView>
      ) : null}
    </AdminSheet>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 40, gap: 12 },
  h1: { fontFamily: AppFonts.heading, fontSize: 26, color: adminColors.evergreen },
  sub: { fontFamily: AppFonts.body, fontSize: 12, color: adminColors.muted },
  empty: { alignItems: 'center', gap: 8, paddingVertical: 40 },
  emptyTitle: { fontFamily: AppFonts.heading, fontSize: 18, color: adminColors.evergreen },
  card: {
    backgroundColor: adminColors.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: adminColors.line,
    padding: 14,
    gap: 8,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  typePill: {
    backgroundColor: adminColors.cream,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: adminColors.line,
  },
  typeText: {
    fontFamily: AppFonts.bodySemi,
    fontSize: 10,
    color: adminColors.evergreen,
    textTransform: 'uppercase',
  },
  statusPill: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  statusOpen: { backgroundColor: '#FEE2E2' },
  statusDone: { backgroundColor: '#E4F5EB' },
  statusText: { fontFamily: AppFonts.bodySemi, fontSize: 10, textTransform: 'capitalize' },
  caption: { fontFamily: AppFonts.bodyMedium, fontSize: 13, color: adminColors.evergreen, lineHeight: 18 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  catPill: { backgroundColor: '#FEE2E2', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  catText: { fontFamily: AppFonts.bodySemi, fontSize: 11, color: adminColors.redBadge },
  meta: { flex: 1, fontFamily: AppFonts.body, fontSize: 11, color: adminColors.muted },
  date: { fontFamily: AppFonts.body, fontSize: 11, color: adminColors.muted },
  sheetBody: { gap: 14, paddingBottom: 8 },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  headerPills: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8, flex: 1 },
  headerClose: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: adminColors.cream,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeBadge: {
    backgroundColor: adminColors.evergreenSoft,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  typeBadgeText: {
    fontFamily: AppFonts.bodySemi,
    fontSize: 11,
    color: '#fff',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  infoCard: {
    backgroundColor: adminColors.cream,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: adminColors.line,
    padding: 14,
    gap: 10,
  },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sectionTitle: { fontFamily: AppFonts.heading, fontSize: 15, color: adminColors.evergreen },
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  infoCell: { flexGrow: 1, flexBasis: '45%', gap: 2 },
  infoLabel: { fontFamily: AppFonts.bodyMedium, fontSize: 11, color: adminColors.muted },
  infoValue: { fontFamily: AppFonts.bodySemi, fontSize: 13, color: adminColors.evergreen },
  notesBox: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: adminColors.line,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  notesText: { fontFamily: AppFonts.body, fontSize: 13, color: adminColors.evergreen, lineHeight: 19 },
  preview: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: adminColors.line,
    padding: 14,
    gap: 12,
  },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: adminColors.line },
  avatarEmpty: { backgroundColor: adminColors.cream, alignItems: 'center', justifyContent: 'center' },
  authorNameRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6 },
  authorName: { fontFamily: AppFonts.bodySemi, fontSize: 14, color: adminColors.evergreen },
  breedChip: {
    backgroundColor: '#C9EAD9',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  breedChipText: {
    fontFamily: AppFonts.bodySemi,
    fontSize: 10,
    color: adminColors.evergreenSoft,
    textTransform: 'uppercase',
  },
  detailMeta: { fontFamily: AppFonts.body, fontSize: 12, color: adminColors.muted },
  previewCaption: { fontFamily: AppFonts.body, fontSize: 14, color: adminColors.evergreen, lineHeight: 21 },
  mediaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  media: {
    width: '48%',
    minWidth: 140,
    flexGrow: 1,
    height: 140,
    borderRadius: 12,
    backgroundColor: adminColors.cream,
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: adminColors.line,
  },
  statItem: { fontFamily: AppFonts.body, fontSize: 12, color: adminColors.muted },
  missingCard: {
    backgroundColor: adminColors.cream,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: adminColors.line,
    padding: 20,
    alignItems: 'center',
    gap: 8,
  },
  missingText: { fontFamily: AppFonts.body, fontSize: 12, color: adminColors.muted, textAlign: 'center' },
  sheetFooter: { gap: 10 },
  statusLine: { fontFamily: AppFonts.bodyMedium, fontSize: 12, color: adminColors.muted },
  statusStrong: { fontFamily: AppFonts.bodySemi },
  footerActions: { gap: 8 },
  actionBtn: {
    minHeight: TapTarget,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 14,
  },
  removeBtn: { backgroundColor: adminColors.redBadge },
  dismissBtn: { backgroundColor: adminColors.cream, borderWidth: 1, borderColor: adminColors.line },
  closeBtn: { backgroundColor: adminColors.evergreenSoft },
  actionLabel: { fontFamily: AppFonts.bodySemi, fontSize: 13, color: '#fff' },
  dismissLabel: { fontFamily: AppFonts.bodySemi, fontSize: 13, color: adminColors.evergreen },
});
