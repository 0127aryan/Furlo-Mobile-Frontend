import * as SecureStore from 'expo-secure-store';

import type { NotificationDevicePrefs } from '@/types/api';

const PREFS_KEY = 'furlo_notification_device_prefs';

export const DEFAULT_DEVICE_PREFS: NotificationDevicePrefs = {
  pushPermissionAsked: false,
  pushPermissionDismissed: false,
  playSound: true,
  hapticFeedback: true,
  quietHoursEnabled: false,
  quietHoursStart: '22:00',
  quietHoursEnd: '07:00',
};

export async function getNotificationDevicePrefs(): Promise<NotificationDevicePrefs> {
  try {
    const raw = await SecureStore.getItemAsync(PREFS_KEY);
    if (!raw) return DEFAULT_DEVICE_PREFS;
    return { ...DEFAULT_DEVICE_PREFS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_DEVICE_PREFS;
  }
}

export async function saveNotificationDevicePrefs(prefs: NotificationDevicePrefs): Promise<void> {
  await SecureStore.setItemAsync(PREFS_KEY, JSON.stringify(prefs));
}
