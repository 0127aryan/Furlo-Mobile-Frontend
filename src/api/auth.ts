import { apiFetch } from '@/api/client';
import { clearTokens, getAccessToken, getRefreshToken, setTokens } from '@/lib/secureStore';
import { useAuthStore } from '@/store/useAuthStore';
import type {
  AuthContext,
  AuthSession,
  CompleteOnboardingBody,
  Community,
  LoginResponse,
  Pet,
  SignupResponse,
} from '@/types/api';

async function persistSession(session?: AuthSession | null) {
  if (session?.access_token) {
    await setTokens(session.access_token, session.refresh_token);
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
  if (data.activePet !== undefined) useAuthStore.getState().setActivePet(data.activePet);
  return data;
}

export async function getMe(options?: { skipUnauthorizedClear?: boolean }) {
  const data = await apiFetch<AuthContext>('/auth/me', options);
  useAuthStore.getState().setUser(data.user);
  useAuthStore.getState().setActivePet(data.activePet);
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
  } catch {
    if (!refresh) {
      await clearTokens();
      useAuthStore.getState().clearAuth();
      return null;
    }
    try {
      await refreshSession();
      return await getMe();
    } catch {
      await clearTokens();
      useAuthStore.getState().clearAuth();
      return null;
    }
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
