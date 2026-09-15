import { Ionicons } from '@expo/vector-icons';
import { Redirect, Tabs } from 'expo-router';
import { useEffect } from 'react';

import { AppFonts, TapTarget } from '@/constants/theme';
import { usePostVerb } from '@/hooks/usePostVerb';
import { useTheme } from '@/hooks/use-theme';
import { registerPushTokenWithBackend } from '@/lib/pushNotifications';
import { startFollowRealtime } from '@/lib/subscribeFollowEvents';
import { useAuthStore } from '@/store/useAuthStore';

export default function TabsLayout() {
  const theme = useTheme();
  const user = useAuthStore((s) => s.user);
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const activePet = useAuthStore((s) => s.activePet);
  const { verb } = usePostVerb(activePet);

  useEffect(() => {
    if (!user?.id) return;
    startFollowRealtime();
    void registerPushTokenWithBackend();
  }, [user?.id]);

  if (isHydrated && !user) {
    return <Redirect href="/join" />;
  }

  return (
    <Tabs
      initialRouteName="feed"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textSecondary,
        tabBarStyle: {
          backgroundColor: theme.card,
          borderTopColor: theme.border,
          minHeight: TapTarget + 8,
        },
        tabBarLabelStyle: {
          fontFamily: AppFonts.bodyMedium,
          fontSize: 11,
        },
      }}>
      <Tabs.Screen
        name="feed"
        options={{
          title: 'The Yard',
          tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="packs"
        options={{
          title: 'Discover Packs',
          tabBarIcon: ({ color, size }) => <Ionicons name="people-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: `Post ${verb}`,
          tabBarIcon: ({ color, size }) => <Ionicons name="add-circle-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="qa"
        options={{
          title: 'Q&A',
          tabBarIcon: ({ color, size }) => <Ionicons name="help-circle-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'My Paw Print',
          tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
