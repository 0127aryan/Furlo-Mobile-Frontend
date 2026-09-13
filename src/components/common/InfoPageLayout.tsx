import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppFonts, palette } from '@/constants/theme';

type Props = {
  title: string;
  children: ReactNode;
};

export function InfoPageLayout({ title, children }: Props) {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.back} hitSlop={8}>
          <Ionicons name="arrow-back" size={20} color={palette.evergreen} />
          <Text style={styles.backLabel}>Back</Text>
        </Pressable>
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
  back: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 4 },
  backLabel: { fontFamily: AppFonts.bodySemi, fontSize: 14, color: palette.evergreen },
  title: { fontFamily: AppFonts.heading, fontSize: 24, color: palette.evergreenSoft },
  scroll: { padding: 16, paddingBottom: 40, gap: 16 },
});
