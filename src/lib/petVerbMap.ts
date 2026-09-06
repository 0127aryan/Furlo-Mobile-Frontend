import { apiFetch } from '@/api/client';
import { BREEDS_BY_PET_TYPE } from '@/constants/petData';

export interface SpeciesVerbItem {
  id?: string;
  species: string;
  label: string;
  verb: string;
  icon?: string;
  is_active?: boolean;
}

export type SpeciesSource = {
  species?: string | null;
  pet_type?: string | null;
  breed?: string | null;
} | null | undefined;

let dynamicVerbMap: Record<string, string> = {
  dog: 'Bark',
  dogs: 'Bark',
  cat: 'Meow',
  cats: 'Meow',
  rabbit: 'Thump',
  rabbits: 'Thump',
  bird: 'Chirp',
  birds: 'Chirp',
  fish: 'Bubble',
  fishes: 'Bubble',
  hamster: 'Squeak',
  hamsters: 'Squeak',
  parrot: 'Squawk',
  parrots: 'Squawk',
  turtle: 'Nudge',
  turtles: 'Nudge',
  guinea_pig: 'Wheek',
  guinea_pigs: 'Wheek',
  other: 'Woof',
  unknown: 'Woof',
};

export const DEFAULT_COMMENT_VERB = 'Sniff';
export const DEFAULT_POST_VERB = 'Bark';

function normalizeSpeciesKey(species: string): string {
  return species.toLowerCase().trim().replace(/[\s-]+/g, '_');
}

function lookupVerb(species: string): string | undefined {
  const key = normalizeSpeciesKey(species);
  if (dynamicVerbMap[key]) return dynamicVerbMap[key];
  if (key.endsWith('s') && key.length > 3) {
    const singular = key.endsWith('es') ? key.slice(0, -2) : key.slice(0, -1);
    if (dynamicVerbMap[singular]) return dynamicVerbMap[singular];
    if (dynamicVerbMap[key.slice(0, -1)]) return dynamicVerbMap[key.slice(0, -1)];
  }
  return undefined;
}

export async function loadSpeciesVerbsFromDB(): Promise<Record<string, string>> {
  try {
    const data = await apiFetch<SpeciesVerbItem[]>('/auth/species-verbs', { skipAuth: true });
    if (Array.isArray(data) && data.length > 0) {
      const newMap: Record<string, string> = { ...dynamicVerbMap };
      data.forEach((item) => {
        if (item.species && item.verb) {
          const key = normalizeSpeciesKey(item.species);
          newMap[key] = item.verb;
          newMap[`${key}s`] = item.verb;
        }
      });
      dynamicVerbMap = newMap;
    }
  } catch (err) {
    console.error('[petVerbMap] Failed to load species verbs from DB:', err);
  }
  return dynamicVerbMap;
}

export function getPetSpecies(pet: SpeciesSource): string | undefined {
  const value = pet?.species || pet?.pet_type || inferPetTypeFromBreed(pet?.breed);
  return value ? String(value) : undefined;
}

function inferPetTypeFromBreed(breed?: string | null): string | undefined {
  if (!breed) return undefined;
  const normalized = breed.toLowerCase().trim();
  for (const [petType, breeds] of Object.entries(BREEDS_BY_PET_TYPE)) {
    if (petType === 'other') continue;
    if (breeds.some((item) => item.toLowerCase() === normalized && item.toLowerCase() !== 'other')) {
      return petType;
    }
  }
  if (/\b(cat|kitten|feline|persian|siamese)\b/i.test(normalized)) return 'cats';
  if (/\b(rabbit|bunny)\b/i.test(normalized)) return 'rabbits';
  if (/\b(bird|parrot|cockatiel|budgie)\b/i.test(normalized)) return 'birds';
  if (/\bhamster\b/i.test(normalized)) return 'hamsters';
  if (/\b(dog|puppy|retriever|shepherd)\b/i.test(normalized)) return 'dogs';
  return undefined;
}

export function getCommentVerb(_species?: string | null): string {
  return DEFAULT_COMMENT_VERB;
}

export function getCommentVerbPlural(_species: string | null | undefined, count: number): string {
  if (count === 1) return DEFAULT_COMMENT_VERB;
  return `${DEFAULT_COMMENT_VERB}s`;
}

export function getPostVerb(species: string | null | undefined): string {
  if (!species) return DEFAULT_POST_VERB;
  return lookupVerb(species) ?? DEFAULT_POST_VERB;
}

export function getPostVerbPlural(species: string | null | undefined, count = 2): string {
  const verb = getPostVerb(species);
  if (count === 1) return verb;
  return `${verb}s`;
}
