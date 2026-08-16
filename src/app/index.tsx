import { Redirect } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { palette } from '@/constants/theme';
import { useAuthStore } from '@/store/useAuthStore';

export default function IndexScreen() {
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const user = useAuthStore((s) => s.user);
  const activePet = useAuthStore((s) => s.activePet);

  if (!isHydrated) {
    return (
      <View style={styles.splash}>
        <ActivityIndicator color={palette.brown} />
      </View>
    );
  }

  if (user && activePet) {
    return <Redirect href="/feed" />;
  }

  if (user) {
    return <Redirect href="/join/select" />;
  }

  return <Redirect href="/join" />;
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.cream,
  },
});
