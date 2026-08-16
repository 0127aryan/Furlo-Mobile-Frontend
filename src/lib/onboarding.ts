import type { CompleteOnboardingBody, OnboardingData } from '@/types/api';

export function buildCompleteOnboardingBody(
  data: OnboardingData | null,
  packs: string[]
): CompleteOnboardingBody {
  const role = data?.role || 'parent';
  return {
    role,
    petName: data?.petName || (role === 'lover' ? 'Pet Lover' : 'My Companion'),
    petUsername: data?.petUsername,
    petType: role === 'lover' ? 'lover' : data?.petType || 'dogs',
    customPetType: data?.customPetType,
    breed: role === 'lover' ? 'Pet Lover' : data?.breed || 'Unknown',
    customBreed: data?.customBreed,
    city: data?.city || 'Bangalore',
    gender: data?.gender || 'unknown',
    bio: data?.bio || '',
    personalityTags: data?.personalityTags || [],
    customPersonalityTags: data?.customPersonalityTags || [],
    avatarData: data?.avatarData,
    packs,
  };
}
