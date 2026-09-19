import type { RealtimeChannel } from '@supabase/supabase-js';

import { getAccessToken, getRefreshToken } from '@/lib/secureStore';
import { getSupabase } from '@/lib/supabase';

export type ActiveBanner = {
  id: string;
  text: string;
  link_url?: string | null;
  cta_text?: string | null;
  style_type: 'orange' | 'emerald' | 'amber' | string;
  is_active?: boolean;
};

type BannerListener = (banner: ActiveBanner | null) => void;

const listeners = new Set<BannerListener>();
let channel: RealtimeChannel | null = null;
let channelPromise: Promise<void> | null = null;

function asBanner(value: unknown): ActiveBanner | null {
  if (!value || typeof value !== 'object') return null;
  const row = value as ActiveBanner;
  if (!row.id || !row.text) return null;
  if (row.is_active === false) return null;
  return row;
}

function handleBanner(banner: ActiveBanner | null) {
  listeners.forEach((fn) => fn(banner));
}

export function subscribeBanners(listener: BannerListener): () => void {
  listeners.add(listener);
  if (!channel && !channelPromise) {
    initBannerSubscription().catch((err) => {
      console.error('[subscribeBanners] Failed to init real-time channel:', err);
    });
  }
  return () => {
    listeners.delete(listener);
  };
}

async function initBannerSubscription() {
  channelPromise = (async () => {
    const supabase = await getSupabase();
    if (!supabase) return;

    const access_token = await getAccessToken();
    const refresh_token = await getRefreshToken();
    if (access_token && refresh_token) {
      await supabase.auth.setSession({ access_token, refresh_token });
    }

    const existing = supabase.getChannels().find((item) => item.topic === 'realtime:global-banners');
    if (existing) {
      await supabase.removeChannel(existing);
    }

    channel = supabase
      .channel('global-banners', {
        config: { broadcast: { ack: false, self: true } },
      })
      .on('broadcast', { event: 'banner_update' }, ({ payload }) => {
        handleBanner(asBanner((payload as { banner?: unknown })?.banner));
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'banners' }, (payload) => {
        const eventType = String(payload.eventType || '');
        const row = eventType === 'DELETE' ? payload.old : payload.new;
        if (eventType === 'DELETE' || (row as { is_active?: boolean } | undefined)?.is_active === false) {
          handleBanner(null);
          return;
        }
        handleBanner(asBanner(row));
      })
      .subscribe();
  })();

  try {
    await channelPromise;
  } finally {
    channelPromise = null;
  }
}
