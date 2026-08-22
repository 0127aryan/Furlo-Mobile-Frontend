import { apiFetch, ApiError, refreshAccessToken } from '@/api/client';
import { roleFromPet } from '@/lib/role';
import {
  clearTokens,
  getAccessToken,
  getAuthCache,
  getRefreshToken,
  setAuthCache,
  setTokens,
} from '@/lib/secureStore';
import { useAuthStore } from '@/store/useAuthStore';
import type {
  AuthContext,
  AuthSession,
  CompleteOnboardingBody,
  Community,
  LoginResponse,
  PackMember,
  Pet,
  PetProfileStats,
  Post,
  SignupResponse,
  WagItem,
} from '@/types/api';

async function persistSession(session?: AuthSession | null) {
  if (session?.access_token) {
    await setTokens(session.access_token, session.refresh_token);
  }
}

async function persistAuthCache() {
  const { user, activePet, role } = useAuthStore.getState();
  await setAuthCache(JSON.stringify({ user, activePet, role }));
}

async function hydrateFromCache(): Promise<AuthContext | null> {
  try {
    const raw = await getAuthCache();
    if (!raw) return null;
    const cached = JSON.parse(raw) as AuthContext & { role?: string | null };
    if (!cached?.user) return null;
    useAuthStore.getState().setUser(cached.user);
    useAuthStore.getState().setActivePet(cached.activePet ?? null);
    useAuthStore.getState().setRole(cached.role ? (cached.role as ReturnType<typeof roleFromPet>) : roleFromPet(cached.activePet));
    return { user: cached.user, activePet: cached.activePet ?? null };
  } catch {
    return null;
  }
}

export async function signup(email: string, password: string) {
  const data = await apiFetch<SignupResponse>('/auth/signup', {
    method: 'POST',
    json: { email, password },
    skipAuth: true,
  });
  await persistSession(data.session);
  if (data.session?.access_token) {
    try {
      await getMe();
    } catch {
      // Verification-required signups may not have a usable session yet.
    }
  }
  return data;
}

export async function login(email: string, password: string) {
  const data = await apiFetch<LoginResponse>('/auth/login', {
    method: 'POST',
    json: { email, password },
    skipAuth: true,
  });
  await persistSession(data.session);
  if (data.user) useAuthStore.getState().setUser(data.user);
  if (data.activePet !== undefined) {
    useAuthStore.getState().setActivePet(data.activePet);
    useAuthStore.getState().setRole(roleFromPet(data.activePet));
  }
  await persistAuthCache();
  return data;
}

export async function getMe(options?: { skipUnauthorizedClear?: boolean }) {
  const data = await apiFetch<AuthContext>('/auth/me', options);
  useAuthStore.getState().setUser(data.user);
  useAuthStore.getState().setActivePet(data.activePet);
  useAuthStore.getState().setRole(roleFromPet(data.activePet));
  await persistAuthCache();
  return data;
}

export async function refreshSession() {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) {
    throw new Error('No refresh token');
  }
  const data = await apiFetch<{ session: AuthSession }>('/auth/refresh', {
    method: 'POST',
    json: { refresh_token: refreshToken },
    skipAuth: true,
  });
  await persistSession(data.session);
  return data.session;
}

export async function restoreSession(): Promise<AuthContext | null> {
  const access = await getAccessToken();
  const refresh = await getRefreshToken();
  if (!access && !refresh) {
    return null;
  }

  try {
    return await getMe({ skipUnauthorizedClear: true });
  } catch (err) {
    const status = err instanceof ApiError ? err.status : 0;
    const isUnauthorized = status === 401;

    if (isUnauthorized && refresh) {
      try {
        await refreshSession();
        return await getMe({ skipUnauthorizedClear: true });
      } catch (refreshErr) {
        const refreshStatus = refreshErr instanceof ApiError ? refreshErr.status : 0;
        if (refreshStatus === 401) {
          await clearTokens();
          useAuthStore.getState().clearAuth();
          return null;
        }
        return hydrateFromCache();
      }
    }

    if (isUnauthorized && !refresh) {
      await clearTokens();
      useAuthStore.getState().clearAuth();
      return null;
    }

    return hydrateFromCache();
  }
}

export async function ensureSession(): Promise<void> {
  const access = await getAccessToken();
  const refresh = await getRefreshToken();
  if (!access && !refresh) return;
  try {
    await getMe({ skipUnauthorizedClear: true });
  } catch (err) {
    const status = err instanceof ApiError ? err.status : 0;
    if (status === 401) {
      const refreshed = await refreshAccessToken();
      if (refreshed) {
        await getMe({ skipUnauthorizedClear: true }).catch(() => hydrateFromCache());
        return;
      }
      await clearTokens();
      useAuthStore.getState().clearAuth();
      return;
    }
    await hydrateFromCache();
  }
}

export async function logout() {
  try {
    await apiFetch('/auth/logout', { method: 'POST' });
  } finally {
    await clearTokens();
    useAuthStore.getState().clearAuth();
  }
}

export function checkUsername(username: string) {
  return apiFetch<{ available: boolean }>(
    `/auth/check-username?username=${encodeURIComponent(username)}`,
    { skipAuth: true }
  );
}

export function getCommunities() {
  return apiFetch<Community[]>('/auth/communities', { skipAuth: true });
}

export function getSpeciesVerbs() {
  return apiFetch('/auth/species-verbs', { skipAuth: true });
}

export function completeOnboarding(body: CompleteOnboardingBody) {
  return apiFetch<{ message: string; pet: Pet }>('/auth/complete-onboarding', {
    method: 'POST',
    json: body,
  });
}

export function resendConfirmation(email: string) {
  return apiFetch('/auth/resend-confirmation', {
    method: 'POST',
    json: { email },
    skipAuth: true,
  });
}

export function checkVerification(email: string) {
  return apiFetch<{ verified: boolean; exists?: boolean }>(
    `/auth/check-verification?email=${encodeURIComponent(email)}`,
    { skipAuth: true }
  );
}

export function getSupabaseConfig() {
  return apiFetch<{ supabaseUrl: string; supabaseAnonKey: string }>('/auth/supabase-config', {
    skipAuth: true,
  });
}

export function getPetProfile(petId: string, viewerPetId?: string) {
  const query = viewerPetId ? `?viewerPetId=${encodeURIComponent(viewerPetId)}` : '';
  return apiFetch<{ pet: Pet; posts: Post[]; stats?: PetProfileStats }>(
    `/auth/pet/${encodeURIComponent(petId)}${query}`
  );
}

export function updatePetProfile(body: {
  petId: string;
  name: string;
  username: string;
  breed: string;
  city: string;
  bio: string;
  personalityTags: string[];
  avatarData?: string;
  removeAvatar?: boolean;
}) {
  return apiFetch<{ pet: Pet }>('/auth/update-pet-profile', {
    method: 'PUT',
    json: body,
  });
}

export async function followPet(targetPetId: string, followerPetId: string) {
  const data = await apiFetch<{
    success?: boolean;
    following?: boolean;
    isFollowing?: boolean;
    packMembersCount: number;
    followingCount?: number;
    targetPetId?: string;
    followerPetId?: string;
  }>('/auth/follow-pet', {
    method: 'POST',
    json: { targetPetId, followerPetId },
  });
  return {
    following: data.following ?? data.isFollowing ?? false,
    packMembersCount: data.packMembersCount ?? 0,
    followingCount: data.followingCount ?? 0,
    targetPetId: data.targetPetId ?? targetPetId,
    followerPetId: data.followerPetId ?? followerPetId,
  };
}

export function sendWag(targetPetId: string, senderPetId: string) {
  return apiFetch<{ success: boolean; message: string }>('/auth/send-wag', {
    method: 'POST',
    json: { targetPetId, senderPetId },
  });
}

export async function getReceivedWags(petId?: string) {
  const query = petId ? `?petId=${encodeURIComponent(petId)}` : '';
  const data = await apiFetch<{ wags?: WagItem[] }>(`/auth/wags${query}`);
  return data.wags || [];
}

function normalizePackMembers(data: {
  members?: PackMember[];
  packMembers?: PackMember[];
  following?: PackMember[];
  count?: number;
}) {
  const members = (data.members ?? data.packMembers ?? data.following ?? []).filter(
    (member): member is PackMember => Boolean(member?.id)
  );
  return { members, count: data.count ?? members.length };
}

export async function getPackMembers(petId: string) {
  const data = await apiFetch<{
    members?: PackMember[];
    packMembers?: PackMember[];
    following?: PackMember[];
    count?: number;
  }>(`/auth/pet/${encodeURIComponent(petId)}/pack-members`);
  return normalizePackMembers(data);
}

export async function getFollowingPets(petId: string) {
  const data = await apiFetch<{
    members?: PackMember[];
    packMembers?: PackMember[];
    following?: PackMember[];
    count?: number;
  }>(`/auth/pet/${encodeURIComponent(petId)}/following`);
  return normalizePackMembers(data);
}
