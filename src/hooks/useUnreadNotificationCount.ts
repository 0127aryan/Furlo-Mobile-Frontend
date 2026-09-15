import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';

import { getNotifications } from '@/api/notifications';
import { subscribeNotifications } from '@/lib/subscribeNotifications';
import { useAuthStore } from '@/store/useAuthStore';

export function useUnreadNotificationCount() {
  const userId = useAuthStore((s) => s.user?.id);
  const [count, setCount] = useState(0);

  const refresh = useCallback(async () => {
    if (!userId) {
      setCount(0);
      return;
    }
    try {
      const res = await getNotifications('all', 1, 1);
      setCount(res.unreadCount || 0);
    } catch {
      setCount(0);
    }
  }, [userId]);

  useEffect(() => {
    refresh();
    if (!userId) return;

    const unsubscribe = subscribeNotifications(userId, (item) => {
      if (!item.is_read) setCount((prev) => prev + 1);
    });

    const poll = setInterval(refresh, 30000);
    return () => {
      unsubscribe();
      clearInterval(poll);
    };
  }, [userId, refresh]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  return { count, refresh };
}
