import { StyleSheet, Text, View } from 'react-native';

import { adminColors } from '@/constants/adminTheme';
import { AppFonts } from '@/constants/theme';

type Props = {
  isVerified?: boolean;
  isFoundingPet?: boolean;
  compact?: boolean;
};

export function PetStatusBadges({ isVerified, isFoundingPet, compact }: Props) {
  if (!isVerified && !isFoundingPet) return null;

  return (
    <View style={[styles.row, compact && styles.rowCompact]}>
      {isVerified ? (
        <View style={[styles.pill, styles.verified, compact && styles.pillCompact]}>
          <Text style={[styles.label, styles.verifiedLabel, compact && styles.labelCompact]}>
            {compact ? '✓' : '✓ Verified Paw'}
          </Text>
        </View>
      ) : null}
      {isFoundingPet ? (
        <View style={[styles.pill, styles.founding, compact && styles.pillCompact]}>
          <Text style={[styles.label, styles.foundingLabel, compact && styles.labelCompact]}>
            {compact ? '👑' : '👑 Founding Pet'}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 },
  rowCompact: { marginTop: 0, gap: 4 },
  pill: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  pillCompact: { paddingHorizontal: 5, paddingVertical: 1 },
  verified: { backgroundColor: '#E4F5EB' },
  founding: { backgroundColor: '#FFF4E5' },
  label: { fontFamily: AppFonts.bodySemi, fontSize: 11 },
  labelCompact: { fontSize: 10 },
  verifiedLabel: { color: adminColors.emeraldBadge },
  foundingLabel: { color: '#B45309' },
});
