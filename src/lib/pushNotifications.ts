import Constants from 'expo-constants';
import type { Router } from 'expo-router';
import { Platform } from 'react-native';

import { registerDeviceToken, type PushPlatform } from '@/api/notifications';
import {
  getNotificationDevicePrefs,
  saveNotificationDevicePrefs,
} from '@/lib/notificationDevicePrefs';
import { ensureNotifeeChannels, resolveChannelId } from '@/lib/notifeeChannels';
import {
  navigateFromNotification,
  parseNotificationData,
  type NotificationLinkData,
} from '@/lib/notificationNavigation';

export type PushPermissionStatus = 'granted' | 'denied' | 'undetermined';

/** Android Expo Go (SDK 53+) cannot load expo-notifications — it throws on import. */
export function isExpoGoAndroidWithoutPush(): boolean {
  return Platform.OS === 'android' && Constants.appOwnership === 'expo';
}

export function isPushAvailableInCurrentRuntime(): boolean {
  return !isExpoGoAndroidWithoutPush();
}

const LEGACY_EXPO_CHANNELS = [
  { id: 'default', name: 'Furlo Alerts' },
  { id: 'furlo_interactions', name: 'Interactions & Treats' },
  { id: 'furlo_qa_advice', name: 'Q&A & Advice' },
  { id: 'furlo_pack_followers', name: 'Pack & Followers' },
] as const;

let pushInitialized = false;
let handlersSetup = false;

function getPushPlatform(): PushPlatform {
  if (Platform.OS === 'ios') return 'ios';
  if (Platform.OS === 'android') return 'android';
  return 'web';
}

async function ensureLegacyExpoChannels(
  Notifications: typeof import('expo-notifications')
): Promise<void> {
  if (Platform.OS !== 'android') return;

  for (const channel of LEGACY_EXPO_CHANNELS) {
    await Notifications.setNotificationChannelAsync(channel.id, {
      name: channel.name,
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
    });
  }
}

async function displayForegroundWithNotifee(
  title: string,
  body: string,
  data: NotificationLinkData
): Promise<void> {
  if (Platform.OS !== 'android' || !isPushAvailableInCurrentRuntime()) return;

  try {
    const notifee = (await import('@notifee/react-native')).default;
    const channelId = resolveChannelId(data.type);

    await notifee.displayNotification({
      id: data.notificationId || `furlo-${Date.now()}`,
      title,
      body,
      data: data as unknown as Record<string, string>,
      android: {
        channelId,
        pressAction: { id: 'default' },
        smallIcon: 'notification_icon',
      },
    });
  } catch (err) {
    console.warn('[push] notifee foreground display failed:', err);
  }
}

/** Call once on app start (dev build / production). Sets handler, channels, and refreshes token. */
export async function initializePushNotifications(): Promise<void> {
  if (!isPushAvailableInCurrentRuntime()) return;

  try {
    const Notifications = await import('expo-notifications');

    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        // Android foreground alerts are shown via Notifee (Phase B).
        shouldShowAlert: Platform.OS !== 'android',
        shouldShowBanner: Platform.OS !== 'android',
        shouldShowList: Platform.OS !== 'android',
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });

    await ensureLegacyExpoChannels(Notifications);
    await ensureNotifeeChannels();

    if (!pushInitialized) {
      pushInitialized = true;

      Notifications.addNotificationReceivedListener(async (notification) => {
        const content = notification.request.content;
        const data = parseNotificationData(content.data as Record<string, unknown>);
        await displayForegroundWithNotifee(content.title || 'Furlo', content.body || '', data);
      });
    }

    const status = await getPushPermissionStatus();
    if (status === 'granted') {
      await registerPushTokenWithBackend();
    }
  } catch (err) {
    console.warn('[push] initializePushNotifications failed:', err);
  }
}

export function setupNotificationResponseHandlers(router: Router): void {
  if (!isPushAvailableInCurrentRuntime() || handlersSetup) return;
  handlersSetup = true;

  void (async () => {
    try {
      const Notifications = await import('expo-notifications');

      const last = await Notifications.getLastNotificationResponseAsync();
      if (last) {
        const data = parseNotificationData(
          last.notification.request.content.data as Record<string, unknown>
        );
        navigateFromNotification(data, router);
        await Notifications.clearLastNotificationResponseAsync();
      }

      Notifications.addNotificationResponseReceivedListener((response) => {
        const data = parseNotificationData(
          response.notification.request.content.data as Record<string, unknown>
        );
        navigateFromNotification(data, router);
      });

      if (Platform.OS === 'android') {
        const notifee = (await import('@notifee/react-native')).default;
        const { EventType } = await import('@notifee/react-native');

        notifee.onForegroundEvent(({ type, detail }) => {
          if (type === EventType.PRESS && detail.notification?.data) {
            navigateFromNotification(
              parseNotificationData(detail.notification.data as Record<string, unknown>),
              router
            );
          }
        });
      }
    } catch (err) {
      console.warn('[push] setupNotificationResponseHandlers failed:', err);
      handlersSetup = false;
    }
  })();
}

export async function registerPushTokenWithBackend(): Promise<void> {
  if (!isPushAvailableInCurrentRuntime()) return;

  try {
    const status = await getPushPermissionStatus();
    if (status !== 'granted') return;

    const Notifications = await import('expo-notifications');
    await ensureLegacyExpoChannels(Notifications);
    await ensureNotifeeChannels();

    const tokenResult = await Notifications.getDevicePushTokenAsync();
    const token = tokenResult.data;
    if (!token) return;

    await registerDeviceToken({
      token,
      platform: getPushPlatform(),
    });
  } catch (err) {
    console.warn('[push] Failed to register device token:', err);
  }
}

export async function getPushPermissionStatus(): Promise<PushPermissionStatus> {
  if (!isPushAvailableInCurrentRuntime()) return 'undetermined';

  try {
    const Notifications = await import('expo-notifications');
    const settings = await Notifications.getPermissionsAsync();
    if (settings.granted || settings.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL) {
      return 'granted';
    }
    if (settings.canAskAgain === false) return 'denied';
    return 'undetermined';
  } catch {
    return 'undetermined';
  }
}

export async function requestPushPermission(): Promise<PushPermissionStatus> {
  if (!isPushAvailableInCurrentRuntime()) return 'denied';

  try {
    const Notifications = await import('expo-notifications');
    await ensureLegacyExpoChannels(Notifications);
    await ensureNotifeeChannels();

    const result = await Notifications.requestPermissionsAsync();
    const granted =
      result.granted || result.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;

    const prefs = await getNotificationDevicePrefs();
    await saveNotificationDevicePrefs({
      ...prefs,
      pushPermissionAsked: true,
      pushPermissionDismissed: !granted,
    });

    if (granted) {
      await registerPushTokenWithBackend();
    }

    return granted ? 'granted' : 'denied';
  } catch {
    const prefs = await getNotificationDevicePrefs();
    await saveNotificationDevicePrefs({ ...prefs, pushPermissionAsked: true });
    return 'denied';
  }
}

export async function shouldShowPushPermissionSheet(): Promise<boolean> {
  if (!isPushAvailableInCurrentRuntime()) return false;

  const prefs = await getNotificationDevicePrefs();
  if (prefs.pushPermissionAsked || prefs.pushPermissionDismissed) return false;
  const status = await getPushPermissionStatus();
  return status !== 'granted';
}
