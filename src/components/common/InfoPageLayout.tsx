import { ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenBackButton } from '@/components/common/ScreenBackButton';
import { AppFonts, palette } from '@/constants/theme';

type Props = {
  title: string;
  children: ReactNode;
};

export function InfoPageLayout({ title, children }: Props) {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <ScreenBackButton style={styles.back} />
        <Text style={styles.title}>{title}</Text>
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>{children}</ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.cream },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: palette.cardLine,
    gap: 8,
  },
  back: { alignSelf: 'flex-start' },
  title: { fontFamily: AppFonts.heading, fontSize: 24, color: palette.evergreenSoft },
  scroll: { padding: 16, paddingBottom: 40, gap: 16 },
});
