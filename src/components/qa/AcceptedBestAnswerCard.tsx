import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { AppFonts, palette, TapTarget } from '@/constants/theme';
import { formatRelativeTime } from '@/lib/formatTime';
import type { AcceptedAnswer } from '@/types/api';

type Props = {
  answer: AcceptedAnswer;
  isQuestionOwner: boolean;
  removing: boolean;
  onRemove: () => void;
};

export function AcceptedBestAnswerCard({ answer, isQuestionOwner, removing, onRemove }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.acceptedBadge}>
          <Text style={styles.acceptedBadgeText}>★ Accepted Best Answer</Text>
        </View>
        <View style={styles.headerRight}>
          <View style={styles.markedBadge}>
            <Text style={styles.markedText}>⭐ Marked by Question Author</Text>
          </View>
          {isQuestionOwner ? (
            <Pressable
              onPress={onRemove}
              disabled={removing}
              style={[styles.removeBtn, removing && { opacity: 0.6 }]}>
              {removing ? (
                <ActivityIndicator size="small" color="#DC2626" />
              ) : (
                <>
                  <Ionicons name="close-circle-outline" size={14} color="#DC2626" />
                  <Text style={styles.removeBtnText}>Remove Best Answer</Text>
                </>
              )}
            </Pressable>
          ) : null}
        </View>
      </View>

      <View style={styles.authorRow}>
        {answer.pets?.profile_image_url ? (
          <Image source={{ uri: answer.pets.profile_image_url }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarEmpty}>
            <Ionicons name="paw" size={18} color="#15803D" />
          </View>
        )}
        <View style={styles.authorMeta}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{answer.pets?.name || 'Helpful Pet Parent'}</Text>
            <View style={styles.bestTag}>
              <Text style={styles.bestTagText}>BEST ANSWER</Text>
            </View>
          </View>
          <Text style={styles.meta}>
            @{answer.pets?.username || 'pet'} · {formatRelativeTime(answer.created_at)}
          </Text>
        </View>
      </View>

      <Text style={styles.content}>"{answer.content}"</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#F7FDF4',
    borderWidth: 1.5,
    borderColor: '#84CC16',
    borderRadius: 24,
    padding: 20,
    gap: 16,
  },
  headerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E3F2D4',
  },
  headerRight: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
  acceptedBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  acceptedBadgeText: { fontFamily: AppFonts.bodySemi, fontSize: 12, color: '#15803D' },
  markedBadge: {
    backgroundColor: '#E8F8DE',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  markedText: { fontFamily: AppFonts.bodySemi, fontSize: 11, color: '#15803D' },
  removeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#FECACA',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    minHeight: TapTarget - 12,
  },
  removeBtnText: { fontFamily: AppFonts.bodySemi, fontSize: 11, color: '#DC2626' },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: '#D2E7BE' },
  avatarEmpty: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#D2E7BE',
  },
  authorMeta: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  name: { fontFamily: AppFonts.bodySemi, fontSize: 15, color: '#1E293B' },
  bestTag: { backgroundColor: '#0F172A', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 4 },
  bestTagText: { fontFamily: AppFonts.bodySemi, fontSize: 9, color: '#fff', letterSpacing: 0.5 },
  meta: { fontFamily: AppFonts.body, fontSize: 12, color: '#5D6F59', marginTop: 2 },
  content: {
    fontFamily: AppFonts.bodyMedium,
    fontSize: 14,
    color: '#334155',
    fontStyle: 'italic',
    lineHeight: 22,
  },
});
