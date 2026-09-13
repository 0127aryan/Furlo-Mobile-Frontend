import { Ionicons } from '@expo/vector-icons';
import { type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppFonts, palette, TapTarget } from '@/constants/theme';

const STEP_WIDTH = ['25%', '50%', '75%', '100%'] as const;

type Props = {
  step: 1 | 2 | 3 | 4;
  rightLabel?: string;
  onBack: () => void;
  onRightPress?: () => void;
  children: ReactNode;
};

export function OnboardingShell({ step, rightLabel, onBack, onRightPress, children }: Props) {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={onBack} style={styles.back} hitSlop={8}>
          <Ionicons name="arrow-back" size={22} color={palette.brown} />
        </Pressable>
        <Text style={styles.stepLabel}>Step {step} of 4</Text>
        {rightLabel ? (
          <Pressable onPress={onRightPress} disabled={!onRightPress} style={styles.rightBtn}>
            <Text style={styles.rightLabel}>{rightLabel}</Text>
          </Pressable>
        ) : (
          <View style={styles.rightSpacer} />
        )}
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: STEP_WIDTH[step - 1] }]} />
      </View>
      {children}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.cream },
  header: {
    height: 52,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  back: { width: TapTarget, height: TapTarget, alignItems: 'flex-start', justifyContent: 'center' },
  stepLabel: {
    fontFamily: AppFonts.bodySemi,
    fontSize: 11,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: palette.faded,
  },
  rightBtn: { minHeight: TapTarget, justifyContent: 'center', alignItems: 'flex-end' },
  rightLabel: { fontFamily: AppFonts.bodyMedium, fontSize: 13, color: palette.brown },
  rightSpacer: { width: TapTarget },
  track: { height: 3, backgroundColor: '#ece7e2' },
  fill: { height: '100%', backgroundColor: palette.amber, borderRadius: 99 },
});
