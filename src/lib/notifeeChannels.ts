import Constants from 'expo-constants';
import { Platform } from 'react-native';

export const NOTIFEE_CHANNELS = [
  { id: 'default', name: 'Furlo Alerts', description: 'General Furlo alerts' },
  {
    id: 'furlo_interactions',
    name: 'Interactions & Treats',
    description: 'Treats, comments, and post activity',
  },
  {
    id: 'furlo_qa_advice',
    name: 'Q&A & Advice',
    description: 'Best answers and Q&A updates',
  },
  {
    id: 'furlo_pack_followers',
    name: 'Pack & Followers',
    description: 'Follows, wags, and pack announcements',
  },
] as const;

export type NotifeeChannelId = (typeof NOTIFEE_CHANNELS)[number]['id'];

function isNotifeeAvailable(): boolean {
  return Platform.OS === 'android' && Constants.appOwnership !== 'expo';
}

export function resolveChannelId(type?: string): NotifeeChannelId {
  if (type === 'best_answer' || type === 'qa_answer') return 'furlo_qa_advice';
  if (type === 'treat' || type === 'comment') return 'furlo_interactions';
  if (type === 'follow' || type === 'pack_announcement') return 'furlo_pack_followers';
  return 'default';
}

export async function ensureNotifeeChannels(): Promise<void> {
  if (!isNotifeeAvailable()) return;

  try {
    const notifee = (await import('@notifee/react-native')).default;
    const { AndroidImportance } = await import('@notifee/react-native');

    for (const channel of NOTIFEE_CHANNELS) {
      await notifee.createChannel({
        id: channel.id,
        name: channel.name,
        description: channel.description,
        importance: AndroidImportance.HIGH,
        vibration: true,
      });
    }
  } catch (err) {
    console.warn('[notifee] Failed to create channels:', err);
  }
}
