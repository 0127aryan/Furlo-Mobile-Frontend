import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, StyleSheet, Text, ViewStyle } from 'react-native';

import { useSendWag } from '@/hooks/useSendWag';
import { AppFonts, palette, TapTarget } from '@/constants/theme';

type Props = {
  targetPetId: string;
  targetPetName?: string;
  initialWagged?: boolean;
  compact?: boolean;
  style?: ViewStyle;
};

export function SendWagButton({
  targetPetId,
  targetPetName,
  initialWagged,
  compact,
  style,
}: Props) {
  const { wagSent, send, sending } = useSendWag({ targetPetId, targetPetName, initialWagged });

  if (compact) {
    return (
      <Pressable
        onPress={send}
        disabled={wagSent || sending}
        style={[styles.chip, wagSent && styles.chipSent, style]}>
        {sending ? (
          <ActivityIndicator size="small" color={palette.evergreen} />
        ) : (
          <>
            <Ionicons name="hand-left-outline" size={14} color={wagSent ? palette.amber : palette.evergreen} />
            <Text style={[styles.chipText, wagSent && styles.chipTextSent]}>
              {wagSent ? 'Wagged 🐾' : 'Send Wag'}
            </Text>
          </>
        )}
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={send}
      disabled={wagSent || sending}
      style={[styles.btn, wagSent && styles.btnSent, { minHeight: TapTarget }, style]}>
      {sending ? (
        <ActivityIndicator size="small" color={palette.amber} />
      ) : (
        <>
          <Ionicons name="hand-left-outline" size={16} color="#974900" />
          <Text style={[styles.label, wagSent && styles.labelSent]}>
            {wagSent ? 'Wag Sent! 🐾' : 'Send a Wag'}
          </Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 2,
    borderColor: '#EDE8E1',
    backgroundColor: '#fff',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  btnSent: { borderColor: palette.amber, backgroundColor: 'rgba(232,132,58,0.1)' },
  label: { fontFamily: AppFonts.bodySemi, fontSize: 13, color: '#011E14' },
  labelSent: { color: palette.amber },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: palette.cardLine,
    backgroundColor: '#fff',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: TapTarget * 0.75,
  },
  chipSent: { borderColor: palette.amber, backgroundColor: 'rgba(232,132,58,0.08)' },
  chipText: { fontFamily: AppFonts.bodySemi, fontSize: 12, color: palette.evergreen },
  chipTextSent: { color: palette.amber },
});
