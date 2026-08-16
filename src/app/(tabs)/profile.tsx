import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { logout } from '@/api/auth';
import { FurloLoadingScreen } from '@/components/FurloLoadingScreen';
import { AppFonts, palette, TapTarget } from '@/constants/theme';
import { useAuthStore } from '@/store/useAuthStore';

export default function ProfileScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
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

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.body}>
        <Text style={styles.kicker}>Paw Print</Text>
        <Text style={styles.name}>{activePet?.name || 'Your profile'}</Text>
        {activePet?.username ? <Text style={styles.handle}>@{activePet.username}</Text> : null}
        {user?.email ? <Text style={styles.email}>{user.email}</Text> : null}

        <Pressable
          onPress={handleLogout}
          style={StyleSheet.flatten([styles.logout, { minHeight: TapTarget }])}>
          <Text style={styles.logoutLabel}>Log out</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.cream },
  body: { flex: 1, paddingHorizontal: 24, paddingTop: 48, gap: 8 },
  kicker: {
    fontFamily: AppFonts.bodySemi,
    fontSize: 11,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: palette.faded,
  },
  name: { fontFamily: AppFonts.heading, fontSize: 28, color: palette.ink },
  handle: { fontFamily: AppFonts.bodyMedium, fontSize: 16, color: palette.brown },
  email: { fontFamily: AppFonts.body, fontSize: 14, color: palette.muted, marginTop: 4 },
  logout: {
    marginTop: 32,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: palette.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutLabel: { fontFamily: AppFonts.bodySemi, fontSize: 16, color: palette.brown },
});
