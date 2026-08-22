import Constants from 'expo-constants';

import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  setTokens,
} from '@/lib/secureStore';
import { useAuthStore } from '@/store/useAuthStore';

function getApiBaseUrl(): string {
  return (
    process.env.EXPO_PUBLIC_API_URL ||
    (Constants.expoConfig?.extra?.apiUrl as string | undefined) ||
    'http://10.0.2.2:4000'
  );
}

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

interface FetchOptions extends RequestInit {
  json?: unknown;
  skipAuth?: boolean;
  skipUnauthorizedClear?: boolean;
  _retry?: boolean;
}

let refreshInFlight: Promise<boolean> | null = null;

async function refreshAccessToken(): Promise<boolean> {
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    const refreshToken = await getRefreshToken();
    if (!refreshToken) return false;

    try {
      const response = await fetch(`${getApiBaseUrl()}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
      if (!response.ok) return false;
      const data = (await response.json()) as {
        session?: { access_token?: string; refresh_token?: string | null };
      };
      if (!data.session?.access_token) return false;
      await setTokens(data.session.access_token, data.session.refresh_token);
      return true;
    } catch {
      return false;
    }
  })();

  try {
    return await refreshInFlight;
  } finally {
    refreshInFlight = null;
  }
}

async function readErrorMessage(response: Response): Promise<string> {
  let errorMessage = 'An error occurred while fetching data.';
  try {
    const errorData = (await response.json()) as { error?: string };
    errorMessage = errorData.error || errorMessage;
  } catch {
    errorMessage = response.statusText || errorMessage;
  }
  return errorMessage;
}

export async function apiFetch<T = unknown>(path: string, options: FetchOptions = {}): Promise<T> {
  const { json, skipAuth, skipUnauthorizedClear, _retry, headers: initHeaders, ...rest } = options;
  const url = `${getApiBaseUrl()}${path}`;

  const headers = new Headers(initHeaders);
  if (json !== undefined && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (!skipAuth && !headers.has('Authorization')) {
    const token = await getAccessToken();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  const response = await fetch(url, {
    ...rest,
    headers,
    body: json !== undefined ? JSON.stringify(json) : rest.body,
  });

  if (response.status === 401 && !skipAuth && !skipUnauthorizedClear && !_retry) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      return apiFetch<T>(path, { ...options, _retry: true });
    }
    await clearTokens();
    useAuthStore.getState().clearAuth();
  }

  if (!response.ok) {
    throw new ApiError(await readErrorMessage(response), response.status);
  }

  const contentType = response.headers.get('Content-Type');
  if (contentType && contentType.includes('application/json')) {
    return response.json() as Promise<T>;
  }

  return (await response.text()) as unknown as T;
}

export { getApiBaseUrl, refreshAccessToken };
