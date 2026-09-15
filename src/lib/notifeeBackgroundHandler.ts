import Constants from 'expo-constants';
import { Platform } from 'react-native';

import { buildNotificationPath, parseNotificationData } from '@/lib/notificationNavigation';
import { setPendingNotificationRoute } from '@/lib/pendingNotificationRoute';

if (Platform.OS === 'android' && Constants.appOwnership !== 'expo') {
  void import('@notifee/react-native').then(({ default: notifee, EventType }) => {
    notifee.onBackgroundEvent(async ({ type, detail }) => {
      if (type !== EventType.PRESS || !detail.notification?.data) return;
      const data = parseNotificationData(detail.notification.data as Record<string, unknown>);
      setPendingNotificationRoute(buildNotificationPath(data));
    });
  });
}
