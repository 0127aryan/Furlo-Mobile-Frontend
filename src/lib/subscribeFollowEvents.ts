import type { RealtimeChannel } from '@supabase/supabase-js';

import { getAccessToken, getRefreshToken } from '@/lib/secureStore';
import { handleNotificationBroadcast } from '@/lib/subscribeNotifications';
import { getSupabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';
import { usePetSocialStore, type FollowEvent } from '@/store/usePetSocialStore';
import type { WagItem } from '@/types/api';

let started = false;
let channel: RealtimeChannel | null = null;
let setupPromise: Promise<void> | null = null;

function isFollowEvent(payload: unknown): payload is FollowEvent {
  if (!payload || typeof payload !== 'object') return false;
  const row = payload as FollowEvent;
  return Boolean(row.targetPetId && row.followerPetId);
}

function wagFromBroadcast(payload: unknown): WagItem | null {
  if (!payload || typeof payload !== 'object') return null;
  const row = payload as {
    id?: string;
    targetPetId?: string;
    senderPetId?: string;
    senderName?: string;
    senderUsername?: string;
    senderAvatar?: string | null;
    senderBreed?: string;
    created_at?: string;
    message?: string | null;
  };
  if (!row.id || !row.senderPetId) return null;
  return {
    id: row.id,
    created_at: row.created_at || new Date().toISOString(),
    message: row.message,
    sender: {
      id: row.senderPetId,
      name: row.senderName || 'A companion',
      username: row.senderUsername || 'pet',
      breed: row.senderBreed,
      profile_image_url: row.senderAvatar,
    },
  };
}

export function startFollowRealtime(): void {
  if (setupPromise) return;

  setupPromise = (async () => {
    const supabase = await getSupabase();
    if (!supabase) {
      started = false;
      return;
    }

    const access_token = await getAccessToken();
    const refresh_token = await getRefreshToken();
    if (access_token && refresh_token) {
      await supabase.auth.setSession({ access_token, refresh_token });
    }

    const existing = supabase
      .getChannels()
      .find((item) => item.topic === 'realtime:pet-social');
    if (existing) {
      await supabase.removeChannel(existing);
    }

    channel = supabase
      .channel('pet-social', { config: { broadcast: { ack: false, self: true } } })
      .on('broadcast', { event: 'follow' }, ({ payload }) => {
        if (isFollowEvent(payload)) {
          usePetSocialStore.getState().applyFollow(payload);
        }
      })
      .on('broadcast', { event: 'wag' }, ({ payload }) => {
        const row = payload as { targetPetId?: string };
        const myPetId = useAuthStore.getState().activePet?.id;
        if (!myPetId || row.targetPetId !== myPetId) return;
        const wag = wagFromBroadcast(payload);
        if (wag) usePetSocialStore.getState().prependWag(wag);
      })
      .on('broadcast', { event: 'notification' }, ({ payload }) => {
        handleNotificationBroadcast(payload);
      });

    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        started = true;
        return;
      }
      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
        started = false;
        channel = null;
        setupPromise = null;
      }
    });
  })().finally(() => {
    setupPromise = null;
  });
}
