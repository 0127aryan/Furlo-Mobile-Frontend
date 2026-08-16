import Constants from 'expo-constants';

import { clearTokens, getAccessToken } from '@/lib/secureStore';
import { useAuthStore } from '@/store/useAuthStore';

function getApiBaseUrl(): string {
  return (
    process.env.EXPO_PUBLIC_API_URL ||
    (Constants.expoConfig?.extra?.apiUrl as string | undefined) ||
    'http://10.0.2.2:4000'
  );
}

interface FetchOptions extends RequestInit {
  json?: unknown;
  skipAuth?: boolean;
  skipUnauthorizedClear?: boolean;
}

export async function apiFetch<T = unknown>(path: string, options: FetchOptions = {}): Promise<T> {
  const { json, skipAuth, skipUnauthorizedClear, headers: initHeaders, ...rest } = options;
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

  if (response.status === 401 && !skipUnauthorizedClear) {
    await clearTokens();
    useAuthStore.getState().clearAuth();
  }

  if (!response.ok) {
    let errorMessage = 'An error occurred while fetching data.';
    try {
      const errorData = (await response.json()) as { error?: string };
      errorMessage = errorData.error || errorMessage;
    } catch {
      errorMessage = response.statusText || errorMessage;
    }
    throw new Error(errorMessage);
  }

  const contentType = response.headers.get('Content-Type');
  if (contentType && contentType.includes('application/json')) {
    return response.json() as Promise<T>;
  }

  return (await response.text()) as unknown as T;
}

export { getApiBaseUrl };
