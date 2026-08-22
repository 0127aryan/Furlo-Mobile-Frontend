import { create } from 'zustand';

import type { WagItem } from '@/types/api';

export type FollowEvent = {
  targetPetId: string;
  followerPetId: string;
  following: boolean;
  packMembersCount: number;
  followingCount: number;
};

type PetCounts = {
  packMembersCount?: number;
  followingCount?: number;
};

interface PetSocialState {
  counts: Record<string, PetCounts>;
  lastEvent: FollowEvent | null;
  waggedTargets: Record<string, boolean>;
  incomingWags: WagItem[];
  setCounts: (petId: string, counts: PetCounts) => void;
  applyFollow: (event: FollowEvent) => void;
  markWagged: (targetPetId: string) => void;
  setIncomingWags: (wags: WagItem[]) => void;
  prependWag: (wag: WagItem) => void;
}

export const usePetSocialStore = create<PetSocialState>((set) => ({
  counts: {},
  lastEvent: null,
  waggedTargets: {},
  incomingWags: [],
  setCounts: (petId, counts) =>
    set((state) => ({
      counts: {
        ...state.counts,
        [petId]: { ...state.counts[petId], ...counts },
      },
    })),
  applyFollow: (event) =>
    set((state) => ({
      lastEvent: event,
      counts: {
        ...state.counts,
        [event.targetPetId]: {
          ...state.counts[event.targetPetId],
          packMembersCount: event.packMembersCount,
        },
        [event.followerPetId]: {
          ...state.counts[event.followerPetId],
          followingCount: event.followingCount,
        },
      },
    })),
  markWagged: (targetPetId) =>
    set((state) => ({
      waggedTargets: { ...state.waggedTargets, [targetPetId]: true },
    })),
  setIncomingWags: (wags) => set({ incomingWags: wags }),
  prependWag: (wag) =>
    set((state) => ({
      incomingWags: state.incomingWags.some((item) => item.id === wag.id)
        ? state.incomingWags
        : [wag, ...state.incomingWags],
    })),
}));
