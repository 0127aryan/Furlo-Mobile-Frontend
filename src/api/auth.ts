import * as WebBrowser from 'expo-web-browser';

import { apiFetch, ApiError, refreshAccessToken } from '@/api/client';
import { roleFromPet } from '@/lib/role';
import {
  clearTokens,
  consumePendingOAuthState,
  getAccessToken,
  getAuthCache,
  getRefreshToken,
  setAuthCache,
  setPendingOAuthState,
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

/** Must match Supabase redirectTo (deep link returns to app; bare HTTPS loads the web site). */
export function getMobileOAuthRedirectUri(): string {
  const fromEnv = process.env.EXPO_PUBLIC_OAUTH_REDIRECT_URL?.trim();
  if (fromEnv) {
    const trimmed = fromEnv.replace(/\/$/, '');
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      const u = new URL(trimmed);
      u.searchParams.set('client', 'mobile');
      return u.toString();
    }
    return trimmed;
  }
  return 'furlo://auth/callback';
}

WebBrowser.maybeCompleteAuthSession();

async function applyLoginResponse(data: LoginResponse) {
  await persistSession(data.session);
  if (data.user) useAuthStore.getState().setUser(data.user);
  if (data.activePet !== undefined) {
    useAuthStore.getState().setActivePet(data.activePet);
    useAuthStore.getState().setRole(roleFromPet(data.activePet));
  }
  await persistAuthCache();
}

export async function verifyEmailOtp(
  email: string,
  token: string,
  password?: string,
) {
  const data = await apiFetch<LoginResponse>('/auth/verify-email-otp', {
    method: 'POST',
    json: {
      email,
      token: token.replace(/\s/g, ''),
      ...(password ? { password } : {}),
    },
    skipAuth: true,
  });
  await applyLoginResponse(data);
  return data;
}

let oauthExchangeInFlight: Promise<LoginResponse> | null = null;
let oauthExchangeInFlightCode: string | null = null;

export async function exchangeOAuthCode(code: string, state?: string) {
  const resolvedState = state?.trim() || (await consumePendingOAuthState());
  if (!resolvedState) {
    throw new Error(
      'Google sign-in session expired. Close this screen and try again from Join.',
    );
  }

  if (oauthExchangeInFlight && oauthExchangeInFlightCode === code) {
    return oauthExchangeInFlight;
  }

  oauthExchangeInFlightCode = code;
  oauthExchangeInFlight = (async () => {
    const data = await apiFetch<LoginResponse>('/auth/oauth/exchange', {
      method: 'POST',
      json: { code, state: resolvedState },
      skipAuth: true,
    });
    await applyLoginResponse(data);
    return data;
  })();

  try {
    return await oauthExchangeInFlight;
  } finally {
    oauthExchangeInFlight = null;
    oauthExchangeInFlightCode = null;
  }
}

function parseOAuthReturnUrl(returnUrl: string): {
  code?: string;
  state?: string;
  error?: string;
} {
  const parsed = new URL(returnUrl);
  const hashParams = parsed.hash
    ? new URLSearchParams(parsed.hash.replace(/^#/, ''))
    : null;

  const code =
    parsed.searchParams.get('code') ?? hashParams?.get('code') ?? undefined;
  const state =
    parsed.searchParams.get('state') ?? hashParams?.get('state') ?? undefined;
  const error =
    parsed.searchParams.get('error_description') ??
    parsed.searchParams.get('error') ??
    hashParams?.get('error_description') ??
    hashParams?.get('error') ??
    undefined;

  return { code: code ?? undefined, state: state ?? undefined, error: error ?? undefined };
}

export async function startGoogleSignIn() {
  const redirectUri = getMobileOAuthRedirectUri();
  const { url, state: oauthState } = await apiFetch<{ url: string; state?: string }>(
    `/auth/oauth/google/url?platform=mobile&redirect_to=${encodeURIComponent(redirectUri)}`,
    { skipAuth: true }
  );

  if (!oauthState) {
    throw new Error('Could not start Google sign-in. Try again in a moment.');
  }
  await setPendingOAuthState(oauthState);

  const result = await WebBrowser.openAuthSessionAsync(url, redirectUri);

  if (result.type !== 'success') {
    throw new Error('Google sign-in was cancelled.');
  }

  const { code, state, error: oauthError } = parseOAuthReturnUrl(result.url);

  if (oauthError) {
    throw new Error(oauthError);
  }
  if (!code) {
    throw new Error('Google sign-in did not return an authorization code.');
  }

  return exchangeOAuthCode(code, state ?? oauthState);
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
  await applyLoginResponse(data);
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
  await ensureSessionForOnboarding().catch(() => hydrateFromCache());
}

/** Restore a valid API session before protected onboarding calls (e.g. complete-onboarding). */
export async function ensureSessionForOnboarding(): Promise<AuthContext> {
  try {
    const me = await getMe({ skipUnauthorizedClear: true });
    if (me?.user) return me;
  } catch (err) {
    const status = err instanceof ApiError ? err.status : 0;
    if (status !== 401) {
      const cached = await hydrateFromCache();
      if (cached?.user) {
        try {
          return await getMe({ skipUnauthorizedClear: true });
        } catch {
          // fall through to re-login
        }
      }
    }
  }

  const refresh = await getRefreshToken();
  if (refresh) {
    try {
      await refreshSession();
      const me = await getMe({ skipUnauthorizedClear: true });
      if (me?.user) return me;
    } catch {
      // fall through
    }
  }

  const ob = useAuthStore.getState().onboardingData;
  if (ob?.email && ob?.password) {
    const res = await login(ob.email, ob.password);
    if (res.user) {
      return { user: res.user, activePet: res.activePet ?? null };
    }
  }

  throw new Error('Please sign in again to finish setup.');
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
  dateOfBirth?: string | null;
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
