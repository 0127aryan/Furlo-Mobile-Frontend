import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { adminColors } from '@/constants/adminTheme';
import { AppFonts, TapTarget } from '@/constants/theme';

export function AdminAccessDenied() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.card}>
        <View style={styles.iconWrap}>
          <Ionicons name="shield" size={32} color={adminColors.redBadge} />
        </View>
        <Text style={styles.title}>Access Denied</Text>
        <Text style={styles.body}>
          Super Admin privileges are required to access the operations portal. Please log in with an
          authorized administrator account.
        </Text>
        <Pressable
          onPress={() => router.replace('/(tabs)/feed')}
          style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}>
          <Ionicons name="arrow-back" size={16} color="#fff" />
          <Text style={styles.ctaLabel}>Back to Pack Feed</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: adminColors.cream,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: adminColors.card,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: adminColors.line,
    padding: 28,
    alignItems: 'center',
    gap: 12,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: AppFonts.heading,
    fontSize: 22,
    color: adminColors.evergreen,
  },
  body: {
    fontFamily: AppFonts.body,
    fontSize: 13,
    lineHeight: 20,
    color: adminColors.muted,
    textAlign: 'center',
  },
  cta: {
    marginTop: 8,
    minHeight: TapTarget,
    paddingHorizontal: 22,
    borderRadius: 999,
    backgroundColor: adminColors.accent,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ctaPressed: { opacity: 0.88 },
  ctaLabel: {
    fontFamily: AppFonts.bodySemi,
    fontSize: 13,
    color: '#fff',
  },
});
