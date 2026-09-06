import { apiFetch } from '@/api/client';
import type { Community, CommunityHub } from '@/types/api';

const ALL_PACKS = 'All Packs';

function normalizeCommunity(pack: Community): Community {
  const joined = pack.joined ?? pack.is_joined ?? false;
  return { ...pack, joined, is_joined: pack.is_joined ?? joined };
}

function normalizeCommunities(payload: unknown): Community[] {
  const raw = Array.isArray(payload)
    ? payload
    : payload && typeof payload === 'object' && Array.isArray((payload as { communities?: Community[] }).communities)
      ? (payload as { communities: Community[] }).communities
      : [];
  return raw.map(normalizeCommunity);
}

function normalizeCategories(payload: unknown): string[] {
  const raw = Array.isArray(payload)
    ? payload
    : payload && typeof payload === 'object' && Array.isArray((payload as { categories?: unknown }).categories)
      ? (payload as { categories: unknown[] }).categories
      : [];
  const labels = raw.map((item) => String(item || '').trim()).filter(Boolean);
  if (labels.length === 0) return [ALL_PACKS];
  if (labels.some((label) => label.toLowerCase() === ALL_PACKS.toLowerCase())) return labels;
  return [ALL_PACKS, ...labels];
}

export function getCommunityCategories() {
  return apiFetch<unknown>('/communities/categories').then(normalizeCategories);
}

export async function listCommunities(params?: { q?: string; category?: string; petId?: string }) {
  const search = new URLSearchParams();
  if (params?.q) search.set('q', params.q);
  if (params?.category && params.category.toLowerCase() !== 'all packs' && params.category.toLowerCase() !== 'all') {
    search.set('category', params.category);
  }
  if (params?.petId) search.set('petId', params.petId);
  const query = search.toString();
  const data = await apiFetch<unknown>(`/communities${query ? `?${query}` : ''}`);
  return normalizeCommunities(data);
}

export async function listMyCommunities(petId?: string) {
  const query = petId ? `?petId=${encodeURIComponent(petId)}` : '';
  const data = await apiFetch<unknown>(`/communities/mine${query}`);
  return normalizeCommunities(data);
}

export async function fetchCommunity(slug: string, petId?: string) {
  const query = petId ? `?petId=${encodeURIComponent(petId)}` : '';
  const data = await apiFetch<CommunityHub & { isJoined?: boolean }>(
    `/communities/${encodeURIComponent(slug)}${query}`,
  );
  const joined = data.joined ?? data.isJoined ?? data.community?.joined ?? data.community?.is_joined ?? false;
  return {
    ...data,
    joined,
    community: data.community ? normalizeCommunity({ ...data.community, joined }) : data.community,
  } as CommunityHub;
}

export async function toggleJoin(communityId: string, petId: string) {
  const data = await apiFetch<{
    success: boolean;
    joined?: boolean;
    is_joined?: boolean;
    isJoined?: boolean;
    member_count?: number;
    memberCount?: number;
  }>(`/communities/${encodeURIComponent(communityId)}/join`, {
    method: 'POST',
    json: { petId },
  });
  return {
    joined: data.joined ?? data.is_joined ?? data.isJoined ?? false,
    member_count: data.member_count ?? data.memberCount ?? 0,
  };
}

export function createCommunity(body: {
  petId: string;
  name: string;
  category: string;
  city?: string;
  description: string;
  coverData?: string;
}) {
  return apiFetch<{ success: boolean; community: Community }>('/communities/create', {
    method: 'POST',
    json: {
      ...body,
      city: body.city,
      location_city: body.city,
      coverData: body.coverData,
      cover_image_url: body.coverData,
    },
  });
}

export const getCommunities = listCommunities;
export const getMyCommunities = listMyCommunities;
export const getCommunity = fetchCommunity;
export const joinCommunity = toggleJoin;
