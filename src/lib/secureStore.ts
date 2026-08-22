import * as SecureStore from 'expo-secure-store';

const ACCESS_TOKEN_KEY = 'furlo_access_token';
const REFRESH_TOKEN_KEY = 'furlo_refresh_token';
const AUTH_CACHE_KEY = 'furlo_auth_cache';

/** Android SecureStore rejects values over ~2048 bytes; JWTs can exceed that. */
const CHUNK_SIZE = 1800;

async function setSecureItem(key: string, value: string): Promise<void> {
  const chunks = Math.ceil(value.length / CHUNK_SIZE) || 1;
  await SecureStore.setItemAsync(`${key}_n`, String(chunks));
  for (let i = 0; i < chunks; i += 1) {
    await SecureStore.setItemAsync(`${key}_${i}`, value.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE));
  }
  await SecureStore.deleteItemAsync(key);
}

async function getSecureItem(key: string): Promise<string | null> {
  const countRaw = await SecureStore.getItemAsync(`${key}_n`);
  if (countRaw) {
    const count = Number(countRaw);
    const parts: string[] = [];
    for (let i = 0; i < count; i += 1) {
      parts.push((await SecureStore.getItemAsync(`${key}_${i}`)) ?? '');
    }
    const joined = parts.join('');
    return joined.length > 0 ? joined : null;
  }
  return SecureStore.getItemAsync(key);
}

async function deleteSecureItem(key: string): Promise<void> {
  const countRaw = await SecureStore.getItemAsync(`${key}_n`);
  if (countRaw) {
    const count = Number(countRaw);
    await SecureStore.deleteItemAsync(`${key}_n`).catch(() => undefined);
    for (let i = 0; i < count; i += 1) {
      await SecureStore.deleteItemAsync(`${key}_${i}`).catch(() => undefined);
    }
  }
  await SecureStore.deleteItemAsync(key).catch(() => undefined);
}

export async function getAccessToken(): Promise<string | null> {
  return getSecureItem(ACCESS_TOKEN_KEY);
}

export async function getRefreshToken(): Promise<string | null> {
  return getSecureItem(REFRESH_TOKEN_KEY);
}

export async function setTokens(accessToken: string, refreshToken?: string | null): Promise<void> {
  await setSecureItem(ACCESS_TOKEN_KEY, accessToken);
  if (refreshToken) {
    await setSecureItem(REFRESH_TOKEN_KEY, refreshToken);
  }
}

export async function clearTokens(): Promise<void> {
  await deleteSecureItem(ACCESS_TOKEN_KEY);
  await deleteSecureItem(REFRESH_TOKEN_KEY);
  await deleteSecureItem(AUTH_CACHE_KEY);
}

export async function setAuthCache(value: string): Promise<void> {
  await setSecureItem(AUTH_CACHE_KEY, value);
}

export async function getAuthCache(): Promise<string | null> {
  return getSecureItem(AUTH_CACHE_KEY);
}
