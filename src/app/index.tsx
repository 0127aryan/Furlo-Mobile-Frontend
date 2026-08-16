import { Redirect } from 'expo-router';

import { FurloLoadingScreen } from '@/components/FurloLoadingScreen';
import { useAuthStore } from '@/store/useAuthStore';

export default function IndexScreen() {
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const user = useAuthStore((s) => s.user);
  const activePet = useAuthStore((s) => s.activePet);

  if (!isHydrated) {
    return <FurloLoadingScreen />;
  }

  if (user && activePet) {
    return <Redirect href="/feed" />;
  }

  if (user) {
    return <Redirect href="/join/select" />;
  }

  return <Redirect href="/join" />;
}
