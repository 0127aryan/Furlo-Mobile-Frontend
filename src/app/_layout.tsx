import '@/lib/notifeeBackgroundHandler';

import { useFonts } from 'expo-font';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';

import { restoreSession } from '@/api/auth';
import { FurloLoadingScreen } from '@/components/FurloLoadingScreen';
import { PushNotificationBootstrap } from '@/components/PushNotificationBootstrap';
import { palette } from '@/constants/theme';
import { useAuthStore } from '@/store/useAuthStore';

SplashScreen.preventAutoHideAsync();

const SPLASH_MIN_MS = 2000;

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [sessionReady, setSessionReady] = useState(false);
  const [minTimeDone, setMinTimeDone] = useState(false);
  const user = useAuthStore((s) => s.user);
  const [fontsLoaded] = useFonts({
    Outfit_400Regular: require('../../assets/fonts/Outfit_400Regular.ttf'),
    Outfit_600SemiBold: require('../../assets/fonts/Outfit_600SemiBold.ttf'),
    Outfit_700Bold: require('../../assets/fonts/Outfit_700Bold.ttf'),
    PlusJakartaSans_400Regular: require('../../assets/fonts/PlusJakartaSans_400Regular.ttf'),
    PlusJakartaSans_500Medium: require('../../assets/fonts/PlusJakartaSans_500Medium.ttf'),
    PlusJakartaSans_600SemiBold: require('../../assets/fonts/PlusJakartaSans_600SemiBold.ttf'),
  });

  useEffect(() => {
    if (!fontsLoaded) return;

    SplashScreen.hideAsync();

    const timer = setTimeout(() => setMinTimeDone(true), SPLASH_MIN_MS);

    let cancelled = false;
    restoreSession()
      .catch(() => null)
      .finally(() => {
        if (cancelled) return;
        useAuthStore.getState().setHydrated(true);
        setSessionReady(true);
      });

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  if (!sessionReady || !minTimeDone) {
    return <FurloLoadingScreen />;
  }

  const navTheme = colorScheme === 'dark' ? DarkTheme : DefaultTheme;
  const furloTheme = {
    ...navTheme,
    colors: {
      ...navTheme.colors,
      primary: palette.amber,
      background: colorScheme === 'dark' ? palette.darkBg : palette.cream,
      card: colorScheme === 'dark' ? palette.darkCard : palette.card,
      text: colorScheme === 'dark' ? palette.cream : palette.charcoal,
      border: colorScheme === 'dark' ? '#2E3135' : palette.border,
    },
  };

  return (
    <ThemeProvider value={furloTheme}>
      <PushNotificationBootstrap enabled={sessionReady && minTimeDone && Boolean(user?.id)} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="join" />
        <Stack.Screen name="forgot-password" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="pet/[id]" />
        <Stack.Screen name="community/[slug]" />
        <Stack.Screen name="qa" />
        <Stack.Screen name="about" />
        <Stack.Screen name="privacy" />
        <Stack.Screen name="terms" />
        <Stack.Screen name="notifications/settings" />
      </Stack>
    </ThemeProvider>
  );
}
