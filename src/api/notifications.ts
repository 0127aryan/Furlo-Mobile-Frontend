import { apiFetch } from '@/api/client';
import type { NotificationCategory, NotificationItem, NotificationSettings } from '@/types/api';

export async function getNotifications(category: NotificationCategory = 'all', page = 1, limit = 30) {
  return apiFetch<{
    notifications: NotificationItem[];
    unreadCount: number;
    totalCount: number;
    page: number;
    limit: number;
  }>(`/notifications?category=${category}&page=${page}&limit=${limit}`);
}

export async function markNotificationRead(notificationId: string) {
  return apiFetch<{ success: boolean }>('/notifications/mark-read', {
    method: 'POST',
    json: { notificationId },
  });
}

export async function markAllNotificationsRead() {
  return apiFetch<{ success: boolean }>('/notifications/mark-read', {
    method: 'POST',
    json: { markAll: true },
  });
}

export async function getNotificationSettings() {
  return apiFetch<{ settings: NotificationSettings }>('/notifications/settings');
}

export async function saveNotificationSettings(settings: NotificationSettings) {
  return apiFetch<{ success: boolean; settings: NotificationSettings }>('/notifications/settings', {
    method: 'POST',
    json: settings,
  });
}

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  master_push_enabled: true,
  qa_answers_enabled: true,
  qa_best_answer_enabled: true,
  treats_enabled: true,
  comments_enabled: true,
  followers_enabled: true,
  pack_announcements_enabled: true,
  email_digest_enabled: false,
  quiet_hours_enabled: false,
  quiet_hours_start: '22:00',
  quiet_hours_end: '07:00',
  timezone: 'UTC',
};

export type PushPlatform = 'ios' | 'android' | 'web';

export async function registerDeviceToken(params: {
  token: string;
  platform: PushPlatform;
  device_id?: string;
}) {
  return apiFetch<{ success: boolean }>('/notifications/register-device', {
    method: 'POST',
    json: params,
  });
}

export async function unregisterDeviceToken(token: string) {
  return apiFetch<{ success: boolean }>('/notifications/register-device', {
    method: 'DELETE',
    json: { token },
  });
}
