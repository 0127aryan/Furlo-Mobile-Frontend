import { apiFetch } from '@/api/client';

export interface SpeciesVerbItem {
  id?: string;
  species: string;
  label: string;
  verb: string;
  icon?: string;
  is_active?: boolean;
}

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

export const DEFAULT_COMMENT_VERB = 'Woof';

export async function loadSpeciesVerbsFromDB(): Promise<Record<string, string>> {
  try {
    const data = await apiFetch<SpeciesVerbItem[]>('/auth/species-verbs', { skipAuth: true });
    if (Array.isArray(data) && data.length > 0) {
      const newMap: Record<string, string> = { ...dynamicVerbMap };
      data.forEach((item) => {
        if (item.species && item.verb) {
          const key = item.species.toLowerCase().trim();
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

export function getCommentVerb(species: string | null | undefined): string {
  if (!species) return DEFAULT_COMMENT_VERB;
  const normalized = species.toLowerCase().trim();
  return dynamicVerbMap[normalized] ?? DEFAULT_COMMENT_VERB;
}

export function getCommentVerbPlural(species: string | null | undefined, count: number): string {
  const verb = getCommentVerb(species);
  if (count === 1) return verb;
  return `${verb}s`;
}
