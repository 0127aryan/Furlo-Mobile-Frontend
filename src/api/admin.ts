import { apiFetch } from '@/api/client';
import type {
  AdminBannerItem,
  AdminBannerStyle,
  AdminBroadcastAudience,
  AdminBroadcastHistoryItem,
  AdminCommunityItem,
  AdminPetItem,
  AdminRecentPet,
  AdminReportAction,
  AdminReportItem,
  AdminStats,
  AdminUserItem,
} from '@/types/admin';

export function getAdminStats() {
  return apiFetch<{ stats: AdminStats; recentPets: AdminRecentPet[] }>('/admin/stats');
}

export function getAdminReports() {
  return apiFetch<{ reports: AdminReportItem[] }>('/admin/reports');
}

export function postAdminReportAction(reportId: string, action: AdminReportAction) {
  return apiFetch<{ success: boolean; message: string }>(`/admin/reports/${reportId}/action`, {
    method: 'POST',
    json: { action },
  });
}

export function getAdminCommunitiesPending() {
  return apiFetch<{ communities: AdminCommunityItem[] }>('/admin/communities/pending');
}

export function approveAdminCommunity(id: string) {
  return apiFetch<{ success: boolean; community: AdminCommunityItem }>(
    `/admin/communities/${id}/approve`,
    { method: 'POST' }
  );
}

export function rejectAdminCommunity(id: string, reason: string) {
  return apiFetch<{ success: boolean; community: AdminCommunityItem }>(
    `/admin/communities/${id}/reject`,
    { method: 'POST', json: { reason } }
  );
}

export function suspendAdminCommunity(id: string, suspended: boolean) {
  return apiFetch<{ success: boolean; community: AdminCommunityItem }>(
    `/admin/communities/${id}/suspend`,
    { method: 'POST', json: { suspended } }
  );
}

export function deleteAdminCommunity(id: string) {
  return apiFetch<{ success: boolean; communityId: string }>(`/admin/communities/${id}`, {
    method: 'DELETE',
  });
}

export function getAdminPets(search = '', filter: 'all' | 'verified' | 'founding' = 'all') {
  const query = new URLSearchParams();
  if (search) query.set('search', search);
  query.set('filter', filter);
  return apiFetch<{ pets: AdminPetItem[]; totalCount: number }>(`/admin/pets?${query.toString()}`);
}

export function updateAdminPetBadges(petId: string, isVerified: boolean, isFoundingPet: boolean) {
  return apiFetch<{ success: boolean; pet: AdminPetItem }>(`/admin/pets/${petId}/badges`, {
    method: 'POST',
    json: { isVerified, isFoundingPet },
  });
}

export function updateAdminPetStatus(petId: string, status: 'active' | 'suspended' | 'deleted') {
  return apiFetch<{ success: boolean; pet: AdminPetItem }>(`/admin/pets/${petId}/status`, {
    method: 'POST',
    json: { status },
  });
}

export function getAdminUsers(search = '', filter: 'all' | 'active' | 'suspended' | 'admin' | 'deleted' = 'all') {
  const query = new URLSearchParams();
  if (search) query.set('search', search);
  query.set('filter', filter);
  return apiFetch<{ users: AdminUserItem[]; totalCount: number }>(`/admin/users?${query.toString()}`);
}

export function updateAdminUserStatus(
  userId: string,
  body: { status?: 'active' | 'suspended' | 'deleted'; isAdmin?: boolean }
) {
  return apiFetch<{ success: boolean; user: AdminUserItem }>(`/admin/users/${userId}/status`, {
    method: 'POST',
    json: body,
  });
}

export function getActiveBanner() {
  return apiFetch<{ banner: AdminBannerItem | null }>('/admin/banners/active', { skipAuth: true });
}

export function getAdminBanners() {
  return apiFetch<{ banners: AdminBannerItem[] }>('/admin/banners');
}

export function createAdminBanner(body: {
  text: string;
  linkUrl?: string;
  ctaText?: string;
  styleType: AdminBannerStyle;
  isActive: boolean;
}) {
  return apiFetch<{ success: boolean; banner: AdminBannerItem }>('/admin/banners', {
    method: 'POST',
    json: body,
  });
}

export function toggleAdminBanner(id: string, isActive: boolean) {
  return apiFetch<{ success: boolean; banner: AdminBannerItem }>(`/admin/banners/${id}/toggle`, {
    method: 'POST',
    json: { isActive },
  });
}

export function deleteAdminBanner(id: string) {
  return apiFetch<{ success: boolean }>(`/admin/banners/${id}`, { method: 'DELETE' });
}

export function getAdminBroadcastHistory() {
  return apiFetch<{ history: AdminBroadcastHistoryItem[] }>('/admin/broadcast/history');
}

export function sendAdminBroadcast(body: {
  title: string;
  body: string;
  linkUrl?: string;
  targetAudience: AdminBroadcastAudience | string;
}) {
  return apiFetch<{ success: boolean; recipientCount: number; message: string }>('/admin/broadcast', {
    method: 'POST',
    json: body,
  });
}

export function revokeAdminBroadcast(id: string) {
  return apiFetch<{ success: boolean; message: string }>(`/admin/broadcast/${id}`, {
    method: 'DELETE',
  });
}
