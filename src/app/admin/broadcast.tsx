import { useEffect, useState } from 'react';
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

import { getAdminBroadcastHistory, revokeAdminBroadcast, sendAdminBroadcast } from '@/api/admin';
import { AdminSheet } from '@/components/admin/AdminSheet';
import { adminColors } from '@/constants/adminTheme';
import { AppFonts, TapTarget } from '@/constants/theme';
import type { AdminBroadcastAudience, AdminBroadcastHistoryItem } from '@/types/admin';

const AUDIENCES: { id: AdminBroadcastAudience; label: string }[] = [
  { id: 'all', label: 'All Users' },
  { id: 'pet_parents', label: 'Pet Parents' },
  { id: 'pet_lovers', label: 'Pet Lovers' },
  { id: 'founding_pets', label: 'Founding Pets' },
  { id: 'verified_pets', label: 'Verified Pets' },
  { id: 'unverified_pets', label: 'Unverified Pets' },
  { id: 'non_founding_pets', label: 'Non Founding Pets' },
];

export default function AdminBroadcastScreen() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [targetAudience, setTargetAudience] = useState<AdminBroadcastAudience>('all');
  const [history, setHistory] = useState<AdminBroadcastHistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [sending, setSending] = useState(false);

  async function loadHistory() {
    setLoadingHistory(true);
    try {
      const res = await getAdminBroadcastHistory();
      setHistory(res.history ?? []);
    } catch {
      Alert.alert('Broadcast', 'Failed to load broadcast history');
    } finally {
      setLoadingHistory(false);
    }
  }

  useEffect(() => {
    void loadHistory();
  }, []);

  async function handleSend() {
    if (sending) return;
    setSending(true);
    try {
      const res = await sendAdminBroadcast({
        title: title.trim(),
        body: body.trim(),
        linkUrl: linkUrl.trim() || undefined,
        targetAudience,
      });
      if (res.success) {
        Alert.alert('Broadcast', `Sent to ${res.recipientCount.toLocaleString()} devices.`);
        setConfirmOpen(false);
        setTitle('');
        setBody('');
        setLinkUrl('');
        void loadHistory();
      }
    } catch (err) {
      Alert.alert('Broadcast', err instanceof Error ? err.message : 'Failed to send broadcast');
    } finally {
      setSending(false);
    }
  }

  async function handleRevoke(item: AdminBroadcastHistoryItem) {
    const previous = history;
    setHistory((prev) => prev.filter((row) => row.id !== item.id));
    try {
      await revokeAdminBroadcast(item.id);
    } catch (err) {
      setHistory(previous);
      Alert.alert('Broadcast', err instanceof Error ? err.message : 'Failed to revoke broadcast');
    }
  }

  const audienceLabel = AUDIENCES.find((a) => a.id === targetAudience)?.label || 'All Users';

  return (
    <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
      <Text style={styles.h1}>Platform Notification Broadcast</Text>
      <Text style={styles.sub}>
        Send in-app notifications and mobile push alerts to a selected audience.
      </Text>

      <View style={styles.card}>
        <Text style={styles.h2}>Broadcast Composer</Text>
        <Text style={styles.label}>Title</Text>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Notification title"
          placeholderTextColor={adminColors.muted}
          style={styles.input}
        />
        <Text style={styles.label}>Body</Text>
        <TextInput
          value={body}
          onChangeText={setBody}
          placeholder="Notification body"
          placeholderTextColor={adminColors.muted}
          multiline
          style={[styles.input, styles.textarea]}
        />
        <Text style={styles.label}>Audience Segment</Text>
        <View style={styles.chips}>
          {AUDIENCES.map((item) => (
            <Pressable
              key={item.id}
              onPress={() => setTargetAudience(item.id)}
              style={[styles.chip, targetAudience === item.id && styles.chipOn]}>
              <Text style={[styles.chipLabel, targetAudience === item.id && styles.chipLabelOn]}>
                {item.label}
              </Text>
            </Pressable>
          ))}
        </View>
        <Text style={styles.label}>Action Link (optional)</Text>
        <TextInput
          value={linkUrl}
          onChangeText={setLinkUrl}
          placeholder="/qa or /packs"
          placeholderTextColor={adminColors.muted}
          autoCapitalize="none"
          style={styles.input}
        />
        <Pressable
          disabled={!title.trim() || !body.trim()}
          onPress={() => setConfirmOpen(true)}
          style={[styles.primary, (!title.trim() || !body.trim()) && styles.primaryDisabled]}>
          <Text style={styles.primaryLabel}>Send broadcast</Text>
        </Pressable>
      </View>

      <Text style={styles.h2}>History</Text>
      {loadingHistory ? (
        <ActivityIndicator color={adminColors.accent} />
      ) : history.length === 0 ? (
        <Text style={styles.sub}>No broadcasts yet.</Text>
      ) : (
        history.map((item) => (
          <View key={item.id} style={styles.card}>
            <Text style={styles.name}>{item.title}</Text>
            <Text style={styles.sub}>{item.body}</Text>
            <Text style={styles.meta}>
              {item.recipientCount.toLocaleString()} recipients · {item.targetAudience || 'all'}
            </Text>
            <Pressable onPress={() => handleRevoke(item)} style={styles.revokeBtn}>
              <Text style={styles.revokeLabel}>Revoke</Text>
            </Pressable>
          </View>
        ))
      )}

      <AdminSheet
        visible={confirmOpen}
        title="Confirm broadcast"
        onClose={() => setConfirmOpen(false)}
        footer={
          <Pressable disabled={sending} onPress={handleSend} style={styles.primary}>
            {sending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryLabel}>Send to {audienceLabel}</Text>
            )}
          </Pressable>
        }>
        <Text style={styles.sub}>
          This will fan out “{title}” to {audienceLabel.toLowerCase()} and trigger push delivery.
        </Text>
      </AdminSheet>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 40, gap: 12 },
  h1: { fontFamily: AppFonts.heading, fontSize: 26, color: adminColors.evergreen },
  h2: { fontFamily: AppFonts.heading, fontSize: 18, color: adminColors.evergreen },
  sub: { fontFamily: AppFonts.body, fontSize: 12, color: adminColors.muted, lineHeight: 18 },
  card: {
    backgroundColor: adminColors.card,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: adminColors.line,
    padding: 16,
    gap: 10,
  },
  label: { fontFamily: AppFonts.bodySemi, fontSize: 12, color: adminColors.evergreen },
  input: {
    minHeight: TapTarget,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: adminColors.line,
    backgroundColor: adminColors.cream,
    paddingHorizontal: 14,
    fontFamily: AppFonts.body,
    fontSize: 14,
    color: adminColors.evergreen,
  },
  textarea: { minHeight: 100, paddingTop: 12, textAlignVertical: 'top' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: adminColors.cream,
  },
  chipOn: { backgroundColor: adminColors.evergreenSoft },
  chipLabel: { fontFamily: AppFonts.bodySemi, fontSize: 11, color: adminColors.evergreen },
  chipLabelOn: { color: '#fff' },
  primary: {
    minHeight: TapTarget,
    borderRadius: 999,
    backgroundColor: adminColors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  primaryDisabled: { opacity: 0.5 },
  primaryLabel: { fontFamily: AppFonts.bodySemi, fontSize: 13, color: '#fff' },
  name: { fontFamily: AppFonts.bodySemi, fontSize: 15, color: adminColors.evergreen },
  meta: { fontFamily: AppFonts.body, fontSize: 11, color: adminColors.muted },
  revokeBtn: {
    minHeight: TapTarget - 6,
    borderRadius: 999,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  revokeLabel: { fontFamily: AppFonts.bodySemi, fontSize: 13, color: adminColors.redBadge },
});
