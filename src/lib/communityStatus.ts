import type { Community } from '@/types/api';

export function isVerifiedCommunity(pack: Pick<Community, 'is_verified' | 'is_approved' | 'status'>) {
  return pack.is_verified === true || pack.is_approved === true || pack.status === 'approved';
}

export function isPendingCommunity(pack: Pick<Community, 'is_verified' | 'is_approved' | 'status'>) {
  return !isVerifiedCommunity(pack);
}

export function isPackJoined(pack: Pick<Community, 'joined' | 'is_joined'>) {
  return pack.joined === true || pack.is_joined === true;
}

export const DEFAULT_PACK_RULES = [
  'Be kind and respectful to all pet parents and pets in the pack.',
  'Keep posts relevant to pack topics, meetups, and pet care.',
  'No commercial spam or unauthorized product sales without mod approval.',
  'Always practice safe, supervised play during offline meetups! 🐾',
];
