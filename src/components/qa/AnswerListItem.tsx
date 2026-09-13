import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { AppFonts, TapTarget } from '@/constants/theme';
import { formatRelativeTime } from '@/lib/formatTime';
import type { CommentItem } from '@/types/api';

type Props = {
  comment: CommentItem;
  isQuestionOwner: boolean;
  hasAcceptedAnswer: boolean;
  accepting: boolean;
  onAccept: () => void;
};

export function AnswerListItem({
  comment,
  isQuestionOwner,
  hasAcceptedAnswer,
  accepting,
  onAccept,
}: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.authorRow}>
          {comment.pets?.profile_image_url ? (
            <Image source={{ uri: comment.pets.profile_image_url }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarEmpty}>
              <Ionicons name="paw" size={18} color="#E8843A" />
            </View>
          )}
          <View>
            <Text style={styles.name}>{comment.pets?.name || 'Pet Parent'}</Text>
            <Text style={styles.meta}>
              @{comment.pets?.username || 'pet'} · {formatRelativeTime(comment.created_at)}
            </Text>
          </View>
        </View>

        {isQuestionOwner ? (
          <Pressable
            onPress={onAccept}
            disabled={accepting}
            style={[styles.acceptBtn, accepting && { opacity: 0.6 }]}>
            {accepting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.acceptBtnText}>
                {hasAcceptedAnswer ? 'Change to Best Answer' : '✓ Accept as Best Answer'}
              </Text>
            )}
          </Pressable>
        ) : null}
      </View>

      <Text style={styles.content}>{comment.content}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#EDE8E1',
    padding: 20,
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
  },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  avatar: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: '#EDE8E1' },
  avatarEmpty: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f3ed',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#EDE8E1',
  },
  name: { fontFamily: AppFonts.bodySemi, fontSize: 14, color: '#011E14' },
  meta: { fontFamily: AppFonts.body, fontSize: 12, color: '#727974', marginTop: 2 },
  acceptBtn: {
    backgroundColor: '#15803D',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    minHeight: TapTarget - 8,
    justifyContent: 'center',
    maxWidth: '48%',
  },
  acceptBtnText: {
    fontFamily: AppFonts.bodySemi,
    fontSize: 11,
    color: '#fff',
    textAlign: 'center',
    lineHeight: 16,
  },
  content: {
    fontFamily: AppFonts.body,
    fontSize: 14,
    color: '#424844',
    lineHeight: 22,
  },
});
