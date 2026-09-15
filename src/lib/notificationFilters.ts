import type { NotificationCategory, NotificationItem } from '@/types/api';

export function normalizeNotificationType(item: NotificationItem): NotificationItem {
  const storedType = item.metadata?.notificationType as string | undefined;
  if (storedType) return { ...item, type: storedType as NotificationItem['type'] };
  if (item.type === 'like') return { ...item, type: 'treat' };
  if (item.type === 'community_announcement') return { ...item, type: 'pack_announcement' };
  if (item.type === 'comment_reply') return { ...item, type: 'comment' };
  return item;
}

export function notificationMatchesFilter(
  item: NotificationItem,
  filter: NotificationCategory
): boolean {
  if (filter === 'all') return true;
  if (filter === 'treats') return item.type === 'treat';
  if (filter === 'comments') return item.type === 'comment';
  if (filter === 'followers') return item.type === 'follow';
  if (filter === 'qa') return item.type === 'best_answer';
  return true;
}
