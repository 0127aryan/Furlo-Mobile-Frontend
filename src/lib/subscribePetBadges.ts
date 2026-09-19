import type { RealtimeChannel } from '@supabase/supabase-js';

import { getAccessToken, getRefreshToken } from '@/lib/secureStore';
import { getSupabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';
import type { Pet, Post } from '@/types/api';

export interface PetBadgeUpdatePayload {
  petId: string;
  is_verified: boolean;
  is_founding_pet: boolean;
}

type BadgeListener = (payload: PetBadgeUpdatePayload) => void;

const badgeListeners = new Set<BadgeListener>();
let badgeChannel: RealtimeChannel | null = null;
let channelPromise: Promise<void> | null = null;

export function applyPetBadgeToPosts(posts: Post[], payload: PetBadgeUpdatePayload): Post[] {
  return posts.map((post) => {
    if (post.pets?.id !== payload.petId) return post;
    return {
      ...post,
      pets: {
        ...post.pets,
        is_verified: payload.is_verified,
        is_founding_pet: payload.is_founding_pet,
      },
    };
  });
}

export function applyPetBadgeToPet(pet: Pet | null, payload: PetBadgeUpdatePayload): Pet | null {
  if (!pet || pet.id !== payload.petId) return pet;
  return {
    ...pet,
    is_verified: payload.is_verified,
    is_founding_pet: payload.is_founding_pet,
  };
}

export function subscribePetBadges(listener: BadgeListener): () => void {
  badgeListeners.add(listener);

  if (!badgeChannel && !channelPromise) {
    initBadgeSubscription().catch((err) => {
      console.error('[subscribePetBadges] Failed to init real-time channel:', err);
    });
  }

  return () => {
    badgeListeners.delete(listener);
  };
}

async function initBadgeSubscription() {
  channelPromise = (async () => {
    const supabase = await getSupabase();
    if (!supabase) return;

    const access_token = await getAccessToken();
    const refresh_token = await getRefreshToken();
    if (access_token && refresh_token) {
      await supabase.auth.setSession({ access_token, refresh_token });
    }

    const existing = supabase.getChannels().find((item) => item.topic === 'realtime:pet-social-badges');
    if (existing) {
      await supabase.removeChannel(existing);
    }

    badgeChannel = supabase
      .channel('pet-social-badges', {
        config: { broadcast: { ack: false, self: true } },
      })
      .on('broadcast', { event: 'pet_badge_updated' }, ({ payload }) => {
        const row = payload as Partial<PetBadgeUpdatePayload>;
        if (row?.petId) {
          handleBadgeUpdate({
            petId: String(row.petId),
            is_verified: Boolean(row.is_verified),
            is_founding_pet: Boolean(row.is_founding_pet),
          });
        }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'pets' }, (payload) => {
        const newRow = payload.new as {
          id?: string;
          is_verified?: boolean;
          is_founding_pet?: boolean;
        };
        if (newRow?.id) {
          handleBadgeUpdate({
            petId: String(newRow.id),
            is_verified: Boolean(newRow.is_verified),
            is_founding_pet: Boolean(newRow.is_founding_pet),
          });
        }
      })
      .subscribe();
  })();

  try {
    await channelPromise;
  } finally {
    channelPromise = null;
  }
}

function handleBadgeUpdate(payload: PetBadgeUpdatePayload) {
  const activePet = useAuthStore.getState().activePet;
  if (activePet && activePet.id === payload.petId) {
    useAuthStore.getState().setActivePet({
      ...activePet,
      is_verified: payload.is_verified,
      is_founding_pet: payload.is_founding_pet,
    });
  }

  badgeListeners.forEach((fn) => fn(payload));
}
