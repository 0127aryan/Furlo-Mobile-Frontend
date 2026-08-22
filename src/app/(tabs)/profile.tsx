import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { logout } from '@/api/auth';
import { FurloLoadingScreen } from '@/components/FurloLoadingScreen';
import { PetProfileView } from '@/components/profile/PetProfileView';
import { AppFonts, palette } from '@/constants/theme';
import { useAuthStore } from '@/store/useAuthStore';

export default function ProfileScreen() {
  const router = useRouter();
  const activePet = useAuthStore((s) => s.activePet);
  const [loggingOut, setLoggingOut] = useState(false);

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

  if (!activePet?.id) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>No Paw Print yet</Text>
          <Text style={styles.emptyBody}>Finish onboarding to see your profile here.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <PetProfileView petId={activePet.id} showLogout onLogout={handleLogout} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FEF9F3' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 8 },
  emptyTitle: { fontFamily: AppFonts.heading, fontSize: 20, color: '#011E14' },
  emptyBody: { fontFamily: AppFonts.body, fontSize: 14, color: palette.muted, textAlign: 'center' },
});
