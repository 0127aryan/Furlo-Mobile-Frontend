import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { logout } from '@/api/auth';
import { ScreenBackButton } from '@/components/common/ScreenBackButton';
import { FurloLoadingScreen } from '@/components/FurloLoadingScreen';
import { PetProfileView } from '@/components/profile/PetProfileView';
import { ProfileMenuSheet } from '@/components/profile/ProfileMenuSheet';
import { AppFonts, palette, TapTarget } from '@/constants/theme';
import { useAuthStore } from '@/store/useAuthStore';

export default function ProfileScreen() {
  const router = useRouter();
  const activePet = useAuthStore((s) => s.activePet);
  const [loggingOut, setLoggingOut] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  async function handleLogout() {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await logout();
    } finally {
      router.replace('/join');
    }
  }

  if (loggingOut) {
    return <FurloLoadingScreen caption="Signing you out" />;
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.topBar}>
        <View style={styles.topBarLeft}>
          <ScreenBackButton />
          <Text style={styles.topTitle}>My Paw Print</Text>
        </View>
        <Pressable
          onPress={() => setMenuOpen(true)}
          hitSlop={8}
          style={[styles.menuBtn, { minHeight: TapTarget, minWidth: TapTarget }]}>
          <Ionicons name="menu" size={24} color={palette.evergreen} />
        </Pressable>
      </View>

      {!activePet?.id ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>No Paw Print yet</Text>
          <Text style={styles.emptyBody}>Finish onboarding to see your profile here.</Text>
        </View>
      ) : (
        <PetProfileView petId={activePet.id} showLogout onLogout={handleLogout} />
      )}

      <ProfileMenuSheet visible={menuOpen} onClose={() => setMenuOpen(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FEF9F3' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: palette.cardLine,
  },
  topBarLeft: { flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1 },
  topTitle: { fontFamily: AppFonts.heading, fontSize: 20, color: palette.evergreen },
  menuBtn: { alignItems: 'center', justifyContent: 'center' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 8 },
  emptyTitle: { fontFamily: AppFonts.heading, fontSize: 20, color: '#011E14' },
  emptyBody: { fontFamily: AppFonts.body, fontSize: 14, color: palette.muted, textAlign: 'center' },
});
