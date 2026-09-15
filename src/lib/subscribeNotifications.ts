import { normalizeNotificationType } from '@/lib/notificationFilters';
import type { NotificationItem } from '@/types/api';
import { useAuthStore } from '@/store/useAuthStore';

type Listener = (notification: NotificationItem) => void;

const listeners = new Set<Listener>();

function dispatchNotification(row: NotificationItem) {
  if (!row?.id) return;
  const normalized = normalizeNotificationType(row);
  listeners.forEach((fn) => fn(normalized));
}

/** Called from the shared pet-social realtime channel. */
export function handleNotificationBroadcast(payload: unknown) {
  if (!payload || typeof payload !== 'object') return;
  const row = payload as NotificationItem;
  const userId = useAuthStore.getState().user?.id;
  if (!userId || row.user_id !== userId) return;
  dispatchNotification(row);
}

/** No-op: notifications ride on the pet-social channel started in tabs layout. */
export function startNotificationRealtime(_userId: string): void {}

export function subscribeNotifications(_userId: string, onNew?: Listener): () => void {
  if (onNew) listeners.add(onNew);

  return () => {
    if (onNew) listeners.delete(onNew);
  };
}
