import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { AppFonts, palette } from '@/constants/theme';
import { isPendingCommunity, isVerifiedCommunity } from '@/lib/communityStatus';
import type { Community } from '@/types/api';

type Props = {
  pack: Pick<Community, 'is_verified' | 'is_approved' | 'status' | 'category'>;
  titleStyle?: object;
  title: string;
  iconSize?: number;
  pendingLabel?: string;
};

export function PackTitleWithBadges({
  pack,
  title,
  titleStyle,
  iconSize = 18,
  pendingLabel = '⏳ Pending Admin Approval',
}: Props) {
  const verified = isVerifiedCommunity(pack);
  const pending = isPendingCommunity(pack);

  return (
    <View>
      <View style={styles.metaRow}>
        {pack.category ? (
          <View style={styles.categoryChip}>
            <Text style={styles.categoryText}>{pack.category}</Text>
          </View>
        ) : null}
        {verified ? (
          <View style={styles.verifiedPill}>
            <Ionicons name="checkmark-circle" size={12} color={palette.evergreenSoft} />
            <Text style={styles.verifiedPillText}>Verified</Text>
          </View>
        ) : pending ? (
          <View style={styles.pendingPill}>
            <Text style={styles.pendingText}>{pendingLabel}</Text>
          </View>
        ) : null}
      </View>
      <View style={styles.titleRow}>
        <Text style={titleStyle} numberOfLines={2}>
          {title}
        </Text>
        {verified ? (
          <View style={styles.verifiedIcon}>
            <Ionicons name="checkmark-circle" size={iconSize} color={palette.evergreenSoft} />
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 6 },
  categoryChip: {
    backgroundColor: palette.tabTrack,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  categoryText: { fontFamily: AppFonts.bodySemi, fontSize: 11, color: '#424844' },
  verifiedPill: {
    backgroundColor: '#C9EAD9',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  verifiedPillText: { fontFamily: AppFonts.bodySemi, fontSize: 10, color: palette.evergreenSoft },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  verifiedIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#C9EAD9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingPill: {
    backgroundColor: palette.apricot,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  pendingText: { fontFamily: AppFonts.bodySemi, fontSize: 11, color: palette.brown },
});
