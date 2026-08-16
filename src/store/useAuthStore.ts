import { create } from 'zustand';

import type { OnboardingData, Pet, User } from '@/types/api';
import type { AccountRole } from '@/lib/role';

interface AuthState {
  user: User | null;
  activePet: Pet | null;
  role: AccountRole | null;
  onboardingData: OnboardingData | null;
  isHydrated: boolean;
  setUser: (user: User | null) => void;
  setActivePet: (pet: Pet | null) => void;
  setRole: (role: AccountRole | null) => void;
  setOnboardingData: (data: Partial<OnboardingData> | null) => void;
  setHydrated: (isHydrated: boolean) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  activePet: null,
  role: null,
  onboardingData: null,
  isHydrated: false,
  setUser: (user) => set({ user }),
  setActivePet: (pet) => set({ activePet: pet }),
  setRole: (role) => set({ role }),
  setOnboardingData: (data) =>
    set((state) => ({
      onboardingData: data
        ? { ...(state.onboardingData || { role: null }), ...data }
        : null,
    })),
  setHydrated: (isHydrated) => set({ isHydrated }),
  clearAuth: () => set({ user: null, activePet: null, role: null, onboardingData: null }),
}));
