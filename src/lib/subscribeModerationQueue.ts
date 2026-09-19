import type { RealtimeChannel } from '@supabase/supabase-js';

import { getAccessToken, getRefreshToken } from '@/lib/secureStore';
import { getSupabase } from '@/lib/supabase';

export interface ModerationEventPayload {
  type: 'report_created' | 'report_action';
  reportId?: string;
  action?: string;
  targetType?: string;
  targetId?: string;
  report?: Record<string, unknown>;
}

type ModerationListener = (payload: ModerationEventPayload) => void;

const moderationListeners = new Set<ModerationListener>();
let moderationChannel: RealtimeChannel | null = null;
let channelPromise: Promise<void> | null = null;

export function subscribeModerationQueue(listener: ModerationListener): () => void {
  moderationListeners.add(listener);

  if (!moderationChannel && !channelPromise) {
    initModerationSubscription().catch((err) => {
      console.error('[subscribeModerationQueue] Failed to init realtime channel:', err);
    });
  }

  return () => {
    moderationListeners.delete(listener);
  };
}

async function initModerationSubscription() {
  channelPromise = (async () => {
    const supabase = await getSupabase();
    if (!supabase) return;

    const access_token = await getAccessToken();
    const refresh_token = await getRefreshToken();
    if (access_token && refresh_token) {
      await supabase.auth.setSession({ access_token, refresh_token });
    }

    const existing = supabase.getChannels().find((item) => item.topic === 'realtime:moderation-queue');
    if (existing) {
      await supabase.removeChannel(existing);
    }

    moderationChannel = supabase
      .channel('moderation-queue', {
        config: { broadcast: { ack: false, self: true } },
      })
      .on('broadcast', { event: 'report_created' }, ({ payload }) => {
        const row = payload as { report?: Record<string, unknown> };
        handleModerationEvent({
          type: 'report_created',
          report: row?.report,
          reportId: typeof row?.report?.id === 'string' ? row.report.id : undefined,
        });
      })
      .on('broadcast', { event: 'report_action' }, ({ payload }) => {
        const row = payload as {
          reportId?: string;
          action?: string;
          targetType?: string;
          targetId?: string;
        };
        handleModerationEvent({
          type: 'report_action',
          reportId: row?.reportId,
          action: row?.action,
          targetType: row?.targetType,
          targetId: row?.targetId,
        });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reports' }, (payload) => {
        const newRow = payload.new as Record<string, unknown> | undefined;
        const eventType = payload.eventType as string;
        handleModerationEvent({
          type: eventType === 'INSERT' ? 'report_created' : 'report_action',
          reportId: typeof newRow?.id === 'string' ? newRow.id : undefined,
          action: typeof newRow?.action_taken === 'string' ? newRow.action_taken : undefined,
          report: newRow,
        });
      })
      .subscribe();
  })();

  try {
    await channelPromise;
  } finally {
    channelPromise = null;
  }
}

function handleModerationEvent(payload: ModerationEventPayload) {
  moderationListeners.forEach((fn) => fn(payload));
}
