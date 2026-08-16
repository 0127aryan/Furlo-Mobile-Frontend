import type { Pet } from '@/types/api';

export type AccountRole = 'parent' | 'lover';

export function isLoverPet(pet: Pet | null | undefined): boolean {
  if (!pet) return false;
  const type = (pet.pet_type || '').toLowerCase();
  const breed = (pet.breed || '').toLowerCase();
  return type === 'lover' || breed === 'pet lover';
}

export function roleFromPet(pet: Pet | null | undefined): AccountRole | null {
  if (!pet) return null;
  return isLoverPet(pet) ? 'lover' : 'parent';
}
