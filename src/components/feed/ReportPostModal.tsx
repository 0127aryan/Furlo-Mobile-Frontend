import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { reportPost } from '@/api/posts';
import { AppFonts, palette, TapTarget } from '@/constants/theme';
import { useAuthStore } from '@/store/useAuthStore';

const REASONS = [
  { id: 'abuse', label: '🚨 Animal abuse or neglect' },
  { id: 'medical', label: '🩺 Medical misinformation' },
  { id: 'harassment', label: '🚫 Harassment or bullying' },
  { id: 'spam', label: '📢 Spam or scam' },
  { id: 'inappropriate', label: '⚠️ Inappropriate content' },
  { id: 'other', label: '💬 Something else' },
];

type Props = {
  postId: string | null;
  visible: boolean;
  onClose: () => void;
};

export function ReportPostModal({ postId, visible, onClose }: Props) {
  const activePet = useAuthStore((s) => s.activePet);
  const [reason, setReason] = useState('abuse');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit() {
    if (!postId || !activePet?.id) return;
    setSubmitting(true);
    try {
      await reportPost(postId, activePet.id, reason, details);
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setDetails('');
        setReason('abuse');
        onClose();
      }, 1500);
    } catch {
      setSubmitting(false);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal visible={visible && !!postId} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.scrim}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>Report this Post</Text>
              <Text style={styles.sub}>Help us keep the Furlo community safe and cozy for everyone.</Text>
            </View>
            <Pressable onPress={onClose} hitSlop={8}>
              <Ionicons name="close" size={20} color={palette.muted} />
            </Pressable>
          </View>

          {submitted ? (
            <View style={styles.done}>
              <Ionicons name="checkmark-circle" size={40} color="#166534" />
              <Text style={styles.title}>Report Submitted</Text>
              <Text style={styles.sub}>Thank you. Our moderation team will review this shortly.</Text>
            </View>
          ) : (
            <>
              <ScrollView contentContainerStyle={styles.body}>
                <Text style={styles.label}>Why are you reporting this?</Text>
                {REASONS.map((r) => {
                  const on = reason === r.id;
                  return (
                    <Pressable key={r.id} onPress={() => setReason(r.id)} style={[styles.reason, on && styles.reasonOn]}>
                      <View style={[styles.radio, on && styles.radioOn]} />
                      <Text style={styles.reasonLabel}>{r.label}</Text>
                    </Pressable>
                  );
                })}
                <Text style={styles.label}>Additional Details (Optional)</Text>
                <TextInput
                  value={details}
                  onChangeText={setDetails}
                  placeholder="Provide more context..."
                  placeholderTextColor={palette.faded}
                  multiline
                  style={styles.details}
                />
              </ScrollView>
              <View style={styles.footer}>
                <Pressable onPress={onClose}>
                  <Text style={styles.cancel}>Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={handleSubmit}
                  disabled={submitting}
                  style={StyleSheet.flatten([styles.submit, { minHeight: TapTarget }])}>
                  {submitting ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.submitLabel}>Submit Report</Text>
                  )}
                </Pressable>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: {
    flex: 1,
    backgroundColor: 'rgba(28,35,41,0.5)',
    justifyContent: 'center',
    padding: 16,
  },
  sheet: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ede8e1',
    maxHeight: '85%',
    overflow: 'hidden',
  },
  header: { flexDirection: 'row', padding: 20, borderBottomWidth: 1, borderBottomColor: '#ede8e1', gap: 8 },
  title: { fontFamily: AppFonts.heading, fontSize: 20, color: '#163328' },
  sub: { fontFamily: AppFonts.body, fontSize: 12, color: palette.muted, marginTop: 4 },
  body: { padding: 20, gap: 8 },
  label: {
    fontFamily: AppFonts.bodySemi,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: palette.faded,
    marginTop: 8,
  },
  reason: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ede8e1',
  },
  reasonOn: { backgroundColor: 'rgba(232,132,58,0.1)', borderColor: palette.amber },
  radio: { width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: palette.border },
  radioOn: { borderColor: palette.amber, backgroundColor: palette.amber },
  reasonLabel: { fontFamily: AppFonts.bodyMedium, fontSize: 14, color: '#163328', flex: 1 },
  details: {
    minHeight: 80,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 12,
    padding: 12,
    backgroundColor: palette.cream,
    fontFamily: AppFonts.body,
    fontSize: 13,
    color: '#163328',
    textAlignVertical: 'top',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#ede8e1',
  },
  cancel: { fontFamily: AppFonts.bodySemi, fontSize: 14, color: palette.muted, paddingHorizontal: 8 },
  submit: {
    backgroundColor: '#C0392B',
    paddingHorizontal: 20,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitLabel: { fontFamily: AppFonts.headingSemi, fontSize: 14, color: '#fff' },
  done: { padding: 32, alignItems: 'center', gap: 8 },
});
