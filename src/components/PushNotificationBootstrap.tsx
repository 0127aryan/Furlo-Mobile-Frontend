import { useRouter } from 'expo-router';
import { useEffect } from 'react';

import {
  initializePushNotifications,
  setupNotificationResponseHandlers,
} from '@/lib/pushNotifications';
import { consumePendingNotificationRoute } from '@/lib/pendingNotificationRoute';

type Props = {
  enabled: boolean;
};

export function PushNotificationBootstrap({ enabled }: Props) {
  const router = useRouter();

  useEffect(() => {
    if (!enabled) return;

    void initializePushNotifications();
    setupNotificationResponseHandlers(router);

    const pending = consumePendingNotificationRoute();
    if (pending) {
      router.push(pending as never);
    }
  }, [enabled, router]);

  return null;
}
